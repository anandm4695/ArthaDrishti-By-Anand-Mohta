/* eslint-disable @typescript-eslint/no-require-imports -- api/ is untyped CommonJS */
import { describe, it, expect } from "vitest";
import { getMonthCategorySpending } from "../utils/finance";

const { computeSummary } = require("../../api/send-summary.js");

const YM = "2026-09";

describe("Budget spending includes credit-card purchases (accrual basis)", () => {
  const card = {
    id: "c1",
    transactions: [
      { id: "ob-c1", date: "2026-09-01", merchant: "Opening Balance", amount: "40000", category: "General" },
      { id: "t1", date: "2026-09-05", merchant: "Swiggy", amount: "1200", category: "Food" },
      { id: "t2", date: "2026-09-12", merchant: "Myntra", amount: "3000", category: "Shopping" },
      { id: "t3", date: "2026-09-14", merchant: "Myntra refund", amount: "-1000", category: "Shopping" },
      { id: "t4", date: "2026-09-20", merchant: "Payment via HDFC", amount: -25000, category: "Payment" },
      { id: "t5", date: "2026-08-28", merchant: "Zomato", amount: "800", category: "Food" },
    ],
  };
  const bank = [
    { id: "b1", date: "2026-09-03", type: "debit", amount: 2000, category: "Food" },
    { id: "b2", date: "2026-09-20", type: "debit", amount: 25000, category: "Credit Card" },
    { id: "b3", date: "2026-09-21", type: "debit", amount: 9000, category: "Transfer" },
  ];

  it("adds card charges to their category and nets refunds", () => {
    const s = getMonthCategorySpending({ transactions: bank, creditCards: [card] }, YM);
    expect(s.Food).toBe(3200); // ₹2,000 bank + ₹1,200 card (August charge excluded)
    expect(s.Shopping).toBe(2000); // ₹3,000 − ₹1,000 refund
  });

  it("skips opening balances, card payments, transfers and the bank-side card bill", () => {
    const s = getMonthCategorySpending({ transactions: bank, creditCards: [card] }, YM);
    expect(s.General).toBeUndefined();
    expect(s.Payment).toBeUndefined();
    expect(s.Transfer).toBeUndefined();
    expect(s["Credit Card"]).toBeUndefined();
  });

  it("keeps the card bill as spend when no card charges are recorded", () => {
    const s = getMonthCategorySpending({ transactions: bank, creditCards: [{ id: "c2", transactions: [] }] }, YM);
    expect(s["Credit Card"]).toBe(25000);
  });

  it("falls back to logged rent payments when no Rent debit exists", () => {
    const s = getMonthCategorySpending(
      { transactions: [], rentedProperties: [{ payments: [{ date: "2026-09-02", amount: 30000 }] }] },
      YM
    );
    expect(s.Rent).toBe(30000);
  });
});

describe("Email summary budget health matches the app", () => {
  it("counts card purchases against the budget and drops the card bill", () => {
    const ref = new Date(2026, 8, 25); // 25 Sep 2026
    const state = {
      transactions: [
        { id: "b1", date: "2026-09-03", type: "debit", amount: 2000, category: "Food" },
        { id: "b2", date: "2026-09-20", type: "debit", amount: 25000, category: "Credit Card" },
      ],
      creditCards: [
        { id: "c1", transactions: [{ id: "t1", date: "2026-09-05", merchant: "Swiggy", amount: "1200", category: "Food" }] },
      ],
      budgets: [{ id: "bd1", category: "Food", monthly: 5000 }],
    };
    const summary = computeSummary(state, ref);
    const food = summary.budgetStatus.find((b: any) => b.category === "Food");
    expect(food.spent).toBe(3200);
    expect(summary.topCats.find((c: any) => c.cat === "Credit Card")).toBeUndefined();
  });
});
