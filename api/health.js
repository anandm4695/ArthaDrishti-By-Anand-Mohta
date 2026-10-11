// Lightweight liveness/readiness endpoint for uptime monitoring.
// Public callers receive only minimal { status: "ok" } / { status: "degraded" }.
// Detailed diagnostic checks are strictly restricted to callers presenting CRON_SECRET.
const { createClient } = require("@supabase/supabase-js");
const { handleCors } = require("./_lib/rateLimit");

module.exports = async function handler(req, res) {
  if (!handleCors(req, res)) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_EMAIL_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.Resend_Email_API || process.env.RESEND_API_KEY;
  const cronSecretSet = !!process.env.CRON_SECRET;

  const checks = {
    supabaseUrlConfigured: !!supabaseUrl,
    supabaseServiceKeyConfigured: !!serviceKey,
    resendKeyConfigured: !!resendKey,
    cronSecretConfigured: cronSecretSet,
  };

  let dbReachable = null;
  if (supabaseUrl && serviceKey && process.env.NODE_ENV !== "test") {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { error } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .limit(1);
      dbReachable = !error;
    } catch {
      dbReachable = false;
    }
  }

  const healthy =
    checks.supabaseUrlConfigured &&
    checks.supabaseServiceKeyConfigured &&
    checks.cronSecretConfigured &&
    dbReachable !== false;

  const authHeader = req.headers ? (req.headers.authorization || "") : "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  const bearerToken = match ? match[1].trim() : "";
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized =
    !!cronSecret &&
    (bearerToken === cronSecret ||
      req.headers?.["x-cron-secret"] === cronSecret ||
      req.query?.secret === cronSecret);

  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (isAuthorized) {
    return res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: { ...checks, dbReachable },
    });
  }

  // Public response: strictly minimal status without leaking internal config presence
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
  });
};
