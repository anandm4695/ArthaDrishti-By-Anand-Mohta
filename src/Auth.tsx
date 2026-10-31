import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { supabase, capturedUrlHash } from "./supabaseClient";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserCircle,
  Mail,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  ArrowLeft,
  Users,
  Zap,
} from "lucide-react";
import { BrandMark } from "./components/ui/BrandMark";
import { DEMO_USER_SESSION } from "./utils/demoData";
import { WealthSkylineCanvas } from "./components/auth/WealthSkylineCanvas";
import { CelestialScreensaver } from "./components/screensaver/CelestialScreensaver";
import { useIdleScreensaver } from "./hooks/useIdleScreensaver";

/* ─── Time-of-day greeting ───────────────────────────────────────────── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Friendly error messages ────────────────────────────────────────── */
function friendlyError(msg: string): string {
  if (!msg) return "Something went wrong. Please try again.";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Incorrect email or password. Please check and try again.";
  if (m.includes("email not confirmed"))
    return "Please verify your email first. Check your inbox for the confirmation link.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("password should be") || m.includes("password is too short"))
    return "Password must be at least 8 characters long.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("network") || m.includes("fetch"))
    return "Network error. Check your connection and try again.";
  if (m.includes("email address is invalid") || m.includes("unable to validate"))
    return "Please enter a valid email address.";
  if (m.includes("signup is disabled"))
    return "New sign-ups are currently disabled. Please contact the admin.";
  if (
    m.includes("invalid totp") ||
    m.includes("invalid code") ||
    m.includes("invalid authentication code") ||
    m.includes("challenge failed")
  )
    return "Invalid verification code. Please check your authenticator app and enter the latest 6-digit code.";
  if (m.includes("mfa factor") || m.includes("factor not found") || m.includes("no mfa factor"))
    return "Authenticator factor not found. Please sign in again with your password.";
  if (m.includes("expired") || m.includes("invalid or has expired"))
    return "This link or challenge has expired. Please try again.";
  return msg;
}

/* ─── Reads Supabase's error hash (#error=...&error_code=...&error_description=...) ─── */
function parseHashError(hash: string): string | null {
  if (!hash || !hash.includes("error")) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const desc = params.get("error_description");
  return desc ? desc.replace(/\+/g, " ") : "This link is invalid or has expired.";
}

/* ─── Password Strength Calculations ──────────────────────────────────── */
interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function checkPasswordCriteria(pw: string): PasswordCriteria {
  return {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSpecial: /[^A-Za-z0-9]/.test(pw),
  };
}

function getStrength(pw: string): { score: number; label: string; color: string; badgeBg: string } {
  if (!pw)
    return {
      score: 0,
      label: "Enter password",
      color: "#94A3B8",
      badgeBg: "rgba(148, 163, 184, 0.1)",
    };
  const c = checkPasswordCriteria(pw);
  let score = 0;
  if (c.minLength) score++;
  if (pw.length >= 12) score++;
  if (c.hasUpper) score++;
  if (c.hasNumber) score++;
  if (c.hasSpecial) score++;

  if (score <= 1)
    return { score: 1, label: "Basic", color: "#F87171", badgeBg: "rgba(248, 113, 113, 0.15)" };
  if (score === 2)
    return { score: 2, label: "Fair", color: "#FBBF24", badgeBg: "rgba(251, 191, 36, 0.15)" };
  if (score === 3)
    return { score: 3, label: "Good", color: "#FCD34D", badgeBg: "rgba(252, 211, 77, 0.15)" };
  if (score === 4)
    return { score: 4, label: "Strong", color: "#34D399", badgeBg: "rgba(52, 211, 153, 0.15)" };
  return {
    score: 5,
    label: "Vault-Grade",
    color: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.2)",
  };
}

/* ─── Mode order for slide animations ───────────────────────────────── */
const MODE_ORDER = { login: 0, signup: 1, forgot: 2, reset: 3, mfa: 4 } as const;

// Module-level so the login preview plays once per page load, not on every Auth remount.
let hasPlayedLoginPreview = false;

export default function Auth({
  onLogin,
  onRecoveryComplete,
  initialMode,
  onCancelMfa,
}: {
  onLogin: (session: any) => void;
  onRecoveryComplete?: () => void;
  initialMode?: "login" | "signup" | "forgot" | "reset" | "mfa";
  onCancelMfa?: () => void;
}) {
  // Detect password-recovery link in the URL hash or forced MFA mode
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset" | "mfa">(() => {
    if (initialMode) return initialMode;
    if (capturedUrlHash.includes("type=recovery")) {
      return "reset";
    }
    return "login";
  });

  // Sync mode if initialMode changes externally (e.g. forced AAL2 requirement)
  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode, mode]);

  // Remember Me: restore saved email
  const savedEmail =
    typeof window !== "undefined" ? localStorage.getItem("pf_remember_email") || "" : "";
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const hashErr = parseHashError(capturedUrlHash);
    return hashErr ? friendlyError(hashErr) : null;
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [activeTabFeature, setActiveTabFeature] = useState<number>(0);

  // MFA TOTP State (Audit S4)
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaFocused, setMfaFocused] = useState(false);

  // Turnstile CAPTCHA State (Audit S4)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  // 3D Screensaver Idle Detection (60s inactivity)
  const { isScreensaverActive, closeScreensaver, launchScreensaver } = useIdleScreensaver({
    timeoutMs: 60000,
    enabled: true,
  });

  // Open the login screen with the screensaver as a preview (once per page load). Pointer
  // movement is ignored until the warp-in intro finishes so it can actually be seen.
  const [isIntroPreview, setIsIntroPreview] = useState(false);
  useEffect(() => {
    if (hasPlayedLoginPreview || mode !== "login") return;
    hasPlayedLoginPreview = true;
    setIsIntroPreview(true);
    launchScreensaver();
  }, [launchScreensaver, mode]);
  const handleCloseScreensaver = useCallback(() => {
    setIsIntroPreview(false);
    closeScreensaver();
  }, [closeScreensaver]);

  // Brand-panel parallax: write pointer position to CSS vars (no React re-render per move).
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const handleBrandPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", (((e.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--my", (((e.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
  }, []);
  const handleBrandPointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--mx", "0");
    e.currentTarget.style.setProperty("--my", "0");
  }, []);

  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const onCapsLockKey = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"));

  // Field-level touched state
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [confirmPassTouched, setConfirmPassTouched] = useState(false);
  const [newPassTouched, setNewPassTouched] = useState(false);
  const [confirmNewPassTouched, setConfirmNewPassTouched] = useState(false);

  // Focus state for styling
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmPassFocused, setConfirmPassFocused] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState(false);
  const [confirmNewPassFocused, setConfirmNewPassFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const isForgot = mode === "forgot";
  const isSignUp = mode === "signup";
  const isReset = mode === "reset";
  const isLogin = mode === "login";
  const isMfa = mode === "mfa";

  // Cloudflare Turnstile loader (Audit S4)
  const turnstileSiteKey = ((import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string) || "";
  useEffect(() => {
    if (isSignUp && turnstileSiteKey && turnstileContainerRef.current) {
      if (!(window as any).turnstile) {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.onload = () => {
          if ((window as any).turnstile && turnstileContainerRef.current) {
            try {
              (window as any).turnstile.render(turnstileContainerRef.current, {
                sitekey: turnstileSiteKey,
                callback: (token: string) => setTurnstileToken(token),
              });
            } catch (err) {
              console.warn("Turnstile render error:", err);
            }
          }
        };
        document.head.appendChild(script);
      } else {
        try {
          (window as any).turnstile.render(turnstileContainerRef.current, {
            sitekey: turnstileSiteKey,
            callback: (token: string) => setTurnstileToken(token),
          });
        } catch (err) {
          console.warn("Turnstile render error:", err);
        }
      }
    }
  }, [isSignUp, turnstileSiteKey]);

  // Auto-cycle feature showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTabFeature((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear error when user modifies fields
  const prevFieldsRef = useRef([
    email,
    password,
    confirmPassword,
    displayName,
    newPassword,
    confirmNewPassword,
  ]);
  useEffect(() => {
    const current = [
      email,
      password,
      confirmPassword,
      displayName,
      newPassword,
      confirmNewPassword,
    ];
    const changed = current.some((v, i) => v !== prevFieldsRef.current[i]);
    prevFieldsRef.current = current;
    if (!changed) return;
    if (error) setError(null);
    if (showResendLink) setShowResendLink(false);
  }, [
    email,
    password,
    confirmPassword,
    displayName,
    newPassword,
    confirmNewPassword,
    error,
    showResendLink,
  ]);

  // Auto-dismiss success message
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 6000);
    return () => clearTimeout(t);
  }, [msg]);

  // Strip error hash after reading
  useEffect(() => {
    if (capturedUrlHash.includes("error") && window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Auto-fetch TOTP factor id when MFA mode is active (Audit L1)
  useEffect(() => {
    if (mode !== "mfa") return;
    if (mfaFactorId) return;
    supabase.auth.mfa
      .listFactors()
      .then(({ data }) => {
        const verified =
          data?.totp?.find((f: any) => f.status === "verified") ||
          data?.totp?.[0] ||
          data?.all?.find((f: any) => f.status === "verified");
        if (verified) setMfaFactorId(verified.id);
      })
      .catch(() => {});
  }, [mode, mfaFactorId]);

  // Validation
  const emailErr =
    emailTouched && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "Please enter a valid email address"
      : "";
  const passErr =
    passTouched && password && password.length < 10 ? "Minimum 10 characters required" : "";
  const confirmPassErr =
    confirmPassTouched && isSignUp && confirmPassword && confirmPassword !== password
      ? "Passwords do not match"
      : "";
  const newPassErr =
    newPassTouched && newPassword && newPassword.length < 8 ? "Minimum 8 characters required" : "";
  const confirmNewPassErr =
    confirmNewPassTouched && confirmNewPassword && confirmNewPassword !== newPassword
      ? "Passwords do not match"
      : "";

  const criteria = isSignUp ? checkPasswordCriteria(password) : checkPasswordCriteria(newPassword);
  const strengthInfo = isSignUp ? getStrength(password) : getStrength(newPassword);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setEmailTouched(true);

    if (isReset) {
      setNewPassTouched(true);
      setConfirmNewPassTouched(true);
      if (!newPassword || newPassword.length < 8) return;
      if (newPassword !== confirmNewPassword) return;
      setLoading(true);
      setError(null);
      setMsg(null);
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setMsg("Password updated! You can now sign in with your new credentials.");
        window.history.replaceState({}, document.title, window.location.pathname);
        await supabase.auth.signOut();
        onRecoveryComplete?.();
        setTimeout(() => switchMode("login"), 2500);
      } catch (err: any) {
        setError(friendlyError(err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isForgot) setPassTouched(true);
    if (isSignUp) setConfirmPassTouched(true);

    const cleanEmail = email.trim();
    setEmail(cleanEmail);
    const hasEmailErr = !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    const hasPassErr = !isForgot && (!password || password.length < 10);
    const hasConfirmErr = isSignUp && password !== confirmPassword;

    if (hasEmailErr || hasPassErr || hasConfirmErr) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMsg("Password recovery link sent! Please check your inbox (and spam folder).");
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            captchaToken: turnstileToken || undefined,
            data: displayName.trim()
              ? { full_name: displayName.trim(), display_name: displayName.trim() }
              : undefined,
          },
        });
        if (error) throw error;
        try {
          localStorage.setItem("pf_pending_onboarding", cleanEmail);
        } catch {
          /* best-effort: storage/parse unavailable */
        }
        setMsg("Account created! Please check your inbox to verify your email before signing in.");
        setTimeout(() => switchMode("login"), 3000);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;

        // Check if TOTP MFA is required (AAL2)
        try {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData && aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            const totpFactor = factorsData?.totp?.[0];
            if (totpFactor) {
              setMfaFactorId(totpFactor.id);
              setMode("mfa");
              setLoading(false);
              return;
            }
          }
        } catch (mfaErr) {
          console.warn("[Auth] MFA check:", mfaErr);
        }

        if (rememberMe) {
          localStorage.setItem("pf_remember_email", cleanEmail);
        } else {
          localStorage.removeItem("pf_remember_email");
        }
        if (data.session) {
          onLogin(data.session);
        } else {
          setError("Unable to sign in right now. Please try again.");
        }
      }
    } catch (err: any) {
      const rawMsg: string = err?.message || "";
      setError(friendlyError(rawMsg));
      setShowResendLink(
        !isSignUp && !isForgot && rawMsg.toLowerCase().includes("email not confirmed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = mfaCode.trim().replace(/\D/g, "");
    if (!cleanCode || cleanCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let factorId = mfaFactorId;
      if (!factorId) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verified =
          factorsData?.totp?.find((f: any) => f.status === "verified") ||
          factorsData?.totp?.[0] ||
          factorsData?.all?.find((f: any) => f.status === "verified");
        if (verified?.id) {
          factorId = verified.id;
          setMfaFactorId(verified.id);
        }
      }
      if (!factorId) {
        throw new Error(
          "Unable to identify authenticator factor. Please cancel and sign in again."
        );
      }

      // Add safety timeout so verification never hangs indefinitely
      const verifyPromise = supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: cleanCode,
      });
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(
          () => reject(new Error("Verification request timed out. Please try again.")),
          15000
        )
      );

      const { data, error } = await Promise.race([verifyPromise, timeoutPromise]);
      if (error) throw error;

      // challengeAndVerify directly returns verified session object in data
      const activeSession = (data as any)?.session || data;
      if (activeSession && activeSession.access_token) {
        if (rememberMe) localStorage.setItem("pf_remember_email", email.trim());
        onLogin(activeSession);
      } else {
        const getSessionPromise = supabase.auth.getSession();
        const getSessionTimeout = new Promise<{ data: { session: any } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3000)
        );
        const {
          data: { session },
        } = await Promise.race([getSessionPromise, getSessionTimeout]);
        if (session) {
          if (rememberMe) localStorage.setItem("pf_remember_email", email.trim());
          onLogin(session);
        } else {
          setError("Authentication session not found. Please sign in again.");
        }
      }
    } catch (err: any) {
      setError(friendlyError(err.message || "Invalid authentication code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    setResendState("sending");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: cleanEmail });
      if (error) throw error;
      setResendState("sent");
      setShowResendLink(false);
      setError(null);
      setMsg("Verification email resent! Please check your inbox (and spam folder).");
    } catch (err: any) {
      setResendState("idle");
      setError(friendlyError(err.message));
    }
  };

  const handleCancelReset = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* best-effort: storage/parse unavailable */
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    onRecoveryComplete?.();
    switchMode("login");
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      localStorage.setItem("pf_demo_mode", "true");
    } catch {
      /* best-effort: storage/parse unavailable */
    }
    onLogin(DEMO_USER_SESSION);
  };

  const switchMode = (m: "login" | "signup" | "forgot" | "reset" | "mfa") => {
    if (m === mode) return;
    setSlideDir(MODE_ORDER[m] >= MODE_ORDER[mode] ? 1 : -1);
    setError(null);
    setMsg(null);
    setShowResendLink(false);
    setResendState("idle");
    setCapsLockOn(false);
    setEmailTouched(false);
    setPassTouched(false);
    setConfirmPassTouched(false);
    setNewPassTouched(false);
    setConfirmNewPassTouched(false);
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowPass(false);
    setShowConfirmPass(false);
    setShowNewPass(false);
    setShowConfirmNewPass(false);
    setMfaCode("");
    setMfaFactorId(null);
    setMode(m);
  };

  const wrapCls = (focused: boolean, err: string) =>
    ["af-inp-wrap", focused ? "af-focused" : "", err ? "af-inp-err" : ""].filter(Boolean).join(" ");

  return (
    <div className="af-shell">
      {/* ── 3D Inactivity Celestial Screensaver Overlay ── */}
      {isScreensaverActive && (
        <CelestialScreensaver
          onClose={handleCloseScreensaver}
          pointerGraceMs={isIntroPreview ? 2000 : undefined}
        />
      )}

      {/* ── Background Aurora Mesh & Starfield ── */}
      <div className="af-cosmic-bg" aria-hidden="true">
        <div className="af-aurora af-aurora-gold" />
        <div className="af-aurora af-aurora-indigo" />
        <div className="af-aurora af-aurora-emerald" />
        <div className="af-grid-overlay" />
      </div>

      {/* ── Brand Panel: 3D "allocation city" hero (desktop) ── */}
      <div
        ref={brandPanelRef}
        className="af-brand-panel"
        aria-label="ArthaDrishti overview"
        onPointerMove={handleBrandPointerMove}
        onPointerLeave={handleBrandPointerLeave}
      >
        <WealthSkylineCanvas paused={isScreensaverActive} trackRef={brandPanelRef} />
        <div className="af-brand-vignette" aria-hidden="true" />

        <div className="af-brand-content">
          <div className="af-brand-top">
            <div className="af-brand-logo">
              <div className="af-logo-glow-wrap">
                <div className="af-logo-ring-halo" />
                <BrandMark size={42} />
              </div>
              <div>
                <div className="af-brand-name">ArthaDrishti</div>
                <div className="af-brand-tagline">Private Wealth Operating System</div>
              </div>
            </div>
            <button
              type="button"
              onClick={launchScreensaver}
              className="af-screensaver-btn"
              title="Launch fullscreen 3D screensaver"
            >
              <Sparkles size={12} />
              <span>Screensaver</span>
            </button>
          </div>

          <div className="af-brand-hero">
            <div className="af-hero-kicker">
              <span className="af-kicker-line" />
              <span className="af-kicker-deva" lang="hi">
                अर्थदृष्टि
              </span>
              <span className="af-kicker-dot" aria-hidden="true" />
              Wealth, seen whole
            </div>
            <h1 className="af-brand-headline">
              See your wealth
              <span className="af-brand-headline-accent">in every dimension.</span>
            </h1>
            <p className="af-brand-sub">
              Bank accounts, equities, mutual funds, real estate, gold, PPF/EPF and family
              liabilities — one living, three-dimensional view of everything you own.
            </p>
          </div>

          {/* Floating glass chips — each sits at its own parallax depth */}
          <div className="af-float af-float-a" style={{ "--depth": 22 } as React.CSSProperties}>
            <div className="af-glass af-glass-networth">
              <div className="af-glass-label">Net worth trajectory</div>
              <div className="af-glass-row">
                <span className="af-glass-growth">
                  <TrendingUp size={13} aria-hidden="true" />
                  +18.4% YoY
                </span>
                <svg className="af-spark" viewBox="0 0 96 28" aria-hidden="true">
                  <defs>
                    <linearGradient id="af-spark-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#FACC15" stopOpacity="0.45" />
                      <stop offset="1" stopColor="#FACC15" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 24 L12 21 L22 22 L34 16 L46 17 L58 11 L70 12 L82 6 L96 3 L96 28 L0 28 Z"
                    fill="url(#af-spark-fill)"
                  />
                  <path
                    className="af-spark-line"
                    d="M0 24 L12 21 L22 22 L34 16 L46 17 L58 11 L70 12 L82 6 L96 3"
                    fill="none"
                    stroke="#FDE68A"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="af-float af-float-b" style={{ "--depth": 14 } as React.CSSProperties}>
            <div className="af-glass af-glass-legend">
              <div className="af-glass-label">One city, five asset classes</div>
              <ul>
                <li>
                  <i style={{ background: "#38BDF8" }} />
                  Equities
                </li>
                <li>
                  <i style={{ background: "#FB923C" }} />
                  Real Estate
                </li>
                <li>
                  <i style={{ background: "#FACC15" }} />
                  Gold
                </li>
                <li>
                  <i style={{ background: "#34D399" }} />
                  EPF &amp; PPF
                </li>
                <li>
                  <i style={{ background: "#C084FC" }} />
                  Liquid Cash
                </li>
              </ul>
            </div>
          </div>

          <div className="af-float af-float-c" style={{ "--depth": 30 } as React.CSSProperties}>
            <div className="af-glass af-glass-vault">
              <span className="af-glass-icon">
                <ShieldCheck size={15} aria-hidden="true" />
              </span>
              <div>
                <strong>Zero-telemetry vault</strong>
                <span>Client-side, 256-bit encryption</span>
              </div>
            </div>
          </div>

          <div className="af-brand-bottom">
            <div className="af-pillars">
              <span>
                <Wallet size={13} aria-hidden="true" /> Multi-account reconciliation
              </span>
              <span>
                <Users size={13} aria-hidden="true" /> Family &amp; nominee tracking
              </span>
              <span>
                <ShieldCheck size={13} aria-hidden="true" /> Bank-grade privacy
              </span>
            </div>
            <div className="af-brand-footer">
              <span>Designed &amp; Engineered by Anand Mohta</span>
              <div className="af-brand-status-chip">
                <span className="af-status-dot-emerald" />
                <span>Institutional Engine 2.5 Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Panel (Right) ── */}
      <div className="af-form-panel">
        <div className="af-card-outer">
          <div className="af-card-border-glow" />
          <div className="af-card">
            {/* Mobile/Tablet brand banner */}
            <div className="af-logo-mobile">
              <div className="af-logo-glow-wrap">
                <div className="af-logo-ring-halo" />
                <BrandMark size={38} />
              </div>
              <div>
                <div className="af-logo-name">ArthaDrishti</div>
                <div className="af-logo-tagline">Private Wealth OS • by Anand Mohta</div>
              </div>
            </div>

            {/* Segmented Auth Mode Switcher (only shown for login/signup) */}
            {(isLogin || isSignUp) && (
              <div className="af-segment-switch" role="tablist" aria-label="Authentication Mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  className={`af-segment-btn ${isLogin ? "af-segment-active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  {isLogin && (
                    <motion.div layoutId="activeTabBadge" className="af-segment-glow-pill" />
                  )}
                  <span className="af-segment-text">Sign In</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignUp}
                  className={`af-segment-btn ${isSignUp ? "af-segment-active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  {isSignUp && (
                    <motion.div layoutId="activeTabBadge" className="af-segment-glow-pill" />
                  )}
                  <span className="af-segment-text">Create Account</span>
                </button>
              </div>
            )}

            {/* Animated Mode Transition */}
            <AnimatePresence mode="wait" initial={false} custom={slideDir}>
              <motion.div
                key={mode}
                custom={slideDir}
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : 10,
                  scale: shouldReduceMotion ? 1 : 0.985,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : -10,
                  scale: shouldReduceMotion ? 1 : 0.985,
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header */}
                <div className="af-card-head">
                  {isLogin && (
                    <div className="af-greeting-badge">
                      <span className="af-greeting-sun" />
                      <span>{getGreeting()}</span>
                    </div>
                  )}
                  <h2 className="af-card-title">
                    {isReset
                      ? "Set new password"
                      : isForgot
                        ? "Reset your password"
                        : isSignUp
                          ? "Join ArthaDrishti"
                          : isMfa
                            ? "Two-Factor Verification"
                            : "Welcome back"}
                  </h2>
                  <p className="af-card-sub">
                    {isReset
                      ? "Create a secure new password for your wealth operating system."
                      : isForgot
                        ? "Enter your registered email and we'll dispatch an instant recovery link."
                        : isSignUp
                          ? "Start tracking your total net worth and family assets in one unified dashboard."
                          : isMfa
                            ? "Enter the 6-digit verification code from your authenticator app to access your vault."
                            : "Enter your credentials to access your financial dashboard."}
                  </p>
                </div>

                {/* Error alert */}
                {error && (
                  <div className="af-alert af-alert-err" role="alert">
                    <AlertCircle size={16} className="af-alert-icon" aria-hidden="true" />
                    <div className="af-alert-body">
                      <span>{error}</span>
                      {showResendLink && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendState === "sending"}
                          className="af-resend-link"
                        >
                          {resendState === "sending" ? "Sending…" : "Resend verification email"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success alert */}
                {msg && (
                  <div className="af-alert af-alert-ok" role="status">
                    <CheckCircle2 size={16} className="af-alert-icon" aria-hidden="true" />
                    <span>{msg}</span>
                  </div>
                )}

                {/* ══ RESET MODE ══ */}
                {isReset ? (
                  <form onSubmit={handleAuth} className="af-form" noValidate>
                    <div className="af-info-banner">
                      <KeyRound size={16} />
                      <span>Password recovery verified. Enter your new password below.</span>
                    </div>

                    {/* New Password */}
                    <div className="af-field">
                      <label className="af-lbl" htmlFor="af-newpass">
                        New Password
                      </label>
                      <div className={wrapCls(newPassFocused, newPassErr)}>
                        <span className="af-inp-icon">
                          <Lock size={16} />
                        </span>
                        <input
                          id="af-newpass"
                          type={showNewPass ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onFocus={() => setNewPassFocused(true)}
                          onBlur={() => {
                            setNewPassFocused(false);
                            setNewPassTouched(true);
                            setCapsLockOn(false);
                          }}
                          onKeyDown={onCapsLockKey}
                          onKeyUp={onCapsLockKey}
                          className="af-inp af-inp-padded"
                          placeholder="Create strong password (10+ chars)"
                          autoComplete="new-password"
                          autoFocus={!isMobileViewport}
                          aria-invalid={!!newPassErr}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowNewPass((v) => !v)}
                          className="af-eye-btn"
                          aria-label={showNewPass ? "Hide password" : "Show password"}
                        >
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {capsLockOn && newPassFocused && (
                        <div className="af-caps-msg" role="status">
                          <AlertCircle size={12} aria-hidden="true" />
                          Caps Lock is active
                        </div>
                      )}
                      {newPassErr && (
                        <div className="af-err-msg" role="alert">
                          <AlertCircle size={12} />
                          {newPassErr}
                        </div>
                      )}

                      {/* Criteria Checklist */}
                      {newPassword && (
                        <div className="af-criteria-card">
                          <div className="af-criteria-head">
                            <span className="af-crit-title">Password Strength</span>
                            <span
                              className="af-strength-badge"
                              style={{
                                color: strengthInfo.color,
                                background: strengthInfo.badgeBg,
                                borderColor: strengthInfo.color,
                              }}
                            >
                              {strengthInfo.label}
                            </span>
                          </div>
                          <div className="af-strength-bar-wrap">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="af-strength-segment"
                                style={{
                                  background:
                                    strengthInfo.score >= i
                                      ? strengthInfo.color
                                      : "rgba(255, 255, 255, 0.08)",
                                }}
                              />
                            ))}
                          </div>
                          <div className="af-criteria-grid">
                            <span
                              className={`af-crit-item ${criteria.minLength ? "af-crit-ok" : ""}`}
                            >
                              {criteria.minLength ? <Check size={12} /> : <X size={12} />} 8+
                              characters
                            </span>
                            <span
                              className={`af-crit-item ${criteria.hasUpper ? "af-crit-ok" : ""}`}
                            >
                              {criteria.hasUpper ? <Check size={12} /> : <X size={12} />} Uppercase
                            </span>
                            <span
                              className={`af-crit-item ${criteria.hasNumber ? "af-crit-ok" : ""}`}
                            >
                              {criteria.hasNumber ? <Check size={12} /> : <X size={12} />} Number
                            </span>
                            <span
                              className={`af-crit-item ${criteria.hasSpecial ? "af-crit-ok" : ""}`}
                            >
                              {criteria.hasSpecial ? <Check size={12} /> : <X size={12} />} Symbol
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="af-field">
                      <label className="af-lbl" htmlFor="af-confirmnewpass">
                        Confirm New Password
                      </label>
                      <div className={wrapCls(confirmNewPassFocused, confirmNewPassErr)}>
                        <span className="af-inp-icon">
                          <Lock size={16} />
                        </span>
                        <input
                          id="af-confirmnewpass"
                          type={showConfirmNewPass ? "text" : "password"}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          onFocus={() => setConfirmNewPassFocused(true)}
                          onBlur={() => {
                            setConfirmNewPassFocused(false);
                            setConfirmNewPassTouched(true);
                          }}
                          className="af-inp af-inp-padded"
                          placeholder="Re-enter your new password"
                          autoComplete="new-password"
                          aria-invalid={!!confirmNewPassErr}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowConfirmNewPass((v) => !v)}
                          className="af-eye-btn"
                          aria-label={showConfirmNewPass ? "Hide" : "Show"}
                        >
                          {showConfirmNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmNewPassErr && (
                        <div className="af-err-msg" role="alert">
                          <AlertCircle size={12} />
                          {confirmNewPassErr}
                        </div>
                      )}
                      {!confirmNewPassErr &&
                        confirmNewPassword &&
                        confirmNewPassword === newPassword && (
                          <div className="af-match-msg">
                            <CheckCircle2 size={12} />
                            Passwords match perfectly
                          </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="af-cta-btn">
                      <div className="af-cta-shine" />
                      {loading ? (
                        <Loader2 size={18} className="af-spin" />
                      ) : (
                        <>
                          <span>Update Password</span>
                          <ArrowRight size={16} strokeWidth={2.5} />
                        </>
                      )}
                    </button>

                    <div className="af-switch">
                      <button type="button" onClick={handleCancelReset} className="af-back-link">
                        <ArrowLeft size={14} />
                        <span>Cancel and return to sign in</span>
                      </button>
                    </div>
                  </form>
                ) : isMfa ? (
                  /* ══ MFA TOTP VERIFICATION MODE (Audit S4) ══ */
                  <form onSubmit={handleMfaSubmit} className="af-form" noValidate>
                    <div className="af-info-banner af-info-banner-mfa">
                      <ShieldCheck size={18} className="af-mfa-banner-icon" />
                      <span>
                        Enter the 6-digit verification code generated by your authenticator app
                        (Google Authenticator, Microsoft Authenticator, 1Password, Authy).
                      </span>
                    </div>

                    <div className="af-field">
                      <label className="af-lbl" htmlFor="af-mfacode">
                        Authenticator Code
                      </label>
                      <div className={wrapCls(mfaFocused, "")}>
                        <span className="af-inp-icon">
                          <Lock size={16} />
                        </span>
                        <input
                          id="af-mfacode"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) =>
                            setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          onFocus={() => setMfaFocused(true)}
                          onBlur={() => setMfaFocused(false)}
                          className="af-inp af-inp-padded af-mfa-inp"
                          placeholder="000000"
                          autoFocus
                          autoComplete="one-time-code"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || mfaCode.length !== 6}
                      className="af-cta-btn"
                    >
                      <div className="af-cta-shine" />
                      {loading ? (
                        <Loader2 size={18} className="af-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                        </>
                      )}
                    </button>

                    <div className="af-switch">
                      <button
                        type="button"
                        onClick={() => {
                          setMfaCode("");
                          setMfaFactorId(null);
                          switchMode("login");
                          onCancelMfa?.();
                        }}
                        className="af-back-link"
                      >
                        <ArrowLeft size={14} />
                        <span>Cancel and return to sign in</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ══ STANDARD FORM (login / signup / forgot) ══ */
                  <form onSubmit={handleAuth} className="af-form" noValidate>
                    {/* Display Name (Sign Up only) */}
                    {isSignUp && (
                      <div className="af-field">
                        <label className="af-lbl" htmlFor="af-name">
                          Full Name <span className="af-optional-tag">(optional)</span>
                        </label>
                        <div className={wrapCls(nameFocused, "")}>
                          <span className="af-inp-icon">
                            <UserCircle size={16} />
                          </span>
                          <input
                            id="af-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                            className="af-inp af-inp-padded"
                            placeholder="e.g. Anand Mohta"
                            autoComplete="name"
                            autoFocus={!isMobileViewport}
                          />
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div className="af-field">
                      <label className="af-lbl" htmlFor="af-email">
                        Email address
                      </label>
                      <div className={wrapCls(emailFocused, emailErr)}>
                        <span className="af-inp-icon">
                          <Mail size={16} />
                        </span>
                        <input
                          id="af-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => {
                            setEmailFocused(false);
                            setEmailTouched(true);
                            setEmail((e) => e.trim());
                          }}
                          className="af-inp af-inp-padded"
                          placeholder="name@example.com"
                          autoComplete="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          autoFocus={!isSignUp && !isMobileViewport}
                          aria-describedby={emailErr ? "af-email-err" : undefined}
                          aria-invalid={!!emailErr}
                        />
                      </div>
                      {emailErr && (
                        <div id="af-email-err" className="af-err-msg" role="alert">
                          <AlertCircle size={12} aria-hidden="true" />
                          {emailErr}
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    {!isForgot && (
                      <div className="af-field">
                        <label className="af-lbl" htmlFor="af-pass">
                          Password
                        </label>
                        <div className={wrapCls(passFocused, passErr)}>
                          <span className="af-inp-icon">
                            <Lock size={16} />
                          </span>
                          <input
                            id="af-pass"
                            type={showPass ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPassFocused(true)}
                            onBlur={() => {
                              setPassFocused(false);
                              setPassTouched(true);
                              setCapsLockOn(false);
                            }}
                            onKeyDown={onCapsLockKey}
                            onKeyUp={onCapsLockKey}
                            className="af-inp af-inp-padded"
                            placeholder={
                              isSignUp
                                ? "Create strong password (10+ chars)"
                                : "Enter your password"
                            }
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            aria-describedby={passErr ? "af-pass-err" : undefined}
                            aria-invalid={!!passErr}
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowPass((v) => !v)}
                            className="af-eye-btn"
                            aria-label={showPass ? "Hide password" : "Show password"}
                          >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {capsLockOn && passFocused && (
                          <div className="af-caps-msg" role="status">
                            <AlertCircle size={12} aria-hidden="true" />
                            Caps Lock is active
                          </div>
                        )}
                        {passErr && (
                          <div id="af-pass-err" className="af-err-msg" role="alert">
                            <AlertCircle size={12} aria-hidden="true" />
                            {passErr}
                          </div>
                        )}

                        {/* Password Criteria Checklist (Sign Up only) */}
                        {isSignUp && password && (
                          <div className="af-criteria-card" aria-live="polite">
                            <div className="af-criteria-head">
                              <span className="af-crit-title">Password Security</span>
                              <span
                                className="af-strength-badge"
                                style={{
                                  color: strengthInfo.color,
                                  background: strengthInfo.badgeBg,
                                  borderColor: strengthInfo.color,
                                }}
                              >
                                {strengthInfo.label}
                              </span>
                            </div>
                            <div className="af-strength-bar-wrap">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className="af-strength-segment"
                                  style={{
                                    background:
                                      strengthInfo.score >= i
                                        ? strengthInfo.color
                                        : "rgba(255, 255, 255, 0.08)",
                                  }}
                                />
                              ))}
                            </div>
                            <div className="af-criteria-grid">
                              <span
                                className={`af-crit-item ${criteria.minLength ? "af-crit-ok" : ""}`}
                              >
                                {criteria.minLength ? <Check size={12} /> : <X size={12} />} 8+
                                chars
                              </span>
                              <span
                                className={`af-crit-item ${criteria.hasUpper ? "af-crit-ok" : ""}`}
                              >
                                {criteria.hasUpper ? <Check size={12} /> : <X size={12} />}{" "}
                                Uppercase
                              </span>
                              <span
                                className={`af-crit-item ${criteria.hasNumber ? "af-crit-ok" : ""}`}
                              >
                                {criteria.hasNumber ? <Check size={12} /> : <X size={12} />} Number
                              </span>
                              <span
                                className={`af-crit-item ${criteria.hasSpecial ? "af-crit-ok" : ""}`}
                              >
                                {criteria.hasSpecial ? <Check size={12} /> : <X size={12} />} Symbol
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirm Password (Sign Up only) */}
                    {isSignUp && (
                      <div className="af-field">
                        <label className="af-lbl" htmlFor="af-confirmpass">
                          Confirm Password
                        </label>
                        <div className={wrapCls(confirmPassFocused, confirmPassErr)}>
                          <span className="af-inp-icon">
                            <Lock size={16} />
                          </span>
                          <input
                            id="af-confirmpass"
                            type={showConfirmPass ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setConfirmPassFocused(true)}
                            onBlur={() => {
                              setConfirmPassFocused(false);
                              setConfirmPassTouched(true);
                            }}
                            className="af-inp af-inp-padded"
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            aria-invalid={!!confirmPassErr}
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowConfirmPass((v) => !v)}
                            className="af-eye-btn"
                            aria-label={showConfirmPass ? "Hide" : "Show"}
                          >
                            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {confirmPassErr && (
                          <div className="af-err-msg" role="alert">
                            <AlertCircle size={12} />
                            {confirmPassErr}
                          </div>
                        )}
                        {!confirmPassErr && confirmPassword && confirmPassword === password && (
                          <div className="af-match-msg">
                            <CheckCircle2 size={12} />
                            Passwords match
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remember me & Forgot Password */}
                    {!isForgot && !isSignUp && (
                      <div className="af-meta-row">
                        <label className="af-remember">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="af-chk"
                          />
                          <span className="af-remember-text">Remember my email</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="af-link af-forgot-btn"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {/* Cloudflare Turnstile CAPTCHA widget (Audit S4) */}
                    {isSignUp && (
                      <div
                        id="cf-turnstile-container"
                        ref={turnstileContainerRef}
                        style={{
                          minHeight: 42,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          margin: "8px 0 12px 0",
                        }}
                      />
                    )}

                    {/* Primary CTA Button with Gold Ingot Polish */}
                    <button type="submit" disabled={loading} className="af-cta-btn">
                      <div className="af-cta-shine" />
                      {loading ? (
                        <Loader2 size={18} className="af-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <span>
                            {isForgot
                              ? "Send Recovery Link"
                              : isSignUp
                                ? "Create Free Account"
                                : "Sign In to Dashboard"}
                          </span>
                          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                        </>
                      )}
                    </button>

                    {/* Back to Sign In button for Forgot Mode */}
                    {isForgot && (
                      <div className="af-switch">
                        <button
                          type="button"
                          onClick={() => switchMode("login")}
                          className="af-back-link"
                        >
                          <ArrowLeft size={14} />
                          <span>Back to Sign In</span>
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* ── Guest Demo Access Section ── */}
                {(isLogin || isSignUp) && (
                  <div className="af-demo-container">
                    <div className="af-divider-row" role="separator" aria-label="Or explore demo">
                      <span className="af-divider-line" />
                      <span className="af-divider-text">OR TEST-DRIVE WITH DUMMY DATA</span>
                      <span className="af-divider-line" />
                    </div>

                    <div className="af-demo-card">
                      <div className="af-demo-card-shine" />
                      <div className="af-demo-content">
                        <div className="af-demo-icon-wrap">
                          <Sparkles size={18} className="af-demo-icon" />
                        </div>
                        <div className="af-demo-text">
                          <div className="af-demo-title-row">
                            <span className="af-demo-title">Explore Interactive Demo</span>
                            <span className="af-demo-badge">No Password</span>
                          </div>
                          <p className="af-demo-desc">
                            Explore full wealth tracking with comprehensive dummy portfolio data —
                            no username, password, or signup needed.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loading}
                        className="af-demo-btn"
                        id="btn-explore-demo"
                      >
                        <Zap size={15} className="af-demo-btn-icon" />
                        <span>Launch Demo with Dummy Data</span>
                        <ArrowRight size={14} className="af-demo-btn-arrow" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Privacy & Trust micro-footer */}
            <div className="af-form-footer">
              <ShieldCheck size={14} className="af-footer-shield" />
              <span>256-bit Encryption • Zero-Telemetry Privacy • End-to-End Secure</span>
            </div>
          </div>
        </div>
      </div>

      <style>{AF_STYLES}</style>
    </div>
  );
}

/* ─── Ultra-Premium Stylesheet ─────────────────────────────────────────── */
const AF_STYLES = `
/* ── Interactive Demo Sandbox Section ───── */
.af-demo-container {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.af-divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.af-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
}

.af-divider-text {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94A3B8;
  text-transform: uppercase;
  white-space: nowrap;
}

.af-demo-card {
  position: relative;
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.af-demo-card:hover {
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow: 0 6px 24px rgba(212, 175, 55, 0.18);
}

.af-demo-card-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.7), transparent);
}

.af-demo-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.af-demo-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F5E5C9;
  flex-shrink: 0;
}

.af-demo-icon {
  color: #E8C872;
}

.af-demo-text {
  flex: 1;
  min-width: 0;
}

.af-demo-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.af-demo-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.01em;
}

.af-demo-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.18);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.af-demo-desc {
  font-size: 11.5px;
  color: #94A3B8;
  margin-top: 4px;
  line-height: 1.45;
  margin-bottom: 0;
}

.af-demo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 18px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  color: #1E293B;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.af-demo-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
  border-color: rgba(212, 175, 55, 0.75);
  color: #FFFFFF;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.25);
}

.af-demo-btn:active:not(:disabled) {
  transform: translateY(0);
}

.af-demo-btn-icon {
  color: #E8C872;
}

.af-demo-btn-arrow {
  transition: transform 0.15s ease;
}

.af-demo-btn:hover .af-demo-btn-arrow {
  transform: translateX(3px);
}

/* ── Global Container & Luxe Tokens (Senior Designer Light Theme) ─────── */
.af-shell {
  --af-gold-primary: #D97706;
  --af-gold-light: #B45309;
  --af-gold-glow: rgba(217, 119, 6, 0.2);
  --af-gold-border: rgba(217, 119, 6, 0.3);
  --af-gold-btn: linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #312E81 100%);
  --af-gold-btn-hover: linear-gradient(135deg, #1E293B 0%, #312E81 70%, #4338CA 100%);
  
  --af-bg-main: #F8FAFC;
  --af-card-surface: rgba(255, 255, 255, 0.94);
  --af-card-border: rgba(226, 232, 240, 0.95);
  --af-input-surface: #FFFFFF;
  --af-input-surface-focus: #FFFFFF;
  
  --af-text-head: #0F172A;
  --af-text-body: #1E293B;
  --af-text-muted: #64748B;

  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--af-bg-main);
  color: var(--af-text-body);
  overflow-x: hidden;
  position: relative;
}

/* ── Cosmic Ambient Aurora Canvas ───────── */
.af-cosmic-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.af-aurora {
  position: absolute;
  filter: blur(120px);
  border-radius: 50%;
  opacity: 0.6;
  animation: af-float 16s ease-in-out infinite alternate;
}

.af-aurora-gold {
  top: -15%;
  right: 15%;
  width: 580px;
  height: 580px;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.05) 0%, transparent 70%);
}

.af-aurora-indigo {
  bottom: -20%;
  left: 5%;
  width: 650px;
  height: 650px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.045) 0%, transparent 70%);
  animation-duration: 20s;
  animation-delay: -4s;
}

.af-aurora-emerald {
  top: 40%;
  left: 30%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(5, 150, 105, 0.03) 0%, transparent 70%);
  animation-duration: 24s;
  animation-delay: -8s;
}

.af-grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px);
  background-size: 44px 44px;
}

/* ── Brand Panel (Left Showcase) ────────── */
.af-brand-panel {
  --mx: 0;
  --my: 0;
  position: relative;
  flex: 0 0 56%;
  min-width: 520px;
  overflow: hidden;
  z-index: 2;
  color: #E2E8F0;
  background:
    radial-gradient(ellipse 80% 55% at 50% 72%, #1e2466 0%, rgba(30, 36, 102, 0) 70%),
    radial-gradient(ellipse 60% 40% at 85% 10%, rgba(217, 119, 6, 0.16) 0%, transparent 70%),
    linear-gradient(180deg, #070a1f 0%, #0b0f2e 55%, #05060f 100%);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06), 24px 0 60px -30px rgba(5, 6, 15, 0.45);
}

.af-skyline-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.af-brand-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(7, 10, 31, 0.85) 0%, rgba(7, 10, 31, 0) 38%),
    linear-gradient(0deg, rgba(5, 6, 15, 0.95) 0%, rgba(5, 6, 15, 0.6) 14%, rgba(5, 6, 15, 0) 32%);
}

.af-brand-content {
  position: absolute;
  inset: 0;
  padding: 32px 44px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}
.af-brand-content button,
.af-brand-content a {
  pointer-events: auto;
}

.af-brand-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: af-rise-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.af-brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.af-logo-glow-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.af-logo-ring-halo {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.3) 0%, transparent 70%);
  z-index: -1;
  animation: af-pulse-halo 3s ease-in-out infinite;
}

.af-brand-name {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #FFFFFF;
  line-height: 1.1;
}

.af-brand-tagline {
  font-size: 10px;
  font-weight: 600;
  color: #FBBF24;
  margin-top: 4px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.af-screensaver-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #FDE68A;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(253, 230, 138, 0.28);
  padding: 7px 13px;
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.af-screensaver-btn:hover {
  background: #F59E0B;
  border-color: #F59E0B;
  color: #1C1206;
  box-shadow: 0 0 24px rgba(245, 158, 11, 0.45);
}
.af-screensaver-btn:focus-visible {
  outline: 2px solid #FDE68A;
  outline-offset: 2px;
}

.af-brand-hero {
  max-width: 540px;
  margin-top: 4vh;
  margin-bottom: auto;
  animation: af-rise-in 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.af-hero-kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #FBBF24;
  margin-bottom: 14px;
}
.af-kicker-deva {
  font-family: 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Mukta', sans-serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  background: linear-gradient(100deg, #FEF3C7, #FACC15 55%, #F59E0B);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.af-kicker-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(251, 191, 36, 0.6);
}
.af-kicker-line {
  width: 28px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #FBBF24);
}

.af-brand-headline {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(34px, 3.5vw, 54px);
  font-weight: 300;
  line-height: 1.04;
  letter-spacing: -0.035em;
  color: #FFFFFF;
  margin: 0;
}

.af-brand-headline-accent {
  display: block;
  font-weight: 700;
  background: linear-gradient(100deg, #FEF3C7 0%, #FACC15 35%, #F59E0B 60%, #FDE68A 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: af-gold-shimmer 6s ease-in-out infinite;
}

.af-brand-sub {
  max-width: 440px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(203, 213, 225, 0.78);
  margin: 16px 0 0;
}

/* Floating glass chips with per-chip parallax depth */
.af-float {
  position: absolute;
  transform: translate3d(calc(var(--mx) * var(--depth) * -1px), calc(var(--my) * var(--depth) * -1px), 0);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.af-float-a { top: 43%; right: 6%; }
.af-float-b { top: 60%; left: 5%; }
.af-float-c { bottom: 19%; right: 8%; }

@media (max-height: 800px) {
  .af-float-b { display: none; }
  .af-float-a { top: 46%; }
  .af-brand-hero { margin-top: 2vh; }
  .af-brand-sub { font-size: 13px; margin-top: 12px; }
}
.af-float > .af-glass {
  animation: af-rise-in 1s cubic-bezier(0.16, 1, 0.3, 1) both, af-bob 7s ease-in-out infinite;
}
.af-float-a > .af-glass { animation-delay: 1.3s, 1.3s; }
.af-float-b > .af-glass { animation-delay: 1.5s, 2.6s; }
.af-float-c > .af-glass { animation-delay: 1.7s, 0.4s; }

.af-glass {
  background: linear-gradient(160deg, rgba(30, 36, 80, 0.55), rgba(10, 12, 32, 0.55));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 12px 14px;
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}
.af-glass-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(203, 213, 225, 0.6);
}
.af-glass-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-top: 6px;
}
.af-glass-growth {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 18px;
  font-weight: 700;
  color: #FDE68A;
  letter-spacing: -0.01em;
}
.af-spark {
  width: 96px;
  height: 28px;
  overflow: visible;
}
.af-spark-line {
  stroke-dasharray: 140;
  stroke-dashoffset: 140;
  animation: af-draw 1.6s cubic-bezier(0.65, 0, 0.35, 1) 1.6s forwards;
}
.af-glass-legend ul {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: auto auto;
  gap: 5px 16px;
}
.af-glass-legend li {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 500;
  color: #E2E8F0;
}
.af-glass-legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  box-shadow: 0 0 8px currentColor;
}
.af-glass-vault {
  display: flex;
  align-items: center;
  gap: 11px;
}
.af-glass-vault strong {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #FFFFFF;
}
.af-glass-vault span {
  font-size: 11px;
  color: rgba(203, 213, 225, 0.7);
}
.af-glass-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #34D399 !important;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.af-brand-bottom {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: af-rise-in 1s cubic-bezier(0.16, 1, 0.3, 1) 1.9s both;
}
.af-pillars {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.82);
}
.af-pillars span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.af-pillars svg {
  color: #FBBF24;
}

.af-brand-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  color: rgba(148, 163, 184, 0.75);
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.af-brand-status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #6EE7B7;
  background: rgba(16, 185, 129, 0.1);
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid rgba(16, 185, 129, 0.28);
}

.af-status-dot-emerald {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
}

@keyframes af-rise-in {
  from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes af-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -7px; }
}
@keyframes af-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes af-gold-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ── Form Panel (Right) ─────────────────── */
.af-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 32px;
  min-height: 100dvh;
  min-height: 100vh;
  overflow-y: auto;
  position: relative;
  z-index: 2;
}

.af-card-outer {
  position: relative;
  width: 100%;
  max-width: 440px;
}

@property --af-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.af-card-outer {
  animation: af-card-rise 1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  transform-origin: 50% 100%;
}

/* Rotating gold/indigo light running around the card edge */
.af-card-border-glow {
  position: absolute;
  inset: -1.5px;
  border-radius: 25.5px;
  background: conic-gradient(from var(--af-angle), rgba(79, 70, 229, 0.15), #6366F1, #F59E0B, #FDE68A, rgba(217, 119, 6, 0.15) 45%, rgba(79, 70, 229, 0.15));
  animation: af-spin-angle 7s linear infinite;
  pointer-events: none;
  z-index: 0;
}
.af-card-border-glow::after {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: inherit;
  background: inherit;
  filter: blur(28px);
  opacity: 0.35;
  z-index: -1;
}
.af-card-outer > .af-card {
  z-index: 1;
}

.af-form-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 50% 40% at 50% 45%, rgba(99, 102, 241, 0.1) 0%, transparent 70%),
    radial-gradient(ellipse 35% 30% at 70% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
}
.af-form-panel::after {
  content: "";
  position: absolute;
  left: -20%;
  right: -20%;
  bottom: -10%;
  height: 55%;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(79, 70, 229, 0.14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 70, 229, 0.14) 1px, transparent 1px);
  background-size: 56px 56px;
  transform: perspective(700px) rotateX(62deg);
  transform-origin: 50% 100%;
  -webkit-mask-image: linear-gradient(0deg, #000 0%, transparent 85%);
  mask-image: linear-gradient(0deg, #000 0%, transparent 85%);
  animation: af-floor-scroll 6s linear infinite;
}

@keyframes af-spin-angle {
  to { --af-angle: 360deg; }
}
@keyframes af-card-rise {
  from { opacity: 0; transform: perspective(1200px) rotateX(14deg) translateY(36px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
@keyframes af-floor-scroll {
  to { background-position: 0 56px; }
}

.af-card {
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 24px;
  padding: 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 
    0 25px 50px -15px rgba(15, 23, 42, 0.08),
    0 4px 16px -2px rgba(15, 23, 42, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
}

.af-logo-mobile {
  display: none;
}

/* Segmented Mode Switcher */
.af-segment-switch {
  position: relative;
  display: flex;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 3px;
  gap: 3px;
}

.af-segment-btn {
  flex: 1;
  position: relative;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: #64748B;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: color 0.2s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.af-segment-btn:hover:not(.af-segment-active) {
  color: #0F172A;
}

.af-segment-active {
  color: #0F172A !important;
  font-weight: 700;
}

.af-segment-glow-pill {
  position: absolute;
  inset: 0;
  background: #FFFFFF;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
  z-index: 1;
}

.af-segment-text {
  position: relative;
  z-index: 2;
}

/* Card Header */
.af-card-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.af-greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #B45309;
  margin-bottom: 2px;
}

.af-greeting-sun {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #D97706;
  box-shadow: 0 0 8px rgba(217, 119, 6, 0.6);
}

.af-card-title {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.af-card-sub {
  font-size: 13px;
  color: #64748B;
  line-height: 1.5;
  margin: 0;
}

/* Alerts */
.af-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.45;
  margin-bottom: 2px;
}

.af-alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.af-alert-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.af-alert-err {
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  color: #BE123C;
}

.af-alert-ok {
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  color: #047857;
}

.af-info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #EFF6FF;
  border-radius: 12px;
  border: 1px solid #BFDBFE;
  font-size: 12.5px;
  color: #1E40AF;
  font-weight: 500;
  margin-bottom: 8px;
}

.af-info-banner.af-info-banner-mfa {
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-left: 3.5px solid #10B981;
  color: #065F46;
  line-height: 1.45;
}

.af-mfa-banner-icon {
  color: #10B981;
  flex-shrink: 0;
}

/* Form Structure */
.af-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.af-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.af-lbl {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  letter-spacing: -0.01em;
}

.af-optional-tag {
  font-size: 11px;
  font-weight: 400;
  color: #64748B;
}

/* Inputs */
.af-inp-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1.5px solid #CBD5E1;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.af-inp-wrap:hover:not(.af-focused):not(.af-inp-err) {
  border-color: #94A3B8;
}

.af-inp-wrap.af-focused,
.af-inp-wrap:focus-within {
  border-color: #4F46E5;
  background: #FFFFFF;
  box-shadow: 
    0 0 0 3.5px rgba(79, 70, 229, 0.14),
    0 2px 8px rgba(15, 23, 42, 0.04);
}

.af-inp-wrap.af-inp-err {
  border-color: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.af-inp {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  color: #0F172A;
  padding: 12px 14px;
  font-weight: 500;
}

.af-inp:focus,
.af-inp:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
}

.af-mfa-inp {
  letter-spacing: 0.3em;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  padding-right: 38px;
  font-family: 'SF Mono', 'Roboto Mono', 'Plus Jakarta Sans', monospace;
}

.af-inp::placeholder {
  color: rgba(148, 163, 184, 0.55);
}

.af-inp-padded {
  padding-left: 8px;
}

.af-inp-icon {
  display: flex;
  align-items: center;
  padding-left: 14px;
  color: #64748B;
  flex-shrink: 0;
  transition: color 0.2s;
}

.af-focused .af-inp-icon,
.af-inp-wrap:focus-within .af-inp-icon {
  color: #4F46E5;
}

.af-eye-btn {
  background: none;
  border: none;
  padding: 0 14px;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.af-eye-btn:hover {
  color: #0F172A;
}

.af-err-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #F87171;
  font-weight: 500;
  margin-top: 2px;
}

.af-caps-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #FBBF24;
  font-weight: 600;
  margin-top: 2px;
}

.af-match-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #34D399;
  font-weight: 600;
  margin-top: 2px;
}

/* Criteria Checklist */
.af-criteria-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 12px 14px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.af-criteria-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.af-crit-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #334155;
}

.af-strength-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid;
}

.af-strength-bar-wrap {
  display: flex;
  gap: 4px;
}

.af-strength-segment {
  flex: 1;
  height: 4px;
  border-radius: 9999px;
  transition: background 0.25s ease;
}

.af-criteria-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
}

.af-crit-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #64748B;
  font-weight: 500;
  transition: color 0.2s ease;
}

.af-crit-ok {
  color: #059669;
  font-weight: 600;
}

/* Remember me & links */
.af-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -2px;
}

.af-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
}

.af-remember-text {
  color: #475569;
}

.af-chk {
  width: 16px;
  height: 16px;
  accent-color: #D4AF37;
  cursor: pointer;
  border-radius: 4px;
  margin: 0;
}

.af-link {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #4F46E5;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s;
  text-decoration: none;
}

.af-link:hover {
  text-decoration: underline;
  color: #3730A3;
}

.af-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  font-family: inherit;
  transition: all 0.15s;
}

.af-back-link:hover {
  background: #F1F5F9;
  color: #0F172A;
}

/* CTA Button with Gold Ingot Finish */
.af-cta-btn {
  position: relative;
  width: 100%;
  padding: 14px 20px;
  background: var(--af-gold-btn);
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 
    0 8px 24px -4px rgba(15, 23, 42, 0.28),
    inset 0 1px 1px rgba(255, 255, 255, 0.25);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 4px;
  overflow: hidden;
}

.af-cta-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-25deg);
  transition: left 0.6s ease;
}

.af-cta-btn:hover .af-cta-shine {
  left: 150%;
}

.af-cta-btn:hover:not(:disabled) {
  background: var(--af-gold-btn-hover);
  box-shadow: 
    0 12px 28px -3px rgba(15, 23, 42, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transform: translateY(-1.5px);
  filter: brightness(1.05);
}

.af-cta-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
  box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
}

.af-cta-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

/* Accessible focus visible rings */
button:focus-visible,
a:focus-visible,
input:not(.af-inp):focus-visible,
.af-feature-item:focus-visible {
  outline: 2px solid #D4AF37 !important;
  outline-offset: 2px !important;
}

/* Footer info */
.af-form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #64748B;
  text-align: center;
  margin-top: 2px;
}

.af-footer-shield {
  color: #D4AF37;
  flex-shrink: 0;
}

.af-switch {
  text-align: center;
  margin-top: 10px;
}

.af-resend-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 700;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

/* ── Animations ─────────────────────────── */
@keyframes af-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

@keyframes af-pulse-halo {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes af-float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, 40px) scale(1.08); }
}

@keyframes af-shine-pass {
  0% { left: -100%; }
  20%, 100% { left: 150%; }
}

.af-spin {
  animation: af-spin-anim 0.8s linear infinite;
}

@keyframes af-spin-anim {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  .af-card-border-glow,
  .af-form-panel::after,
  .af-brand-headline-accent,
  .af-float > .af-glass,
  .af-aurora,
  .af-logo-ring-halo,
  .af-live-dot,
  .af-preview-card-shine,
  .af-cta-shine {
    animation: none !important;
  }
  .af-preview-card:hover,
  .af-cta-btn:hover,
  .af-demo-btn:hover,
  .af-feature-item:hover {
    transform: none !important;
  }
}

/* ── Responsive Viewports ───────────────── */
@media (min-width: 1024px) {
  .af-shell {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }
  .af-brand-panel {
    height: 100vh;
    max-height: 100vh;
  }
  .af-form-panel {
    height: 100vh;
    max-height: 100vh;
    overflow-y: auto;
    padding: 20px 32px;
  }
}

@media (max-width: 1100px) {
  .af-brand-panel {
    display: none;
  }
  /* iOS Safari zooms into inputs smaller than 16px on focus */
  .af-inp {
    font-size: 16px;
  }
  .af-form-panel {
    padding: 32px 20px;
    align-items: center;
  }
  .af-logo-mobile {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 4px;
    padding-bottom: 16px;
    border-bottom: 1px solid #E2E8F0;
  }
  .af-logo-name {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #0F172A;
  }
  .af-logo-tagline {
    font-size: 11.5px;
    color: #B45309;
  }
  .af-card {
    border-radius: 24px;
    padding: 28px 24px;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .af-form-panel {
    padding: 16px 12px;
  }
  .af-card {
    padding: 24px 18px;
    gap: 14px;
    border-radius: 20px;
  }
  .af-card-title {
    font-size: 21px;
  }
  .af-segment-btn {
    padding: 8px 10px;
    font-size: 12px;
  }
}

@media (max-width: 380px) {
  .af-form-panel {
    padding: 12px 8px;
  }
  .af-card {
    padding: 20px 14px;
    gap: 12px;
    border-radius: 18px;
  }
  .af-card-title {
    font-size: 19px;
  }
  .af-segment-btn {
    padding: 7px 6px;
    font-size: 11px;
  }
}

@media (max-width: 340px) {
  .af-card {
    padding: 16px 10px;
    gap: 10px;
  }
  .af-segment-btn {
    padding: 7px 4px;
    font-size: 10.5px;
  }
}
`;
