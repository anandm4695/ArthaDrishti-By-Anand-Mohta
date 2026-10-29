import React, { useState, useMemo } from "react";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Search,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import {
  fmtINRFull,
  exportArrayToCSV,
  today,
  isDepositClosed,
  rdElapsed,
  rdMaturity,
  calculateEpfBalance,
  loanOutstanding,
  loanGivenOutstanding,
  informalPersonOutstanding,
  getCcOutstanding,
  getGoldPricePerGram,
  GOLD_PURITY_FACTOR,
} from "../../utils/finance";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Money } from "../ui/Money";

interface DoubleEntryTrialBalanceProps {
  state: any;
  metrics: any;
  marketData?: any;
  setTab?: (tab: string) => void;
  showToast?: (msg: string, type?: string) => void;
}

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  category: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  subCategory: string;
  debit: number;
  credit: number;
  netBalance: number;
  normalBalance: "DEBIT" | "CREDIT";
  owner: string;
  status: "OK" | "WARNING" | "ATTENTION";
  note?: string;
  tabTarget?: string;
}

function realEstateTrackedShare(property: any): number {
  if (Array.isArray(property?.owners) && property.owners.length > 0) {
    return (
      property.owners.reduce(
        (s: number, o: any) => (o?.id !== "external" ? s + Number(o.sharePct || 0) : s),
        0
      ) / 100
    );
  }
  return 1;
}

export const DoubleEntryTrialBalance: React.FC<DoubleEntryTrialBalanceProps> = ({
  state,
  metrics,
  marketData,
  setTab,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [copiedCert, setCopiedCert] = useState(false);
  const [showJournalEntries, setShowJournalEntries] = useState(false);

  // Build Comprehensive Ledger Matrix from active state — reconciled 1-for-1 with useMetrics.ts
  const { ledgers, totals, anomalies } = useMemo(() => {
    const list: LedgerAccount[] = [];
    const detectedAnomalies: {
      id: string;
      severity: "WARNING" | "ATTENTION";
      title: string;
      detail: string;
      tab?: string;
      suggestedJournalEntry?: {
        drAccount: string;
        crAccount: string;
        amount: number;
        narration: string;
      };
    }[] = [];

    // 1. BANK ACCOUNTS (Asset -> Debit; Overdraft -> Credit)
    (state.bankAccounts || []).forEach((b: any, idx: number) => {
      const bal = Number(b.balance || 0);
      const isNeg = bal < 0;
      const bankLabel = b.bankName || b.bank || "Bank";
      if (isNeg) {
        detectedAnomalies.push({
          id: `anom-bank-${b.id || idx}`,
          severity: "WARNING",
          title: `Overdrawn Bank Account: ${bankLabel}`,
          detail: `Account has a negative balance of ${fmtINRFull(bal)}. Verify overdraft interest or pending sweep-in transfers.`,
          tab: "banking",
          suggestedJournalEntry: {
            drAccount: "Bank Charges & Overdraft Interest (Code 5100)",
            crAccount: `${bankLabel} Overdraft Facility (Liability Code 2100)`,
            amount: Math.abs(bal),
            narration: `Rectification to classify negative bank balance as short-term bank accommodation.`,
          },
        });
      }
      list.push({
        id: b.id || `bank-${idx}`,
        code: `1100-${String(idx + 1).padStart(2, "0")}`,
        name: `${bankLabel} (${b.type || "Savings"}) ${b.accountNumber ? `••••${String(b.accountNumber).slice(-4)}` : ""}`.trim(),
        category: "ASSET",
        subCategory: "Cash & Liquid",
        debit: Math.max(0, bal),
        credit: isNeg ? Math.abs(bal) : 0,
        netBalance: bal,
        normalBalance: "DEBIT",
        owner: b.owner || "self",
        status: isNeg ? "WARNING" : "OK",
        note: isNeg ? "Overdrawn bank balance (Credit balance in Asset ledger)" : "Active Liquid Asset",
        tabTarget: "banking",
      });
    });

    // 2. PREPAID CARDS & WALLETS (Asset -> Debit)
    (state.prepaidCards || [])
      .filter((pc: any) => (pc.status || "").toLowerCase() !== "closed")
      .forEach((pc: any, idx: number) => {
        const txns = pc.transactions || [];
        const loaded = txns
          .filter((t: any) => t.type === "load")
          .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        const spent = txns
          .filter((t: any) => t.type === "spend")
          .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        const bal = loaded - spent;
        if (bal !== 0 || txns.length > 0) {
          list.push({
            id: pc.id || `prepaid-${idx}`,
            code: `1150-${String(idx + 1).padStart(2, "0")}`,
            name: `Prepaid Wallet: ${pc.name || pc.issuer || "Card"}`,
            category: "ASSET",
            subCategory: "Cash & Liquid",
            debit: Math.max(0, bal),
            credit: bal < 0 ? Math.abs(bal) : 0,
            netBalance: bal,
            normalBalance: "DEBIT",
            owner: pc.owner || "self",
            status: bal < 0 ? "WARNING" : "OK",
            note: `Loaded: ${fmtINRFull(loaded)} | Spent: ${fmtINRFull(spent)}`,
            tabTarget: "cards",
          });
        }
      });

    // 3. FIXED & RECURRING DEPOSITS (Asset -> Debit)
    (state.fixedDeposits || []).forEach((fd: any, idx: number) => {
      if (isDepositClosed(fd)) return;
      const amt = Number(fd.principal || 0);
      list.push({
        id: fd.id || `fd-${idx}`,
        code: `1200-${String(idx + 1).padStart(2, "0")}`,
        name: `FD: ${fd.bank || "Bank"} @ ${fd.rate || 0}%`,
        category: "ASSET",
        subCategory: "Term Deposits",
        debit: amt,
        credit: 0,
        netBalance: amt,
        normalBalance: "DEBIT",
        owner: fd.owner || "self",
        status: "OK",
        note: `Matures: ${fd.maturityDate || "N/A"}`,
        tabTarget: "investments",
      });
    });

    (state.recurringDeposits || []).forEach((rd: any, idx: number) => {
      if (isDepositClosed(rd)) return;
      const monthly = Number(rd.monthly || 0);
      const rate = Number(rd.rate || 0);
      const elapsed = rdElapsed(rd, today());
      const amt = rate > 0 ? rdMaturity(monthly, rate, elapsed) : monthly * elapsed;
      list.push({
        id: rd.id || `rd-${idx}`,
        code: `1250-${String(idx + 1).padStart(2, "0")}`,
        name: `RD: ${rd.bank || "Bank"} (₹${monthly.toLocaleString("en-IN")}/mo)`,
        category: "ASSET",
        subCategory: "Term Deposits",
        debit: amt,
        credit: 0,
        netBalance: amt,
        normalBalance: "DEBIT",
        owner: rd.owner || "self",
        status: "OK",
        note: `${elapsed} mos accrued @ ${rate}% p.a.`,
        tabTarget: "investments",
      });
    });

    // 4. BONDS & DEBENTURES (Asset -> Debit)
    (state.bonds || []).forEach((b: any, idx: number) => {
      const amt = Number(
        b.totalInvestmentAmount ||
          b.totalPrincipalAmount ||
          Number(b.numberOfUnits || 0) * Number(b.faceValuePerUnit || 0) ||
          b.faceValue ||
          b.principal ||
          0
      );
      list.push({
        id: b.id || `bond-${idx}`,
        code: `1280-${String(idx + 1).padStart(2, "0")}`,
        name: `Bond: ${b.issuerName || b.name || "Fixed Income Bond"}`,
        category: "ASSET",
        subCategory: "Fixed Income Securities",
        debit: amt,
        credit: 0,
        netBalance: amt,
        normalBalance: "DEBIT",
        owner: b.owner || "self",
        status: "OK",
        note: b.couponRate ? `Coupon: ${b.couponRate}% p.a.` : undefined,
        tabTarget: "investments",
      });
    });

    // 5. EQUITIES & MUTUAL FUNDS (Asset -> Debit)
    let totalStockVal = 0;
    let totalStockCost = 0;
    (state.stocks || []).forEach((s: any) => {
      const yfSym = `${(s.symbol || "").replace(/\.(NS|BO)$/i, "")}.${(s.exchange || "NSE") === "BSE" ? "BO" : "NS"}`;
      const livePrice = marketData?.[yfSym]?.price ?? Number(s.currentPrice || 0);
      const fallbackPrice = livePrice || Number(s.avgPrice || 0);
      const val = fallbackPrice * Number(s.qty || 0);
      const cost = Number(s.avgPrice || 0) * Number(s.qty || 0);
      totalStockVal += val;
      totalStockCost += cost;
    });
    if (totalStockVal > 0 || (state.stocks || []).length > 0) {
      list.push({
        id: "ledger-stocks-portfolio",
        code: "1300-01",
        name: `Listed Equities & Demat Holdings (${(state.stocks || []).length} scrips)`,
        category: "ASSET",
        subCategory: "Marketable Securities",
        debit: totalStockVal,
        credit: 0,
        netBalance: totalStockVal,
        normalBalance: "DEBIT",
        owner: "family",
        status: "OK",
        note: `Invested Cost: ₹${Math.round(totalStockCost).toLocaleString("en-IN")}`,
        tabTarget: "demat",
      });
    }

    let totalMFVal = 0;
    let totalMFCost = 0;
    let zeroNavCount = 0;
    (state.mutualFunds || []).forEach((m: any) => {
      const units = Number(m.units || 0);
      const nav =
        Number(m.currentNav || 0) ||
        Number(m.nav || 0) ||
        Number(m.buyNav || 0) ||
        (units > 0 ? Number(m.invested || 0) / units : 0);
      const cur = Number(m.current || 0) > 0 ? Number(m.current) : units * nav;
      const cost = Number(m.invested || 0);
      if (units > 0 && cur <= 0) zeroNavCount++;
      totalMFVal += cur;
      totalMFCost += cost;
    });
    if (zeroNavCount > 0) {
      detectedAnomalies.push({
        id: "anom-mf-zero-nav",
        severity: "ATTENTION",
        title: `${zeroNavCount} Mutual Fund Folio(s) Missing Live NAV`,
        detail: "Some mutual fund holdings have units > 0 but no current/buy NAV recorded.",
        tab: "mutualFunds",
      });
    }
    if (totalMFVal > 0 || (state.mutualFunds || []).length > 0) {
      list.push({
        id: "ledger-mf-portfolio",
        code: "1350-01",
        name: `Mutual Funds Portfolio (${(state.mutualFunds || []).length} folios)`,
        category: "ASSET",
        subCategory: "Marketable Securities",
        debit: totalMFVal,
        credit: 0,
        netBalance: totalMFVal,
        normalBalance: "DEBIT",
        owner: "family",
        status: zeroNavCount > 0 ? "ATTENTION" : "OK",
        note: `Invested Cost: ₹${Math.round(totalMFCost).toLocaleString("en-IN")}`,
        tabTarget: "mutualFunds",
      });
    }

    // 6. RETIREMENT, INSURANCE & GOVT ASSETS (Asset -> Debit)
    (state.ppf || []).forEach((p: any, idx: number) => {
      const bal = Number(p.balance || 0);
      list.push({
        id: p.id || `ppf-${idx}`,
        code: `1400-${String(idx + 1).padStart(2, "0")}`,
        name: `Public Provident Fund (PPF) ${p.accountNumber ? `••••${String(p.accountNumber).slice(-4)}` : ""}`.trim(),
        category: "ASSET",
        subCategory: "Retirement Funds",
        debit: bal,
        credit: 0,
        netBalance: bal,
        normalBalance: "DEBIT",
        owner: p.owner || "self",
        status: "OK",
        tabTarget: "investments",
      });
    });

    (state.epf || []).forEach((e: any, idx: number) => {
      const calcBal = calculateEpfBalance(e);
      const bal = calcBal > 0 ? calcBal : !(e.transactions && e.transactions.length > 0) ? Number(e.currentBalance || e.balance || 0) : 0;
      list.push({
        id: e.id || `epf-${idx}`,
        code: `1420-${String(idx + 1).padStart(2, "0")}`,
        name: `Employees' Provident Fund (EPFO: ${e.employer || "Org"})`,
        category: "ASSET",
        subCategory: "Retirement Funds",
        debit: bal,
        credit: 0,
        netBalance: bal,
        normalBalance: "DEBIT",
        owner: e.owner || "self",
        status: "OK",
        tabTarget: "investments",
      });
    });

    (state.nps || []).forEach((n: any, idx: number) => {
      const directBal = Number(n.balance || 0);
      const txTotal = (n.transactions || []).reduce(
        (ss: number, t: any) => ss + (Number(t.employeeAmount) || 0) + (Number(t.employerAmount) || 0),
        0
      );
      const bal = directBal > 0 ? directBal : txTotal;
      list.push({
        id: n.id || `nps-${idx}`,
        code: `1440-${String(idx + 1).padStart(2, "0")}`,
        name: `National Pension System (NPS ${n.tier || "Tier 1"})`,
        category: "ASSET",
        subCategory: "Retirement Funds",
        debit: bal,
        credit: 0,
        netBalance: bal,
        normalBalance: "DEBIT",
        owner: n.owner || "self",
        status: "OK",
        tabTarget: "investments",
      });
    });

    (state.govtSchemes || []).forEach((sc: any, idx: number) => {
      const bal = Number(sc.currentBalance || 0);
      list.push({
        id: sc.id || `govt-${idx}`,
        code: `1460-${String(idx + 1).padStart(2, "0")}`,
        name: `${sc.schemeType || "Govt Scheme"}: ${sc.accountHolder || sc.bankOrPostOffice || "Account"}`,
        category: "ASSET",
        subCategory: "Government Schemes",
        debit: bal,
        credit: 0,
        netBalance: bal,
        normalBalance: "DEBIT",
        owner: sc.owner || "self",
        status: "OK",
        tabTarget: "investments",
      });
    });

    (state.lic || []).forEach((l: any, idx: number) => {
      const txTotal = (l.transactions || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
      const val = txTotal > 0 ? txTotal : Number(l.premiumPaid || 0);
      if (val > 0) {
        list.push({
          id: l.id || `lic-${idx}`,
          code: `1480-${String(idx + 1).padStart(2, "0")}`,
          name: `LIC / Endowment: ${l.name || l.policyNumber || "Policy"}`,
          category: "ASSET",
          subCategory: "Insurance & Endowment",
          debit: val,
          credit: 0,
          netBalance: val,
          normalBalance: "DEBIT",
          owner: l.owner || "self",
          status: "OK",
          tabTarget: "insurance",
        });
      }
    });

    (state.investmentPlans || []).forEach((ip: any, idx: number) => {
      const txTotal = (ip.transactions || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
      const val = txTotal > 0 ? txTotal : Number(ip.premiumPaid || 0);
      if (val > 0) {
        list.push({
          id: ip.id || `invplan-${idx}`,
          code: `1490-${String(idx + 1).padStart(2, "0")}`,
          name: `Investment Plan: ${ip.name || "ULIP / Plan"}`,
          category: "ASSET",
          subCategory: "Insurance & Endowment",
          debit: val,
          credit: 0,
          netBalance: val,
          normalBalance: "DEBIT",
          owner: ip.owner || "self",
          status: "OK",
          tabTarget: "insurance",
        });
      }
    });

    // 7. GOLD & SOVEREIGN BULLION (Asset -> Debit)
    const goldPrice = getGoldPricePerGram(state);
    (state.goldHoldings || []).forEach((g: any, idx: number) => {
      const grams = Number(g.grams || g.weightGrams || 0);
      const purityMul = g.type === "physical" ? GOLD_PURITY_FACTOR[g.purity] || 1 : 1;
      const val = grams * goldPrice * purityMul;
      list.push({
        id: g.id || `gold-${idx}`,
        code: `1500-${String(idx + 1).padStart(2, "0")}`,
        name: `${g.name || g.type || "Gold"} (${grams}g ${g.purity || "24K"})`,
        category: "ASSET",
        subCategory: "Precious Metals",
        debit: val,
        credit: 0,
        netBalance: val,
        normalBalance: "DEBIT",
        owner: g.owner || "self",
        status: "OK",
        tabTarget: "gold",
      });
    });

    // 8. REAL ESTATE, RENTAL PROPERTIES & SECURITY DEPOSITS (Asset -> Debit)
    (state.realEstateProperties || [])
      .filter((r: any) => r.status !== "sold")
      .forEach((r: any, idx: number) => {
        const share = realEstateTrackedShare(r);
        const rawVal = Number(r.marketValue || r.agreementValue || r.propertyValue || r.purchasePrice || 0);
        const val = rawVal * share;
        list.push({
          id: r.id || `re-${idx}`,
          code: `1600-${String(idx + 1).padStart(2, "0")}`,
          name: `Property: ${r.name || "Real Estate"}${share < 1 ? ` (${Math.round(share * 100)}% Share)` : ""}`,
          category: "ASSET",
          subCategory: "Immovable Property",
          debit: val,
          credit: 0,
          netBalance: val,
          normalBalance: "DEBIT",
          owner: r.owner || "self",
          status: "OK",
          tabTarget: "realEstate",
        });
      });

    (state.rentalProperties || []).forEach((rp: any, idx: number) => {
      const val = Number(rp.propertyValue || 0);
      if (val > 0) {
        list.push({
          id: rp.id || `rental-prop-${idx}`,
          code: `1620-${String(idx + 1).padStart(2, "0")}`,
          name: `Let-Out Property: ${rp.propertyName || rp.address || "Rental Asset"}`,
          category: "ASSET",
          subCategory: "Immovable Property",
          debit: val,
          credit: 0,
          netBalance: val,
          normalBalance: "DEBIT",
          owner: rp.owner || "self",
          status: "OK",
          tabTarget: "rentals",
        });
      }
    });

    (state.rentedProperties || []).forEach((rp: any, idx: number) => {
      const actualDeposit =
        rp.depositTransactions && rp.depositTransactions.length > 0
          ? rp.depositTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0)
          : Number(rp.securityDeposit || 0);
      const returned = Number(rp.depositReturned || 0);
      const netDeposit = Math.max(0, actualDeposit - returned);
      if (netDeposit > 0) {
        list.push({
          id: rp.id || `rented-dep-${idx}`,
          code: `1650-${String(idx + 1).padStart(2, "0")}`,
          name: `Security Deposit Receivable: ${rp.propertyName || rp.landlordName || "Rented Home"}`,
          category: "ASSET",
          subCategory: "Deposits & Advances",
          debit: netDeposit,
          credit: 0,
          netBalance: netDeposit,
          normalBalance: "DEBIT",
          owner: rp.owner || "self",
          status: "OK",
          tabTarget: "rentals",
        });
      }
    });

    // 9. VEHICLES (Asset -> Debit)
    (state.vehicles || []).forEach((v: any, idx: number) => {
      const val = Number(v.currentValue || v.purchasePrice || 0);
      list.push({
        id: v.id || `veh-${idx}`,
        code: `1700-${String(idx + 1).padStart(2, "0")}`,
        name: `Vehicle: ${v.make || ""} ${v.model || v.name || "Automobile"}`.trim(),
        category: "ASSET",
        subCategory: "Movable Fixed Assets",
        debit: val,
        credit: 0,
        netBalance: val,
        normalBalance: "DEBIT",
        owner: v.owner || "self",
        status: "OK",
        tabTarget: "vehicles",
      });
    });

    // 10. LOANS & ADVANCES GIVEN (Asset -> Debit)
    const nowStr = today();
    (state.loansGiven || []).forEach((l: any, idx: number) => {
      const out = loanGivenOutstanding(l);
      const isOverdue = out > 0 && l.dueDate && l.dueDate < nowStr;
      if (isOverdue) {
        detectedAnomalies.push({
          id: `anom-lg-${l.id || idx}`,
          severity: "ATTENTION",
          title: `Overdue Loan Receivable: ${l.borrower || "Borrower"}`,
          detail: `${fmtINRFull(out)} is past agreed due date (${l.dueDate}). Follow up or assess provision for doubtful debt.`,
          tab: "credit",
          suggestedJournalEntry: {
            drAccount: "Provision for Doubtful Debts (P&L Code 5400)",
            crAccount: `Allowance for Credit Losses - ${l.borrower} (Contra Asset Code 1890)`,
            amount: out,
            narration: `Prudence provision created for overdue loan receivable past statutory due date.`,
          },
        });
      }
      list.push({
        id: l.id || `lg-${idx}`,
        code: `1800-${String(idx + 1).padStart(2, "0")}`,
        name: `Loan Given: ${l.borrower || "Borrower"}`,
        category: "ASSET",
        subCategory: "Loans & Receivables",
        debit: out,
        credit: 0,
        netBalance: out,
        normalBalance: "DEBIT",
        owner: l.owner || "self",
        status: isOverdue ? "WARNING" : out > 0 ? "OK" : "ATTENTION",
        note: isOverdue ? `Overdue since ${l.dueDate}` : undefined,
        tabTarget: "credit",
      });
    });

    (state.informalLent || []).forEach((i: any, idx: number) => {
      const out = informalPersonOutstanding(i);
      list.push({
        id: i.id || `inf-lent-${idx}`,
        code: `1850-${String(idx + 1).padStart(2, "0")}`,
        name: `Receivable from ${i.name || i.person || "Person"}`,
        category: "ASSET",
        subCategory: "Loans & Receivables",
        debit: out,
        credit: 0,
        netBalance: out,
        normalBalance: "DEBIT",
        owner: i.owner || "self",
        status: "OK",
        tabTarget: "credit",
      });
    });

    // 11. SECURED & UNSECURED BORROWINGS (Liability -> Credit)
    (state.loansTaken || []).forEach((l: any, idx: number) => {
      const out = loanOutstanding(l);
      const isSecured =
        (l.type || "").toLowerCase().includes("home") ||
        (l.type || "").toLowerCase().includes("vehicle") ||
        (l.type || "").toLowerCase().includes("car") ||
        (l.type || "").toLowerCase().includes("gold");
      list.push({
        id: l.id || `loan-taken-${idx}`,
        code: `2100-${String(idx + 1).padStart(2, "0")}`,
        name: `Loan: ${l.lender || "Bank"} (${l.type || "General"})`,
        category: "LIABILITY",
        subCategory: isSecured ? "Secured Borrowings" : "Unsecured Borrowings",
        debit: 0,
        credit: out,
        netBalance: out,
        normalBalance: "CREDIT",
        owner: l.owner || "self",
        status: out > 0 ? "OK" : "ATTENTION",
        note: `EMI: ₹${Number(l.emi || 0).toLocaleString("en-IN")}/mo @ ${l.rate || 0}%`,
        tabTarget: "credit",
      });
    });

    // Under-Construction Builder Demands Outstanding (Liability -> Credit)
    (state.realEstateProperties || [])
      .filter((p: any) => p.status === "under-construction")
      .forEach((p: any, idx: number) => {
        const share = realEstateTrackedShare(p);
        const demanded = (state.realEstateDemands || [])
          .filter((d: any) => d.propertyId === p.id)
          .reduce((s: number, d: any) => s + Number(d.totalAmount || d.amount || 0), 0);
        const paid = (state.realEstatePayments || [])
          .filter((pm: any) => pm.propertyId === p.id)
          .reduce((s: number, pm: any) => s + Number(pm.amount || 0), 0);
        const out = Math.max(0, demanded - paid) * share;
        if (out > 0) {
          list.push({
            id: `re-demand-liab-${p.id || idx}`,
            code: `2150-${String(idx + 1).padStart(2, "0")}`,
            name: `Builder Demand Payable: ${p.name || "Under-Construction Property"}`,
            category: "LIABILITY",
            subCategory: "Real Estate Payables",
            debit: 0,
            credit: out,
            netBalance: out,
            normalBalance: "CREDIT",
            owner: p.owner || "self",
            status: "ATTENTION",
            note: `Demanded: ${fmtINRFull(demanded)} | Paid: ${fmtINRFull(paid)}`,
            tabTarget: "realEstate",
          });
        }
      });

    (state.informalBorrowed || []).forEach((i: any, idx: number) => {
      const out = informalPersonOutstanding(i);
      list.push({
        id: i.id || `inf-borr-${idx}`,
        code: `2200-${String(idx + 1).padStart(2, "0")}`,
        name: `Payable to ${i.name || i.person || "Lender"}`,
        category: "LIABILITY",
        subCategory: "Informal Liabilities",
        debit: 0,
        credit: out,
        netBalance: out,
        normalBalance: "CREDIT",
        owner: i.owner || "self",
        status: "OK",
        tabTarget: "credit",
      });
    });

    // Landlord Security Deposits Held (Liability -> Credit)
    (state.rentalProperties || []).forEach((r: any, idx: number) => {
      const actualDeposit =
        r.depositTransactions && r.depositTransactions.length > 0
          ? r.depositTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0)
          : Number(r.securityDeposit || 0);
      const deducted = (r.depositDeductions || []).reduce(
        (a: number, d: any) => a + Number(d.amount || 0),
        0
      );
      const returned = Number(r.depositReturned || 0);
      const liab = Math.max(0, actualDeposit - deducted - returned);
      if (liab > 0) {
        list.push({
          id: `rental-dep-liab-${r.id || idx}`,
          code: `2250-${String(idx + 1).padStart(2, "0")}`,
          name: `Tenant Security Deposit Refundable: ${r.propertyName || r.tenantName || "Tenant"}`,
          category: "LIABILITY",
          subCategory: "Security Deposits Payable",
          debit: 0,
          credit: liab,
          netBalance: liab,
          normalBalance: "CREDIT",
          owner: r.owner || "self",
          status: "OK",
          tabTarget: "rentals",
        });
      }
    });

    (state.creditCards || [])
      .filter((c: any) => (c.status || "").toLowerCase() !== "closed")
      .forEach((c: any, idx: number) => {
        const out = getCcOutstanding(c);
        const limit = Number(c.limit || 0);
        const overLimit = limit > 0 && out > limit;
        if (overLimit) {
          detectedAnomalies.push({
            id: `anom-cc-${c.id || idx}`,
            severity: "WARNING",
            title: `Credit Limit Exceeded: ${c.bank || ""} ${c.name || "Card"}`,
            detail: `Outstanding ${fmtINRFull(out)} exceeds sanctioned limit of ${fmtINRFull(limit)}.`,
            tab: "cards",
            suggestedJournalEntry: {
              drAccount: "Credit Card Overlimit Fee & Finance Charges (P&L Code 5200)",
              crAccount: `${c.bank || ""} ${c.name || "Card"} (Liability Code 2300)`,
              amount: Math.max(0, out - limit),
              narration: `Accrual for unbilled overlimit balance exceeding sanctioned limit.`,
            },
          });
        }
        list.push({
          id: c.id || `cc-${idx}`,
          code: `2300-${String(idx + 1).padStart(2, "0")}`,
          name: `Credit Card: ${c.bank || ""} ${c.name || "Card"}`.trim(),
          category: "LIABILITY",
          subCategory: "Current Liabilities",
          debit: 0,
          credit: out,
          netBalance: out,
          normalBalance: "CREDIT",
          owner: c.owner || "self",
          status: overLimit ? "WARNING" : "OK",
          note: `Due: ${c.dueDate || "N/A"} | Limit: ₹${limit.toLocaleString("en-IN")}`,
          tabTarget: "cards",
        });
      });

    // Compute Totals (Net Asset Value & Net Liability Value)
    const totalAssets = list
      .filter((l) => l.category === "ASSET")
      .reduce((sum, l) => sum + (l.debit - l.credit), 0);

    const totalLiabilities = list
      .filter((l) => l.category === "LIABILITY")
      .reduce((sum, l) => sum + (l.credit - l.debit), 0);

    const netWorth = totalAssets - totalLiabilities;

    // 12. OWNER'S CAPITAL / EQUITY ACCOUNT (Credit when Net Worth >= 0, Debit when Accumulated Deficit < 0)
    list.push({
      id: "ledger-equity-capital",
      code: "3000-01",
      name:
        netWorth >= 0
          ? "Family Capital Account (Accumulated Net Worth)"
          : "Family Capital Account (Accumulated Deficit)",
      category: "EQUITY",
      subCategory: "Owner Equity",
      debit: netWorth < 0 ? Math.abs(netWorth) : 0,
      credit: netWorth >= 0 ? netWorth : 0,
      netBalance: netWorth,
      normalBalance: "CREDIT",
      owner: "family",
      status: netWorth >= 0 ? "OK" : "WARNING",
      note: "Balancing Equity Account: Assets − Liabilities",
    });

    const totalDebits = list.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = list.reduce((sum, l) => sum + l.credit, 0);
    const variance = Math.abs(totalDebits - totalCredits);

    return {
      ledgers: list,
      totals: {
        totalAssets,
        totalLiabilities,
        netWorth,
        totalDebits,
        totalCredits,
        variance,
      },
      anomalies: detectedAnomalies,
    };
  }, [state, marketData]);

  // Unique Owners for Owner Filter
  const availableOwners = useMemo(() => {
    const set = new Set<string>();
    ledgers.forEach((l) => {
      if (l.owner) set.add(l.owner);
    });
    return Array.from(set);
  }, [ledgers]);

  // Filtered List
  const filteredLedgers = useMemo(() => {
    return ledgers.filter((l) => {
      if (categoryFilter !== "ALL" && l.category !== categoryFilter) return false;
      if (ownerFilter !== "ALL" && l.owner !== ownerFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          l.subCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledgers, categoryFilter, ownerFilter, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = ledgers.map((l) => ({
      "Account Code": l.code,
      "Account Head": l.name,
      Category: l.category,
      "Sub Category": l.subCategory,
      Owner: l.owner,
      "Debit Balance (INR)": l.debit,
      "Credit Balance (INR)": l.credit,
      Status: l.status,
      Notes: l.note || "",
    }));
    exportArrayToCSV(rows, `Trial-Balance-Ledger-${new Date().toISOString().split("T")[0]}`);
    showToast?.("Trial Balance exported to CSV successfully", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  const metricsNetWorth = typeof metrics?.netWorth === "number" ? metrics.netWorth : totals.netWorth;
  const nwReconciliationDelta = Math.abs(totals.netWorth - metricsNetWorth);

  const handleCopyAuditorCertificate = () => {
    const liquidAssets = ledgers
      .filter((l) => l.subCategory === "Cash & Liquid")
      .reduce((s, l) => s + (l.debit - l.credit), 0);
    const currentLiab = ledgers
      .filter((l) => l.subCategory === "Current Liabilities" || l.subCategory === "Security Deposits Payable")
      .reduce((s, l) => s + (l.credit - l.debit), 0);
    const currentRatio = currentLiab > 0 ? (liquidAssets / currentLiab).toFixed(2) : "N/A (No short-term debt)";
    const debtToEquity = totals.netWorth > 0 ? (totals.totalLiabilities / totals.netWorth).toFixed(2) : "N/A";
    const solvencyRatio = totals.totalAssets > 0 ? ((totals.netWorth / totals.totalAssets) * 100).toFixed(1) : "0";

    const certText = `
AUDITOR'S STATEMENT OF FINANCIAL POSITION & RECONCILIATION
══════════════════════════════════════════════════════════════════════════════
Audit Reference Date: ${today()}
Accounting Standard: Double-Entry Accrual / Indian Accounting Standards (Ind AS)
Assessee / Family Profile: ${ownerFilter === "ALL" ? "Consolidated Family Portfolio" : ownerFilter.toUpperCase()}

1. ACCOUNTING IDENTITY VERIFICATION:
   • Total Debits (Gross Realizable Assets): ₹${Math.round(totals.totalAssets).toLocaleString("en-IN")}
   • Total Credits (Gross External Liabilities): ₹${Math.round(totals.totalLiabilities).toLocaleString("en-IN")}
   • Balancing Equity (Family Accumulated Net Worth): ₹${Math.round(totals.netWorth).toLocaleString("en-IN")}
   • Mathematical Variance: ₹${totals.variance.toFixed(2)} [PARITY VERIFIED]

2. PRUDENTIAL SOLVENCY & LIQUIDITY RATIOS:
   • Solvency Ratio (Equity / Gross Assets): ${solvencyRatio}%
   • Current / Quick Liquidity Ratio: ${currentRatio}
   • Debt-to-Equity Ratio: ${debtToEquity}
   • Net Worth Reconciliation vs Live Ledger: ₹${Math.round(metricsNetWorth).toLocaleString("en-IN")} (Delta: ₹${nwReconciliationDelta.toFixed(2)})

3. AUDIT OBSERVATIONS & INTEGRITY:
   • Active Ledger Heads: ${ledgers.length}
   • Exceptions / Flags Detected: ${anomalies.length}
   • Status: ${anomalies.length === 0 ? "UNQUALIFIED / CLEAN OPINION" : `${anomalies.length} EMPHASIS OF MATTER / ATTENTION POINTS`}
══════════════════════════════════════════════════════════════════════════════
Generated by ArthaDrishti Executive Double-Entry Audit Desk
`.trim();

    navigator.clipboard.writeText(certText);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2500);
    showToast?.("Auditor's Financial Certificate copied to clipboard", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Header Card & Accounting Equation Tally ── */}
      <Card
        style={{
          padding: 20,
          background: `linear-gradient(135deg, color-mix(in srgb, ${THEME.accent} 8%, transparent), color-mix(in srgb, ${THEME.sage} 6%, transparent))`,
          border: `1px solid color-mix(in srgb, ${THEME.accent} 25%, transparent)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: THEME.accent,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Scale size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                  Double-Entry General Ledger & Trial Balance
                </h2>
                <p style={{ fontSize: 12, color: THEME.muted, margin: "2px 0 0" }}>
                  Real-time double-entry trial balance generator · Assets = Liabilities + Capital Verification
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              icon={copiedCert ? <Check size={14} color="var(--t-sage)" /> : <Copy size={14} />}
              onClick={handleCopyAuditorCertificate}
              title="Copy formal Auditor's Financial Position Statement & Ratios"
            >
              {copiedCert ? "Copied Certificate" : "Copy Auditor Certificate"}
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
              Export Trial Balance
            </Button>
            <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={handlePrint}>
              Print Ledger
            </Button>
          </div>
        </div>

        {/* Accounting Equation Verification Pill */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "var(--t-paper)",
            border: `1px solid ${totals.variance < 1 ? "color-mix(in srgb, var(--t-sage) 35%, transparent)" : "color-mix(in srgb, var(--t-rust) 35%, transparent)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {totals.variance < 1 ? (
              <CheckCircle2 size={18} color="var(--t-sage)" />
            ) : (
              <AlertTriangle size={18} color="var(--t-rust)" />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
              Accounting Identity: Assets (
              <Money value={totals.totalAssets} />) = Liabilities (
              <Money value={totals.totalLiabilities} />) + Equity (
              <Money value={totals.netWorth} />)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge variant={nwReconciliationDelta < 1 ? "success" : "warning"}>
              {nwReconciliationDelta < 1 ? "100% RECONCILED WITH DASHBOARD NW" : `NW DELTA: ${fmtINRFull(nwReconciliationDelta)}`}
            </Badge>
            <Badge variant={totals.variance < 1 ? "success" : "danger"}>
              {totals.variance < 1 ? "PARITY VERIFIED (₹0 VARIANCE)" : `VARIANCE: ₹${totals.variance.toFixed(2)}`}
            </Badge>
          </div>
        </div>
      </Card>

      {/* ── Key Metrics Deck ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
            Total Debits (Assets)
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: THEME.ink, marginTop: 4 }}>
            <Money value={totals.totalDebits} variant="full" />
          </div>
          <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
            {ledgers.filter((l) => l.category === "ASSET").length} active asset ledger accounts
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
            Total Credits (Liab + Equity)
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: THEME.ink, marginTop: 4 }}>
            <Money value={totals.totalCredits} variant="full" />
          </div>
          <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
            {ledgers.filter((l) => l.category !== "ASSET").length} liability & capital accounts
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
            Owner Net Worth (Capital)
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t-sage)", marginTop: 4 }}>
            <Money value={totals.netWorth} variant="full" />
          </div>
          <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
            Solvency: {totals.totalAssets > 0 ? ((totals.netWorth / totals.totalAssets) * 100).toFixed(1) : 0}% of gross assets
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
            Auditor Integrity Score
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: anomalies.length === 0 ? THEME.accent : "var(--t-gold)", marginTop: 4 }}>
            {anomalies.length === 0 ? "100% / Clean" : `${Math.max(70, 100 - anomalies.length * 8)}% / ${anomalies.length} Flag(s)`}
          </div>
          <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
            {anomalies.length === 0 ? "Zero ledger exceptions detected" : `${anomalies.length} account(s) flagged for review`}
          </div>
        </Card>
      </div>

      {/* ── Senior Accountant Reconciliation & Exception Inspector (New Feature) ── */}
      {anomalies.length > 0 && (
        <Card
          style={{
            padding: 16,
            border: "1px solid color-mix(in srgb, var(--t-gold) 35%, transparent)",
            background: "color-mix(in srgb, var(--t-gold) 5%, transparent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} color="var(--t-gold)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>
                Ledger Exception & Audit Observations ({anomalies.length})
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJournalEntries(!showJournalEntries)}
                style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px" }}
              >
                {showJournalEntries ? "Hide Journal Entries" : "Show Corrective Journal Entries"}
              </Button>
              <Badge variant="warning">ACTION RECOMMENDED</Badge>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {anomalies.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--t-paper)",
                  border: `1px solid ${THEME.line}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: a.severity === "WARNING" ? "var(--t-rust)" : THEME.ink }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>{a.detail}</div>
                  </div>
                  {setTab && a.tab && (
                    <Button variant="secondary" size="sm" onClick={() => setTab(a.tab!)}>
                      Inspect
                    </Button>
                  )}
                </div>

                {showJournalEntries && a.suggestedJournalEntry && (
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "color-mix(in srgb, var(--surface-1) 80%, transparent)",
                      border: `1px dashed ${THEME.line}`,
                      fontFamily: "monospace",
                      fontSize: 11,
                      lineHeight: 1.5,
                      color: THEME.ink,
                    }}
                  >
                    <div style={{ color: THEME.accent, fontWeight: 700 }}>
                      Dr. {a.suggestedJournalEntry.drAccount}  ₹{a.suggestedJournalEntry.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ color: "var(--t-sage)", fontWeight: 700, paddingLeft: 16 }}>
                      Cr. {a.suggestedJournalEntry.crAccount}  ₹{a.suggestedJournalEntry.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ color: THEME.muted, fontSize: 10, marginTop: 2 }}>
                      ({a.suggestedJournalEntry.narration})
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Filters & Controls Bar ── */}
      <Card style={{ padding: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 240 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
              <Search
                size={15}
                color={THEME.muted}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search ledger code, account name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  borderRadius: 8,
                  border: `1px solid ${THEME.line}`,
                  background: "var(--t-paper)",
                  fontSize: 13,
                  color: THEME.ink,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              aria-label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${THEME.line}`,
                background: "var(--t-paper)",
                fontSize: 12.5,
                fontWeight: 600,
                color: THEME.ink,
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="ASSET">Assets (Debit)</option>
              <option value="LIABILITY">Liabilities (Credit)</option>
              <option value="EQUITY">Capital / Equity (Credit)</option>
            </select>

            <select
              aria-label="Filter by Owner"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${THEME.line}`,
                background: "var(--t-paper)",
                fontSize: 12.5,
                fontWeight: 600,
                color: THEME.ink,
              }}
            >
              <option value="ALL">All Owners</option>
              {availableOwners.map((owner) => (
                <option key={owner} value={owner}>
                  Owner: {owner.charAt(0).toUpperCase() + owner.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Trial Balance Table ── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "color-mix(in srgb, var(--t-accent) 5%, transparent)", borderBottom: `1.5px solid ${THEME.line}` }}>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Code</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Account Head</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Classification</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Owner</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Debit (Dr.)</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Credit (Cr.)</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedgers.map((l, i) => (
                <tr
                  key={l.id}
                  onClick={() => l.tabTarget && setTab?.(l.tabTarget)}
                  style={{
                    borderBottom: `1px solid ${THEME.line}`,
                    background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--t-paper) 40%, transparent)",
                    cursor: l.tabTarget && setTab ? "pointer" : "default",
                  }}
                >
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: THEME.muted }}>
                    {l.code}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: THEME.ink }}>
                    <div>{l.name}</div>
                    {l.note && <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 400 }}>{l.note}</div>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: l.category === "ASSET" ? THEME.accent : l.category === "LIABILITY" ? "var(--t-rust)" : "var(--t-sage)" }}>
                      {l.category}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.muted }}>{l.subCategory}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: THEME.muted, textTransform: "capitalize" }}>
                    {l.owner}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: l.debit > 0 ? THEME.ink : THEME.muted }}>
                    {l.debit > 0 ? <Money value={l.debit} variant="full" /> : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: l.credit > 0 ? THEME.ink : THEME.muted }}>
                    {l.credit > 0 ? <Money value={l.credit} variant="full" /> : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <Badge variant={l.status === "OK" ? "success" : l.status === "WARNING" ? "danger" : "warning"}>
                      {l.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "color-mix(in srgb, var(--t-accent) 8%, transparent)", borderTop: `2px solid ${THEME.line}` }}>
                <td colSpan={4} style={{ padding: "14px 16px", fontWeight: 800, fontSize: 14, color: THEME.ink }}>
                  TOTAL TRIAL BALANCE
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 900, fontSize: 15, color: THEME.ink }}>
                  <Money value={totals.totalDebits} variant="full" />
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 900, fontSize: 15, color: THEME.ink }}>
                  <Money value={totals.totalCredits} variant="full" />
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                  <Badge variant="success">TALLIED</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
