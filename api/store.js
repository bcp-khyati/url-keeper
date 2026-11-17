// // // Vercel serverless function:  GET /api/store?url=https://...
// // // Generates a unique key and saves key/url in Supabase. Returns JSON { key, url }.
// // const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
// // const makeKey = (len = 6) =>
// //   Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

// // export default async function handler(req, res) {
// //   const url = req.query.url;
// //   if (!url) return res.status(400).json({ error: "Missing ?url=" });
// //   try {
// //     const u = new URL(url);
// //     if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
// //   } catch {
// //     return res.status(400).json({ error: "Not a valid http(s) URL" });
// //   }

// //   const base = process.env.VITE_SUPABASE_URL;
// //   const anon = process.env.VITE_SUPABASE_ANON_KEY;
// //   if (!base || !anon) return res.status(500).json({ error: "Supabase env vars missing on Vercel" });

// //   for (let i = 0; i < 5; i++) {
// //     const key = makeKey();
// //     const r = await fetch(`${base}/rest/v1/links`, {
// //       method: "POST",
// //       headers: {
// //         apikey: anon,
// //         Authorization: `Bearer ${anon}`,
// //         "Content-Type": "application/json",
// //         Prefer: "return=minimal",
// //       },
// //       body: JSON.stringify({ key, url }),
// //     });
// //     if (r.ok) return res.status(200).json({ key, url });
// //     const err = await r.json().catch(() => ({}));
// //     if (err.code !== "23505") return res.status(500).json({ error: err.message || "Supabase error" });
// //   }
// //   res.status(500).json({ error: "Could not generate a unique key" });
// // }

// #########################################last edited files

// import { useEffect, useState } from "react";
// import { supabase } from "./supabase.js";

// const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
// const makeKey = (len = 6) =>
//   Array.from(crypto.getRandomValues(new Uint8Array(len)), (n) => ALPHABET[n % ALPHABET.length]).join("");

// const isValidKey = (value) => /^[A-Za-z0-9_-]{1,64}$/.test(value);

// const isValidUrl = (value) => {
//   try {
//     const u = new URL(value);
//     return u.protocol === "http:" || u.protocol === "https:";
//   } catch {
//     return false;
//   }
// };

// // ---------- /  → show everything ----------
// function All() {
//   const [rows, setRows] = useState(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     supabase
//       .from("links")
//       .select("key, url, created_at")
//       .order("created_at", { ascending: false })
//       .then(({ data, error }) => (error ? setError(error.message) : setRows(data)));
//   }, []);

//   const onSubmit = (e) => {
//     e.preventDefault();
//     const url = new FormData(e.target).get("url").trim();
//     window.location.href = `/store?url=${encodeURIComponent(url)}`;
//   };

//   return (
//     <>
//       <form className="row" onSubmit={onSubmit}>
//         <input name="url" type="url" placeholder="https://example.com/a/long/address" required />
//         <button>Store URL</button>
//       </form>

//       {error && <p className="error">{error}</p>}
//       {!error && rows === null && <p className="muted">Loading…</p>}
//       {rows?.length === 0 && <p className="muted">Nothing stored yet. Paste a URL above to create the first key.</p>}
//       {rows?.length > 0 && (
//         <table>
//           <thead>
//             <tr><th>Key</th><th>URL</th></tr>
//           </thead>
//           <tbody>
//             {rows.map((r) => (
//               <tr key={r.key}>
//                 <td><a href={`/get?key=${r.key}`}>{r.key}</a></td>
//                 <td className="url">{r.url}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </>
//   );
// }

// // ---------- /get?key=abc123 → return the stored URL ----------
// function Get({ params }) {
//   const key = params.get("key");
//   const [state, setState] = useState({ loading: true });

//   useEffect(() => {
//     if (!key) return setState({ error: "Add a key to the address, like /get?key=abc123" });
//     supabase
//       .from("links")
//       .select("url")
//       .eq("key", key)
//       .maybeSingle()
//       .then(({ data, error }) => {
//         if (error) setState({ error: error.message });
//         else if (!data) setState({ error: `No URL is stored under “${key}”.` });
//         else setState({ url: data.url });
//       });
//   }, [key]);

//   if (state.loading) return <p className="muted">Looking up…</p>;
//   if (state.error) return <p className="error">{state.error}</p>;
//   return (
//     <div className="result">
//       <p className="muted">URL for key <code>{key}</code></p>
//       <a className="big" href={state.url} target="_blank" rel="noreferrer">{state.url}</a>
//     </div>
//   );
// }

// // ---------- /store?url=https://...            → random new key
// // ---------- /store?url=https://...&key=ABCDEF → fixed key (created, or URL updated if key exists)
// function Store({ params }) {
//   const url = params.get("url");
//   const fixedKey = params.get("key");
//   const [state, setState] = useState({ loading: true });

//   useEffect(() => {
//     if (!url) return setState({ error: "Add a URL to the address, like /store?url=https://example.com" });
//     if (!isValidUrl(url)) return setState({ error: "That doesn’t look like a full http(s) URL." });
//     if (fixedKey && !isValidKey(fixedKey))
//       return setState({ error: "Key can only contain letters, numbers, - and _ (max 64 characters)." });

//     (async () => {
//       // Fixed key: upsert = insert if new, otherwise overwrite the URL of that key
//       if (fixedKey) {
//         const { error } = await supabase.from("links").upsert({ key: fixedKey, url });
//         return error ? setState({ error: error.message }) : setState({ key: fixedKey });
//       }

//       // No key given: generate a random one and retry if it already exists
//       for (let attempt = 0; attempt < 5; attempt++) {
//         const key = makeKey();
//         const { error } = await supabase.from("links").insert({ key, url });
//         if (!error) return setState({ key });
//         if (error.code !== "23505") return setState({ error: error.message }); // 23505 = key already exists, retry
//       }
//       setState({ error: "Couldn’t generate a unique key. Try again." });
//     })();
//   }, [url, fixedKey]);

//   if (state.loading) return <p className="muted">Saving…</p>;
//   if (state.error) return <p className="error">{state.error}</p>;
//   return (
//     <div className="result">
//       <p className="muted">Saved. Your key is</p>
//       <p className="big key">{state.key}</p>
//       <a href={`/get?key=${state.key}`}>/get?key={state.key}</a>
//     </div>
//   );
// }

// export default function App() {
//   const params = new URLSearchParams(window.location.search);
//   const path = window.location.pathname.replace(/\/+$/, "") || "/";
//   const Page = { "/": All, "/get": Get, "/store": Store }[path];

//   return (
//     <main>
//       <header>
//         <a href="/" className="brand">URL Keeper</a>
//         <nav>
//           <a href="/">/</a>
//           <a href="/get">/get</a>
//           <a href="/store">/store</a>
//         </nav>
//       </header>
//       {Page ? <Page params={params} /> : <p className="error">No page at {path}.</p>}
//     </main>
//   );
// }
// //////////////////////////////////////////////////

// Vercel serverless function
//   GET /api/store?url=https://...             → new random key
//   GET /api/store?url=https://...&key=ABCDEF  → fixed key: created, or its URL updated if it exists
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const makeKey = (len = 6) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export default async function handler(req, res) {
  const { url, key: fixedKey } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=" });
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    return res.status(400).json({ error: "Not a valid http(s) URL" });
  }
  if (fixedKey && !/^[A-Za-z0-9_-]{1,64}$/.test(fixedKey))
    return res.status(400).json({ error: "Key can only contain letters, numbers, - and _ (max 64)" });

  const base = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anon) return res.status(500).json({ error: "Supabase env vars missing on Vercel" });

  const headers = {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    "Content-Type": "application/json",
  };

  // Fixed key → upsert (needs the UPDATE policy from supabase.sql)
  if (fixedKey) {
    const r = await fetch(`${base}/rest/v1/links?on_conflict=key`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key: fixedKey, url }),
    });
    if (r.ok) return res.status(200).json({ key: fixedKey, url });
    const err = await r.json().catch(() => ({}));
    return res.status(500).json({ error: err.message || "Supabase error" });
  }

  // No key → random key, retry on collision
  for (let i = 0; i < 5; i++) {
    const key = makeKey();
    const r = await fetch(`${base}/rest/v1/links`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ key, url }),
    });
    if (r.ok) return res.status(200).json({ key, url });
    const err = await r.json().catch(() => ({}));
    if (err.code !== "23505") return res.status(500).json({ error: err.message || "Supabase error" });
  }
  res.status(500).json({ error: "Could not generate a unique key" });
}

