import { describe, it, expect } from "vitest";
import {
  computeCreditPortfolioSummary,
  getCardEffectiveLimitAndAvail,
} from "../utils/finance";

describe("Credit Card Shared Limit Pools & Portfolio Metrics", () => {
  it("counts shared pool limit exactly ONCE, not the sum of individual cards", () => {
    const cards = [
      // 3 HDFC cards sharing a 5,00,000 pool
      { id: "c1", issuer: "HDFC Regalia Gold", limit: 500000, outstanding: 120000, sharedGroup: "HDFC Pool", sharedGroupLimit: 500000 },
      { id: "c2", issuer: "HDFC Tata Neu Infinity", limit: 500000, outstanding: 80000, sharedGroup: "HDFC Pool", sharedGroupLimit: 500000 },
      { id: "c3", issuer: "HDFC Swiggy", limit: 500000, outstanding: 25000, sharedGroup: "HDFC Pool", sharedGroupLimit: 500000 },
      // Standalone card
      { id: "c4", issuer: "Amex Platinum Travel", limit: 300000, outstanding: 45000 },
    ];

    const summary = computeCreditPortfolioSummary(cards);

    // Total limit should be 5,00,000 (HDFC Pool) + 3,00,000 (Amex) = 8,00,000
    // NOT 5L + 5L + 5L + 3L = 18,00,000!
    expect(summary.totalLimit).toBe(800000);
    // Total outstanding = 120k + 80k + 25k + 45k = 270,000
    expect(summary.totalOutstanding).toBe(270000);
    // Total available = 800,000 - 270,000 = 530,000
    expect(summary.totalAvailable).toBe(530000);
    // Overall utilization = 270k / 800k = 33.75% -> 34%
    expect(summary.utilizationPct).toBe(34);

    // Verify HDFC pool breakdown
    const hdfcPool = summary.pools["hdfc pool"];
    expect(hdfcPool).toBeDefined();
    expect(hdfcPool.poolLimit).toBe(500000);
    expect(hdfcPool.totalOutstanding).toBe(225000); // 120k + 80k + 25k
    expect(hdfcPool.available).toBe(275000); // 500k - 225k
    expect(hdfcPool.utilizationPct).toBe(45); // 225k / 500k = 45%
  });

  it("handles case-insensitivity and whitespace trimming for shared pool names", () => {
    const cards = [
      { id: "1", issuer: "HDFC Millennia", limit: 400000, outstanding: 50000, sharedGroup: "HDFC Shared Pool" },
      { id: "2", issuer: "HDFC Diners Black", limit: 400000, outstanding: 100000, sharedGroup: "  hdfc shared pool  " },
      { id: "3", issuer: "HDFC UPI RuPay", limit: 400000, outstanding: 10000, sharedGroup: "Hdfc Shared Pool" },
    ];

    const summary = computeCreditPortfolioSummary(cards);

    // All 3 should be merged into ONE pool
    expect(summary.poolList.length).toBe(1);
    expect(summary.totalLimit).toBe(400000);
    expect(summary.totalOutstanding).toBe(160000);
    expect(summary.totalAvailable).toBe(240000);
  });

  it("falls back to the max individual card limit if sharedGroupLimit is not explicitly set", () => {
    const cards = [
      { id: "1", issuer: "ICICI Sapphiro", limit: 600000, outstanding: 50000, sharedGroup: "ICICI Pool" },
      { id: "2", issuer: "ICICI Amazon Pay", limit: 400000, outstanding: 30000, sharedGroup: "ICICI Pool" },
    ];

    const summary = computeCreditPortfolioSummary(cards);

    // Max card limit across the pool is 600,000
    expect(summary.totalLimit).toBe(600000);
    expect(summary.totalOutstanding).toBe(80000);
    expect(summary.totalAvailable).toBe(520000);
  });

  it("excludes closed cards from pool limit, pool outstanding, and total metrics", () => {
    const cards = [
      { id: "1", issuer: "HDFC Active", limit: 500000, outstanding: 50000, sharedGroup: "HDFC Pool", status: "active" },
      { id: "2", issuer: "HDFC Old Closed", limit: 500000, outstanding: 0, sharedGroup: "HDFC Pool", status: "closed" },
      { id: "3", issuer: "SBI Closed Standalone", limit: 200000, outstanding: 0, status: "closed" },
    ];

    const summary = computeCreditPortfolioSummary(cards);

    expect(summary.activeCards.length).toBe(1);
    expect(summary.closedCards.length).toBe(2);
    expect(summary.totalLimit).toBe(500000);
    expect(summary.totalOutstanding).toBe(50000);
  });

  it("provides correct effective pool limits and shared headroom for each card", () => {
    const cards = [
      { id: "c1", issuer: "HDFC Regalia", limit: 500000, outstanding: 150000, sharedGroup: "HDFC Pool", sharedGroupLimit: 500000 },
      { id: "c2", issuer: "HDFC Swiggy", limit: 500000, outstanding: 50000, sharedGroup: "HDFC Pool", sharedGroupLimit: 500000 },
      { id: "c3", issuer: "Amex Gold", limit: 100000, outstanding: 20000 },
    ];

    const summary = computeCreditPortfolioSummary(cards);

    const infoC1 = getCardEffectiveLimitAndAvail(cards[0], summary);
    expect(infoC1.isShared).toBe(true);
    expect(infoC1.poolLimit).toBe(500000);
    expect(infoC1.effectiveLimit).toBe(500000);
    expect(infoC1.poolOutstanding).toBe(200000); // 150k + 50k
    expect(infoC1.effectiveAvailable).toBe(300000); // 500k - 200k shared headroom
    expect(infoC1.cardOutstanding).toBe(150000);

    const infoC3 = getCardEffectiveLimitAndAvail(cards[2], summary);
    expect(infoC3.isShared).toBe(false);
    expect(infoC3.effectiveLimit).toBe(100000);
    expect(infoC3.effectiveAvailable).toBe(80000);
    expect(infoC3.cardOutstanding).toBe(20000);
  });
});
