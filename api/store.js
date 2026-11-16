// Vercel serverless function:  GET /api/store?url=https://...
// Generates a unique key and saves key/url in Supabase. Returns JSON { key, url }.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const makeKey = (len = 6) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing ?url=" });
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    return res.status(400).json({ error: "Not a valid http(s) URL" });
  }

  const base = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anon) return res.status(500).json({ error: "Supabase env vars missing on Vercel" });

  for (let i = 0; i < 5; i++) {
    const key = makeKey();
    const r = await fetch(`${base}/rest/v1/links`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ key, url }),
    });
    if (r.ok) return res.status(200).json({ key, url });
    const err = await r.json().catch(() => ({}));
    if (err.code !== "23505") return res.status(500).json({ error: err.message || "Supabase error" });
  }
  res.status(500).json({ error: "Could not generate a unique key" });
}
