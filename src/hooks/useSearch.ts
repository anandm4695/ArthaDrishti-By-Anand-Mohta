import { useMemo } from "react";
import {
  fmtINRFull,
  calculateEpfBalance,
  loanOutstanding,
  loanGivenOutstanding,
  informalPersonOutstanding,
  getEffectiveRent,
  getGoldPricePerGram,
  GOLD_PURITY_FACTOR,
} from "../utils/finance";

export interface SearchResult {
  type: string;
  name: string;
  detail: string;
  tab: string;
}

export function useSearch(state: any, search: string): SearchResult[] {
  return useMemo(() => {
    if (!search.trim() || search.length < 2) return [];
    const q = search.toLowerCase();
    const match = (v: string) => (v || "").toLowerCase().includes(q);
    const results: SearchResult[] = [];

    // Bank Accounts
    (state.bankAccounts || []).forEach((b: any) => {
      const bankLabel = b.bankName || b.bank || "";
      if (match(bankLabel) || match(b.accountNumber)) {
        results.push({
          type: "Bank Account",
          name: bankLabel,
          detail: `${b.accountNumber || ""} · ${fmtINRFull(b.balance)}`.replace(/^ · /, ""),
          tab: "banks",
        });
      }
    });
    // Transactions
    (state.transactions || []).forEach((t: any) => {
      if (match(t.note) || match(t.description) || match(t.category)) {
        results.push({
          type: "Transaction",
          name: t.note || t.description || t.category,
          detail: `${t.date} · ${fmtINRFull(t.amount)}`,
          tab: "banks",
        });
      }
    });
    // Stocks
    (state.stocks || []).forEach((s: any) => {
      if (match(s.symbol) || match(s.name)) {
        results.push({
          type: "Stock",
          name: s.symbol,
          detail: fmtINRFull(Number(s.qty || 0) * Number(s.currentPrice || s.avgPrice || 0)),
          tab: "demat",
        });
      }
    });
    // Mutual Funds
    (state.mutualFunds || []).forEach((m: any) => {
      const mfName = m.name || m.scheme || "";
      if (match(mfName)) {
        const nav = Number(m.currentNav || m.nav || m.buyNav || 0);
        results.push({
          type: "Mutual Fund",
          name: mfName,
          detail: fmtINRFull(
            Number(m.units || 0) * nav || Number(m.invested || 0)
          ),
          tab: "investments",
        });
      }
    });
    // Fixed Deposits
    (state.fixedDeposits || []).forEach((f: any) => {
      if (match(f.bank) || match(f.bankName)) {
        results.push({
          type: "Fixed Deposit",
          name: f.bank || f.bankName || "FD",
          detail: fmtINRFull(f.principal),
          tab: "investments",
        });
      }
    });
    // Recurring Deposits
    (state.recurringDeposits || []).forEach((r: any) => {
      if (match(r.bank) || match(r.bankName)) {
        results.push({
          type: "Recurring Deposit",
          name: r.bank || r.bankName || "RD",
          detail: `${fmtINRFull(r.monthly)}/mo`,
          tab: "investments",
        });
      }
    });
    // Bonds
    (state.bonds || []).forEach((b: any) => {
      const bondName = b.issuerName || b.name || "";
      if (match(bondName)) {
        const val =
          Number(
            b.totalInvestmentAmount ||
              b.totalPrincipalAmount ||
              Number(b.numberOfUnits || 0) * Number(b.faceValuePerUnit || 0) ||
              b.faceValue ||
              b.principal ||
              0
          );
        results.push({
          type: "Bond",
          name: bondName,
          detail: fmtINRFull(val),
          tab: "investments",
        });
      }
    });
    // PPF
    (state.ppf || []).forEach((p: any) => {
      if (match(p.institution) || match(p.bank) || match("ppf")) {
        results.push({
          type: "PPF",
          name: p.institution || p.bank || "PPF",
          detail: fmtINRFull(p.balance),
          tab: "investments",
        });
      }
    });
    // NPS
    (state.nps || []).forEach((n: any) => {
      if (match(n.bank) || match(n.accountNumber) || match("nps")) {
        const npsBal = Number(n.balance) || 0;
        const npsTxVal =
          npsBal > 0
            ? npsBal
            : (n.transactions || []).reduce(
                (s: number, t: any) =>
                  s + (Number(t.employeeAmount) || 0) + (Number(t.employerAmount) || 0),
                0
              );
        results.push({
          type: "NPS",
          name: n.bank || "NPS",
          detail: fmtINRFull(npsTxVal),
          tab: "investments",
        });
      }
    });
    // EPF
    (state.epf || []).forEach((e: any) => {
      if (match(e.employer) || match(e.bank) || match("epf") || match("pf")) {
        results.push({
          type: "EPF",
          name: e.employer || e.bank || "EPF",
          detail: fmtINRFull(calculateEpfBalance(e)),
          tab: "investments",
        });
      }
    });
    // Govt Schemes (SSY, SCSS, NSC, KVP, POMIS)
    (state.govtSchemes || []).forEach((sc: any) => {
      const label = sc.schemeType || sc.accountHolder || sc.bankOrPostOffice || "Govt Scheme";
      if (match(sc.schemeType) || match(sc.accountHolder) || match(sc.bankOrPostOffice) || match(sc.accountNumber)) {
        results.push({
          type: "Govt Scheme",
          name: label,
          detail: fmtINRFull(sc.currentBalance || sc.investedAmount || 0),
          tab: "investments",
        });
      }
    });
    // Gold & SGBs
    const goldPrice = getGoldPricePerGram(state);
    (state.goldHoldings || []).forEach((g: any) => {
      const gName = g.name || g.type || "Gold";
      if (match(gName) || match(g.type) || match("gold") || match("sgb")) {
        const grams = Number(g.grams || g.weightGrams || 0);
        const purityMul = g.type === "physical" ? GOLD_PURITY_FACTOR[g.purity] || 1 : 1;
        const val = Number(g.currentValue || 0) > 0 ? Number(g.currentValue) : grams * goldPrice * purityMul;
        results.push({
          type: "Gold Holding",
          name: gName,
          detail: `${grams}g · ${fmtINRFull(val)}`,
          tab: "gold",
        });
      }
    });
    // Goals
    (state.goals || []).forEach((g: any) => {
      if (match(g.name)) {
        results.push({
          type: "Goal",
          name: g.name,
          detail: `${fmtINRFull(g.currentAmount)} / ${fmtINRFull(g.targetAmount)}`,
          tab: "goals",
        });
      }
    });
    // Credit Cards
    (state.creditCards || []).forEach((c: any) => {
      const ccLabel = c.issuer || c.bank || c.name || "Credit Card";
      if (match(ccLabel) || match(c.name) || (c.last4 || "").includes(q)) {
        results.push({
          type: "Credit Card",
          name: ccLabel,
          detail: `**** ${c.last4 || ""} · ${fmtINRFull(c.outstanding)}`,
          tab: "cc",
        });
      }
    });
    // Prepaid Cards
    (state.prepaidCards || []).forEach((p: any) => {
      if (match(p.cardName) || match(p.cardType) || match(p.name) || (p.last4 || "").includes(q)) {
        const txns = p.transactions || [];
        const loaded = txns
          .filter((t: any) => t.type === "load")
          .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
        const spent = txns
          .filter((t: any) => t.type === "spend")
          .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
        results.push({
          type: "Prepaid Card",
          name: p.cardName || p.name || p.cardType || "Prepaid",
          detail: `**** ${p.last4 || ""} · ${fmtINRFull(loaded - spent)}`,
          tab: "prepaid",
        });
      }
    });
    // Loans Taken
    (state.loansTaken || []).forEach((l: any) => {
      if (match(l.lender) || match(l.type)) {
        results.push({
          type: "Loan Taken",
          name: l.lender,
          detail: `${l.type || "Loan"} · ${fmtINRFull(loanOutstanding(l))}`,
          tab: "taken",
        });
      }
    });
    // Loans Given
    (state.loansGiven || []).forEach((l: any) => {
      if (match(l.borrower)) {
        results.push({
          type: "Loan Given",
          name: l.borrower,
          detail: fmtINRFull(loanGivenOutstanding(l)),
          tab: "given",
        });
      }
    });
    // Informal Borrowed (From People)
    (state.informalBorrowed || []).forEach((p: any) => {
      const pName = p.name || p.person || "";
      if (match(pName)) {
        const out = informalPersonOutstanding(p) || Number(p.outstanding ?? p.amount ?? 0);
        results.push({
          type: "Borrowed From",
          name: pName,
          detail: fmtINRFull(out),
          tab: "borrowed",
        });
      }
    });
    // Informal Lent (To People)
    (state.informalLent || []).forEach((p: any) => {
      const pName = p.name || p.person || "";
      if (match(pName)) {
        const out = informalPersonOutstanding(p) || Number(p.outstanding ?? p.amount ?? 0);
        results.push({
          type: "Lent To",
          name: pName,
          detail: fmtINRFull(out),
          tab: "lent",
        });
      }
    });
    // Subscriptions
    (state.subscriptions || []).forEach((s: any) => {
      if (match(s.name)) {
        results.push({
          type: "Subscription",
          name: s.name,
          detail: `${fmtINRFull(s.amount)} / ${s.cycle || s.billingCycle || "monthly"}`,
          tab: "subs",
        });
      }
    });
    // Bill Payments
    (state.billPayments || []).forEach((b: any) => {
      if (match(b.name) || match(b.provider) || match(b.category)) {
        results.push({
          type: "Bill Payment",
          name: b.name || b.provider || "Utility Bill",
          detail: `${b.category || "Bill"} · ${fmtINRFull(b.amount || 0)}`,
          tab: "bills",
        });
      }
    });
    // SIPs
    (state.sips || []).forEach((s: any) => {
      if (match(s.scheme) || match(s.name)) {
        results.push({
          type: "SIP",
          name: s.scheme || s.name,
          detail: `${fmtINRFull(s.amount)}/${s.frequency === "quarterly" ? "qtr" : "mo"}`,
          tab: "sip",
        });
      }
    });
    // Insurance (LIC + Term Plans + Health Insurance)
    (state.lic || []).forEach((l: any) => {
      if (match(l.planName) || match(l.name)) {
        results.push({
          type: "Insurance (LIC)",
          name: l.planName || l.name,
          detail: fmtINRFull(l.sumAssured || l.coverAmount),
          tab: "insurance",
        });
      }
    });
    (state.termPlans || []).forEach((t: any) => {
      if (match(t.planName) || match(t.name)) {
        results.push({
          type: "Term Plan",
          name: t.planName || t.name || "Term Plan",
          detail: fmtINRFull(t.coverAmount || t.sumAssured),
          tab: "insurance",
        });
      }
    });
    (state.healthInsurance || []).forEach((h: any) => {
      const hName = h.planName || h.insurer || h.policyNumber || "";
      if (match(hName) || match(h.insurer)) {
        results.push({
          type: "Health Insurance",
          name: hName || "Health Policy",
          detail: fmtINRFull(h.sumInsured || h.coverAmount || 0),
          tab: "insurance",
        });
      }
    });
    // Rental Properties (owned)
    (state.rentalProperties || []).forEach((p: any) => {
      if (match(p.propertyName) || match(p.tenantName)) {
        results.push({
          type: "Rental Property",
          name: p.propertyName,
          detail: fmtINRFull(getEffectiveRent(p)),
          tab: "rental",
        });
      }
    });
    // Rented Properties (tenant)
    (state.rentedProperties || []).forEach((p: any) => {
      if (match(p.propertyName) || match(p.landlordName)) {
        results.push({
          type: "Rented Property",
          name: p.propertyName || "Rented",
          detail: fmtINRFull(getEffectiveRent(p)),
          tab: "rental",
        });
      }
    });
    // Real Estate
    (state.realEstateProperties || []).forEach((p: any) => {
      if (match(p.name)) {
        results.push({
          type: "Real Estate",
          name: p.name,
          detail: fmtINRFull(p.marketValue || p.agreementValue || p.currentValue || p.purchasePrice),
          tab: "realestate",
        });
      }
    });
    // Vehicles
    (state.vehicles || []).forEach((v: any) => {
      const vName = `${v.make || ""} ${v.model || ""}`.trim() || "Vehicle";
      if (match(v.make) || match(v.model) || match(v.registrationNumber)) {
        results.push({
          type: "Vehicle",
          name: vName,
          detail: v.registrationNumber || "",
          tab: "vehicles",
        });
      }
    });
    // Reminders
    (state.reminders || []).forEach((r: any) => {
      if (match(r.title) || match(r.note)) {
        results.push({
          type: "Reminder",
          name: r.title,
          detail: r.dueDate || "",
          tab: "reminders",
        });
      }
    });
    return results.slice(0, 15);
  }, [search, state]);
}
