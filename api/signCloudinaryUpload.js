import { createHash } from "crypto";

const CLOUDINARY_CLOUD_NAME = "duusiq4ws";
const CLOUDINARY_UPLOAD_PRESET = "InternAssesment";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;

  if (!apiSecret || !apiKey) {
    // Signing credentials not configured — client will fall back to unsigned upload
    res.status(503).json({ error: "Signing not configured" });
    return;
  }

  const timestamp = Math.round(Date.now() / 1000);
  // Cloudinary signature: SHA1 of sorted params (excl. file, cloud_name, resource_type, api_key) + api_secret
  const toSign = `timestamp=${timestamp}&upload_preset=${CLOUDINARY_UPLOAD_PRESET}`;
  const signature = createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  res.status(200).json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: CLOUDINARY_CLOUD_NAME,
    upload_preset: CLOUDINARY_UPLOAD_PRESET,
  });
}
