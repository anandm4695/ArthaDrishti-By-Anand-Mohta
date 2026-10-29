/* eslint-disable @typescript-eslint/no-require-imports -- api/ is untyped CommonJS */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { isAllowedOrigin } = require("../../api/_lib/rateLimit");

const mockRes = () => {
  const out: { status: number; body: any } = { status: 200, body: null };
  const res: any = {
    setHeader: vi.fn(),
    status: (code: number) => {
      out.status = code;
      return {
        json: (b: any) => {
          out.body = b;
        },
        end: () => {},
      };
    },
    json: (b: any) => {
      out.body = b;
    },
  };
  return { res, out };
};

describe("CORS origin allow-list", () => {
  it("admits this project's Vercel previews but not arbitrary *.vercel.app sites", () => {
    expect(isAllowedOrigin("https://arthadrishti-app.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://arthadrishti-app-git-feature-anand.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://evil.vercel.app")).toBe(false);
    expect(isAllowedOrigin("https://phish-arthadrishti.vercel.app")).toBe(false);
  });
});

describe("cron-update-prices auth", () => {
  const handler = require("../../api/cron-update-prices.js");
  beforeEach(() => {
    process.env.CRON_SECRET = "cron_test_secret";
  });

  it("does not trust a client-supplied x-vercel-cron header", async () => {
    const { res, out } = mockRes();
    await handler({ method: "GET", headers: { "x-vercel-cron": "1" }, query: {} }, res);
    expect(out.status).toBe(401);
  });

  it("fails closed when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const { res, out } = mockRes();
    await handler({ method: "GET", headers: { authorization: "Bearer undefined" }, query: {} }, res);
    expect(out.status).toBe(401);
  });
});

describe("rc-lookup requires a signed-in user", () => {
  const handler = require("../../api/rc-lookup.js");

  it("rejects anonymous callers before any paid provider is touched", async () => {
    process.env.SUREPASS_TOKEN = "server_paid_token";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { res, out } = mockRes();
    await handler({ method: "GET", headers: {}, query: { reg: "MH12AB1234" } }, res);
    expect(out.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    delete process.env.SUREPASS_TOKEN;
  });
});
