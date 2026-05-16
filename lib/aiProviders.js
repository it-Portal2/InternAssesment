import { GoogleGenAI } from "@google/genai";

export async function callAI(provider, model, opts) {
  if (provider === "gemini") return callGemini(model, opts);
  if (provider === "openrouter") return callOpenRouter(model, opts);
  throw new Error(`Unknown provider: ${provider}`);
}

async function callGemini(model, { userPrompt, expectJson, temperature, maxTokens, pdfBase64, pdfMimeType, apiKey }) {
  const ai = new GoogleGenAI({ apiKey });
  const parts = [];
  if (pdfBase64) {
    parts.push({ inlineData: { data: pdfBase64, mimeType: pdfMimeType || "application/pdf" } });
  }
  parts.push({ text: userPrompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      ...(expectJson ? { responseMimeType: "application/json" } : {}),
      temperature,
      maxOutputTokens: maxTokens,
    },
  });
  return response.text || "";
}

async function callOpenRouter(model, { userPrompt, expectJson, temperature, maxTokens, pdfBase64, pdfMimeType, pdfFileName, pdfEngine, apiKey }) {
  const content = [{ type: "text", text: userPrompt }];
  if (pdfBase64) {
    content.push({
      type: "file",
      file: {
        filename: pdfFileName || "resume.pdf",
        file_data: `data:${pdfMimeType || "application/pdf"};base64,${pdfBase64}`,
      },
    });
  }

  const body = {
    model,
    messages: [{ role: "user", content }],
    temperature,
    max_tokens: maxTokens,
    ...(expectJson ? { response_format: { type: "json_object" } } : {}),
    // Reasoning models silently burn the max_tokens budget thinking, then leave message.content empty.
    // We want answer tokens, not reasoning tokens — disable explicitly.
    reasoning: { exclude: true },
    // Only pin an engine when the admin asked for one; default lets OpenRouter try native then fall back to cloudflare-ai (free).
    ...(pdfBase64 && pdfEngine ? { plugins: [{ id: "file-parser", pdf: { engine: pdfEngine } }] } : {}),
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://it-portal-aa1f7.web.app",
      "X-Title": process.env.OPENROUTER_TITLE || "Intern Assessment",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Prefix with status so the existing isRetryableError() in api/analyzeResume.js catches 401/403/429.
    throw new Error(`OpenRouter ${res.status}: ${errText || res.statusText}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  const msg = choice?.message;
  // Some reasoning models put the actual answer in `reasoning` / `reasoning_content` when content is empty.
  const text = msg?.content || msg?.reasoning_content || msg?.reasoning || "";

  if (!text) {
    console.error("OpenRouter returned empty content. finish_reason:", choice?.finish_reason);
    console.error("OpenRouter response (truncated):", JSON.stringify(json).slice(0, 2000));
  }

  return text;
}
