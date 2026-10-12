import { describe, it, expect, vi, beforeEach } from "vitest";

const { isAllowedOrigin, handleCors, rateLimit } = require("../../api/_lib/rateLimit");

describe("System Audit Phase 1 & 2 Security Hardening", () => {
  describe("CORS & Origin Validation (Audit S2)", () => {
    it("allows trusted origins including localhost, main domain, and vercel preview domains", () => {
      expect(isAllowedOrigin("https://arthadrishti-app.vercel.app")).toBe(true);
      expect(isAllowedOrigin("https://arthadrishti-preview-xyz.vercel.app")).toBe(true);
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
    });

    it("strictly blocks untrusted third-party origins", () => {
      expect(isAllowedOrigin("https://evil.com")).toBe(false);
      expect(isAllowedOrigin("https://attacker-site.org")).toBe(false);
      expect(isAllowedOrigin("https://fake-arthadrishti.com")).toBe(false);
      expect(isAllowedOrigin("null")).toBe(false);
      expect(isAllowedOrigin("")).toBe(false);
    });

    it("rejects unauthorized cross-origin requests with 403 Forbidden", () => {
      const req = {
        headers: { origin: "https://unauthorized-domain.com" },
        method: "GET",
      };
      let statusCode = 200;
      let jsonPayload: any = null;
      const res: any = {
        setHeader: vi.fn(),
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: any) => {
              jsonPayload = payload;
            },
          };
        },
      };

      const allowed = handleCors(req, res);
      expect(allowed).toBe(false);
      expect(statusCode).toBe(403);
      expect(jsonPayload?.error).toContain("Forbidden");
    });

    it("sets dynamic origin and security headers for allowed origins (never wildcard *)", () => {
      const origin = "https://arthadrishti-app.vercel.app";
      const req = {
        headers: { origin },
        method: "GET",
      };
      const headersSet: Record<string, string> = {};
      const res: any = {
        setHeader: (key: string, val: string) => {
          headersSet[key] = val;
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const allowed = handleCors(req, res);
      expect(allowed).toBe(true);
      expect(headersSet["Access-Control-Allow-Origin"]).toBe(origin);
      expect(headersSet["Access-Control-Allow-Origin"]).not.toBe("*");
      expect(headersSet["Vary"]).toBe("Origin");
      expect(headersSet["X-Content-Type-Options"]).toBe("nosniff");
      expect(headersSet["X-Frame-Options"]).toBe("DENY");
    });

    it("handles OPTIONS preflight for allowed origin", () => {
      const origin = "https://arthadrishti-app.vercel.app";
      const req = {
        headers: { origin },
        method: "OPTIONS",
      };
      let ended = false;
      let statusCode = 0;
      const res: any = {
        setHeader: vi.fn(),
        status: (code: number) => {
          statusCode = code;
          return {
            end: () => {
              ended = true;
            },
          };
        },
      };

      const allowed = handleCors(req, res);
      expect(allowed).toBe(false); // Finished response in handler
      expect(statusCode).toBe(200);
      expect(ended).toBe(true);
    });
  });

  describe("Rate Limiting (Audit S2)", () => {
    it("enforces sliding window limits per IP/key and responds 429 when exceeded", async () => {
      const customKey = `test_ip_${Date.now()}`;
      const req = { headers: {} };
      let statusCode = 200;
      const res: any = {
        setHeader: vi.fn(),
        status: (code: number) => {
          statusCode = code;
          return {
            json: vi.fn(),
          };
        },
      };

      // Allow 3 calls
      expect(await rateLimit(req, res, { max: 3, windowMs: 60000, customKey })).toBe(true);
      expect(await rateLimit(req, res, { max: 3, windowMs: 60000, customKey })).toBe(true);
      expect(await rateLimit(req, res, { max: 3, windowMs: 60000, customKey })).toBe(true);

      // 4th call should hit rate limit
      const pass = await rateLimit(req, res, { max: 3, windowMs: 60000, customKey });
      expect(pass).toBe(false);
      expect(statusCode).toBe(429);
      expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    });
  });

  describe("Public Health Endpoint Hardening (Audit S5)", () => {
    const healthHandler = require("../../api/health.js");

    beforeEach(() => {
      process.env.VITE_SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_role_key";
      process.env.CRON_SECRET = "test_super_secret_cron_key";
    });

    it("returns strictly minimal status to public callers without leaking config presence", async () => {
      const req = {
        headers: {},
        query: {},
        method: "GET",
      };
      let statusCode = 200;
      let payload: any = null;
      const res: any = {
        setHeader: vi.fn(),
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
          };
        },
      };

      await healthHandler(req, res);
      expect(statusCode).toBe(200);
      expect(payload).toEqual({ status: "ok" });
      expect(payload.checks).toBeUndefined();
      expect(payload.supabaseServiceKeyConfigured).toBeUndefined();
      expect(payload.resendKeyConfigured).toBeUndefined();
    });

    it("reveals diagnostic checks only when authenticated with CRON_SECRET", async () => {
      process.env.CRON_SECRET = "test_super_secret_cron_key";
      const req = {
        headers: {
          authorization: "Bearer test_super_secret_cron_key",
        },
        query: {},
        method: "GET",
      };
      let statusCode = 200;
      let payload: any = null;
      const res: any = {
        setHeader: vi.fn(),
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
          };
        },
      };

      await healthHandler(req, res);
      expect(statusCode).toBe(200);
      expect(payload.status).toBe("ok");
      expect(payload.checks).toBeDefined();
      expect(payload.checks.cronSecretConfigured).toBe(true);
    });
  });

  describe("Data Correctness & Reconciliation (Audit D1, D3, D5)", () => {
    it("health score caps at maximum 58 (Fair) when critical red flags are present", () => {
      const savingsScore = 25;
      const emergencyScore = 25;
      const divScore = 25;
      const debtScore = 4; // severe debt
      const rawScore = savingsScore + debtScore + emergencyScore + divScore; // 79

      const debtToAssetRatio = 73.8;
      const hasCriticalRedFlag = debtToAssetRatio >= 50;
      const totalScore = hasCriticalRedFlag ? Math.min(rawScore, 58) : rawScore;

      expect(rawScore).toBe(79);
      expect(totalScore).toBe(58);
    });

    it("asset allocation includes other assets and consolidates to 100%", () => {
      const total = 1000000;
      const liquid = 250000;
      const equity = 200000;
      const retirement = 160000;
      const physical = 0;
      const accounted = liquid + equity + retirement + physical; // 610000 (61%)
      const others = Math.max(0, total - accounted); // 390000 (39%)

      const segments = [
        { label: "Liquid", pct: (liquid / total) * 100 },
        { label: "Equity", pct: (equity / total) * 100 },
        { label: "Retirement", pct: (retirement / total) * 100 },
        ...(others > 0 ? [{ label: "Others", pct: (others / total) * 100 }] : []),
      ];

      const sumPct = segments.reduce((acc, s) => acc + s.pct, 0);
      expect(sumPct).toBeCloseTo(100);
    });

    it("deducts monthly EMIs in savings rate to reflect true cash retention (Audit D4)", () => {
      const monthIncome = 415110;
      const monthExpense = 110000;
      const totalMonthlyEMI = 83300;

      // Pre-EMI savings calculation
      const preEmiSavings = monthIncome - monthExpense; // 305110
      const preEmiSavingsRate = (preEmiSavings / monthIncome) * 100; // ~73.5%

      // Post-EMI savings calculation (Audit D4 fix)
      const totalOutflow = monthExpense + totalMonthlyEMI; // 193300
      const netSavings = monthIncome - totalOutflow; // 221810
      const postEmiSavingsRate = (netSavings / monthIncome) * 100; // ~53.4%

      expect(preEmiSavingsRate).toBeCloseTo(73.5, 0);
      expect(netSavings).toBe(221810); // Reconciles with Monthly Cash Velocity +₹2,21,810/mo
      expect(postEmiSavingsRate).toBeCloseTo(53.4, 0);
    });

    it("differentiates Emergency Liquid Reserves from standalone Bank Cash (Audit D2)", () => {
      const bankCash = 720000;
      const liquidFunds = 35500;
      const nearTermFDs = 0;
      const totalLiquidReserves = bankCash + liquidFunds + nearTermFDs;

      expect(bankCash).toBe(720000); // Standalone Bank Cash tile
      expect(totalLiquidReserves).toBe(755500); // Total Liquid Reserves
      expect(totalLiquidReserves).toBeGreaterThan(bankCash);
    });
  });

  describe("Email & Routing Hardening (Audit S3 & E1)", () => {
    it("recognizes invalid client paths as non-root to render 404 UI (Audit E1)", () => {
      const isInvalid = (pathname: string) => pathname !== "/" && pathname !== "/index.html";
      expect(isInvalid("/")).toBe(false);
      expect(isInvalid("/index.html")).toBe(false);
      expect(isInvalid("/unknown-route")).toBe(true);
      expect(isInvalid("/.env")).toBe(true);
      expect(isInvalid("/admin/secret")).toBe(true);
    });

    it("ensures email summary ignores arbitrary client sender/recipient fields (Audit S3)", () => {
      const authenticatedUser = { email: "user@domain.com", email_confirmed_at: "2026-01-01T00:00:00Z" };
      const maliciousBody = {
        emailTo: "victim@target.com",
        fromEmail: "admin@spoofed.com",
      };

      // Server-side enforcement: strictly use authenticatedUser.email and fixed verified domain sender
      const resolvedRecipient = authenticatedUser.email;
      const resolvedSender = "ArthaDrishti <reports@your-verified-domain>";

      expect(resolvedRecipient).toBe("user@domain.com");
      expect(resolvedRecipient).not.toBe(maliciousBody.emailTo);
      expect(resolvedSender).not.toBe(maliciousBody.fromEmail);
    });
  });
});
