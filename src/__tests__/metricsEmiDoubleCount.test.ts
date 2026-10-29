import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMetrics } from "../hooks/useMetrics";

const ym = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

const EMPTY = Object.fromEntries(
  ["bankAccounts", "fixedDeposits", "recurringDeposits", "bonds", "ppf", "nps", "epf", "lic",
   "termPlans", "investmentPlans", "mutualFunds", "stocks", "demat", "creditCards", "prepaidCards",
   "loansGiven", "subscriptions", "goals", "taxPayments", "budgets", "sips", "netWorthHistory"].map((k) => [k, []])
);

const baseState = (transactions: any[]) => ({
  ...EMPTY,
  profile: { fy: "2026-27", regime: "new" },
  transactions,
  income: [{ id: "i1", date: `${ym}-01`, amount: 100_000 }],
  loansTaken: [{ id: "l1", type: "Home", outstanding: 2_000_000, rate: 8.5, emi: 30_000 }],
});

const netSavings = (transactions: any[]) =>
  renderHook(() => useMetrics(baseState(transactions), "all", {})).result.current.metrics.netSavings;

describe("Net savings counts each EMI once", () => {
  const groceries = { id: "t1", date: `${ym}-03`, type: "debit", amount: 20_000, category: "Groceries" };

  it("adds the scheduled EMI when it has not been logged as a bank debit", () => {
    expect(netSavings([groceries])).toBe(100_000 - 20_000 - 30_000);
  });

  it("does not add the EMI again when it was paid from the bank", () => {
    const emiDebit = { id: "t2", date: `${ym}-05`, type: "debit", amount: 30_000, category: "EMI" };
    expect(netSavings([groceries, emiDebit])).toBe(100_000 - 20_000 - 30_000);
  });

  it("treats a loan-linked debit the same way regardless of its category", () => {
    const linked = {
      id: "t3",
      date: `${ym}-05`,
      type: "debit",
      amount: 30_000,
      category: "Debt Repayment",
      linkedType: "loansTaken",
      linkedId: "l1",
    };
    expect(netSavings([groceries, linked])).toBe(100_000 - 20_000 - 30_000);
  });
});
