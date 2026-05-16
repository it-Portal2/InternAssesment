import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount(raw) {
  // Accept either raw JSON or base64-encoded JSON — pasting into Vercel's UI works either way.
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  return JSON.parse(Buffer.from(trimmed, "base64").toString("utf8"));
}

function getApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
  const json = parseServiceAccount(raw);
  return initializeApp({ credential: cert(json), projectId: json.project_id });
}

export const getDb = () => getFirestore(getApp());
