const { createClient } = require("@supabase/supabase-js");

let supabaseAdmin = null;

function getSupabase() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Production stores the service key as SUPABASE_SERVICE_EMAIL_ROLE_KEY (see health.js,
  // rateLimit.js); reading only SUPABASE_SERVICE_ROLE_KEY made every sign-in check fail.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_EMAIL_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service credentials not configured in environment");
  }
  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false },
  });
  return supabaseAdmin;
}

async function verifyManualAuth(req) {
  const authHeader = req.headers ? req.headers["authorization"] || req.headers["Authorization"] : "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader || "");
  if (!match) return { ok: false, reason: "Missing Authorization header" };
  const token = match[1].trim();
  if (!token) return { ok: false, reason: "Empty bearer token" };
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return { ok: false, reason: "Invalid or expired session" };
    if (!data.user.email_confirmed_at && process.env.NODE_ENV !== "test") {
      return { ok: false, reason: "Email address not verified. Please verify your email before proceeding." };
    }
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, reason: err.message || "Auth check failed" };
  }
}

module.exports = { getSupabase, verifyManualAuth };
