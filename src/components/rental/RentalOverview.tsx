import React from "react";
import {
  Building2,
  TrendingUp,
  Landmark,
  Receipt,
  Shield,
  Percent,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Home,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINRFull } from "../../utils/finance";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { StatCard } from "../ui/StatCard";
import { Money } from "../ui/Money";

interface RentalOverviewProps {
  sub: "out" | "in";
  setSub: (tab: "out" | "in") => void;
  propertiesOut: any[];
  propertiesIn: any[];
  outMonthlyRent: number;
  inMonthlyRent: number;
  animOutMonthlyRent: number;
  animInMonthlyRent: number;
  outThisFY: number;
  inThisFY: number;
  outExpectedFY: number;
  inExpectedFY: number;
  outDepositHeld: number;
  inDepositPaid: number;
  outPropertyValuation: number;
  outTaxableIHP: number;
  municipalTaxPaid: number;
  homeLoanInterestPaid?: number;
  fyLabel: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: "all" | "active" | "expiring" | "ended";
  setStatusFilter: (f: "all" | "active" | "expiring" | "ended") => void;
  onAddNew: () => void;
  counts: {
    outTotal: number;
    outActive: number;
    outExpiring: number;
    outEnded: number;
    inTotal: number;
    inActive: number;
    inExpiring: number;
    inEnded: number;
  };
}

export const RentalOverview: React.FC<RentalOverviewProps> = ({
  sub,
  setSub,
  propertiesOut,
  propertiesIn,
  outMonthlyRent,
  inMonthlyRent,
  animOutMonthlyRent,
  animInMonthlyRent,
  outThisFY,
  inThisFY,
  outExpectedFY,
  inExpectedFY,
  outDepositHeld,
  inDepositPaid,
  outPropertyValuation,
  outTaxableIHP,
  municipalTaxPaid,
  homeLoanInterestPaid = 0,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  counts,
}) => {
  const netMonthly = outMonthlyRent - inMonthlyRent;
  const activeCounts = sub === "out" ? counts.outTotal : counts.inTotal;

  const outPct = outExpectedFY > 0 ? Math.min(100, Math.round((outThisFY / outExpectedFY) * 100)) : 0;
  const inPct = inExpectedFY > 0 ? Math.min(100, Math.round((inThisFY / inExpectedFY) * 100)) : 0;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* ── Top Cash Flow & Summary Header Card ── */}
      <Card
        variant="base"
        style={{
          marginBottom: 20,
          padding: "clamp(20px, 3.5vw, 32px)",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--surface-0) 96%, var(--t-accent) 4%), var(--surface-0))",
          border: `1px solid ${THEME.line}`,
          borderTop: `4px solid ${sub === "out" ? THEME.accent : THEME.rust}`,
          borderRadius: "var(--radius-xl)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          {/* Main Hero Number */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: THEME.muted,
                marginBottom: 6,
              }}
            >
              {sub === "out" ? (
                <>
                  <Landmark size={15} color={THEME.accent} /> Monthly Rental Inflow
                </>
              ) : (
                <>
                  <Receipt size={15} color={THEME.rust} /> Monthly Rent Outflow
                </>
              )}
            </div>

            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(34px, 4.5vw, 52px)",
                fontWeight: 900,
                color: THEME.ink,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <Money
                value={sub === "out" ? animOutMonthlyRent : animInMonthlyRent}
                variant="full"
              />
            </div>

            <div style={{ fontSize: 13, color: THEME.muted, marginTop: 8, fontWeight: 600 }}>
              {sub === "out" ? (
                <>
                  <span style={{ color: THEME.sage, fontWeight: 700 }}>
                    <Money value={outThisFY} variant="full" />
                  </span>{" "}
                  received this FY ({outPct}% of{" "}
                  <Money value={outExpectedFY} variant="full" /> expected)
                </>
              ) : (
                <>
                  <span style={{ color: THEME.rust, fontWeight: 700 }}>
                    <Money value={inThisFY} variant="full" />
                  </span>{" "}
                  paid this FY ({inPct}% of{" "}
                  <Money value={inExpectedFY} variant="full" /> commitment)
                </>
              )}
            </div>
          </div>

          {/* Quick Cashflow Mini Balance Bar */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 14,
              background: `color-mix(in srgb, var(--surface-1) 80%, transparent)`,
              border: `1px solid ${THEME.line}`,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
                fontWeight: 700,
                color: THEME.muted,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={14} color={THEME.accent} /> Rental Net Cashflow
              </span>
              <Badge
                variant={netMonthly >= 0 ? "accent" : "muted"}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: netMonthly >= 0 ? THEME.sage : THEME.rust,
                  background:
                    netMonthly >= 0
                      ? `color-mix(in srgb, ${THEME.sage} 12%, transparent)`
                      : `color-mix(in srgb, ${THEME.rust} 12%, transparent)`,
                }}
              >
                {netMonthly >= 0 ? "+" : "-"}
                <Money value={Math.abs(netMonthly)} variant="full" />
                /mo
              </Badge>
            </div>

            {/* Income vs Expense comparison meter */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  fontWeight: 600,
                  color: THEME.muted,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: THEME.sage, display: "flex", alignItems: "center", gap: 3 }}>
                  <ArrowUpRight size={12} /> In: <Money value={outMonthlyRent} variant="full" />
                </span>
                <span style={{ color: THEME.rust, display: "flex", alignItems: "center", gap: 3 }}>
                  <ArrowDownRight size={12} /> Out: <Money value={inMonthlyRent} variant="full" />
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 99,
                  background: `color-mix(in srgb, ${THEME.line} 40%, transparent)`,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                {outMonthlyRent + inMonthlyRent > 0 ? (
                  <>
                    <div
                      style={{
                        width: `${(outMonthlyRent / (outMonthlyRent + inMonthlyRent)) * 100}%`,
                        background: THEME.sage,
                        transition: "width 0.4s ease",
                      }}
                    />
                    <div
                      style={{
                        width: `${(inMonthlyRent / (outMonthlyRent + inMonthlyRent)) * 100}%`,
                        background: THEME.rust,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </>
                ) : (
                  <div style={{ width: "100%", background: THEME.line }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Key Metrics Cards ── */}
      {activeCounts > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {sub === "out" ? (
            <>
              <StatCard
                label="Property Portfolio"
                value={fmtINRFull(outPropertyValuation)}
                numericValue={outPropertyValuation}
                formatValue={fmtINRFull}
                sub="Total asset valuation"
                icon={<Building2 />}
                color={THEME.violet}
              />
              <StatCard
                label="Received (FY)"
                value={fmtINRFull(outThisFY)}
                numericValue={outThisFY}
                formatValue={fmtINRFull}
                sub={
                  <>
                    of <Money value={outExpectedFY} variant="full" /> target ({outPct}%)
                  </>
                }
                icon={<TrendingUp />}
                color={THEME.sage}
              />
              <StatCard
                label="Deposit Held"
                value={fmtINRFull(outDepositHeld)}
                numericValue={outDepositHeld}
                formatValue={fmtINRFull}
                sub="Active liability balance"
                icon={<Shield />}
                color={THEME.gold}
              />
              <StatCard
                label={outTaxableIHP < 0 ? "House Property Loss" : "Taxable IHP"}
                value={fmtINRFull(Math.abs(outTaxableIHP))}
                numericValue={outTaxableIHP}
                formatValue={fmtINRFull}
                sub={
                  outTaxableIHP < 0
                    ? "Sec 71(3A) capped at -₹2L against other heads"
                    : municipalTaxPaid > 0 || homeLoanInterestPaid > 0
                      ? "Net of Sec 24(a) 30% std ded & 24(b) interest"
                      : "Post 30% statutory deduction (Sec 24a)"
                }
                icon={<Percent />}
                color={outTaxableIHP < 0 ? THEME.rust : THEME.accent}
              />
            </>
          ) : (
            <>
              <StatCard
                label="Rent Paid (FY)"
                value={fmtINRFull(inThisFY)}
                numericValue={inThisFY}
                formatValue={fmtINRFull}
                sub={
                  <>
                    of <Money value={inExpectedFY} variant="full" /> commitment ({inPct}%)
                  </>
                }
                icon={<Receipt />}
                color={THEME.rust}
              />
              <StatCard
                label="Deposit Paid"
                value={fmtINRFull(inDepositPaid)}
                numericValue={inDepositPaid}
                formatValue={fmtINRFull}
                sub="Recoverable security asset"
                icon={<Shield />}
                color={THEME.sage}
              />
              <StatCard
                label="HRA Eligible"
                value={fmtINRFull(inThisFY)}
                numericValue={inThisFY}
                formatValue={fmtINRFull}
                sub="Sec 10(13A) annual basis"
                icon={<Building2 />}
                color={THEME.accent}
              />
              <StatCard
                label="Active Leases"
                value={`${counts.inActive} Leases`}
                sub={counts.inExpiring > 0 ? `${counts.inExpiring} expiring soon` : "All active"}
                icon={<Home />}
                color={THEME.gold}
              />
            </>
          )}
        </div>
      )}

      {/* ── Sub-Tab Segment & Filter Toolbar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        {/* Rented Out vs Rented In Tabs */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--surface-0)",
            borderRadius: 12,
            padding: 4,
            border: `1px solid ${THEME.line}`,
          }}
        >
          {[
            { id: "out", label: "Rented Out (Landlord)", count: propertiesOut.length },
            { id: "in", label: "Rented In (Tenant)", count: propertiesIn.length },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSub(s.id as "out" | "in")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background:
                  sub === s.id
                    ? s.id === "out"
                      ? "color-mix(in srgb, var(--t-accent) 14%, transparent)"
                      : "color-mix(in srgb, var(--t-rust) 14%, transparent)"
                    : "transparent",
                color: sub === s.id ? (s.id === "out" ? "var(--t-accent)" : THEME.rust) : THEME.muted,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              {s.label}
              {s.count > 0 && (
                <Badge
                  variant={sub === s.id ? "accent" : "muted"}
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    background:
                      sub === s.id
                        ? s.id === "out"
                          ? THEME.accent
                          : THEME.rust
                        : undefined,
                    color: sub === s.id ? "#fff" : undefined,
                  }}
                >
                  {s.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Status filter pills & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Search Box */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={14}
              color={THEME.muted}
              style={{ position: "absolute", left: 10, pointerEvents: "none" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties or people..."
              style={{
                padding: "7px 12px 7px 30px",
                borderRadius: 8,
                border: `1px solid ${THEME.line}`,
                background: "var(--surface-0)",
                color: THEME.ink,
                fontSize: 12,
                width: 210,
                outline: "none",
              }}
            />
          </div>

          {/* Filter pills */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--surface-0)",
              padding: 3,
              borderRadius: 8,
              border: `1px solid ${THEME.line}`,
            }}
          >
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "expiring", label: "Expiring" },
              { id: "ended", label: "Ended" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    statusFilter === f.id
                      ? `color-mix(in srgb, ${THEME.accent} 15%, transparent)`
                      : "transparent",
                  color: statusFilter === f.id ? THEME.accent : THEME.muted,
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
