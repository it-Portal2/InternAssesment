import { getDb } from "../lib/firebaseAdmin.js";

const provider = process.argv[2] || "openrouter";

if (provider !== "gemini" && provider !== "openrouter") {
  console.error(`Invalid provider "${provider}". Use "gemini" or "openrouter".`);
  process.exit(1);
}

const doc = {
  provider,
  geminiModel: "gemini-2.5-flash",
  openrouterModel: "deepseek/deepseek-v4-flash:free",
  // openrouterPdfEngine: "mistral-ocr",  // uncomment to pin paid OCR
};

await getDb().collection("aiConfig").doc("active").set(doc, { merge: true });
console.log(`✓ aiConfig/active written:`, doc);
process.exit(0);
