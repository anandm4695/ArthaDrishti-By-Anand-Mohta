import { createBrowserClient } from "@supabase/ssr";

// Captured synchronously, before createBrowserClient() below constructs the
// GoTrueClient — its own init (detectSessionInUrl) reads and strips any
// #access_token/#error hash from the URL asynchronously, so anything that reads
// window.location.hash later (e.g. Auth.tsx, on the first React render) can lose
// the race and see it already gone. Read it once, here, first.
export const capturedUrlHash = typeof window !== "undefined" ? window.location.hash : "";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseReady = Boolean(
  SUPABASE_URL &&
    !SUPABASE_URL.includes("placeholder") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("placeholder")
);

// If a session was previously written to sb-auth-token, sync it back to the project default key
if (typeof window !== "undefined") {
  try {
    const custom = localStorage.getItem("sb-auth-token");
    const projectRef = (SUPABASE_URL || "").split(".")[0].replace("https://", "");
    const defaultKey = projectRef ? `sb-${projectRef}-auth-token` : "";
    if (custom && defaultKey && !localStorage.getItem(defaultKey)) {
      localStorage.setItem(defaultKey, custom);
    }
  } catch {}
}

export const supabase = createBrowserClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder",
  {
    cookieOptions: {
      secure: typeof window !== "undefined" ? window.location.protocol === "https:" : true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days (Audit L4 fix: replace 400 days with 7 days and secure flag)
      path: "/",
    },
  }
);
