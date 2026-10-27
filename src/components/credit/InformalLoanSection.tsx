/* eslint-disable */
import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Wallet,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Columns,
  MessageSquare,
  Sparkles,
  Zap,
  Clock,
  User,
  Phone,
  Tag,
  Share2,
  Calendar,
  IndianRupee,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  X,
  History,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINR, fmtINRFull, fmtINRExact, today } from "../../utils/finance";
import { useMasterData } from "../../utils/masterData";
import { StatCard } from "../ui/StatCard";
import { Card } from "../ui/Card";
import { Money } from "../ui/Money";
import { ConfirmDialog } from "../ui/Feedback";
import { InformalPersonModal } from "./InformalPersonModal";
import { InformalTrancheModal } from "./InformalTrancheModal";
import { InformalPaymentModal } from "./InformalPaymentModal";
import { InformalStatementModal } from "./InformalStatementModal";

const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    ["#3b82f6", "#60a5fa"], // Blue
    ["#7c3aed", "#a78bfa"], // Violet
    ["#059669", "#34d399"], // Emerald
    ["#d97706", "#fbbf24"], // Amber
    ["#2563eb", "#60a5fa"], // Indigo
    ["#0d9488", "#5eead4"], // Teal
    ["#dc2626", "#f87171"], // Red
  ];
  const idx = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]} 0%, ${colors[idx][1]} 100%)`;
};

const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Family",
  "Relative",
  "Colleague",
  "Business Partner",
  "Neighbor",
  "Other",
];

interface InformalLoanSectionProps {
  direction: "borrowed" | "lent";
  items?: any[];
  bankAccounts?: any[];
  otherDirectionItems?: any[];
  onDirectionChange?: (newDirection: "borrowed" | "lent") => void;
  onAddPerson: (v: any) => Promise<void> | void;
  onUpdate: (id: string, patch: any) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onAddTransaction?: (txn: any) => Promise<void> | void;
  onEdit?: (id: string) => void;
}

export function InformalLoanSection({
  direction: controlledDirection,
  items = [],
  bankAccounts = [],
  otherDirectionItems = [],
  onDirectionChange,
  onAddPerson,
  onUpdate,
  onRemove,
  onAddTransaction,
  onEdit,
}: InformalLoanSectionProps) {
  const { familyProfiles } = useMasterData();
  const [internalDirection, setInternalDirection] = useState<"borrowed" | "lent">(controlledDirection);

  // Sync internal state if controlled prop changes
  React.useEffect(() => {
    setInternalDirection(controlledDirection);
  }, [controlledDirection]);

  const activeDirection = onDirectionChange ? controlledDirection : internalDirection;
  const isBorrowed = activeDirection === "borrowed";
  const personLabel = isBorrowed ? "Lender" : "Borrower";
  const otherLabel = isBorrowed ? "Borrower" : "Lender";
  const accentColor = isBorrowed ? "var(--t-rust)" : "var(--t-accent)";
  const now = new Date();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "overdue" | "settled" | "overpaid">("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "overdue_first" | "due_soon" | "outstanding_desc" | "recent_activity" | "name_asc"
  >("overdue_first");
  const [viewMode, setViewMode] = useState<"grid" | "split" | "table">("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Modals
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [editPersonTarget, setEditPersonTarget] = useState<any | null>(null);
  const [trancheTarget, setTrancheTarget] = useState<any | null>(null);
  const [editTrancheTarget, setEditTrancheTarget] = useState<{ person: any; tranche: any } | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);
  const [editPaymentTarget, setEditPaymentTarget] = useState<{ person: any; payment: any } | null>(null);
  const [statementTarget, setStatementTarget] = useState<any | null>(null);
  const [confirmDeletePerson, setConfirmDeletePerson] = useState<any | null>(null);
  const [confirmDeleteTranche, setConfirmDeleteTranche] = useState<any | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<any | null>(null);

  // Enriched Person Data
  const enrichList = (rawItems: any[]) => {
    return rawItems.map((person: any) => {
      const name = person.person || person.name || "Unknown";
      let tranches: any[] = person.tranches || [];
      let payments: any[] = person.payments || [];

      // Backward compatibility fallback for legacy items with no tranches array
      if (tranches.length === 0 && Number(person.amount || 0) > 0) {
        tranches = [
          {
            id: `legacy-${person.id}`,
            amount: Number(person.amount),
            date: person.date || today(),
            note: "Principal Amount",
          },
        ];
      }

      const totalT = tranches.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const totalP = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const outstanding = totalT - totalP;
      const hasActivity = totalT > 0 || totalP > 0;
      const settled = hasActivity && outstanding <= 0;
      const overpaid = outstanding < 0;

      // Find earliest pending due date
      const nextDueDate = tranches
        .map((t: any) => t.dueDate)
        .filter(Boolean)
        .sort()[0];
      const dueDateObj = nextDueDate ? new Date(nextDueDate + "T00:00:00") : null;
      const isOverdue = !settled && !overpaid && !!dueDateObj && dueDateObj < now;
      const daysOverdue = isOverdue
        ? Math.floor((now.getTime() - dueDateObj!.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Most recent activity date
      const allDates = [
        ...tranches.map((t: any) => t.date),
        ...payments.map((p: any) => p.date),
      ].filter(Boolean);
      const lastActivityDate = allDates.sort().reverse()[0] || person.date || "";

      const ownerProfile = familyProfiles.find((x: any) => x.id === person.owner);
      const ownerLabel = ownerProfile ? ownerProfile.name : "Self";

      return {
        person,
        id: person.id,
        name,
        relationship: person.relationship || "Friend",
        phone: person.phone || "",
        note: person.note || "",
        owner: person.owner || "self",
        ownerLabel,
        tranches,
        payments,
        totalT,
        totalP,
        outstanding,
        settled,
        overpaid,
        nextDueDate,
        dueDateObj,
        isOverdue,
        daysOverdue,
        lastActivityDate,
      };
    });
  };

  const enrichedItems = useMemo(() => enrichList(items), [items, familyProfiles]);
  const otherEnrichedItems = useMemo(() => enrichList(otherDirectionItems), [otherDirectionItems, familyProfiles]);

  // Aggregated KPIs for Active Direction
  const totalBorrowed = enrichedItems.reduce((s, p) => s + p.totalT, 0);
  const totalPaid = enrichedItems.reduce((s, p) => s + p.totalP, 0);
  const totalOutstanding = Math.max(0, totalBorrowed - totalPaid);
  const overdueItems = enrichedItems.filter((x) => x.isOverdue);
  const overdueCount = overdueItems.length;
  const overdueAmount = overdueItems.reduce((s, x) => s + Math.max(0, x.outstanding), 0);
  const settlementRate = totalBorrowed > 0 ? (totalPaid / totalBorrowed) * 100 : 0;
  const activeCount = enrichedItems.filter((x) => x.outstanding > 0).length;
  const settledCount = enrichedItems.filter((x) => x.settled && !x.overpaid).length;
  const overpaidCount = enrichedItems.filter((x) => x.overpaid).length;

  // Other Direction Totals for Consolidated View
  const otherTotalBorrowed = otherEnrichedItems.reduce((s, p) => s + p.totalT, 0);
  const otherTotalPaid = otherEnrichedItems.reduce((s, p) => s + p.totalP, 0);
  const otherTotalOutstanding = Math.max(0, otherTotalBorrowed - otherTotalPaid);

  // Consolidated Net Informal Position: (Lent - Borrowed)
  // If positive -> Net Creditor (you are owed net)
  // If negative -> Net Debtor (you owe net)
  const netInformalPosition = isBorrowed
    ? otherTotalOutstanding - totalOutstanding
    : totalOutstanding - otherTotalOutstanding;

  // Filtered & Sorted Display Items
  const filteredItems = useMemo(() => {
    let list = [...enrichedItems];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.relationship.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.note.toLowerCase().includes(q) ||
          item.tranches.some((t: any) => (t.note || "").toLowerCase().includes(q)) ||
          item.payments.some((p: any) => (p.note || "").toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((item) => item.outstanding > 0);
    } else if (statusFilter === "overdue") {
      list = list.filter((item) => item.isOverdue);
    } else if (statusFilter === "settled") {
      list = list.filter((item) => item.settled && !item.overpaid);
    } else if (statusFilter === "overpaid") {
      list = list.filter((item) => item.overpaid);
    }

    // Owner filter
    if (ownerFilter !== "all") {
      list = list.filter((item) => item.owner === ownerFilter);
    }

    // Relationship filter
    if (relationshipFilter !== "all") {
      list = list.filter((item) => item.relationship.toLowerCase() === relationshipFilter.toLowerCase());
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "overdue_first") {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return b.outstanding - a.outstanding;
      }
      if (sortBy === "due_soon") {
        if (!a.nextDueDate) return 1;
        if (!b.nextDueDate) return -1;
        return a.nextDueDate.localeCompare(b.nextDueDate);
      }
      if (sortBy === "outstanding_desc") {
        return b.outstanding - a.outstanding;
      }
      if (sortBy === "recent_activity") {
        return (b.lastActivityDate || "").localeCompare(a.lastActivityDate || "");
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });

    return list;
  }, [enrichedItems, searchQuery, statusFilter, ownerFilter, relationshipFilter, sortBy]);

  // Default selected person for Split View
  const selectedItem = useMemo(() => {
    if (selectedPersonId) {
      const found = filteredItems.find((x) => x.id === selectedPersonId);
      if (found) return found;
    }
    return filteredItems[0] || null;
  }, [filteredItems, selectedPersonId]);

  const handleDirectionSwitch = (newDir: "borrowed" | "lent") => {
    if (newDir === activeDirection) return;
    if (onDirectionChange) {
      onDirectionChange(newDir);
    } else {
      setInternalDirection(newDir);
    }
    setExpandedId(null);
    setSelectedPersonId(null);
  };

  const fmtD = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* ── 0. High-Level Direction Switcher & Consolidated Net Financial Position ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "10px 14px",
          background: "color-mix(in srgb, var(--surface-1) 40%, transparent)",
          borderRadius: 12,
          border: "1px solid var(--t-line)",
          marginBottom: 16,
        }}
      >
        {/* Seamless Direction Switcher Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleDirectionSwitch("borrowed")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${
                isBorrowed ? "var(--t-rust)" : "color-mix(in srgb, var(--t-line) 80%, transparent)"
              }`,
              background: isBorrowed
                ? "color-mix(in srgb, var(--t-rust) 14%, var(--surface-0))"
                : "transparent",
              color: isBorrowed ? "var(--t-rust)" : "var(--t-muted)",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ArrowDownLeft size={16} />
            <span>From People (Borrowed)</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 12,
                background: isBorrowed ? "var(--t-rust)" : "color-mix(in srgb, var(--surface-1) 80%, transparent)",
                color: isBorrowed ? "#fff" : "var(--t-muted)",
              }}
            >
              {isBorrowed ? enrichedItems.length : otherEnrichedItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDirectionSwitch("lent")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${
                !isBorrowed ? "var(--t-accent)" : "color-mix(in srgb, var(--t-line) 80%, transparent)"
              }`,
              background: !isBorrowed
                ? "color-mix(in srgb, var(--t-accent) 14%, var(--surface-0))"
                : "transparent",
              color: !isBorrowed ? "var(--t-accent)" : "var(--t-muted)",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ArrowUpRight size={16} />
            <span>To People (Lent)</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 12,
                background: !isBorrowed ? "var(--t-accent)" : "color-mix(in srgb, var(--surface-1) 80%, transparent)",
                color: !isBorrowed ? "#fff" : "var(--t-muted)",
              }}
            >
              {!isBorrowed ? enrichedItems.length : otherEnrichedItems.length}
            </span>
          </button>
        </div>

        {/* Consolidated Net Financial Position Badge */}
        {(otherDirectionItems.length > 0 || items.length > 0) && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--t-card-bg)",
              border: "1px solid var(--t-line)",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--t-muted)", fontWeight: 600 }}>Net Position:</span>
            {netInformalPosition > 0 ? (
              <span style={{ color: "var(--t-sage)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} /> You are Net Creditor (+₹{fmtINR(netInformalPosition)})
              </span>
            ) : netInformalPosition < 0 ? (
              <span style={{ color: "var(--t-rust)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={13} /> You are Net Debtor (-₹{fmtINR(Math.abs(netInformalPosition))})
              </span>
            ) : (
              <span style={{ color: "var(--t-muted)", fontWeight: 700 }}>
                Balanced (₹0 Net)
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 1. Executive Analytics / Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard
          label={isBorrowed ? "Total Borrowed" : "Total Lent"}
          value={fmtINRFull(totalBorrowed)}
          numericValue={totalBorrowed}
          formatValue={fmtINRFull}
          sub={`${enrichedItems.length} total ${isBorrowed ? "lenders" : "borrowers"}`}
          color={isBorrowed ? THEME.rust : THEME.accent}
          icon={isBorrowed ? <TrendingDown /> : <TrendingUp />}
        />
        <StatCard
          label={isBorrowed ? "Total Repaid" : "Total Received"}
          value={fmtINRFull(totalPaid)}
          numericValue={totalPaid}
          formatValue={fmtINRFull}
          sub={`${settlementRate.toFixed(0)}% recovery rate`}
          color={THEME.sage}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Net Outstanding"
          value={fmtINRFull(totalOutstanding)}
          numericValue={totalOutstanding}
          formatValue={fmtINRFull}
          sub={totalOutstanding > 0 ? `${activeCount} pending accounts` : "All accounts settled"}
          color={totalOutstanding > 0 ? accentColor : THEME.sage}
          icon={<Wallet />}
        />
        <StatCard
          label="Overdue Follow-ups"
          value={String(overdueCount)}
          numericValue={overdueCount}
          formatValue={(n) => String(Math.round(n))}
          sub={overdueCount > 0 ? `₹${fmtINR(overdueAmount)} at risk` : "All on schedule"}
          color={overdueCount > 0 ? THEME.rust : THEME.sage}
          icon={<AlertCircle />}
        />
      </div>

      {/* ── 2. Control Toolbar: Search, Filters, View Modes & Add CTA ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          background: "var(--t-card-bg)",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--t-line)",
        }}
      >
        {/* Left side: Search & Status Filter Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, flex: "1 1 380px" }}>
          <div style={{ position: "relative", minWidth: 200, flex: "1 1 200px" }}>
            <input
              style={{
                width: "100%",
                padding: "8px 32px 8px 34px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--t-line)",
                background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                color: "var(--t-ink)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder={`Search ${personLabel.toLowerCase()}s, notes, phone...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--t-muted)",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--t-muted)",
                  cursor: "pointer",
                  padding: 3,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All", count: enrichedItems.length },
              { id: "active", label: "Active", count: activeCount },
              { id: "overdue", label: "Overdue", count: overdueCount, highlight: overdueCount > 0 },
              { id: "settled", label: "Settled", count: settledCount },
              ...(overpaidCount > 0
                ? [{ id: "overpaid", label: "Overpaid", count: overpaidCount, highlight: true }]
                : []),
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor:
                    statusFilter === st.id
                      ? "var(--t-accent)"
                      : st.highlight
                      ? "color-mix(in srgb, var(--t-rust) 40%, transparent)"
                      : "var(--t-line)",
                  background:
                    statusFilter === st.id
                      ? "color-mix(in srgb, var(--t-accent) 15%, transparent)"
                      : "transparent",
                  color:
                    statusFilter === st.id
                      ? "var(--t-accent)"
                      : st.highlight
                      ? "var(--t-rust)"
                      : "var(--t-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.15s ease",
                }}
              >
                <span>{st.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 5px",
                    borderRadius: 10,
                    background:
                      statusFilter === st.id
                        ? "var(--t-accent)"
                        : "color-mix(in srgb, var(--surface-1) 80%, transparent)",
                    color: statusFilter === st.id ? "#fff" : "var(--t-muted)",
                  }}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Relationship, Owner filter, Sorting, View Switcher & Add Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Relationship Filter */}
          <select
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--t-line)",
              background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
              color: "var(--t-ink)",
              fontSize: 12,
              outline: "none",
            }}
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
          >
            <option value="all">All Relationships</option>
            {RELATIONSHIP_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Owner Filter */}
          {familyProfiles.length > 1 && (
            <select
              style={{
                padding: "7px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--t-line)",
                background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                color: "var(--t-ink)",
                fontSize: 12,
                outline: "none",
              }}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="all">All Profiles</option>
              {familyProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort selector */}
          <select
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--t-line)",
              background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
              color: "var(--t-ink)",
              fontSize: 12,
              outline: "none",
            }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="overdue_first">Priority: Overdue First</option>
            <option value="due_soon">Repayment: Due Soonest</option>
            <option value="outstanding_desc">Amount: Highest Outstanding</option>
            <option value="recent_activity">Activity: Most Recent</option>
            <option value="name_asc">Name: Alphabetical A-Z</option>
          </select>

          {/* View Mode Toggle: Grid, Split Widescreen, Dense Table */}
          <div
            style={{
              display: "flex",
              background: "color-mix(in srgb, var(--surface-1) 70%, transparent)",
              padding: 2,
              borderRadius: 8,
              border: "1px solid var(--t-line)",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: viewMode === "grid" ? "var(--t-card-bg)" : "transparent",
                color: viewMode === "grid" ? "var(--t-accent)" : "var(--t-muted)",
                boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: viewMode === "split" ? "var(--t-card-bg)" : "transparent",
                color: viewMode === "split" ? "var(--t-accent)" : "var(--t-muted)",
                boxShadow: viewMode === "split" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
              }}
              title="Split Master-Detail View"
            >
              <Columns size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: viewMode === "table" ? "var(--t-card-bg)" : "transparent",
                color: viewMode === "table" ? "var(--t-accent)" : "var(--t-muted)",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
              }}
              title="Table Ledger View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Add Person CTA */}
          <button
            type="button"
            onClick={() => setAddPersonOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: isBorrowed ? "var(--t-rust)" : "var(--t-accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <Plus size={15} /> Add {personLabel}
          </button>
        </div>
      </div>

      {/* ── 3. Content Area: Empty State or Active View Mode ── */}
      {enrichedItems.length === 0 ? (
        <Card style={{ padding: "48px 32px", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 16px",
              background: isBorrowed
                ? "color-mix(in srgb, var(--t-rust) 12%, transparent)"
                : "color-mix(in srgb, var(--t-accent) 12%, transparent)",
              color: isBorrowed ? "var(--t-rust)" : "var(--t-accent)",
            }}
          >
            {isBorrowed ? <TrendingDown size={32} /> : <TrendingUp size={32} />}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginBottom: 6 }}>
            {isBorrowed ? "No Borrowings Recorded Yet" : "No Personal Loans Given Yet"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--t-muted)",
              maxWidth: 420,
              margin: "0 auto 18px",
              lineHeight: 1.6,
            }}
          >
            {isBorrowed
              ? "Track informal loans and borrowings from friends or family members. Log multiple installments, record repayments with bank sync, and view itemized statements."
              : "Track personal money lent to friends, relatives, or colleagues. Monitor repayment due dates, generate WhatsApp statements, and log settlements."}
          </div>
          <button
            type="button"
            onClick={() => setAddPersonOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: isBorrowed ? "var(--t-rust)" : "var(--t-accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add First {personLabel}
          </button>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card style={{ padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t-ink)", marginBottom: 4 }}>
            No matches found
          </div>
          <div style={{ fontSize: 13, color: "var(--t-muted)", marginBottom: 14 }}>
            Try adjusting your search query or status filter to see other records.
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setOwnerFilter("all");
              setRelationshipFilter("all");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--t-line)",
              background: "var(--t-card-bg)",
              color: "var(--t-ink)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        </Card>
      ) : viewMode === "grid" ? (
        /* ── 4A. Rich Cards Grid View ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const progressPct = item.totalT > 0 ? Math.min(100, (item.totalP / item.totalT) * 100) : 0;
            const avatarGradient = getAvatarGradient(item.name);
            const firstLetter = item.name.charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                className="card-lift"
                style={{
                  background: "var(--t-card-bg)",
                  borderRadius: 14,
                  border: `1px solid ${
                    item.isOverdue
                      ? "color-mix(in srgb, var(--t-rust) 40%, transparent)"
                      : item.settled && !item.overpaid
                      ? "color-mix(in srgb, var(--t-sage) 30%, transparent)"
                      : "var(--t-line)"
                  }`,
                  overflow: "hidden",
                  boxShadow: item.isOverdue ? "0 4px 12px rgba(239,68,68,0.06)" : "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Card Header */}
                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--t-line)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: avatarGradient,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        {firstLetter}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)" }}>
                            {item.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "color-mix(in srgb, var(--surface-1) 80%, transparent)",
                              color: "var(--t-muted)",
                              border: "1px solid var(--t-line)",
                            }}
                          >
                            {item.relationship}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--t-muted)",
                            marginTop: 3,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span>{item.ownerLabel}</span>
                          {item.phone && (
                            <>
                              <span>•</span>
                              <a
                                href={`tel:${item.phone}`}
                                style={{
                                  color: "var(--t-accent)",
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Phone size={10} /> {item.phone}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {item.overpaid ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "var(--t-gold)",
                            background: "color-mix(in srgb, var(--t-gold) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--t-gold) 25%, transparent)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          OVERPAID
                        </span>
                      ) : item.settled ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "var(--t-sage)",
                            background: "color-mix(in srgb, var(--t-sage) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--t-sage) 25%, transparent)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          SETTLED ✓
                        </span>
                      ) : item.isOverdue ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#fff",
                            background: "var(--t-rust)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {item.daysOverdue}D OVERDUE
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "var(--t-accent)",
                            background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--t-accent) 25%, transparent)",
                            borderRadius: 6,
                            padding: "3px 8px",
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {item.note && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--t-muted)",
                        marginTop: 10,
                        fontStyle: "italic",
                        background: "color-mix(in srgb, var(--surface-1) 40%, transparent)",
                        padding: "6px 10px",
                        borderRadius: 6,
                      }}
                    >
                      "{item.note}"
                    </div>
                  )}
                </div>

                {/* Financial Summary & Progress */}
                <div style={{ padding: "16px 18px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
                        {item.overpaid ? "Overpaid Amount" : "Outstanding Balance"}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 22,
                          fontWeight: 900,
                          color: item.overpaid
                            ? "var(--t-gold)"
                            : item.settled
                            ? "var(--t-sage)"
                            : accentColor,
                          fontVariantNumeric: "tabular-nums",
                          marginTop: 2,
                        }}
                      >
                        <Money value={Math.abs(item.outstanding)} variant="full" />
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
                        {isBorrowed ? "Repaid / Borrowed" : "Received / Lent"}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-ink)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                        ₹{fmtINR(item.totalP)} / ₹{fmtINR(item.totalT)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: "var(--t-muted)", marginBottom: 4 }}>
                      <span>Settlement Progress</span>
                      <span style={{ color: item.settled ? "var(--t-sage)" : accentColor, fontWeight: 800 }}>
                        {progressPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: 6, borderRadius: 99 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${progressPct}%`,
                          background: item.settled ? "var(--t-sage)" : accentColor,
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>

                  {/* Due Date & Activity Details */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      color: "var(--t-muted)",
                      background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                      padding: "8px 12px",
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} />
                      {item.nextDueDate ? `Due ${fmtD(item.nextDueDate)}` : "No target due date"}
                    </span>
                    <span>
                      {item.tranches.length} {item.tranches.length === 1 ? "loan" : "loans"} · {item.payments.length} {item.payments.length === 1 ? "payment" : "payments"}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    padding: "10px 14px",
                    background: "color-mix(in srgb, var(--surface-1) 30%, transparent)",
                    borderTop: "1px solid var(--t-line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.outstanding > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentTarget(item.person)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: "var(--t-sage)",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title={isBorrowed ? "Record repayment made" : "Record payment received"}
                      >
                        <Zap size={12} /> Pay
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setTrancheTarget(item.person)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--t-line)",
                        background: "var(--t-card-bg)",
                        color: "var(--t-ink)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      title={isBorrowed ? "Add another borrowing entry" : "Add another loan entry"}
                    >
                      <Plus size={12} /> {isBorrowed ? "Borrow" : "Loan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatementTarget(item.person)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--t-line)",
                        background: "var(--t-card-bg)",
                        color: "var(--t-ink)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      title="Generate WhatsApp / SMS Statement"
                    >
                      <MessageSquare size={12} /> Share
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => (onEdit ? onEdit(item.id) : setEditPersonTarget(item.person))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid var(--t-line)",
                        background: "transparent",
                        color: "var(--t-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title="Edit person details"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePerson(item.person)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        background: "rgba(239, 68, 68, 0.08)",
                        color: "var(--t-rust)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title="Delete person and all history"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid var(--t-line)",
                        background: isExpanded ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "transparent",
                        color: isExpanded ? "var(--t-accent)" : "var(--t-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title="View Ledger & Transaction History"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Ledger Section */}
                {isExpanded && (
                  <ExpandedLedgerView
                    isBorrowed={isBorrowed}
                    item={item}
                    accentColor={accentColor}
                    bankAccounts={bankAccounts}
                    onAddTranche={() => setTrancheTarget(item.person)}
                    onEditTranche={(t: any) => setEditTrancheTarget({ person: item.person, tranche: t })}
                    onDeleteTranche={(t: any) =>
                      setConfirmDeleteTranche({
                        personId: item.id,
                        updated: item.tranches.filter((x: any) => x.id !== t.id),
                      })
                    }
                    onAddPayment={() => setPaymentTarget(item.person)}
                    onEditPayment={(p: any) => setEditPaymentTarget({ person: item.person, payment: p })}
                    onDeletePayment={(p: any) =>
                      setConfirmDeletePayment({
                        personId: item.id,
                        updated: item.payments.filter((x: any) => x.id !== p.id),
                      })
                    }
                    onSettleFull={() => setPaymentTarget(item.person)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === "split" ? (
        /* ── 4B. Widescreen Split Master-Detail Layout ── */
        <div className="informal-split-layout">
          {/* Left Column: Master List of Parties */}
          <div
            style={{
              background: "var(--t-card-bg)",
              borderRadius: 14,
              border: "1px solid var(--t-line)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "820px",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--t-line)",
                background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--t-muted)", letterSpacing: "0.05em" }}>
                {personLabel}s ({filteredItems.length})
              </span>
              <span style={{ fontSize: 11, color: "var(--t-muted)" }}>
                Total: ₹{fmtINR(totalOutstanding)}
              </span>
            </div>

            <div style={{ overflowY: "auto", flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const avatarGradient = getAvatarGradient(item.name);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPersonId(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? "var(--t-accent)" : "transparent"}`,
                      background: isSelected
                        ? "color-mix(in srgb, var(--t-accent) 12%, var(--surface-0))"
                        : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: avatarGradient,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: isSelected ? "var(--t-accent)" : "var(--t-ink)",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                          {item.relationship}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          fontVariantNumeric: "tabular-nums",
                          color: item.overpaid
                            ? "var(--t-gold)"
                            : item.settled
                            ? "var(--t-sage)"
                            : accentColor,
                        }}
                      >
                        ₹{fmtINR(Math.abs(item.outstanding))}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                        {item.overpaid ? (
                          <span style={{ color: "var(--t-gold)" }}>OVERPAID</span>
                        ) : item.settled ? (
                          <span style={{ color: "var(--t-sage)" }}>SETTLED ✓</span>
                        ) : item.isOverdue ? (
                          <span style={{ color: "var(--t-rust)" }}>{item.daysOverdue}D DUE</span>
                        ) : (
                          <span style={{ color: "var(--t-muted)" }}>ACTIVE</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Comprehensive Detail Dossier & Timeline */}
          {selectedItem && (
            <div
              style={{
                background: "var(--t-card-bg)",
                borderRadius: 14,
                border: "1px solid var(--t-line)",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* Detail Header Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 14,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--t-line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: getAvatarGradient(selectedItem.name),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 800,
                      boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                    }}
                  >
                    {selectedItem.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "var(--t-ink)" }}>
                        {selectedItem.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "color-mix(in srgb, var(--surface-1) 80%, transparent)",
                          color: "var(--t-muted)",
                          border: "1px solid var(--t-line)",
                        }}
                      >
                        {selectedItem.relationship}
                      </span>
                      {selectedItem.overpaid ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-gold)", background: "color-mix(in srgb, var(--t-gold) 12%, transparent)", padding: "3px 8px", borderRadius: 6 }}>
                          OVERPAID
                        </span>
                      ) : selectedItem.settled ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-sage)", background: "color-mix(in srgb, var(--t-sage) 12%, transparent)", padding: "3px 8px", borderRadius: 6 }}>
                          SETTLED ✓
                        </span>
                      ) : selectedItem.isOverdue ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--t-rust)", padding: "3px 8px", borderRadius: 6 }}>
                          {selectedItem.daysOverdue}D OVERDUE
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-accent)", background: "color-mix(in srgb, var(--t-accent) 12%, transparent)", padding: "3px 8px", borderRadius: 6 }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span>Profile: <strong>{selectedItem.ownerLabel}</strong></span>
                      {selectedItem.phone && (
                        <>
                          <span>•</span>
                          <a
                            href={`tel:${selectedItem.phone}`}
                            style={{ color: "var(--t-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <Phone size={12} /> {selectedItem.phone}
                          </a>
                        </>
                      )}
                      {selectedItem.nextDueDate && (
                        <>
                          <span>•</span>
                          <span style={{ color: selectedItem.isOverdue ? "var(--t-rust)" : "var(--t-muted)", fontWeight: 600 }}>
                            Due: {fmtD(selectedItem.nextDueDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {selectedItem.outstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentTarget(selectedItem.person)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--t-sage)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Zap size={14} /> Record Payment
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTrancheTarget(selectedItem.person)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--t-line)",
                      background: "var(--t-card-bg)",
                      color: "var(--t-ink)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} /> Add {isBorrowed ? "Borrowing" : "Loan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatementTarget(selectedItem.person)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--t-line)",
                      background: "var(--t-card-bg)",
                      color: "var(--t-ink)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <MessageSquare size={14} /> WhatsApp Statement
                  </button>
                  <button
                    type="button"
                    onClick={() => (onEdit ? onEdit(selectedItem.id) : setEditPersonTarget(selectedItem.person))}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--t-line)",
                      background: "transparent",
                      color: "var(--t-muted)",
                      cursor: "pointer",
                    }}
                    title="Edit party details"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePerson(selectedItem.person)}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      background: "rgba(239, 68, 68, 0.08)",
                      color: "var(--t-rust)",
                      cursor: "pointer",
                    }}
                    title="Delete person"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Note callout */}
              {selectedItem.note && (
                <div
                  style={{
                    padding: "8px 14px",
                    background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--t-muted)",
                    fontStyle: "italic",
                  }}
                >
                  "{selectedItem.note}"
                </div>
              )}

              {/* 4 Mini Stat Metrics */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 40%, transparent)", border: "1px solid var(--t-line)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
                    Outstanding
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: selectedItem.overpaid ? "var(--t-gold)" : selectedItem.settled ? "var(--t-sage)" : accentColor, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                    <Money value={Math.abs(selectedItem.outstanding)} variant="full" />
                  </div>
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 40%, transparent)", border: "1px solid var(--t-line)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
                    {isBorrowed ? "Total Borrowed" : "Total Lent"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                    ₹{fmtINR(selectedItem.totalT)}
                  </div>
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 40%, transparent)", border: "1px solid var(--t-line)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
                    {isBorrowed ? "Total Repaid" : "Total Received"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-sage)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                    ₹{fmtINR(selectedItem.totalP)}
                  </div>
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "color-mix(in srgb, var(--surface-1) 40%, transparent)", border: "1px solid var(--t-line)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>
                    Recovery Rate
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                    {selectedItem.totalT > 0 ? ((selectedItem.totalP / selectedItem.totalT) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Comprehensive Ledger Breakdown with Passbook & Dual View */}
              <ExpandedLedgerView
                isBorrowed={isBorrowed}
                item={selectedItem}
                accentColor={accentColor}
                bankAccounts={bankAccounts}
                onAddTranche={() => setTrancheTarget(selectedItem.person)}
                onEditTranche={(t: any) => setEditTrancheTarget({ person: selectedItem.person, tranche: t })}
                onDeleteTranche={(t: any) =>
                  setConfirmDeleteTranche({
                    personId: selectedItem.id,
                    updated: selectedItem.tranches.filter((x: any) => x.id !== t.id),
                  })
                }
                onAddPayment={() => setPaymentTarget(selectedItem.person)}
                onEditPayment={(p: any) => setEditPaymentTarget({ person: selectedItem.person, payment: p })}
                onDeletePayment={(p: any) =>
                  setConfirmDeletePayment({
                    personId: selectedItem.id,
                    updated: selectedItem.payments.filter((x: any) => x.id !== p.id),
                  })
                }
                onSettleFull={() => setPaymentTarget(selectedItem.person)}
              />
            </div>
          )}
        </div>
      ) : (
        /* ── 4C. Dense Table Ledger View ── */
        <Card style={{ padding: 0, overflow: "hidden", border: "1px solid var(--t-line)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "color-mix(in srgb, var(--surface-1) 80%, transparent)", borderBottom: "1px solid var(--t-line)" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase" }}>
                    Party / Name
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase" }}>
                    Household
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>
                    {isBorrowed ? "Total Borrowed" : "Total Lent"}
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>
                    {isBorrowed ? "Total Repaid" : "Total Received"}
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>
                    Outstanding
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase" }}>
                    Status / Due
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--t-muted)", fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const avatarGradient = getAvatarGradient(item.name);
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? "none" : "1px solid var(--t-line)",
                          background: isExpanded ? "color-mix(in srgb, var(--surface-1) 40%, transparent)" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: avatarGradient,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "var(--t-ink)" }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--t-muted)" }}>
                                {item.relationship} {item.phone ? `• ${item.phone}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px", color: "var(--t-muted)" }}>
                          {item.ownerLabel}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          ₹{fmtINR(item.totalT)}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--t-sage)", fontVariantNumeric: "tabular-nums" }}>
                          ₹{fmtINR(item.totalP)}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: item.overpaid ? "var(--t-gold)" : item.settled ? "var(--t-sage)" : accentColor }}>
                          <Money value={Math.abs(item.outstanding)} variant="full" />
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {item.overpaid ? (
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-gold)", background: "color-mix(in srgb, var(--t-gold) 12%, transparent)", padding: "2px 6px", borderRadius: 4 }}>
                              OVERPAID
                            </span>
                          ) : item.settled ? (
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--t-sage)", background: "color-mix(in srgb, var(--t-sage) 12%, transparent)", padding: "2px 6px", borderRadius: 4 }}>
                              SETTLED ✓
                            </span>
                          ) : item.isOverdue ? (
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--t-rust)", padding: "2px 6px", borderRadius: 4 }}>
                              {item.daysOverdue}D OVERDUE
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--t-muted)" }}>
                              {item.nextDueDate ? `Due ${fmtD(item.nextDueDate)}` : "Active"}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {item.outstanding > 0 && (
                              <button
                                type="button"
                                onClick={() => setPaymentTarget(item.person)}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: "var(--t-sage)",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Pay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setTrancheTarget(item.person)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid var(--t-line)",
                                background: "var(--t-card-bg)",
                                color: "var(--t-ink)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              + {isBorrowed ? "Borrow" : "Loan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatementTarget(item.person)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid var(--t-line)",
                                background: "var(--t-card-bg)",
                                color: "var(--t-ink)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Share
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                border: "1px solid var(--t-line)",
                                background: isExpanded ? "var(--t-accent)" : "transparent",
                                color: isExpanded ? "#fff" : "var(--t-muted)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, borderBottom: "1px solid var(--t-line)" }}>
                            <ExpandedLedgerView
                              isBorrowed={isBorrowed}
                              item={item}
                              accentColor={accentColor}
                              bankAccounts={bankAccounts}
                              onAddTranche={() => setTrancheTarget(item.person)}
                              onEditTranche={(t: any) => setEditTrancheTarget({ person: item.person, tranche: t })}
                              onDeleteTranche={(t: any) =>
                                setConfirmDeleteTranche({
                                  personId: item.id,
                                  updated: item.tranches.filter((x: any) => x.id !== t.id),
                                })
                              }
                              onAddPayment={() => setPaymentTarget(item.person)}
                              onEditPayment={(p: any) => setEditPaymentTarget({ person: item.person, payment: p })}
                              onDeletePayment={(p: any) =>
                                setConfirmDeletePayment({
                                  personId: item.id,
                                  updated: item.payments.filter((x: any) => x.id !== p.id),
                                })
                              }
                              onSettleFull={() => setPaymentTarget(item.person)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── 5. MODALS & DIALOGS ── */}
      {/* 1. Add Person */}
      {addPersonOpen && (
        <InformalPersonModal
          direction={activeDirection}
          bankAccounts={bankAccounts}
          onSave={async (newPerson, bankTxn) => {
            await onAddPerson(newPerson);
            if (bankTxn && onAddTransaction) {
              await onAddTransaction(bankTxn);
            }
            setAddPersonOpen(false);
          }}
          onClose={() => setAddPersonOpen(false)}
        />
      )}

      {/* 2. Edit Person */}
      {editPersonTarget && (
        <InformalPersonModal
          direction={activeDirection}
          initial={editPersonTarget}
          onSave={async (updatedPerson) => {
            await onUpdate(editPersonTarget.id, updatedPerson);
            setEditPersonTarget(null);
          }}
          onClose={() => setEditPersonTarget(null)}
        />
      )}

      {/* 3. Add Tranche */}
      {trancheTarget && (
        <InformalTrancheModal
          direction={activeDirection}
          person={trancheTarget}
          bankAccounts={bankAccounts}
          onSave={async (trancheData, bankTxn) => {
            const updatedTranches = [...(trancheTarget.tranches || []), trancheData];
            await onUpdate(trancheTarget.id, { tranches: updatedTranches });
            if (bankTxn && onAddTransaction) {
              await onAddTransaction(bankTxn);
            }
            setTrancheTarget(null);
          }}
          onClose={() => setTrancheTarget(null)}
        />
      )}

      {/* 4. Edit Tranche */}
      {editTrancheTarget && (
        <InformalTrancheModal
          direction={activeDirection}
          person={editTrancheTarget.person}
          initial={editTrancheTarget.tranche}
          bankAccounts={bankAccounts}
          onSave={async (updatedTranche) => {
            const tranches = editTrancheTarget.person.tranches || [];
            const updated = tranches.map((t: any) =>
              t.id === updatedTranche.id ? updatedTranche : t
            );
            await onUpdate(editTrancheTarget.person.id, { tranches: updated });
            setEditTrancheTarget(null);
          }}
          onClose={() => setEditTrancheTarget(null)}
        />
      )}

      {/* 5. Record / Add Payment */}
      {paymentTarget && (
        <InformalPaymentModal
          direction={activeDirection}
          person={paymentTarget}
          bankAccounts={bankAccounts}
          onSave={async (paymentData, bankTxn) => {
            const updatedPayments = [...(paymentTarget.payments || []), paymentData];
            await onUpdate(paymentTarget.id, { payments: updatedPayments });
            if (bankTxn && onAddTransaction) {
              await onAddTransaction(bankTxn);
            }
            setPaymentTarget(null);
          }}
          onClose={() => setPaymentTarget(null)}
        />
      )}

      {/* 6. Edit Payment */}
      {editPaymentTarget && (
        <InformalPaymentModal
          direction={activeDirection}
          person={editPaymentTarget.person}
          initial={editPaymentTarget.payment}
          bankAccounts={bankAccounts}
          onSave={async (updatedPayment) => {
            const payments = editPaymentTarget.person.payments || [];
            const updated = payments.map((p: any) =>
              p.id === updatedPayment.id ? updatedPayment : p
            );
            await onUpdate(editPaymentTarget.person.id, { payments: updated });
            setEditPaymentTarget(null);
          }}
          onClose={() => setEditPaymentTarget(null)}
        />
      )}

      {/* 7. Statement / WhatsApp Reminder Generator */}
      {statementTarget && (
        <InformalStatementModal
          direction={activeDirection}
          person={statementTarget}
          onClose={() => setStatementTarget(null)}
        />
      )}

      {/* 8. Confirmation Dialogs */}
      {confirmDeletePerson && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${
            confirmDeletePerson.person || confirmDeletePerson.name || "this person"
          }" along with all loan tranches and repayment records? This action cannot be undone.`}
          onConfirm={async () => {
            await onRemove(confirmDeletePerson.id);
            setConfirmDeletePerson(null);
          }}
          onCancel={() => setConfirmDeletePerson(null)}
        />
      )}

      {confirmDeleteTranche && (
        <ConfirmDialog
          message="Are you sure you want to delete this loan record? This will adjust the outstanding ledger balance."
          onConfirm={async () => {
            await onUpdate(confirmDeleteTranche.personId, {
              tranches: confirmDeleteTranche.updated,
            });
            setConfirmDeleteTranche(null);
          }}
          onCancel={() => setConfirmDeleteTranche(null)}
        />
      )}

      {confirmDeletePayment && (
        <ConfirmDialog
          message="Are you sure you want to delete this payment record? This will adjust the outstanding ledger balance."
          onConfirm={async () => {
            await onUpdate(confirmDeletePayment.personId, {
              payments: confirmDeletePayment.updated,
            });
            setConfirmDeletePayment(null);
          }}
          onCancel={() => setConfirmDeletePayment(null)}
        />
      )}
    </div>
  );
}

/* =========================================================================
   Expanded Item Ledger Component (Loans, Payments & Passbook Timeline)
   ========================================================================= */
interface ExpandedLedgerViewProps {
  isBorrowed: boolean;
  item: any;
  accentColor: string;
  bankAccounts?: any[];
  onAddTranche: () => void;
  onEditTranche: (tranche: any) => void;
  onDeleteTranche: (tranche: any) => void;
  onAddPayment: () => void;
  onEditPayment: (payment: any) => void;
  onDeletePayment: (payment: any) => void;
  onSettleFull: () => void;
}

function ExpandedLedgerView({
  isBorrowed,
  item,
  accentColor,
  bankAccounts = [],
  onAddTranche,
  onEditTranche,
  onDeleteTranche,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onSettleFull,
}: ExpandedLedgerViewProps) {
  const [ledgerTab, setLedgerTab] = useState<"passbook" | "columns">("passbook");

  const fmtD = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // Synthesize unified chronological passbook timeline with running balance
  const passbookTimeline = useMemo(() => {
    const events: any[] = [];

    // Add tranches (+ liability if borrowed, + asset if lent)
    (item.tranches || []).forEach((t: any) => {
      events.push({
        id: t.id,
        rawDate: t.date || today(),
        date: t.date,
        dueDate: t.dueDate,
        type: "tranche",
        label: isBorrowed ? "Loan Received" : "Loan Given",
        amount: Number(t.amount || 0),
        sign: 1, // increases outstanding principal
        note: t.note,
        mode: t.mode || t.method || "Direct",
        bankAccountId: t.bankAccountId,
        referenceNumber: t.referenceNumber || t.reference,
        rawObj: t,
      });
    });

    // Add payments (- liability if borrowed, - asset if lent)
    (item.payments || []).forEach((p: any) => {
      events.push({
        id: p.id,
        rawDate: p.date || today(),
        date: p.date,
        type: "payment",
        label: isBorrowed ? "Repayment Made" : "Payment Received",
        amount: Number(p.amount || 0),
        sign: -1, // reduces outstanding principal
        note: p.note,
        mode: p.method || "Direct",
        bankAccountId: p.bankAccountId,
        referenceNumber: p.referenceNumber || p.reference,
        rawObj: p,
      });
    });

    // Sort chronologically (earliest first) to compute running balance
    events.sort((a, b) => (a.rawDate || "").localeCompare(b.rawDate || ""));

    let running = 0;
    events.forEach((ev) => {
      running += ev.sign * ev.amount;
      ev.runningBalance = running;
    });

    // Return in reverse chronological order for passbook display (newest first)
    return [...events].reverse();
  }, [item.tranches, item.payments, isBorrowed]);

  const getBankName = (id?: string) => {
    if (!id) return null;
    const b = bankAccounts.find((acc) => acc.id === id);
    return b ? b.bankName || "Linked Bank" : "Linked Bank";
  };

  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--surface-1) 25%, transparent)",
        padding: "16px 18px",
        borderTop: "1px solid var(--t-line)",
      }}
    >
      {/* Ledger Mode Switcher Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={() => setLedgerTab("passbook")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${ledgerTab === "passbook" ? "var(--t-accent)" : "var(--t-line)"}`,
              background: ledgerTab === "passbook" ? "color-mix(in srgb, var(--t-accent) 14%, transparent)" : "transparent",
              color: ledgerTab === "passbook" ? "var(--t-accent)" : "var(--t-muted)",
            }}
          >
            <History size={13} /> Chronological Passbook
          </button>
          <button
            type="button"
            onClick={() => setLedgerTab("columns")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${ledgerTab === "columns" ? "var(--t-accent)" : "var(--t-line)"}`,
              background: ledgerTab === "columns" ? "color-mix(in srgb, var(--t-accent) 14%, transparent)" : "transparent",
              color: ledgerTab === "columns" ? "var(--t-accent)" : "var(--t-muted)",
            }}
          >
            <Columns size={13} /> Dual Columns (Loans vs Payments)
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={onAddTranche}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--t-line)",
              background: "var(--t-card-bg)",
              color: "var(--t-ink)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={12} /> {isBorrowed ? "Add Borrowing" : "Add Loan"}
          </button>
          <button
            type="button"
            onClick={onAddPayment}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 6,
              border: "none",
              background: "var(--t-sage)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={12} /> Record Payment
          </button>
        </div>
      </div>

      {ledgerTab === "passbook" ? (
        /* Chronological Passbook Timeline Table */
        <div
          style={{
            background: "var(--t-card-bg)",
            borderRadius: 10,
            border: "1px solid var(--t-line)",
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          {passbookTimeline.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--t-muted)", fontSize: 13 }}>
              No transactions recorded yet for this person.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="informal-passbook-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction Type</th>
                    <th>Details & Mode</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Balance After</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passbookTimeline.map((ev) => {
                    const isTranche = ev.type === "tranche";
                    const isOverdue =
                      ev.dueDate && item.outstanding > 0 && new Date(ev.dueDate + "T00:00:00") < new Date();
                    const bankName = getBankName(ev.bankAccountId);

                    return (
                      <tr key={ev.id}>
                        <td style={{ fontWeight: 600, color: "var(--t-ink)", whiteSpace: "nowrap" }}>
                          {fmtD(ev.date)}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: isTranche
                                ? isBorrowed
                                  ? "color-mix(in srgb, var(--t-rust) 12%, transparent)"
                                  : "color-mix(in srgb, var(--t-accent) 12%, transparent)"
                                : "color-mix(in srgb, var(--t-sage) 12%, transparent)",
                              color: isTranche
                                ? isBorrowed
                                  ? "var(--t-rust)"
                                  : "var(--t-accent)"
                                : "var(--t-sage)",
                              border: "1px solid",
                              borderColor: isTranche
                                ? isBorrowed
                                  ? "color-mix(in srgb, var(--t-rust) 25%, transparent)"
                                  : "color-mix(in srgb, var(--t-accent) 25%, transparent)"
                                : "color-mix(in srgb, var(--t-sage) 25%, transparent)",
                            }}
                          >
                            {isTranche ? (isBorrowed ? "+ BORROWED" : "+ DISBURSED") : (isBorrowed ? "- REPAID" : "- RECEIVED")}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: "var(--t-ink)", fontWeight: 500 }}>
                            {ev.note || (isTranche ? "Loan Principal" : "Payment Settlement")}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span>via {ev.mode}</span>
                            {bankName && <span>• {bankName}</span>}
                            {ev.referenceNumber && <span>• Ref: {ev.referenceNumber}</span>}
                            {ev.dueDate && (
                              <span
                                style={{
                                  fontWeight: isOverdue ? 800 : 500,
                                  color: isOverdue ? "var(--t-rust)" : "var(--t-muted)",
                                }}
                              >
                                • [Due: {fmtD(ev.dueDate)}]
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 800,
                            fontVariantNumeric: "tabular-nums",
                            color: isTranche ? accentColor : "var(--t-sage)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isTranche ? "+" : "-"}₹{fmtINR(ev.amount)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 800,
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--t-ink)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₹{fmtINR(Math.abs(ev.runningBalance))}
                          {ev.runningBalance < 0 && (
                            <span style={{ fontSize: 9, color: "var(--t-gold)", marginLeft: 3 }}>
                              (CR)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => (isTranche ? onEditTranche(ev.rawObj) : onEditPayment(ev.rawObj))}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--t-muted)",
                                cursor: "pointer",
                                padding: 4,
                              }}
                              title={isTranche ? "Edit loan record" : "Edit payment"}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => (isTranche ? onDeleteTranche(ev.rawObj) : onDeletePayment(ev.rawObj))}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--t-rust)",
                                cursor: "pointer",
                                padding: 4,
                              }}
                              title={isTranche ? "Delete loan record" : "Delete payment"}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Dual Columns: Loans on Left, Payments on Right */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 14,
          }}
        >
          {/* Left Column: Loan Entries */}
          <div
            style={{
              background: "var(--t-card-bg)",
              borderRadius: 10,
              border: "1px solid var(--t-line)",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: accentColor,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.04em",
                }}
              >
                {isBorrowed ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                {isBorrowed ? "Borrowings / Loans Received" : "Loans Given / Disbursed"}
              </div>
              <button
                type="button"
                onClick={onAddTranche}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                  color: "var(--t-accent)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={11} /> {isBorrowed ? "Add Borrowing" : "Add Loan"}
              </button>
            </div>

            {item.tranches.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--t-muted)", fontStyle: "italic", padding: "8px 0" }}>
                {isBorrowed ? "No borrowings recorded yet." : "No loans recorded yet."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.tranches.map((t: any) => {
                  const isTrancheOverdue =
                    t.dueDate && item.outstanding > 0 && new Date(t.dueDate + "T00:00:00") < new Date();
                  const bankName = getBankName(t.bankAccountId);

                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                        borderRadius: 8,
                        border: "1px solid var(--t-line)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: accentColor, fontVariantNumeric: "tabular-nums" }}>
                          <Money value={t.amount} variant="exact" />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                          {fmtD(t.date)}
                          {t.note ? ` • ${t.note}` : ""}
                          {bankName ? ` • ${bankName}` : ""}
                          {t.dueDate && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontWeight: isTrancheOverdue ? 800 : 500,
                                color: isTrancheOverdue ? "var(--t-rust)" : "var(--t-muted)",
                              }}
                            >
                              [Due {fmtD(t.dueDate)}]
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => onEditTranche(t)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--t-muted)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                          title={isBorrowed ? "Edit borrowing record" : "Edit loan record"}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTranche(t)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--t-rust)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                          title={isBorrowed ? "Delete borrowing record" : "Delete loan record"}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Repayments / Payments Made */}
          <div
            style={{
              background: "var(--t-card-bg)",
              borderRadius: 10,
              border: "1px solid var(--t-line)",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--t-sage)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.04em",
                }}
              >
                <CheckCircle2 size={13} />
                {isBorrowed ? "Repayments Made" : "Payments Received"}
              </div>
              <button
                type="button"
                onClick={onAddPayment}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: "color-mix(in srgb, var(--t-sage) 12%, transparent)",
                  color: "var(--t-sage)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={11} /> Record Payment
              </button>
            </div>

            {item.payments.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--t-muted)", fontStyle: "italic", padding: "8px 0" }}>
                No payments recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.payments.map((p: any) => {
                  const bankName = getBankName(p.bankAccountId);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                        borderRadius: 8,
                        border: "1px solid var(--t-line)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-sage)", fontVariantNumeric: "tabular-nums" }}>
                          <Money value={p.amount} variant="exact" />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                          {fmtD(p.date)}
                          {p.method ? ` via ${p.method}` : ""}
                          {bankName ? ` • ${bankName}` : ""}
                          {p.note ? ` • ${p.note}` : ""}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => onEditPayment(p)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--t-muted)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                          title="Edit payment"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePayment(p)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--t-rust)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                          title="Delete payment"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger Footer / Settle Up Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          background: "var(--t-card-bg)",
          borderRadius: 8,
          border: "1px solid var(--t-line)",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--t-muted)" }}>Running Account Balance:</span>
          <span
            style={{
              color: item.overpaid ? "var(--t-gold)" : item.settled ? "var(--t-sage)" : accentColor,
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {item.overpaid ? (
              <>Overpaid by <Money value={Math.abs(item.outstanding)} variant="full" /></>
            ) : item.settled ? (
              "Fully Settled & Cleared ✓"
            ) : (
              <><Money value={item.outstanding} variant="full" /> Pending</>
            )}
          </span>
        </div>

        {item.outstanding > 0 && (
          <button
            type="button"
            onClick={onSettleFull}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid color-mix(in srgb, var(--t-sage) 30%, transparent)",
              background: "color-mix(in srgb, var(--t-sage) 12%, transparent)",
              color: "var(--t-sage)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Zap size={13} /> Settle Remaining ₹{fmtINR(item.outstanding)}
          </button>
        )}
      </div>
    </div>
  );
}
