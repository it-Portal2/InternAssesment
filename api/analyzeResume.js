import { callAI } from "../lib/aiProviders.js";
import { getAiConfig } from "../lib/aiConfig.js";

// API Key Manager with rotation and fallback
class APIKeyManager {
  constructor(apiKeys) {
    this.apiKeys = apiKeys.filter((key) => key && key.trim()); // Remove empty keys
    this.currentIndex = 0;
    this.failedKeys = new Set();
  }

  getCurrentKey() {
    if (this.failedKeys.size === this.apiKeys.length) {
      throw new Error("ALL_KEYS_FAILED");
    }
    return this.apiKeys[this.currentIndex];
  }

  markKeyAsFailed(key) {
    this.failedKeys.add(key);
    console.log(`API Key ${this.currentIndex + 1} marked as failed`);
  }

  rotateToNextKey() {
    const startIndex = this.currentIndex;
    do {
      this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
      if (!this.failedKeys.has(this.apiKeys[this.currentIndex])) {
        console.log(`Rotated to API Key ${this.currentIndex + 1}`);
        return true;
      }
    } while (this.currentIndex !== startIndex);

    return false; // All keys failed
  }

  reset() {
    this.failedKeys.clear();
    this.currentIndex = 0;
  }
}

// Determine if error is retryable with another API key
const isRetryableError = (error) => {
  const errorMessage = error?.message?.toLowerCase() || "";
  const retryablePatterns = [
    "quota",
    "rate limit",
    "429",
    "too many requests",
    "api key",
    "401",
    "403",
    "unauthorized",
    "forbidden",
    "invalid api key",
    "quota exceeded",
  ];

  return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
};

// Helper: Clean JSON output from AI (remove markdown code blocks).
// Handles either a JSON object or a top-level array — models on OpenRouter sometimes
// return a bare array when asked for `{ questions: [...] }`.
const cleanJsonOutput = (text) => {
  if (!text) return "{}";

  let cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();

  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  const useArray =
    firstArr !== -1 && (firstObj === -1 || firstArr < firstObj);

  if (useArray) {
    const lastClose = cleaned.lastIndexOf("]");
    if (lastClose > firstArr) return cleaned.substring(firstArr, lastClose + 1);
  } else if (firstObj !== -1) {
    const lastClose = cleaned.lastIndexOf("}");
    if (lastClose > firstObj) return cleaned.substring(firstObj, lastClose + 1);
  }

  return cleaned;
};

// Wrapper function with automatic retry
async function executeWithRetry(apiKeyManager, operationFn, operationName) {
  let lastError = null;
  let attempts = 0;
  const maxAttempts = apiKeyManager.apiKeys.length;

  while (attempts < maxAttempts) {
    attempts++;
    const currentKey = apiKeyManager.getCurrentKey();

    try {
      console.log(
        `Attempt ${attempts}/${maxAttempts} - ${operationName} with API Key ${
          apiKeyManager.currentIndex + 1
        }`
      );
      const result = await operationFn(currentKey);

      // Success - reset failed keys for future operations
      if (attempts > 1) {
        console.log(
          `✓ Success after ${attempts} attempts using API Key ${
            apiKeyManager.currentIndex + 1
          }`
        );
      }

      return result;
    } catch (error) {
      lastError = error;
      console.error(
        `✗ ${operationName} failed with API Key ${
          apiKeyManager.currentIndex + 1
        }:`,
        error.message
      );

      // Check if error is retryable
      if (isRetryableError(error)) {
        apiKeyManager.markKeyAsFailed(currentKey);

        // Try to rotate to next key
        if (apiKeyManager.rotateToNextKey()) {
          console.log(`Retrying ${operationName} with next API key...`);
          continue; // Retry with next key
        } else {
          // All keys exhausted
          break;
        }
      } else {
        // Non-retryable error (e.g., invalid file, network issue)
        throw error;
      }
    }
  }

  // All attempts failed
  throw new Error(
    `ALL_API_KEYS_FAILED: ${lastError?.message || "Unknown error"}`
  );
}

// Resume analysis with automatic fallback
async function analyzeResumeWithAI(base64Data, mimeType, fileName, apiKeyManager, provider, model, pdfEngine) {
  const analysisOperation = async (apiKey) => {
    const prompt = `You are an expert HR professional and resume analyzer. Analyze this resume document carefully and extract key information.

IMPORTANT: Extract ONLY information that is explicitly present in the resume. Do not infer or assume information.

EDGE CASE HANDLING:
- If NO work experience is found → Mark as "0 years, Fresher/Entry level"
- If NO skills are explicitly mentioned → Return ["General skills"] or skills inferred from education/projects
- If NO education is found → Mark as "Not specified"
- If NO clear summary can be formed → Create brief summary from available information

Extract the following data and return it in JSON format:
1. Technical and professional skills (array of specific skills mentioned or inferred from projects/education)
2. Years of experience and seniority level (calculate from work history or mark as fresher)
3. Educational background and qualifications (degrees, certifications, institutions)
4. Brief professional summary (2-3 sentences highlighting available strengths)

EXPERIENCE LEVEL CALCULATION:
- 0 years = "0 years, Fresher/Entry level"
- 0-2 years = "X years, Junior level" 
- 2-5 years = "X years, Mid level"
- 5-8 years = "X years, Senior level"  
- 8+ years = "X years, Lead/Principal level"

Return JSON in this exact format:
{
  "skills": ["specific_skill_1", "specific_skill_2", "specific_skill_3"],
  "experience": "X years, [Fresher/Junior/Mid/Senior/Lead] level",
  "education": "Degree, Institution, Year (or 'Not specified' if unavailable)",
  "summary": "Professional summary highlighting key strengths and expertise based on available information"
}

  "summary": "Professional summary highlighting key strengths and expertise based on available information"
}

Be precise and handle missing information gracefully by using appropriate defaults. DO NOT use Markdown formatting (no \`\`\`json blocks). Return ONLY the raw JSON string.`;

    const rawText = await callAI(provider, model, {
      userPrompt: prompt,
      expectJson: true,
      temperature: 0.1,
      maxTokens: 8192,
      pdfBase64: base64Data,
      pdfMimeType: mimeType,
      pdfFileName: fileName,
      pdfEngine,
      apiKey,
    });

    let analysis;
    try {
      analysis = JSON.parse(cleanJsonOutput(rawText));
    } catch (e) {
      console.error("Failed to parse Resume Analysis JSON. Raw text:", rawText);
      throw e;
    }

    // Surface near-empty responses early — caller usually masks this with default values otherwise.
    if (!analysis || Object.keys(analysis).length === 0) {
      console.error("Resume Analysis returned empty/near-empty JSON. Raw text:", rawText?.slice(0, 1000));
    }

    // Validate and set defaults
    if (
      !analysis.skills ||
      !Array.isArray(analysis.skills) ||
      analysis.skills.length === 0
    ) {
      analysis.skills = ["General skills"];
    }

    if (!analysis.experience) {
      analysis.experience = "0 years, Fresher/Entry level";
    }

    if (!analysis.education) {
      analysis.education = "Not specified";
    }

    if (!analysis.summary) {
      analysis.summary =
        "Candidate with available qualifications seeking opportunities.";
    }

    return analysis;
  };

  return await executeWithRetry(
    apiKeyManager,
    analysisOperation,
    "Resume Analysis"
  );
}

// Question generation with automatic fallback
async function generateInterviewQuestions(
  resumeData,
  apiKeyManager,
  customInstructions = null,
  provider,
  model
) {
  const questionOperation = async (apiKey) => {
    const customSection =
      customInstructions && customInstructions.trim()
        ? `\nCUSTOM INSTRUCTIONS FOR QUESTION GENERATION:
${customInstructions}
Focus on these specific requirements when generating questions. Adapt these instructions while generating the 10-question set.\n`
        : "";

    const prompt = `You are a senior HR director at a Fortune 500 company. Based on the candidate's resume analysis, generate EXACTLY 10 interview questions for this candidate.

CANDIDATE ANALYSIS:
- Skills: ${resumeData.skills.join(", ")}
- Experience: ${resumeData.experience}
- Education: ${resumeData.education}
- Summary: ${resumeData.summary}

${customSection}

GENERATE EXACTLY 10 QUESTIONS WITH THIS DISTRIBUTION:
- 4 TECHNICAL QUESTIONS: Core technical knowledge questions based on their specific skills
- 2 BEHAVIORAL-FOCUSED: Use STAR method frameworks (Situation, Task, Action, Result) to assess past experiences and behaviors but in the question dont mention user that it is start method or answer the question in star method 
- 2 SCENARIO-DRIVEN: Present realistic workplace challenges they might face
- 2 LEADERSHIP & PROBLEM-SOLVING: Assess critical thinking and decision-making abilities based on their background

Technical Questions Must Focus ONLY On:
${resumeData.skills.join(", ")} (use ONLY these skills from their resume)

STRICT RULE: Do not ask about technologies, frameworks, or skills that are NOT mentioned in their resume.

Return JSON in this exact format with EXACTLY 10 questions:
{
  "questions": [
    {
      "id": "technical_q1",
      "question": "Technical question 1 based on their skills"
    },
    {
      "id": "technical_q2",
      "question": "Technical question 2 based on their skills"
    },
    {
      "id": "technical_q3",
      "question": "Technical question 3 based on their skills"
    },
    {
      "id": "technical_q4",
      "question": "Technical question 4 based on their skills"
    },
    {
      "id": "behavioral_q1",
      "question": "Behavioral question based on their experience"
    },
    {
      "id": "behavioral_q2",
      "question": "Behavioral question based on their experience"
    },
    {
      "id": "scenario_q1",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "scenario_q2",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "leadership_q1",
      "question": "Leadership and problem-solving question"
    },
    {
      "id": "leadership_q2",
      "question": "Leadership and problem-solving question"
    }
  ]
}

Generate exactly 10 questions following this distribution. Make them specific to their actual resume data. DO NOT use Markdown formatting. Return ONLY the raw JSON string.`;

    const rawText = await callAI(provider, model, {
      userPrompt: prompt,
      expectJson: true,
      temperature: 0.7,
      maxTokens: 8192,
      apiKey,
    });

    let data;
    try {
      data = JSON.parse(cleanJsonOutput(rawText));
    } catch (e) {
      console.error("Failed to parse Questions JSON. Raw text:", rawText);
      throw e;
    }

    // Accept either { questions: [...] } or a bare array — model outputs vary across providers.
    const rawQuestions = Array.isArray(data)
      ? data
      : Array.isArray(data.questions)
        ? data.questions
        : null;

    if (!rawQuestions) {
      console.error("Invalid questions shape. Parsed:", JSON.stringify(data).slice(0, 500));
      console.error("Raw model text:", rawText?.slice(0, 1000));
      throw new Error("Invalid questions format in AI response");
    }

    const questions = rawQuestions.map((q, index) => ({
      id: q.id || `question_${index + 1}_${Date.now()}`,
      question: q.question,
      answer: "",
    }));

    return questions.slice(0, 10);
  };

  return await executeWithRetry(
    apiKeyManager,
    questionOperation,
    "Question Generation"
  );
}

// Main handler with comprehensive error handling
export default async function handler(req, res) {
  try {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { fileData, fileName, fileType, fileSize } = req.body;
    const startTime = Date.now();

    // Input validation
    if (!fileData) {
      return res.status(400).json({
        success: false,
        error: "No file data provided",
        errorType: "file_processing_error",
      });
    }

    if (fileType !== "application/pdf") {
      return res.status(400).json({
        success: false,
        error: "Only PDF files are supported",
        errorType: "file_processing_error",
      });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "File too large (max 5MB)",
        errorType: "file_processing_error",
      });
    }

    const aiConfig = await getAiConfig();

    // Provider failover: configured provider runs first; the other is tried only if the first throws.
    // Keeps admin intent while ensuring the user never sees an error just because one provider is down.
    const providerOrder = aiConfig.provider === "gemini"
      ? ["gemini", "openrouter"]
      : ["openrouter", "gemini"];

    const providerCtx = (provider) => {
      const keys = provider === "gemini"
        ? [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
        : [process.env.OPENROUTER_API_KEY].filter(Boolean);
      const model = provider === "gemini" ? aiConfig.geminiModel : aiConfig.openrouterModel;
      return { provider, model, keys };
    };

    const tryWithFailover = async (opName, run) => {
      let lastErr;
      for (const provider of providerOrder) {
        const ctx = providerCtx(provider);
        if (ctx.keys.length === 0) {
          console.warn(`${opName}: no API keys for ${provider}, skipping`);
          continue;
        }
        try {
          const manager = new APIKeyManager(ctx.keys);
          const result = await run(ctx.provider, ctx.model, manager);
          if (provider !== aiConfig.provider) {
            console.warn(`${opName}: failed over from ${aiConfig.provider} to ${provider}`);
          }
          return { result, usedProvider: ctx.provider, usedModel: ctx.model, usedKeyCount: ctx.keys.length };
        } catch (err) {
          lastErr = err;
          console.error(`${opName} on ${provider} failed:`, err?.message || err);
        }
      }
      throw lastErr || new Error(`${opName}: no providers available`);
    };

    const customInstructions = process.env.INTERVIEW_CUSTOM_INSTRUCTIONS || null;
    if (customInstructions) console.log("Using custom interview instructions from environment");

    console.log(`Processing resume: ${fileName} (${Math.round(fileSize / 1024)} KB)`);
    console.log(`Configured provider: ${aiConfig.provider}, model: ${aiConfig.provider === "gemini" ? aiConfig.geminiModel : aiConfig.openrouterModel}`);

    const analysisRun = await tryWithFailover("Resume Analysis", (provider, model, manager) =>
      analyzeResumeWithAI(fileData, fileType, fileName, manager, provider, model, aiConfig.openrouterPdfEngine)
    );
    const resumeAnalysis = analysisRun.result;
    console.log("✓ Resume analysis completed:", resumeAnalysis.skills.length, "skills found");

    const questionsRun = await tryWithFailover("Question Generation", (provider, model, manager) =>
      generateInterviewQuestions(resumeAnalysis, manager, customInstructions, provider, model)
    );
    const questions = questionsRun.result;
    console.log("✓ Generated exactly", questions.length, "questions");

    const totalProcessingTime = Date.now() - startTime;
    console.log(`Total processing time: ${totalProcessingTime}ms`);

    return res.status(200).json({
      success: true,
      resumeAnalysis,
      questions,
      customInstructionsUsed: !!customInstructions,
      processingTimeMs: totalProcessingTime,
      provider: questionsRun.usedProvider,
      model: questionsRun.usedModel,
      apiKeysUsed: questionsRun.usedKeyCount,
      performance: {
        totalTimeMs: totalProcessingTime,
      },
    });
  } catch (error) {
    console.error("Resume analysis failed:", error);

    // Categorize errors for user-friendly messages
    let errorType = "general_error";
    let statusCode = 500;
    let userMessage = "Failed to process resume";

    const errorMessage = error?.message || "";

    if (errorMessage.includes("ALL_API_KEYS_FAILED")) {
      errorType = "rate_limit_error";
      statusCode = 429;
      userMessage =
        "All AI services are currently busy. Please try again in 10-15 minutes.";
    } else if (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429")
    ) {
      errorType = "rate_limit_error";
      statusCode = 429;
      userMessage =
        "Service is experiencing high demand. Please try again in a few minutes.";
    } else if (
      errorMessage.includes("API key") ||
      errorMessage.includes("401") ||
      errorMessage.includes("403")
    ) {
      errorType = "api_auth_error";
      statusCode = 401;
      userMessage = "AI service authentication failed. Please contact support.";
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("ECONNRESET")
    ) {
      errorType = "network_error";
      statusCode = 503;
      userMessage =
        "Network connection issue. Please check your internet and try again.";
    } else if (
      errorMessage.includes("PDF") ||
      errorMessage.includes("file") ||
      errorMessage.includes("parse")
    ) {
      errorType = "file_processing_error";
      statusCode = 400;
      userMessage =
        "Unable to read your resume file. Please ensure it's a valid PDF.";
    } else if (
      errorMessage.includes("Failed to analyze") ||
      errorMessage.includes("Failed to generate")
    ) {
      errorType = "ai_processing_error";
      statusCode = 502;
      userMessage = "AI processing encountered an issue. Please try again.";
    }

    return res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType: errorType,
      technicalDetails:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}
