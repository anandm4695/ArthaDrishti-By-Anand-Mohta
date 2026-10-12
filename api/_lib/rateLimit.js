// Distributed & in-memory sliding-window rate limiter and CORS helper for Vercel serverless functions.
let upstashLimiter = null;
const hasUpstashEnv = !!(
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
);

if (hasUpstashEnv) {
  try {
    const { Ratelimit } = require("@upstash/ratelimit");
    const { Redis } = require("@upstash/redis");
    const redis = process.env.UPSTASH_REDIS_REST_URL
      ? Redis.fromEnv()
      : new Redis({
          url: process.env.KV_REST_API_URL,
          token: process.env.KV_REST_API_TOKEN,
        });

    upstashLimiter = (max, windowMs) =>
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, `${Math.max(1, Math.ceil(windowMs / 1000))} s`),
        prefix: "@arthadrishti/rl",
      });
  } catch (err) {
    console.warn("[rateLimit] Upstash Ratelimit init warning:", err?.message || err);
  }
}

const buckets = new Map();

function clientIp(req) {
  if (!req) return "127.0.0.1";
  const fwd = req.headers
    ? req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"] || req.headers["x-real-ip"]
    : null;
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    // Local development
    if (host === "localhost" || host === "127.0.0.1") return true;
    // Production app
    if (host === "arthadrishti-app.vercel.app") return true;
    // Vercel preview & production deployments
    if (host.endsWith(".vercel.app")) return true;
    // Custom configured app domain
    const appUrl = process.env.APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (appUrl) {
      const configuredHost = new URL(
        appUrl.startsWith("http") ? appUrl : `https://${appUrl}`
      ).hostname.toLowerCase();
      if (host === configuredHost) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function handleCors(req, res, { allowedMethods = "GET, OPTIONS" } = {}) {
  // Baseline security headers on API responses
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  const origin = req.headers ? req.headers.origin || req.headers.Origin : null;
  if (origin) {
    if (isAllowedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", allowedMethods);
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    } else {
      res.status(403).json({ error: "Forbidden: Origin not permitted" });
      return false;
    }
  }

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false;
  }

  return true;
}

async function rateLimit(
  req,
  res,
  { windowMs = 60_000, max = 30, keyPrefix = "", customKey = null } = {}
) {
  const ip = customKey || clientIp(req);
  const key = `${keyPrefix}${ip}`;

  // If Upstash Redis is configured, enforce distributed rate limiting across serverless instances
  if (upstashLimiter) {
    try {
      const rl = upstashLimiter(max, windowMs);
      const { success, reset } = await rl.limit(key);
      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({ error: "Too many requests — please slow down" });
        return false;
      }
      return true;
    } catch (e) {
      console.warn("[rateLimit] Upstash check failed, falling back to database/local memory:", e?.message || e);
    }
  }

  // Distributed rate limit fallback via Supabase Postgres table
  const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey && process.env.NODE_ENV !== "test") {
    try {
      const { createClient } = require("@supabase/supabase-js");
      const supa = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
      const now = Date.now();
      const { data, error } = await supa
        .from("api_rate_limits")
        .select("count, reset_at")
        .eq("key", key)
        .maybeSingle();

      if (!error && data) {
        if (now > Number(data.reset_at)) {
          await supa.from("api_rate_limits").upsert({ key, count: 1, reset_at: now + windowMs, updated_at: new Date().toISOString() });
          return true;
        }
        const newCount = Number(data.count) + 1;
        await supa.from("api_rate_limits").update({ count: newCount, updated_at: new Date().toISOString() }).eq("key", key);
        if (newCount > max) {
          const retryAfter = Math.max(1, Math.ceil((Number(data.reset_at) - now) / 1000));
          res.setHeader("Retry-After", String(retryAfter));
          res.status(429).json({ error: "Too many requests — please slow down" });
          return false;
        }
        return true;
      } else if (!error && !data) {
        await supa.from("api_rate_limits").insert({ key, count: 1, reset_at: now + windowMs, updated_at: new Date().toISOString() });
        return true;
      }
    } catch (supaErr) {
      // Fallback silently to memory bucket if table is not yet created
    }
  }

  // Local sliding-window bucket fallback
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count++;
  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "Too many requests — please slow down" });
    return false;
  }
  return true;
}

// Prevent unbounded growth on long-lived warm instances.
const cleanupTimer = setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  },
  5 * 60_000
);
cleanupTimer.unref?.();

module.exports = { rateLimit, clientIp, isAllowedOrigin, handleCors };
