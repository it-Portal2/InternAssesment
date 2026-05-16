import { getDb } from "./firebaseAdmin.js";

const DEFAULTS = Object.freeze({
  provider: "gemini",
  geminiModel: "gemini-2.5-flash",
  openrouterModel: "deepseek/deepseek-v4-flash:free",
  openrouterPdfEngine: undefined,
});

const TTL_MS = 30_000;
let cache = { value: null, fetchedAt: 0 };

export async function getAiConfig() {
  const now = Date.now();
  if (cache.value && now - cache.fetchedAt < TTL_MS) return cache.value;

  try {
    const snap = await getDb().collection("aiConfig").doc("active").get();
    if (!snap.exists) {
      console.warn("aiConfig/active missing — defaulting to Gemini");
      cache = { value: DEFAULTS, fetchedAt: now };
      return DEFAULTS;
    }
    const merged = { ...DEFAULTS, ...(snap.data() || {}) };
    if (merged.provider !== "gemini" && merged.provider !== "openrouter") {
      console.warn(`aiConfig/active.provider="${merged.provider}" invalid — defaulting to Gemini`);
      merged.provider = "gemini";
    }
    cache = { value: merged, fetchedAt: now };
    return merged;
  } catch (err) {
    // Never break a request because the config doc is unreachable; fall back to Gemini.
    console.error("aiConfig read failed — defaulting to Gemini:", err?.message || err);
    return DEFAULTS;
  }
}
