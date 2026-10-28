/* eslint-disable */
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  TrendingDown,
  Wallet,
  Calendar,
  Calculator,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Layers,
  LayoutGrid,
  List,
  Building,
  RotateCcw,
  IndianRupee,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINR, fmtINRFull, fmtINRExact, loanOutstanding } from "../../utils/finance";
import { useMasterData, formatProfileOption } from "../../utils/masterData";
import { StatCard } from "../ui/StatCard";
import { Card } from "../ui/Card";
import { Money } from "../ui/Money";
import { BankLogo } from "../ui/BrandLogos";
import { ConfirmDialog } from "../ui/Feedback";
import { DataTable } from "../design-system/DataTable";
import { LoanAmortizationModal } from "./LoanAmortizationModal";
import { LoanPrepaymentDrawer } from "./LoanPrepaymentDrawer";
import { LoanPaymentModal } from "./LoanPaymentModal";
import { LoanTakenModal } from "./LoanTakenModal";

function loanOrdinalSuffix(d: number) {
  if (d >= 11 && d <= 13) return "th";
  const r = d % 10;
  if (r === 1) return "st";
  if (r === 2) return "nd";
  if (r === 3) return "rd";
  return "th";
}

function getReconciledLoanTakenMetrics(l: any) {
  const principal = Number(l?.principal) || 0;
  const rate = Number(l?.rate ?? l?.interestRate) || 0;
  const emi = Number(l?.emi) || 0;
  const payments: any[] = Array.isArray(l?.payments) ? l.payments : [];
  const rawOutstanding = loanOutstanding(l);
  const rawMonths = Number(l?.monthsRemaining ?? l?.tenureMonths) || 0;

  if ((l?.status || "").toLowerCase() === "closed") {
    return { outstanding: 0, months: 0, totalLoggedPaid: payments.reduce((s, p) => s + Number(p?.amount || 0), 0) };
  }

  const totalLoggedPaid = payments.reduce((s, p) => s + Number(p?.amount || 0), 0);
  const totalLoggedPrincipal = payments.reduce(
    (s, p) => s + (Number(rate === 0 ? p?.amount : p?.principalPortion ?? 0) || 0),
    0
  );

  if (principal > 0 && totalLoggedPrincipal > 0) {
    const maxPossibleOutstanding = Math.max(0, principal - totalLoggedPrincipal);
    if (rawOutstanding > maxPossibleOutstanding) {
      const reconciledOutstanding = maxPossibleOutstanding;
      const reconciledMonths =
        reconciledOutstanding <= 0
          ? 0
          : rate === 0 && emi > 0
          ? Math.ceil(reconciledOutstanding / emi)
          : rawMonths;
      return {
        outstanding: reconciledOutstanding,
        months: reconciledMonths,
        totalLoggedPaid,
      };
    }
  }

  const resolvedMonths =
    rawOutstanding <= 0
      ? 0
      : rate === 0 && emi > 0
      ? Math.ceil(rawOutstanding / emi)
      : rawMonths;

  return {
    outstanding: rawOutstanding,
    months: resolvedMonths,
    totalLoggedPaid,
  };
}

interface LoanTakenSectionProps {
  items: any[];
  bankAccounts?: any[];
  onRemove: (id: string) => Promise<void> | void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: any) => Promise<void> | void;
  onAddTransaction?: (txn: any) => Promise<void> | void;
}

export function LoanTakenSection({
  items = [],
  bankAccounts = [],
  onRemove,
  onEdit,
  onAdd,
  onUpdate,
  onAddTransaction,
}: LoanTakenSectionProps) {
  const { familyProfiles, loanTypes } = useMasterData();

  // Search, filter, and view mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "outstanding_desc" | "rate_desc" | "emi_desc" | "tenure_asc" | "lender_asc"
  >("outstanding_desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [amortizationLoan, setAmortizationLoan] = useState<any | null>(null);
  const [prepayLoan, setPrepayLoan] = useState<any | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<any | null>(null);
  const [historyLoan, setHistoryLoan] = useState<any | null>(null);
  const [singlePassbookOpen, setSinglePassbookOpen] = useState<boolean>(true);
  const [confirmDeleteLoan, setConfirmDeleteLoan] = useState<any | null>(null);
  const [confirmUndoPayment, setConfirmUndoPayment] = useState<any | null>(null);
  const healedLoanIdsRef = useRef<Set<string>>(new Set());

  // Auto-reconcile any 0%-interest loan whose stored outstanding/monthsRemaining drifted from its payments ledger
  useEffect(() => {
    items.forEach((l: any) => {
      if (!l?.id || healedLoanIdsRef.current.has(l.id)) return;
      const rate = Number(l.rate ?? l.interestRate) || 0;
      const principal = Number(l.principal) || 0;
      const payments: any[] = Array.isArray(l.payments) ? l.payments : [];
      if (rate === 0 && principal > 0 && payments.length > 0 && (l.status || "active").toLowerCase() !== "closed") {
        const { outstanding: expectedOut, months: expectedMonths } = getReconciledLoanTakenMetrics(l);
        if (Number(l.outstanding) !== expectedOut || (Number(l.emi) > 0 && Number(l.monthsRemaining) !== expectedMonths)) {
          healedLoanIdsRef.current.add(l.id);
          onUpdate(l.id, {
            outstanding: expectedOut,
            monthsRemaining: expectedMonths,
            ...(expectedOut <= 0 ? { status: "closed" } : {}),
          });
        }
      }
    });
  }, [items, onUpdate]);

  // Aggregates & Analytics
  const activeLoans = useMemo(
    () => items.filter((l: any) => (l.status || "active").toLowerCase() !== "closed" && getReconciledLoanTakenMetrics(l).outstanding > 0),
    [items]
  );
  const closedLoans = useMemo(
    () => items.filter((l: any) => (l.status || "active").toLowerCase() === "closed" || getReconciledLoanTakenMetrics(l).outstanding <= 0),
    [items]
  );

  const totalPrincipal = useMemo(
    () => items.reduce((s: number, l: any) => s + (Number(l.principal) || 0), 0),
    [items]
  );
  const totalOutstanding = useMemo(
    () => activeLoans.reduce((s: number, l: any) => s + getReconciledLoanTakenMetrics(l).outstanding, 0),
    [activeLoans]
  );
  const totalEMI = useMemo(
    () => activeLoans.reduce((s: number, l: any) => s + (Number(l.emi) || 0), 0),
    [activeLoans]
  );

  // Total Interest Remaining calculation
  const totalInterestRemaining = useMemo(() => {
    return activeLoans.reduce((acc: number, l: any) => {
      const { outstanding: out, months } = getReconciledLoanTakenMetrics(l);
      const emi = Number(l.emi) || 0;
      if (out <= 0 || emi <= 0 || months <= 0) return acc;
      return acc + Math.max(0, emi * months - out);
    }, 0);
  }, [activeLoans]);

  // Weighted Average Interest Rate
  const weightedAvgRate = useMemo(() => {
    if (totalOutstanding <= 0) return 0;
    const weightedSum = activeLoans.reduce((s: number, l: any) => {
      const { outstanding: out } = getReconciledLoanTakenMetrics(l);
      const rate = Number(l.rate ?? l.interestRate) || 0;
      return s + out * rate;
    }, 0);
    return weightedSum / totalOutstanding;
  }, [activeLoans, totalOutstanding]);

  // Filtered & Sorted items
  const displayItems = useMemo(() => {
    let list = items;

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((l: any) => (l.status || "active").toLowerCase() !== "closed" && loanOutstanding(l) > 0);
    } else if (statusFilter === "closed") {
      list = list.filter((l: any) => (l.status || "active").toLowerCase() === "closed" || loanOutstanding(l) <= 0);
    }

    // Type filter
    if (typeFilter !== "all") {
      list = list.filter((l: any) => (l.type || l.loanType || "").toLowerCase() === typeFilter.toLowerCase());
    }

    // Owner filter
    if (ownerFilter !== "all") {
      list = list.filter((l: any) => (l.owner || "self") === ownerFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l: any) =>
          (l.lender || "").toLowerCase().includes(q) ||
          (l.type || l.loanType || "").toLowerCase().includes(q) ||
          (l.accountNumber || "").toLowerCase().includes(q) ||
          (l.note || l.name || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    return [...list].sort((a: any, b: any) => {
      if (sortBy === "outstanding_desc") return loanOutstanding(b) - loanOutstanding(a);
      if (sortBy === "rate_desc") return (Number(b.rate ?? b.interestRate) || 0) - (Number(a.rate ?? a.interestRate) || 0);
      if (sortBy === "emi_desc") return (Number(b.emi) || 0) - (Number(a.emi) || 0);
      if (sortBy === "tenure_asc") return (Number(a.monthsRemaining ?? a.tenureMonths) || 0) - (Number(b.monthsRemaining ?? b.tenureMonths) || 0);
      if (sortBy === "lender_asc") return (a.lender || "").localeCompare(b.lender || "");
      return 0;
    });
  }, [items, statusFilter, typeFilter, ownerFilter, searchQuery, sortBy]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          label="Total Borrowed"
          value={fmtINRFull(totalPrincipal)}
          numericValue={totalPrincipal}
          formatValue={fmtINRFull}
          sub={`${items.length} total loan${items.length !== 1 ? "s" : ""}`}
          color={THEME.muted}
          icon={<TrendingDown />}
        />
        <StatCard
          label="Outstanding Debt"
          value={fmtINRFull(totalOutstanding)}
          numericValue={totalOutstanding}
          formatValue={fmtINRFull}
          sub={
            totalOutstanding > 0
              ? `${activeLoans.length} active loan${activeLoans.length !== 1 ? "s" : ""}`
              : "All debt paid off"
          }
          color={THEME.rust}
          icon={<Wallet />}
        />
        <StatCard
          label="Monthly EMI Outflow"
          value={fmtINRFull(totalEMI)}
          numericValue={totalEMI}
          formatValue={fmtINRFull}
          sub={
            activeLoans.length > 0
              ? `Avg rate: ${weightedAvgRate.toFixed(2)}% p.a.`
              : "No active monthly outflows"
          }
          color={THEME.accent}
          icon={<Calendar />}
        />
        <StatCard
          label="Est. Remaining Interest"
          value={fmtINRFull(totalInterestRemaining)}
          numericValue={totalInterestRemaining}
          formatValue={fmtINRFull}
          sub="Prepaying early reduces this"
          color={THEME.gold}
          icon={<Sparkles />}
        />
      </div>

      {/* Control Bar */}
      <Card
        style={{
          padding: "14px 18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Left: Search & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: "1 1 500px" }}>
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: 200, flex: "1 1 200px" }}>
            <Search
              size={14}
              color="var(--t-muted)"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search lender, type, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 12px 7px 30px",
                borderRadius: 8,
                border: "1px solid var(--t-line)",
                background: "var(--surface-0)",
                color: "var(--t-ink)",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", background: "var(--surface-1)", padding: 2, borderRadius: 8 }}>
            {[
              { key: "active", label: `Active (${activeLoans.length})` },
              { key: "closed", label: `Paid Off (${closedLoans.length})` },
              { key: "all", label: `All (${items.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as any)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === key ? "var(--surface-0)" : "transparent",
                  color: statusFilter === key ? "var(--t-ink)" : "var(--t-muted)",
                  boxShadow: statusFilter === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--t-line)",
              background: "var(--surface-0)",
              color: "var(--t-ink)",
              fontSize: 11,
              fontWeight: 700,
              outline: "none",
            }}
          >
            <option value="all">All Types</option>
            {loanTypes.map((t: string) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Owner Filter */}
          {familyProfiles.length > 1 && (
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--t-line)",
                background: "var(--surface-0)",
                color: "var(--t-ink)",
                fontSize: 11,
                fontWeight: 700,
                outline: "none",
              }}
            >
              <option value="all">All Profiles</option>
              {familyProfiles.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--t-line)",
              background: "var(--surface-0)",
              color: "var(--t-ink)",
              fontSize: 11,
              fontWeight: 700,
              outline: "none",
            }}
          >
            <option value="outstanding_desc">Highest Outstanding</option>
            <option value="rate_desc">Highest Interest Rate</option>
            <option value="emi_desc">Highest EMI</option>
            <option value="tenure_asc">Shortest Tenure</option>
            <option value="lender_asc">Lender Name (A-Z)</option>
          </select>
        </div>

        {/* Right: View switcher & Add button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", background: "var(--surface-1)", padding: 2, borderRadius: 8 }}>
            <button
              onClick={() => setViewMode("grid")}
              title="Card View"
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: viewMode === "grid" ? "var(--surface-0)" : "transparent",
                color: viewMode === "grid" ? "var(--t-accent)" : "var(--t-muted)",
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: viewMode === "table" ? "var(--surface-0)" : "transparent",
                color: viewMode === "table" ? "var(--t-accent)" : "var(--t-muted)",
              }}
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={onAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "var(--t-accent)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 12,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--t-accent) 25%, transparent)",
            }}
          >
            <Plus size={14} /> Add Loan Taken
          </button>
        </div>
      </Card>

      {/* Main Content Area */}
      {displayItems.length === 0 ? (
        <Card style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ color: "var(--t-rust)", marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <TrendingDown size={36} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)", marginBottom: 6 }}>
            {items.length === 0 ? "No Loans Recorded Yet" : "No Loans Match Your Filter"}
          </div>
          <div style={{ fontSize: 13, color: "var(--t-muted)", maxWidth: 400, margin: "0 auto 20px" }}>
            {items.length === 0
              ? "Track your home loans, vehicle loans, personal loans, or education loans with live EMI tracking, amortization schedules, and prepayment simulators."
              : "Try adjusting your search keywords or switching filters to view your loans."}
          </div>
          {items.length === 0 ? (
            <button
              onClick={onAdd}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--t-accent)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Add Your First Loan
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
                setOwnerFilter("all");
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--t-line)",
                background: "var(--surface-0)",
                color: "var(--t-ink)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW — 2-Row Architecture when History open:
           Row 1: Selected Loan (50% Left) + Payment History Passbook (50% Right, matched height)
           Row 2: Remaining Loans in a full-width multi-column grid (50%/50% or 33%/33%/33%) so no blank space on right! */
        (() => {
          const resolvedHistoryLoan = historyLoan
            ? displayItems.find((l: any) => l.id === historyLoan.id) || historyLoan
            : null;
          const activeHistoryLoan =
            resolvedHistoryLoan || (displayItems.length === 1 && singlePassbookOpen ? displayItems[0] : null);
          const otherLoans = activeHistoryLoan
            ? displayItems.filter((l: any) => l.id !== activeHistoryLoan.id)
            : [];

          const renderLoanCard = (l: any) => {
              const principal = Number(l.principal) || 0;
              const { outstanding, months } = getReconciledLoanTakenMetrics(l);
              const emi = Number(l.emi) || 0;
              const rate = Number(l.rate ?? l.interestRate) || 0;
              const loanType = l.type || l.loanType || "Personal Loan";
              const dueDay = l.dueDay ?? l.emiDay;
              const isPaidOff = outstanding <= 0;
              const paid = Math.max(0, principal - outstanding);
              const paidPct = principal > 0 ? Math.min(100, (paid / principal) * 100) : 0;

              const payoffDate =
                months > 0
                  ? (() => {
                      const sortedPayments = (l.payments || [])
                        .filter((p: any) => p?.date)
                        .slice()
                        .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
                      const startVal =
                        sortedPayments.length > 0
                          ? sortedPayments[0].date
                          : l.startDate || l.emiStartDate;
                      const d = startVal ? new Date(startVal + "T00:00:00") : new Date();
                      d.setMonth(d.getMonth() + months);
                      return d.toLocaleString("en-IN", { month: "short", year: "numeric" });
                    })()
                  : null;

              const barColor = isPaidOff
                ? "var(--t-sage)"
                : paidPct > 60
                ? "var(--t-sage)"
                : paidPct > 30
                ? "var(--t-gold)"
                : "var(--t-rust)";

              const ownerProfile = familyProfiles.find((p: any) => p.id === l.owner);
              const ownerLabel = ownerProfile ? ownerProfile.name : "Self";

              const paymentsCount = (l.payments || []).length;
              const isSelectedHistory = activeHistoryLoan?.id === l.id;

              return (
                <Card
                  key={l.id}
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderTop: `4px solid ${isPaidOff ? "var(--t-sage)" : "var(--t-rust)"}`,
                    outline: isSelectedHistory ? "2px solid var(--t-accent)" : "none",
                    position: "relative",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    {/* Card Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <BankLogo bankName={l.lender} size={36} />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: isPaidOff ? "var(--t-sage)" : "var(--t-rust)", letterSpacing: "0.06em" }}>
                            {loanType} {l.interestType ? `· ${l.interestType}` : ""}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)", marginTop: 1, lineHeight: 1.2 }}>
                            {l.lender}
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase", marginTop: 2 }}>
                            Profile: {ownerLabel} {l.accountNumber ? `· #${l.accountNumber}` : ""}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {isPaidOff ? (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              color: "var(--t-sage)",
                              background: "color-mix(in srgb, var(--t-sage) 12%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--t-sage) 25%, transparent)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              letterSpacing: "0.05em",
                            }}
                          >
                            PAID OFF
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              color: "var(--t-rust)",
                              background: "color-mix(in srgb, var(--t-rust) 12%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--t-rust) 25%, transparent)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ACTIVE
                          </span>
                        )}

                        {dueDay && !isPaidOff && (
                          <span style={{ fontSize: 9, color: "var(--t-muted)", fontWeight: 700 }}>
                            Due: {dueDay}{loanOrdinalSuffix(Number(dueDay))} / mo
                          </span>
                        )}

                        {(l.startDate || l.emiStartDate) && !isPaidOff && (
                          <span style={{ fontSize: 9, color: "var(--t-muted)", fontWeight: 600 }}>
                            Started: {new Date((l.startDate || l.emiStartDate) + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Outstanding Balance */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)", letterSpacing: "0.05em" }}>
                        Outstanding Debt Balance
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 26,
                          fontWeight: 700,
                          color: isPaidOff ? "var(--t-sage)" : "var(--t-rust)",
                          letterSpacing: "-0.03em",
                          marginTop: 2,
                        }}
                      >
                        <Money value={outstanding} variant="full" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {principal > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--t-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
                          <span>Paid: {fmtINR(paid)}</span>
                          <span style={{ color: barColor, fontWeight: 800 }}>
                            {paidPct.toFixed(1)}% {months > 0 ? `· ${months}m left` : ""}
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: "var(--surface-1)", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(paidPct, 100)}%`,
                              background: `linear-gradient(90deg, ${barColor}, color-mix(in srgb, ${barColor} 65%, white))`,
                              borderRadius: 99,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Financial Metrics Badges */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                      <div style={{ padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 50%, transparent)", border: "1px solid var(--t-line)" }}>
                        <div style={{ fontSize: 9, color: "var(--t-muted)", fontWeight: 700, textTransform: "uppercase" }}>Monthly EMI</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-accent)", marginTop: 1 }}>
                          <Money value={emi} variant="exact" />/mo
                        </div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 50%, transparent)", border: "1px solid var(--t-line)" }}>
                        <div style={{ fontSize: 9, color: "var(--t-muted)", fontWeight: 700, textTransform: "uppercase" }}>Interest Rate</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-ink)", marginTop: 1 }}>
                          {rate ? `${rate}% p.a.` : "0% (Interest-Free)"}
                        </div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 50%, transparent)", border: "1px solid var(--t-line)" }}>
                        <div style={{ fontSize: 9, color: "var(--t-muted)", fontWeight: 700, textTransform: "uppercase" }}>Principal Borrowed</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-ink)", marginTop: 1 }}>
                          <Money value={principal} variant="exact" />
                        </div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 50%, transparent)", border: "1px solid var(--t-line)" }}>
                        <div style={{ fontSize: 9, color: "var(--t-muted)", fontWeight: 700, textTransform: "uppercase" }}>Est. Payoff Date</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: payoffDate || isPaidOff ? "var(--t-sage)" : "var(--t-ink)", marginTop: 1 }}>
                          {isPaidOff ? "Debt Free" : payoffDate || "—"}
                        </div>
                      </div>
                    </div>

                    {l.note && (
                      <div style={{ fontSize: 11, color: "var(--t-muted)", fontStyle: "italic", marginTop: 10, lineHeight: 1.4 }}>
                        "{l.note}"
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--t-line)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Action Tools Row */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {!isPaidOff && (
                        <button
                          onClick={() => setPaymentLoan(l)}
                          style={{
                            flex: "1 1 auto",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "color-mix(in srgb, var(--t-sage) 12%, transparent)",
                            color: "var(--t-sage)",
                            border: "1px solid color-mix(in srgb, var(--t-sage) 25%, transparent)",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          <IndianRupee size={12} /> Pay EMI
                        </button>
                      )}

                      {!isPaidOff && (
                        <button
                          onClick={() => setPrepayLoan(l)}
                          style={{
                            flex: "1 1 auto",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "color-mix(in srgb, var(--t-accent) 10%, transparent)",
                            color: "var(--t-accent)",
                            border: "1px solid color-mix(in srgb, var(--t-accent) 20%, transparent)",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          <Zap size={12} /> Simulate
                        </button>
                      )}

                      <button
                        onClick={() => setAmortizationLoan(l)}
                        style={{
                          flex: "1 1 auto",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: "var(--surface-1)",
                          color: "var(--t-ink)",
                          border: "1px solid var(--t-line)",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        <Calculator size={12} /> Schedule
                      </button>
                    </div>

                    {/* Secondary Actions (History, Edit, Delete) */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                      {paymentsCount > 0 ? (
                        <button
                          onClick={() => {
                            if (displayItems.length === 1) {
                              setSinglePassbookOpen((prev) => !prev);
                              setHistoryLoan(null);
                            } else {
                              setHistoryLoan(isSelectedHistory ? null : l);
                            }
                          }}
                          style={{
                            fontSize: 11,
                            color: "var(--t-accent)",
                            background: isSelectedHistory ? "color-mix(in srgb, var(--t-accent) 12%, transparent)" : "transparent",
                            padding: isSelectedHistory ? "3px 8px" : 0,
                            borderRadius: 6,
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={12} /> Payment History ({paymentsCount})
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--t-muted)" }}>No payments logged yet</span>
                      )}

                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => onEdit(l.id)}
                          title="Edit loan"
                          style={{
                            padding: 5,
                            borderRadius: 6,
                            border: "none",
                            background: "transparent",
                            color: "var(--t-muted)",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteLoan(l)}
                          title="Delete loan"
                          style={{
                            padding: 5,
                            borderRadius: 6,
                            border: "none",
                            background: "transparent",
                            color: "var(--t-rust)",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {activeHistoryLoan ? (
                <>
                  {/* TOP SPOTLIGHT ROW: Selected Loan (Left 50%) + Payment History Passbook (Right 50%) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
                      gap: 18,
                      alignItems: "start",
                    }}
                  >
                    {renderLoanCard(activeHistoryLoan)}
                    <LoanHistoryModal
                      loan={activeHistoryLoan}
                      allLoans={displayItems}
                      onSelectLoan={(targetLoan: any) => setHistoryLoan(targetLoan)}
                      isAutoPreview={!historyLoan && displayItems.length === 1}
                      onClose={() => {
                        if (displayItems.length === 1) {
                          setSinglePassbookOpen(false);
                        }
                        setHistoryLoan(null);
                      }}
                      onRecordPayment={(targetLoan: any) => setPaymentLoan(targetLoan)}
                      onOpenSchedule={(targetLoan: any) => setAmortizationLoan(targetLoan)}
                      onUndoPayment={(undoTarget: any) => {
                        setConfirmUndoPayment(undoTarget);
                      }}
                    />
                  </div>

                  {/* BOTTOM FULL-WIDTH ROW: Remaining Loans in Multi-Column Grid across 100% width */}
                  {otherLoans.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                        gap: 16,
                        alignItems: "stretch",
                      }}
                    >
                      {otherLoans.map((l: any) => renderLoanCard(l))}
                    </div>
                  )}
                </>
              ) : (
                /* DEFAULT FULL-WIDTH MULTI-COLUMN GRID */
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                    gap: 16,
                    alignItems: "stretch",
                  }}
                >
                  {displayItems.map((l: any) => renderLoanCard(l))}
                </div>
              )}
            </div>
          );
        })()
      ) : (
        /* TABLE VIEW */
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--t-line)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Lender & Type
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Profile
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Original Principal
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Outstanding
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Monthly EMI
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Rate (%)
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Tenure Left
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Due Day
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Status
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--t-muted)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((l: any) => {
                  const out = loanOutstanding(l);
                  const isPaidOff = out <= 0;
                  const rateVal = Number(l.rate ?? l.interestRate) || 0;
                  const monthsVal = Number(l.monthsRemaining ?? l.tenureMonths) || 0;
                  const dueDayVal = l.dueDay ?? l.emiDay;
                  const ownerProfile = familyProfiles.find((p: any) => p.id === l.owner);
                  return (
                    <tr key={l.id} style={{ borderBottom: "1px solid var(--t-line)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <BankLogo bankName={l.lender} size={24} />
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--t-ink)" }}>{l.lender}</div>
                            <div style={{ fontSize: 10, color: "var(--t-muted)" }}>{l.type || l.loanType || "Loan"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--t-muted)", fontWeight: 600 }}>
                        {ownerProfile ? ownerProfile.name : "Self"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "var(--t-ink)" }}>
                        <Money value={l.principal} variant="exact" />
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: isPaidOff ? "var(--t-sage)" : "var(--t-rust)" }}>
                        <Money value={out} variant="exact" />
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "var(--t-accent)" }}>
                        <Money value={l.emi} variant="exact" />
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "var(--t-ink)" }}>
                        {rateVal ? `${rateVal}%` : "0%"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "var(--t-ink)", fontWeight: 700 }}>
                        {isPaidOff ? "0m" : `${monthsVal || "—"}m`}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "var(--t-muted)", fontWeight: 600 }}>
                        {dueDayVal ? `${dueDayVal}${loanOrdinalSuffix(Number(dueDayVal))}` : "—"}
                        {(l.startDate || l.emiStartDate) && (
                          <div style={{ fontSize: 9, color: "var(--t-muted)" }}>
                            from {new Date((l.startDate || l.emiStartDate) + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: isPaidOff ? "var(--t-sage)" : "var(--t-rust)",
                            background: `color-mix(in srgb, ${isPaidOff ? "var(--t-sage)" : "var(--t-rust)"} 12%, transparent)`,
                            borderRadius: 6,
                            padding: "2px 6px",
                          }}
                        >
                          {isPaidOff ? "PAID OFF" : "ACTIVE"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          {!isPaidOff && (
                            <button
                              onClick={() => setPaymentLoan(l)}
                              title="Pay EMI"
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid var(--t-line)",
                                background: "var(--surface-0)",
                                color: "var(--t-sage)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => setAmortizationLoan(l)}
                            title="View Amortization"
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid var(--t-line)",
                              background: "var(--surface-0)",
                              color: "var(--t-ink)",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => onEdit(l.id)}
                            title="Edit"
                            style={{
                              padding: "4px 6px",
                              borderRadius: 6,
                              border: "none",
                              background: "transparent",
                              color: "var(--t-muted)",
                              cursor: "pointer",
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteLoan(l)}
                            title="Delete"
                            style={{
                              padding: "4px 6px",
                              borderRadius: 6,
                              border: "none",
                              background: "transparent",
                              color: "var(--t-rust)",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Amortization Schedule Modal */}
      {amortizationLoan && (
        <LoanAmortizationModal loan={amortizationLoan} onClose={() => setAmortizationLoan(null)} />
      )}

      {/* Prepayment Simulation Drawer */}
      {prepayLoan && (
        <LoanPrepaymentDrawer
          loan={prepayLoan}
          onClose={() => setPrepayLoan(null)}
          onApplyPrepayment={async (amt: number) => {
            const nextOutstanding = Math.max(0, loanOutstanding(prepayLoan) - amt);
            await onUpdate(prepayLoan.id, {
              outstanding: nextOutstanding,
              status: nextOutstanding === 0 ? "closed" : prepayLoan.status,
            });
          }}
        />
      )}

      {/* Payment Recording Modal */}
      {paymentLoan && (() => {
        const rawPaymentLoan = items.find((item: any) => item.id === paymentLoan.id) || paymentLoan;
        const reconciledMetrics = getReconciledLoanTakenMetrics(rawPaymentLoan);
        const activePaymentLoan = {
          ...rawPaymentLoan,
          outstanding: reconciledMetrics.outstanding,
          monthsRemaining: reconciledMetrics.months,
        };
        return (
          <LoanPaymentModal
            loan={activePaymentLoan}
            type="taken"
            bankAccounts={bankAccounts}
            onClose={() => setPaymentLoan(null)}
            onSavePayment={async (_record: any, patch: any, bankTxn?: any) => {
              const targetId = activePaymentLoan.id;
              // Automatically reveal and focus the passbook so the user immediately sees the new EMI entry & reduced balance
              setSinglePassbookOpen(true);
              if (displayItems.length > 1 || historyLoan) {
                setHistoryLoan({ ...activePaymentLoan, ...patch });
              }
              const updatePromise = Promise.resolve(onUpdate(targetId, patch));
              const txnPromise =
                bankTxn && onAddTransaction
                  ? Promise.resolve(onAddTransaction(bankTxn))
                  : Promise.resolve();
              // Close the modal immediately (optimistic local state is already updated synchronously)
              setPaymentLoan(null);
              await Promise.all([updatePromise, txnPromise]);
            }}
          />
        );
      })()}

      {/* Payment History Modal (Rendered below only when in Table View; Grid View renders side-by-side) */}
      {historyLoan && viewMode === "table" && (
        <LoanHistoryModal
          loan={historyLoan}
          onClose={() => setHistoryLoan(null)}
          onRecordPayment={(targetLoan: any) => setPaymentLoan(targetLoan)}
          onOpenSchedule={(targetLoan: any) => setAmortizationLoan(targetLoan)}
          onUndoPayment={(undoTarget: any) => {
            setConfirmUndoPayment(undoTarget);
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteLoan && (
        <ConfirmDialog
          message={`Delete loan "${confirmDeleteLoan.lender || "this loan"}" (${confirmDeleteLoan.type || "Loan"})? This cannot be undone.`}
          onConfirm={() => {
            onRemove(confirmDeleteLoan.id);
            setConfirmDeleteLoan(null);
          }}
          onCancel={() => setConfirmDeleteLoan(null)}
        />
      )}

      {/* Confirm Undo Payment Dialog */}
      {confirmUndoPayment && (
        <ConfirmDialog
          message="Undo this payment? The amount will be added back to the loan's outstanding debt."
          confirmLabel="Yes, undo payment"
          onConfirm={async () => {
            await onUpdate(confirmUndoPayment.loanId, {
              payments: confirmUndoPayment.updatedPayments,
              outstanding: confirmUndoPayment.restoredBalance,
              ...(confirmUndoPayment.restoredMonths !== undefined
                ? { monthsRemaining: confirmUndoPayment.restoredMonths }
                : {}),
              status: confirmUndoPayment.restoredBalance > 0 ? "active" : undefined,
            });
            setConfirmUndoPayment(null);
          }}
          onCancel={() => setConfirmUndoPayment(null)}
        />
      )}
    </div>
  );
}

// Payment History & Repayment Passbook Companion sub-component
function LoanHistoryModal({
  loan,
  allLoans = [],
  onSelectLoan,
  isAutoPreview,
  onClose,
  onRecordPayment,
  onOpenSchedule,
  onUndoPayment,
}: any) {
  const payments: any[] = loan.payments || [];
  const { outstanding, months } = getReconciledLoanTakenMetrics(loan);
  const principal = Number(loan.principal) || 0;
  const totalPaidLogged = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const isPaidOff = outstanding <= 0;

  return (
    <Card
      style={{
        padding: "18px 20px",
        borderTop: "4px solid var(--t-accent)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Focused Multi-Loan Quick Switcher & Back Bar */}
      {!isAutoPreview && allLoans.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            paddingBottom: 12,
            borderBottom: "1px solid var(--t-line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid var(--t-line)",
                background: "var(--surface-1)",
                color: "var(--t-ink)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              ← All Loans ({allLoans.length})
            </button>
            <span style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600, margin: "0 2px" }}>|</span>
            {allLoans.map((item: any) => {
              const active = item.id === loan.id;
              const count = (item.payments || []).length;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectLoan && onSelectLoan(item)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    border: active ? "1px solid var(--t-accent)" : "1px solid var(--t-line)",
                    background: active ? "color-mix(in srgb, var(--t-accent) 12%, transparent)" : "var(--surface-0)",
                    color: active ? "var(--t-accent)" : "var(--t-muted)",
                    cursor: "pointer",
                  }}
                >
                  {item.lender} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--t-accent)", letterSpacing: "0.06em" }}>
            Repayment Ledger & Passbook
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "var(--t-ink)", marginTop: 2 }}>
            Payment History — {loan.lender || "Loan"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isPaidOff && onRecordPayment && (
            <button
              onClick={() => onRecordPayment(loan)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid color-mix(in srgb, var(--t-sage) 30%, transparent)",
                background: "color-mix(in srgb, var(--t-sage) 12%, transparent)",
                color: "var(--t-sage)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Plus size={12} /> Log EMI
            </button>
          )}
          {onOpenSchedule && (
            <button
              onClick={() => onOpenSchedule(loan)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid var(--t-line)",
                background: "var(--surface-1)",
                color: "var(--t-ink)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Calculator size={12} /> Schedule
            </button>
          )}
          {!isAutoPreview && (
            <button
              onClick={onClose}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid var(--t-line)",
                background: "transparent",
                color: "var(--t-muted)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Mini Passbook Summary Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 10,
          background: "color-mix(in srgb, var(--surface-1) 60%, transparent)",
          border: "1px solid var(--t-line)",
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
            Logged Payments
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--t-ink)", marginTop: 2 }}>
            {payments.length} Installment{payments.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
            Total Logged Paid
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--t-sage)", marginTop: 2 }}>
            <Money value={totalPaidLogged || Math.max(0, principal - outstanding)} variant="exact" />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
            Balance Remaining
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: isPaidOff ? "var(--t-sage)" : "var(--t-rust)", marginTop: 2 }}>
            <Money value={outstanding} variant="exact" />
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div
          style={{
            padding: "28px 16px",
            textAlign: "center",
            color: "var(--t-muted)",
            fontSize: 12,
            borderRadius: 10,
            border: "1px dashed var(--t-line)",
            background: "color-mix(in srgb, var(--surface-1) 30%, transparent)",
          }}
        >
          No payments recorded yet for this loan. Click <strong>Pay EMI</strong> to log your first installment and sync with your bank account.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 248, overflowY: "auto", paddingRight: 2 }}>
          {payments
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((p, idx) => (
              <div
                key={p.id || idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--surface-1)",
                  border: "1px solid var(--t-line)",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "color-mix(in srgb, var(--t-sage) 14%, transparent)",
                      color: "var(--t-sage)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    #{payments.length - idx}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--t-sage)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Money value={p.amount} variant="exact" />
                      <span
                        style={{
                          fontSize: 9.5,
                          color: "var(--t-ink)",
                          background: "var(--surface-0)",
                          border: "1px solid var(--t-line)",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {p.type === "prepayment" ? "Part Prepayment" : p.mode || "EMI Payment"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.date} {p.reference || p.referenceNumber ? `· Ref: ${p.reference || p.referenceNumber}` : ""} {p.note ? `· ${p.note}` : ""}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onUndoPayment({
                      loanId: loan.id,
                      updatedPayments: payments.filter((x) => x.id !== p.id),
                      restoredBalance: outstanding + Number(p.principalPortion ?? p.amount ?? 0),
                      restoredMonths: months + (p.type === "prepayment" ? 0 : 1),
                    })
                  }
                  title="Undo this payment"
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    color: "var(--t-rust)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
