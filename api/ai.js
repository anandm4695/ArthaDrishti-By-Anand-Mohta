// Vercel serverless function — Proxies AI Assistant queries securely
// Keeps Gemini API keys strictly server-side (Audit L2 fix)
const { handleCors, rateLimit } = require("./_lib/rateLimit");
const { verifyManualAuth } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  if (!handleCors(req, res, { allowedMethods: "POST, OPTIONS" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Rate limit: 20 AI queries per minute per user/IP
  if (!(await rateLimit(req, res, { max: 20, windowMs: 60_000, keyPrefix: "ai:" }))) {
    return;
  }

  // Enforce authenticated session
  const auth = await verifyManualAuth(req);
  if (!auth.ok) {
    return res.status(401).json({ error: auth.reason || "Unauthorized" });
  }

  const { prompt, contents, systemInstruction } = req.body || {};
  if (!prompt && (!contents || !contents.length)) {
    return res.status(400).json({ error: "prompt or contents parameter required" });
  }

  const serverApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_KEY;

  // Ephemeral client key passed in header if server has no default key configured
  const clientEphemeralKey = req.headers["x-gemini-key"] ? String(req.headers["x-gemini-key"]).trim() : null;
  const apiKey = serverApiKey || clientEphemeralKey;

  if (!apiKey) {
    return res.status(400).json({
      error: "Gemini API key is not configured on the server. Please set GEMINI_API_KEY in Vercel environment variables or provide an ephemeral session key.",
    });
  }

  try {
    const formattedContents = contents && contents.length
      ? contents
      : [{ role: "user", parts: [{ text: String(prompt) }] }];

    const requestBody = {
      contents: formattedContents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: String(systemInstruction) }],
      };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const upstreamRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(25_000),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      let parsed;
      try { parsed = JSON.parse(errText); } catch { parsed = errText; }
      return res.status(upstreamRes.status).json({
        error: "Google Gemini API error",
        details: parsed,
      });
    }

    const data = await upstreamRes.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text).join("") || "";

    res.setHeader("Cache-Control", "no-store, private");
    return res.status(200).json({
      success: true,
      text,
      model: "gemini-2.5-flash",
    });
  } catch (err) {
    console.error("[api/ai] Generation error:", err?.message || err);
    return res.status(500).json({
      error: "Failed to generate AI response",
      message: err?.message || String(err),
    });
  }
};
