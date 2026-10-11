// Best-effort per-instance rate limiter and CORS helper for Vercel serverless functions.

const buckets = new Map();

function clientIp(req) {
  if (!req) return "127.0.0.1";
  const fwd = req.headers ? (req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"]) : null;
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
      const configuredHost = new URL(appUrl.startsWith("http") ? appUrl : `https://${appUrl}`).hostname.toLowerCase();
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

  const origin = req.headers ? (req.headers.origin || req.headers.Origin) : null;
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

function rateLimit(req, res, { windowMs = 60_000, max = 30, keyPrefix = "", customKey = null } = {}) {
  const key = keyPrefix + (customKey || clientIp(req));
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count++;
  if (bucket.count > max) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
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
