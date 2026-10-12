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
      maxAge: 604800, // 7 days (Audit L4 fix: enforce 7-day maxAge instead of 400 days)
      path: "/",
    },
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        return document.cookie
          .split("; ")
          .filter(Boolean)
          .map((c) => {
            const idx = c.indexOf("=");
            const name = idx > -1 ? c.slice(0, idx).trim() : c.trim();
            const rawVal = idx > -1 ? c.slice(idx + 1) : "";
            let value = rawVal;
            try {
              value = decodeURIComponent(rawVal);
            } catch {
              value = rawVal;
            }
            return { name, value };
          });
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        cookiesToSet.forEach(({ name, value, options }) => {
          const isDelete = !value;
          const maxAge = isDelete ? 0 : 604800; // 7 days
          const secure =
            typeof window !== "undefined" && window.location.protocol === "https:"
              ? "; Secure"
              : "";
          const path = options?.path || "/";
          const sameSite = options?.sameSite ? `; SameSite=${options.sameSite}` : "; SameSite=Lax";
          document.cookie = `${name}=${value ? encodeURIComponent(value) : ""}; Max-Age=${maxAge}; Path=${path}${sameSite}${secure}`;
        });
      },
    },
  }
);
