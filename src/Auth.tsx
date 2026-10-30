import React, { useState, useEffect, useRef } from "react";
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
import { WealthOrbCanvas } from "./components/auth/WealthOrbCanvas";

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
      {/* ── Background Aurora Mesh & Starfield ── */}
      <div className="af-cosmic-bg" aria-hidden="true">
        <div className="af-aurora af-aurora-gold" />
        <div className="af-aurora af-aurora-indigo" />
        <div className="af-aurora af-aurora-emerald" />
        <div className="af-grid-overlay" />
      </div>

      {/* ── Brand & Executive Showcase Panel (Desktop & Tablet) ── */}
      <div className="af-brand-panel" aria-label="ArthaDrishti Institutional Overview">
        <div className="af-brand-content">
          {/* Brand header */}
          <div className="af-brand-logo">
            <div className="af-logo-glow-wrap">
              <div className="af-logo-ring-halo" />
              <BrandMark size={46} />
            </div>
            <div>
              <div className="af-brand-name">ArthaDrishti</div>
              <div className="af-brand-tagline">Private Wealth Operating System</div>
            </div>
          </div>

          {/* Headline & Value Proposition */}
          <div className="af-brand-hero">
            <div className="af-hero-badge">
              <Sparkles size={12} className="af-badge-icon" />
              <span>Institutional Wealth Intelligence</span>
            </div>
            <h1 className="af-brand-headline">
              Unify your wealth.{" "}
              <span className="af-brand-headline-accent">Master your future.</span>
            </h1>
            <p className="af-brand-sub">
              Consolidate multi-currency bank accounts, mutual funds, direct equities, real estate,
              PPF/EPF, and family liabilities into an autonomous executive command center.
            </p>
          </div>

          {/* 3D Wealth Orrery & Asset Convergence Matrix */}
          <div
            className="af-3d-showcase-box"
            role="region"
            aria-label="3D Wealth Matrix Visualization"
          >
            <div className="af-3d-header">
              <span className="af-3d-pill">
                <span className="af-live-dot" aria-hidden="true" />
                <span>Multi-Asset Equilibrium Matrix</span>
              </span>
              <span className="af-3d-status">Euler 3D Projection</span>
            </div>
            <div className="af-3d-canvas-wrap">
              <WealthOrbCanvas size={230} interactive={true} />
            </div>
            <div className="af-3d-caption">
              <span>Interactive 3D Matrix • Hover or tilt to inspect asset convergence</span>
            </div>
          </div>

          {/* Live Holographic Net Worth Mockup Card */}
          <div className="af-preview-card" role="region" aria-label="Portfolio Snapshot Preview">
            <div className="af-preview-card-shine" />
            <div className="af-preview-header">
              <div className="af-preview-pill">
                <span className="af-live-dot" aria-hidden="true" />
                <span>Live Portfolio Summary</span>
              </div>
              <div className="af-preview-growth">
                <TrendingUp size={12} aria-hidden="true" />
                <span>+18.4% YoY</span>
              </div>
            </div>

            <div className="af-preview-amount-row">
              <div className="af-preview-amount">
                <span className="af-preview-currency">₹</span>
                <span className="af-preview-val">1,48,50,000</span>
              </div>
              <div className="af-preview-lbl">
                Consolidated Net Worth across 14 assets &amp; 3 banks
              </div>
            </div>

            {/* Asset distribution bar */}
            <div className="af-asset-bar" title="Asset allocation distribution">
              <div
                className="af-asset-seg af-seg-mf"
                style={{ width: "42%" }}
                title="Mutual Funds & Stocks (42%)"
              />
              <div
                className="af-asset-seg af-seg-re"
                style={{ width: "34%" }}
                title="Real Estate & Gold (34%)"
              />
              <div
                className="af-asset-seg af-seg-epf"
                style={{ width: "16%" }}
                title="EPF & PPF (16%)"
              />
              <div
                className="af-asset-seg af-seg-cash"
                style={{ width: "8%" }}
                title="Liquid Cash (8%)"
              />
            </div>

            <div className="af-preview-tags">
              <span className="af-tag">
                <span className="af-tag-dot af-dot-mf" />
                Equities ₹62.3L
              </span>
              <span className="af-tag">
                <span className="af-tag-dot af-dot-re" />
                Real Estate ₹50.5L
              </span>
              <span className="af-tag">
                <span className="af-tag-dot af-dot-epf" />
                EPF/PPF ₹23.7L
              </span>
              <span className="af-tag">
                <span className="af-tag-dot af-dot-cash" />
                Cash ₹12.0L
              </span>
            </div>
          </div>

          {/* Executive Pillars Strip (Static Trust Badges - No Dropdown) */}
          <div className="af-feature-chips-strip">
            <div className="af-feature-chip">
              <div className="af-feat-icon-box">
                <Wallet size={14} aria-hidden="true" />
              </div>
              <div className="af-feat-text-wrap">
                <strong>Automated Multi-Account Reconciliation</strong>
                <p>Track liquid cash, yields, and liabilities.</p>
              </div>
            </div>

            <div className="af-feature-chip">
              <div className="af-feat-icon-box">
                <Users size={14} aria-hidden="true" />
              </div>
              <div className="af-feat-text-wrap">
                <strong>Family Entities &amp; Nominee Tracking</strong>
                <p>Organize portfolios across family members.</p>
              </div>
            </div>

            <div className="af-feature-chip">
              <div className="af-feat-icon-box">
                <ShieldCheck size={14} aria-hidden="true" />
              </div>
              <div className="af-feat-text-wrap">
                <strong>Zero-Telemetry 256-Bit Vault Security</strong>
                <p>Client-side encryption. Zero tracking.</p>
              </div>
            </div>
          </div>

          {/* Footer signature */}
          <div className="af-brand-footer">
            <span>Designed &amp; Engineered by Anand Mohta</span>
            <div className="af-brand-status-chip">
              <span className="af-status-dot-emerald" />
              <span>Institutional Engine 2.5 Active</span>
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
                    <div className="af-info-banner" style={{ borderLeft: "3px solid #10B981" }}>
                      <ShieldCheck size={18} style={{ color: "#10B981", flexShrink: 0 }} />
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
                          className="af-inp af-inp-padded"
                          style={{
                            letterSpacing: "0.25em",
                            fontSize: 18,
                            fontWeight: 700,
                            textAlign: "center",
                          }}
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
  position: relative;
  flex: 0 0 50%;
  min-width: 440px;
  max-width: 680px;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #E2E8F0;
  z-index: 2;
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.98) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  overflow-y: auto;
}

.af-brand-content {
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  justify-content: space-between;
}

/* Brand Logo */
.af-brand-logo {
  display: flex;
  align-items: center;
  gap: 14px;
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
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0F172A;
  line-height: 1.1;
}

.af-brand-tagline {
  font-size: 11px;
  font-weight: 600;
  color: #D97706;
  margin-top: 3px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Brand Hero */
.af-brand-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.af-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  width: fit-content;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.af-badge-icon {
  color: #D97706;
}

.af-brand-headline {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: -0.03em;
  color: #0F172A;
  margin: 0;
}

.af-brand-headline-accent {
  background: linear-gradient(135deg, #4F46E5 0%, #312E81 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.af-brand-sub {
  font-size: 12.5px;
  line-height: 1.5;
  color: #475569;
  margin: 0;
  font-weight: 400;
}

/* 3D Showcase Box */
.af-3d-showcase-box {
  position: relative;
  border: 1px solid #E2E8F0;
  border-radius: 18px;
  padding: 12px 14px 6px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 25px -8px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.af-3d-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 2px;
}

.af-3d-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #F8FAFC;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #1E293B;
  border: 1px solid #E2E8F0;
}

.af-3d-status {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: #4F46E5;
  background: #EEF2F6;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  font-weight: 600;
}

.af-3d-canvas-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.af-3d-caption {
  margin-top: 6px;
  font-size: 10.5px;
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid #F1F5F9;
  width: 100%;
  justify-content: center;
}

/* Live Holographic Mockup Card */
.af-preview-card {
  position: relative;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 18px;
  padding: 14px 18px;
  box-shadow: 0 10px 25px -8px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.af-preview-card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: skewX(-25deg);
  animation: af-shine-pass 6s infinite;
  pointer-events: none;
}

.af-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.af-preview-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F8FAFC;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  border: 1px solid #E2E8F0;
}

.af-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 10px #10B981;
  animation: af-pulse 2s infinite;
}

.af-preview-growth {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #047857;
  font-size: 11px;
  font-weight: 700;
  background: #ECFDF5;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid #A7F3D0;
}

.af-preview-amount-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 4px;
  margin-bottom: 2px;
}

.af-preview-amount {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: #0F172A;
}

.af-preview-currency {
  font-size: 18px;
  font-weight: 600;
  color: #D97706;
}

.af-preview-val {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: #0F172A;
  font-family: 'Outfit', sans-serif;
}

.af-preview-lbl {
  font-size: 11px;
  color: #64748B;
}

.af-asset-bar {
  display: flex;
  height: 5px;
  border-radius: 9999px;
  overflow: hidden;
  background: #F1F5F9;
  gap: 2px;
  margin: 8px 0;
}

.af-asset-seg {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.af-seg-mf { background: linear-gradient(90deg, #38BDF8, #60A5FA); }
.af-seg-re { background: linear-gradient(90deg, #D4AF37, #F5E5C9); }
.af-seg-epf { background: linear-gradient(90deg, #10B981, #34D399); }
.af-seg-cash { background: linear-gradient(90deg, #8B5CF6, #A78BFA); }

.af-preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.af-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-family: 'JetBrains Mono', monospace;
  color: #334155;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 2px 7px;
  border-radius: 5px;
}

.af-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.af-dot-mf { background: #38BDF8; box-shadow: 0 0 6px #38BDF8; }
.af-dot-re { background: #D4AF37; box-shadow: 0 0 6px #D4AF37; }
.af-dot-epf { background: #10B981; box-shadow: 0 0 6px #10B981; }
.af-dot-cash { background: #8B5CF6; box-shadow: 0 0 6px #8B5CF6; }

/* Executive Pillars Strip (Static Trust Badges - No Dropdown) */
.af-feature-chips-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.af-feature-chip {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.af-feat-icon-box {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(217, 119, 6, 0.1);
  border: 1px solid rgba(217, 119, 6, 0.25);
  color: #D97706;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.af-feat-text-wrap strong {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 2px;
  line-height: 1.25;
}

.af-feat-text-wrap p {
  margin: 0;
  font-size: 10px;
  color: #64748B;
  line-height: 1.35;
}

.af-brand-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  color: #64748B;
  padding-top: 8px;
  border-top: 1px solid #E2E8F0;
}

.af-brand-status-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.af-status-dot-emerald {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #10B981;
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

.af-card-border-glow {
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #4F46E5 30%, #D97706 70%, transparent);
  border-radius: 50%;
  z-index: 10;
  pointer-events: none;
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
  background: rgba(212, 175, 55, 0.14);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.35);
  font-size: 12.5px;
  color: #FDE68A;
  font-weight: 500;
  margin-bottom: 8px;
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
  border-color: rgba(255, 255, 255, 0.2);
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
  color: #D4AF37;
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
  color: #FFFFFF;
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
  color: #CBD5E1;
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
  color: #FCD34D;
}

.af-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #CBD5E1;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  font-family: inherit;
  transition: all 0.15s;
}

.af-back-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #FFFFFF;
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
input:focus-visible,
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
    overflow: hidden;
    padding: 24px 36px;
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
}
  .af-segment-btn {
    padding: 7px 4px;
    font-size: 10.5px;
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
}
`;
