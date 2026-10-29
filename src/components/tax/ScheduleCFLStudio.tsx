import React, { useState, useMemo } from "react";
import {
  Layers,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Info,
  Sparkles,
  TrendingDown,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINRFull, exportArrayToCSV } from "../../utils/finance";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Money } from "../ui/Money";
import { StatCard } from "../ui/StatCard";

/* ══════════════════════════════════════════════════════════════════
   STATUTORY CONSTANTS & TYPES (SECTION 70, 71, 74 & SECTION 80)
   ══════════════════════════════════════════════════════════════════ */

export const MAX_CARRY_FORWARD_YEARS = 8;
export const STCG_STATUTORY_TAX_RATE = 0.2; // 20% on equity post-Finance Act 2024
export const LTCG_EFFECTIVE_TAX_RATE = 0.13; // 12.5% + 4% cess

export interface BroughtForwardLossRow {
  assessmentYear: string;
  financialYear: string;
  returnFiledOnTime: boolean; // Section 80 compliance
  filingDate: string;
  acknowledgmentNumber?: string;
  bfSTCL: number; // Brought-Forward Short-Term Capital Loss
  bfLTCL: number; // Brought-Forward Long-Term Capital Loss
  sourceNote?: string;
}

export interface SetOffResultRow extends BroughtForwardLossRow {
  eligible: boolean;
  ineligibilityReason?: string;
  stclAbsorbedAgainstSTCG: number;
  stclAbsorbedAgainstLTCG: number;
  ltclAbsorbedAgainstLTCG: number;
  totalAbsorbed: number;
  unabsorbedSTCL: number;
  unabsorbedLTCL: number;
  totalCarriedForward: number;
  lapsedSTCL: number;
  lapsedLTCL: number;
  yearsRemaining: number;
  isExpiringThisAY: boolean;
}

export interface ScheduleCFLStudioProps {
  currentFYSTCG?: number;
  currentFYLTCG?: number;
  showToast?: (msg: string, type?: string) => void;
}

// Initial 8 Assessment Years prior to AY 2026-27
export const INITIAL_AY_SCHEDULE: BroughtForwardLossRow[] = [
  {
    assessmentYear: "AY 2018-19",
    financialYear: "FY 2017-18",
    returnFiledOnTime: true,
    filingDate: "2018-07-28",
    bfSTCL: 0,
    bfLTCL: 0,
    sourceNote: "8th Year (Final Year)",
  },
  {
    assessmentYear: "AY 2019-20",
    financialYear: "FY 2018-19",
    returnFiledOnTime: true,
    filingDate: "2019-07-25",
    bfSTCL: 0,
    bfLTCL: 0,
    sourceNote: "7th Year",
  },
  {
    assessmentYear: "AY 2020-21",
    financialYear: "FY 2019-20",
    returnFiledOnTime: true,
    filingDate: "2020-12-15",
    bfSTCL: 0,
    bfLTCL: 0,
    sourceNote: "COVID year extended due date",
  },
  {
    assessmentYear: "AY 2021-22",
    financialYear: "FY 2020-21",
    returnFiledOnTime: true,
    filingDate: "2021-12-20",
    bfSTCL: 0,
    bfLTCL: 0,
  },
  {
    assessmentYear: "AY 2022-23",
    financialYear: "FY 2021-22",
    returnFiledOnTime: true,
    filingDate: "2022-07-29",
    bfSTCL: 0,
    bfLTCL: 0,
  },
  {
    assessmentYear: "AY 2023-24",
    financialYear: "FY 2022-23",
    returnFiledOnTime: true,
    filingDate: "2023-07-26",
    bfSTCL: 0,
    bfLTCL: 0,
  },
  {
    assessmentYear: "AY 2024-25",
    financialYear: "FY 2023-24",
    returnFiledOnTime: true,
    filingDate: "2024-07-24",
    bfSTCL: 0,
    bfLTCL: 0,
  },
  {
    assessmentYear: "AY 2025-26",
    financialYear: "FY 2024-25",
    returnFiledOnTime: true,
    filingDate: "2025-07-22",
    bfSTCL: 0,
    bfLTCL: 0,
    sourceNote: "Immediately Preceding AY",
  },
];

export const SAMPLE_BF_LOSSES: BroughtForwardLossRow[] = [
  {
    assessmentYear: "AY 2018-19",
    financialYear: "FY 2017-18",
    returnFiledOnTime: true,
    filingDate: "2018-07-28",
    bfSTCL: 40000,
    bfLTCL: 25000,
    sourceNote: "Small Cap sell-off (Final 8th Year)",
  },
  {
    assessmentYear: "AY 2019-20",
    financialYear: "FY 2018-19",
    returnFiledOnTime: true,
    filingDate: "2019-07-25",
    bfSTCL: 0,
    bfLTCL: 0,
  },
  {
    assessmentYear: "AY 2020-21",
    financialYear: "FY 2019-20",
    returnFiledOnTime: true,
    filingDate: "2020-12-15",
    bfSTCL: 85000,
    bfLTCL: 120000,
    sourceNote: "March 2020 COVID drawdown",
  },
  {
    assessmentYear: "AY 2021-22",
    financialYear: "FY 2020-21",
    returnFiledOnTime: true,
    filingDate: "2021-12-20",
    bfSTCL: 0,
    bfLTCL: 0,
  },
  {
    assessmentYear: "AY 2022-23",
    financialYear: "FY 2021-22",
    returnFiledOnTime: true,
    filingDate: "2022-07-29",
    bfSTCL: 65000,
    bfLTCL: 35000,
    sourceNote: "Rate hike correction",
  },
  {
    assessmentYear: "AY 2023-24",
    financialYear: "FY 2022-23",
    returnFiledOnTime: false,
    filingDate: "2023-12-31",
    bfSTCL: 50000,
    bfLTCL: 50000,
    sourceNote: "Filed belatedly — ineligible u/s 80",
  },
  {
    assessmentYear: "AY 2024-25",
    financialYear: "FY 2023-24",
    returnFiledOnTime: true,
    filingDate: "2024-07-24",
    bfSTCL: 30000,
    bfLTCL: 70000,
  },
  {
    assessmentYear: "AY 2025-26",
    financialYear: "FY 2024-25",
    returnFiledOnTime: true,
    filingDate: "2025-07-22",
    bfSTCL: 0,
    bfLTCL: 55000,
    sourceNote: "Debt MF rebalancing",
  },
];

/**
 * Computes FIFO Statutory Set-off of Brought-Forward Losses (Section 74)
 */
export function computeScheduleCFLSetOff({
  currentSTCG,
  currentLTCG,
  schedule,
  activeAY = 2026, // Default target AY 2026-27
}: {
  currentSTCG: number;
  currentLTCG: number;
  schedule: BroughtForwardLossRow[];
  activeAY?: number;
}) {
  let remainingSTCG = Math.max(0, currentSTCG);
  let remainingLTCG = Math.max(0, currentLTCG);

  let totalBFSTCLAvailable = 0;
  let totalBFLTCLAvailable = 0;
  let totalSTCLAbsorbed = 0;
  let totalLTCLAbsorbed = 0;

  // Process FIFO from oldest Assessment Year to newest
  const rows: SetOffResultRow[] = schedule.map((row, index) => {
    const ayStartYear = Number(row.assessmentYear.replace(/AY\s*(\d{4})-\d{2}/i, "$1")) || 2018;
    const elapsedYears = activeAY - ayStartYear;
    const yearsRemaining = Math.max(0, MAX_CARRY_FORWARD_YEARS - elapsedYears);
    const isExpiringThisAY = yearsRemaining === 0;

    let eligible = true;
    let ineligibilityReason: string | undefined;

    if (!row.returnFiledOnTime) {
      eligible = false;
      ineligibilityReason = "Section 80: Belated return bars loss carry-forward";
    }

    const stcl = Math.max(0, Number(row.bfSTCL || 0));
    const ltcl = Math.max(0, Number(row.bfLTCL || 0));

    if (eligible) {
      totalBFSTCLAvailable += stcl;
      totalBFLTCLAvailable += ltcl;
    }

    let stclRemaining = eligible ? stcl : 0;
    let ltclRemaining = eligible ? ltcl : 0;

    // 1. STCL sets off remaining STCG
    let stclAgainstSTCG = 0;
    if (stclRemaining > 0 && remainingSTCG > 0) {
      stclAgainstSTCG = Math.min(stclRemaining, remainingSTCG);
      remainingSTCG -= stclAgainstSTCG;
      stclRemaining -= stclAgainstSTCG;
    }

    // 2. Unabsorbed STCL can set off remaining LTCG (Section 74(1)(a))
    let stclAgainstLTCG = 0;
    if (stclRemaining > 0 && remainingLTCG > 0) {
      stclAgainstLTCG = Math.min(stclRemaining, remainingLTCG);
      remainingLTCG -= stclAgainstLTCG;
      stclRemaining -= stclAgainstLTCG;
    }

    // 3. LTCL sets off remaining LTCG ONLY (Section 74(1)(b) - cannot set off STCG)
    let ltclAgainstLTCG = 0;
    if (ltclRemaining > 0 && remainingLTCG > 0) {
      ltclAgainstLTCG = Math.min(ltclRemaining, remainingLTCG);
      remainingLTCG -= ltclAgainstLTCG;
      ltclRemaining -= ltclAgainstLTCG;
    }

    const totalAbsorbed = stclAgainstSTCG + stclAgainstLTCG + ltclAgainstLTCG;
    totalSTCLAbsorbed += stclAgainstSTCG + stclAgainstLTCG;
    totalLTCLAbsorbed += ltclAgainstLTCG;

    // If row was in its final 8th year and has remaining unabsorbed loss, it lapses
    let unabsorbedSTCL = stclRemaining;
    let unabsorbedLTCL = ltclRemaining;
    let lapsedSTCL = 0;
    let lapsedLTCL = 0;

    if (isExpiringThisAY) {
      lapsedSTCL = stclRemaining;
      lapsedLTCL = ltclRemaining;
      unabsorbedSTCL = 0;
      unabsorbedLTCL = 0;
    }

    return {
      ...row,
      eligible,
      ineligibilityReason,
      stclAbsorbedAgainstSTCG: stclAgainstSTCG,
      stclAbsorbedAgainstLTCG: stclAgainstLTCG,
      ltclAbsorbedAgainstLTCG: ltclAgainstLTCG,
      totalAbsorbed,
      unabsorbedSTCL,
      unabsorbedLTCL,
      totalCarriedForward: unabsorbedSTCL + unabsorbedLTCL,
      lapsedSTCL,
      lapsedLTCL,
      yearsRemaining,
      isExpiringThisAY,
    };
  });

  const totalCarriedForwardSTCL = rows.reduce((s, r) => s + r.unabsorbedSTCL, 0);
  const totalCarriedForwardLTCL = rows.reduce((s, r) => s + r.unabsorbedLTCL, 0);
  const totalLapsedLosses = rows.reduce((s, r) => s + r.lapsedSTCL + r.lapsedLTCL, 0);

  // Direct Tax Saved via Absorption
  const stcgTaxSaved = totalSTCLAbsorbed * STCG_STATUTORY_TAX_RATE;
  const ltcgTaxSaved = totalLTCLAbsorbed * LTCG_EFFECTIVE_TAX_RATE;
  const totalTaxSaved = Math.round(stcgTaxSaved + ltcgTaxSaved);

  return {
    rows,
    netTaxableSTCG: remainingSTCG,
    netTaxableLTCG: remainingLTCG,
    totalBFSTCLAvailable,
    totalBFLTCLAvailable,
    totalBFAvailable: totalBFSTCLAvailable + totalBFLTCLAvailable,
    totalSTCLAbsorbed,
    totalLTCLAbsorbed,
    totalAbsorbed: totalSTCLAbsorbed + totalLTCLAbsorbed,
    totalCarriedForwardSTCL,
    totalCarriedForwardLTCL,
    totalCarriedForward: totalCarriedForwardSTCL + totalCarriedForwardLTCL,
    totalLapsedLosses,
    totalTaxSaved,
  };
}

export const ScheduleCFLStudio: React.FC<ScheduleCFLStudioProps> = ({
  currentFYSTCG = 0,
  currentFYLTCG = 0,
  showToast,
}) => {
  const [schedule, setSchedule] = useState<BroughtForwardLossRow[]>(INITIAL_AY_SCHEDULE);
  const [manualSTCG, setManualSTCG] = useState<number>(currentFYSTCG);
  const [manualLTCG, setManualLTCG] = useState<number>(currentFYLTCG);
  const [usePortfolioGains, setUsePortfolioGains] = useState<boolean>(
    currentFYSTCG > 0 || currentFYLTCG > 0
  );
  const [copiedReport, setCopiedReport] = useState(false);

  // Active gains used for set-off calculation
  const activeSTCG = usePortfolioGains ? currentFYSTCG : manualSTCG;
  const activeLTCG = usePortfolioGains ? currentFYLTCG : manualLTCG;

  const result = useMemo(() => {
    return computeScheduleCFLSetOff({
      currentSTCG: activeSTCG,
      currentLTCG: activeLTCG,
      schedule,
    });
  }, [activeSTCG, activeLTCG, schedule]);

  const handleRowChange = (index: number, field: keyof BroughtForwardLossRow, val: any) => {
    setSchedule((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleLoadSample = () => {
    setSchedule(SAMPLE_BF_LOSSES);
    showToast?.("Loaded sample brought-forward losses across AY 2018-19 to AY 2025-26", "info");
  };

  const handleReset = () => {
    setSchedule(INITIAL_AY_SCHEDULE);
    showToast?.("Schedule CFL reset to zero entries", "info");
  };

  const handleExportCSV = () => {
    const exportData = result.rows.map((r) => ({
      "Assessment Year": r.assessmentYear,
      "Financial Year": r.financialYear,
      "Filed on Time u/s 139(1)": r.returnFiledOnTime ? "YES" : "NO",
      "Filing Date": r.filingDate || "N/A",
      "Brought-Forward STCL": r.bfSTCL,
      "Brought-Forward LTCL": r.bfLTCL,
      "STCL Absorbed Against STCG": r.stclAbsorbedAgainstSTCG,
      "STCL Absorbed Against LTCG": r.stclAbsorbedAgainstLTCG,
      "LTCL Absorbed Against LTCG": r.ltclAbsorbedAgainstLTCG,
      "Total Absorbed": r.totalAbsorbed,
      "Carried Forward STCL": r.unabsorbedSTCL,
      "Carried Forward LTCL": r.unabsorbedLTCL,
      "Lapsed Losses": r.lapsedSTCL + r.lapsedLTCL,
      "Years Remaining": r.yearsRemaining,
      Status: r.eligible ? (r.isExpiringThisAY ? "Final Year" : "Active") : "Ineligible (Sec 80)",
    }));

    exportArrayToCSV(exportData, `ITR_Schedule_CFL_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast?.("Exported Schedule CFL CSV successfully", "success");
  };

  const handleCopyReport = () => {
    const text = `
ITR SCHEDULE CFL - LOSS SET-OFF & CARRY FORWARD REPORT
══════════════════════════════════════════════════════════════════
CURRENT ASSESSMENT YEAR GAINS:
• Current STCG: ₹${activeSTCG.toLocaleString("en-IN")}
• Current LTCG: ₹${activeLTCG.toLocaleString("en-IN")}
• Net Taxable STCG Post Set-off: ₹${result.netTaxableSTCG.toLocaleString("en-IN")}
• Net Taxable LTCG Post Set-off: ₹${result.netTaxableLTCG.toLocaleString("en-IN")}

SET-OFF & TAX HARVEST SUMMARY:
• Total BF Losses Available: ₹${result.totalBFAvailable.toLocaleString("en-IN")}
• Total Losses Absorbed in Current AY: ₹${result.totalAbsorbed.toLocaleString("en-IN")}
• Direct Statutory Tax Saved: ₹${result.totalTaxSaved.toLocaleString("en-IN")}
• Losses Carried Forward to Future AYs: ₹${result.totalCarriedForward.toLocaleString("en-IN")}
• Lapsed Losses (Exceeded 8 Years): ₹${result.totalLapsedLosses.toLocaleString("en-IN")}

BREAKDOWN BY ASSESSMENT YEAR:
${result.rows
  .map(
    (r) =>
      `• ${r.assessmentYear} (${r.financialYear}) | Filed on Time: ${r.returnFiledOnTime ? "Yes" : "No"} | BF STCL: ₹${r.bfSTCL.toLocaleString("en-IN")} | BF LTCL: ₹${r.bfLTCL.toLocaleString("en-IN")} | Absorbed: ₹${r.totalAbsorbed.toLocaleString("en-IN")} | Carried Forward: ₹${r.totalCarriedForward.toLocaleString("en-IN")}`
  )
  .join("\n")}
══════════════════════════════════════════════════════════════════
Generated by ArthaDrishti Senior Tax & Accounting Desk
`.trim();

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
    showToast?.("Copied Schedule CFL text report to clipboard", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Studio Header Banner ─────────────────────────────────── */}
      <Card style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `color-mix(in srgb, ${THEME.accent} 15%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: THEME.accent,
                }}
              >
                <Layers size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: THEME.ink }}>
                  ITR Schedule CFL: Capital Loss Set-Off & Carry-Forward Studio
                </h2>
                <div style={{ fontSize: 12, color: THEME.muted }}>
                  Statutory 8-Year Absorption Engine (Section 70, 71, 74 & Section 80 of the
                  Income-tax Act, 1961)
                </div>
              </div>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: THEME.muted,
                maxWidth: 740,
                lineHeight: 1.5,
              }}
            >
              Track and offset brought-forward Short-Term and Long-Term Capital Losses against
              current year gains in strict statutory priority (FIFO order). Enforces the mandatory
              Section 80 on-time filing rule and projects carry-forward losses with expiration
              countdowns.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSample}
              title="Prefill realistic market cycle losses"
            >
              <Sparkles size={14} color={THEME.gold} /> Prefill Sample Losses
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Clear all brought-forward entries"
            >
              <RotateCcw size={14} /> Reset
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              title="Export ITR Schedule CFL to CSV"
            >
              <FileSpreadsheet size={14} /> Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyReport}
              title="Copy ITR Schedule CFL summary text"
            >
              {copiedReport ? <Check size={14} /> : <Copy size={14} />}{" "}
              {copiedReport ? "Copied!" : "Copy Report"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Key Metrics Radar ─────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
        }}
      >
        <StatCard
          label="Total BF Losses Available"
          value={<Money value={result.totalBFAvailable} variant="full" />}
          icon={<TrendingDown size={20} />}
          color={THEME.muted}
          subtext={`STCL: ${fmtINRFull(result.totalBFSTCLAvailable)} · LTCL: ${fmtINRFull(result.totalBFLTCLAvailable)}`}
        />
        <StatCard
          label="Losses Absorbed in Current AY"
          value={<Money value={result.totalAbsorbed} variant="full" />}
          icon={<ShieldCheck size={20} />}
          color={THEME.sage}
          subtext={`Against STCG: ${fmtINRFull(result.totalSTCLAbsorbed)} · LTCG: ${fmtINRFull(result.totalLTCLAbsorbed)}`}
        />
        <StatCard
          label="Direct Tax Saved via Set-Off"
          value={<Money value={result.totalTaxSaved} variant="full" />}
          icon={<Sparkles size={20} />}
          color={THEME.gold}
          subtext="20% STCG + 13.0% LTCG with Cess"
        />
        <StatCard
          label="Carried Forward to Future AYs"
          value={<Money value={result.totalCarriedForward} variant="full" />}
          icon={<Clock size={20} />}
          color={THEME.accent}
          subtext={`STCL: ${fmtINRFull(result.totalCarriedForwardSTCL)} · LTCL: ${fmtINRFull(result.totalCarriedForwardLTCL)}`}
        />
      </div>

      {/* ── Current Year Gains Reconciler ─────────────────────────── */}
      <Card style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={16} color={THEME.accent} />
            <span style={{ fontSize: 14, fontWeight: 700, color: THEME.ink }}>
              Current Financial Year Realized Gains Pool
            </span>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: THEME.muted,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={usePortfolioGains}
              onChange={(e) => setUsePortfolioGains(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>
              Auto-link Realized Gains from Portfolio ({fmtINRFull(currentFYSTCG + currentFYLTCG)})
            </span>
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: THEME.muted,
                marginBottom: 4,
              }}
            >
              Current Year STCG (Equity 20% / Debt Slab)
            </label>
            <input
              type="number"
              className="form-input"
              value={usePortfolioGains ? currentFYSTCG : manualSTCG}
              disabled={usePortfolioGains}
              onChange={(e) => setManualSTCG(Math.max(0, Number(e.target.value) || 0))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                borderColor: THEME.line,
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
              Taxable STCG remaining after set-off:{" "}
              <strong style={{ color: result.netTaxableSTCG > 0 ? THEME.ink : THEME.sage }}>
                {fmtINRFull(result.netTaxableSTCG)}
              </strong>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: THEME.muted,
                marginBottom: 4,
              }}
            >
              Current Year LTCG (Equity 12.5% / Others)
            </label>
            <input
              type="number"
              className="form-input"
              value={usePortfolioGains ? currentFYLTCG : manualLTCG}
              disabled={usePortfolioGains}
              onChange={(e) => setManualLTCG(Math.max(0, Number(e.target.value) || 0))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                borderColor: THEME.line,
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
              Taxable LTCG remaining after set-off:{" "}
              <strong style={{ color: result.netTaxableLTCG > 0 ? THEME.ink : THEME.sage }}>
                {fmtINRFull(result.netTaxableLTCG)}
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Schedule CFL Ledger Table ─────────────────────────────── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${THEME.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: THEME.ink }}>
              Schedule CFL: Brought-Forward Capital Losses Matrix
            </div>
            <div style={{ fontSize: 12, color: THEME.muted }}>
              Previous 8 Assessment Years · Oldest years absorbed first (FIFO) · Section 80
              compliance mandatory
            </div>
          </div>
          {result.totalLapsedLosses > 0 && (
            <Badge variant="rust">
              <AlertTriangle size={12} style={{ marginRight: 4 }} />
              {fmtINRFull(result.totalLapsedLosses)} Lapsed (Exceeded 8 Years)
            </Badge>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}
            role="table"
            aria-label="Schedule CFL Losses Matrix"
          >
            <thead>
              <tr
                style={{
                  background: "color-mix(in srgb, var(--t-accent) 5%, transparent)",
                  borderBottom: `1.5px solid ${THEME.line}`,
                }}
              >
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Assessment Year
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Sec 139(1) Filed on Time
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Brought-Forward STCL
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Brought-Forward LTCL
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Absorbed This AY
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Carried Forward
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: THEME.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Expiry Status
                </th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => (
                <tr
                  key={row.assessmentYear}
                  style={{
                    borderBottom: `1px solid ${THEME.line}`,
                    background: !row.eligible
                      ? "color-mix(in srgb, var(--t-rust) 5%, transparent)"
                      : row.isExpiringThisAY && (row.unabsorbedSTCL > 0 || row.unabsorbedLTCL > 0)
                        ? "color-mix(in srgb, var(--t-gold) 6%, transparent)"
                        : idx % 2 === 0
                          ? "transparent"
                          : "color-mix(in srgb, var(--t-paper) 30%, transparent)",
                  }}
                >
                  {/* AY & FY */}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: THEME.ink }}>{row.assessmentYear}</div>
                    <div style={{ fontSize: 11, color: THEME.muted }}>{row.financialYear}</div>
                    {row.sourceNote && (
                      <div style={{ fontSize: 10, color: THEME.accent }}>{row.sourceNote}</div>
                    )}
                  </td>

                  {/* Section 80 compliance toggle */}
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={row.returnFiledOnTime}
                        onChange={(e) =>
                          handleRowChange(idx, "returnFiledOnTime", e.target.checked)
                        }
                        style={{ cursor: "pointer" }}
                        aria-label={`Toggle Section 139(1) compliance for ${row.assessmentYear}`}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          color: row.returnFiledOnTime ? THEME.sage : "var(--t-rust)",
                        }}
                      >
                        {row.returnFiledOnTime ? "On-Time" : "Belated"}
                      </span>
                    </label>
                    {!row.eligible && (
                      <div style={{ fontSize: 10, color: "var(--t-rust)", marginTop: 2 }}>
                        Barred u/s 80
                      </div>
                    )}
                  </td>

                  {/* Brought-Forward STCL input */}
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <input
                      type="number"
                      className="form-input"
                      value={row.bfSTCL === 0 ? "" : row.bfSTCL}
                      placeholder="0"
                      onChange={(e) =>
                        handleRowChange(idx, "bfSTCL", Math.max(0, Number(e.target.value) || 0))
                      }
                      style={{
                        width: 110,
                        padding: "5px 8px",
                        borderRadius: 6,
                        textAlign: "right",
                        fontSize: 12,
                        fontWeight: 600,
                        borderColor: THEME.line,
                      }}
                      aria-label={`BF STCL for ${row.assessmentYear}`}
                    />
                  </td>

                  {/* Brought-Forward LTCL input */}
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <input
                      type="number"
                      className="form-input"
                      value={row.bfLTCL === 0 ? "" : row.bfLTCL}
                      placeholder="0"
                      onChange={(e) =>
                        handleRowChange(idx, "bfLTCL", Math.max(0, Number(e.target.value) || 0))
                      }
                      style={{
                        width: 110,
                        padding: "5px 8px",
                        borderRadius: 6,
                        textAlign: "right",
                        fontSize: 12,
                        fontWeight: 600,
                        borderColor: THEME.line,
                      }}
                      aria-label={`BF LTCL for ${row.assessmentYear}`}
                    />
                  </td>

                  {/* Absorbed This AY */}
                  <td
                    style={{
                      padding: "12px 14px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: row.totalAbsorbed > 0 ? THEME.sage : THEME.muted,
                    }}
                  >
                    {row.totalAbsorbed > 0 ? (
                      <div>
                        <Money value={row.totalAbsorbed} variant="full" />
                        <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 400 }}>
                          {row.stclAbsorbedAgainstSTCG > 0 &&
                            `ST→ST: ${fmtINRFull(row.stclAbsorbedAgainstSTCG)} `}
                          {row.stclAbsorbedAgainstLTCG > 0 &&
                            `ST→LT: ${fmtINRFull(row.stclAbsorbedAgainstLTCG)} `}
                          {row.ltclAbsorbedAgainstLTCG > 0 &&
                            `LT→LT: ${fmtINRFull(row.ltclAbsorbedAgainstLTCG)}`}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Carried Forward */}
                  <td
                    style={{
                      padding: "12px 14px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: row.totalCarriedForward > 0 ? THEME.ink : THEME.muted,
                    }}
                  >
                    {row.totalCarriedForward > 0 ? (
                      <div>
                        <Money value={row.totalCarriedForward} variant="full" />
                        <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 400 }}>
                          STCL: {fmtINRFull(row.unabsorbedSTCL)} · LTCL:{" "}
                          {fmtINRFull(row.unabsorbedLTCL)}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Expiry Status */}
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    {!row.eligible ? (
                      <Badge variant="rust">Sec 80 Disqualified</Badge>
                    ) : row.isExpiringThisAY ? (
                      <Badge variant="rust">Final 8th Year</Badge>
                    ) : row.yearsRemaining <= 2 ? (
                      <Badge variant="gold">{row.yearsRemaining} yrs left</Badge>
                    ) : (
                      <Badge variant="sage">{row.yearsRemaining} yrs left</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                style={{
                  background: "color-mix(in srgb, var(--t-accent) 8%, transparent)",
                  borderTop: `2px solid ${THEME.line}`,
                  fontWeight: 700,
                }}
              >
                <td style={{ padding: "12px 14px" }} colSpan={2}>
                  Total Schedule CFL Totals
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <Money value={result.totalBFSTCLAvailable} variant="full" />
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <Money value={result.totalBFLTCLAvailable} variant="full" />
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right", color: THEME.sage }}>
                  <Money value={result.totalAbsorbed} variant="full" />
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right", color: THEME.ink }}>
                  <Money value={result.totalCarriedForward} variant="full" />
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <Badge variant="accent">FIFO Applied</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ── Statutory Compliance Guidance Card ─────────────────────── */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <ShieldAlert size={16} color={THEME.accent} />
          <span style={{ fontSize: 14, fontWeight: 700, color: THEME.ink }}>
            Statutory Loss Carry-Forward & Set-Off Rules (ICAI / Income Tax Act, 1961)
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "var(--surface-1)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.gold, marginBottom: 4 }}>
              Section 80: Mandatory On-Time Filing
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, lineHeight: 1.5 }}>
              Loss under head "Capital Gains" can be carried forward only if the return of income is
              filed on or before the statutory due date under Section 139(1) (July 31 / October 31).
              A belated return under Section 139(4) forfeits the right to carry forward that year's
              capital loss.
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "var(--surface-1)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.sage, marginBottom: 4 }}>
              Section 74(1): Asymmetric Set-Off
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, lineHeight: 1.5 }}>
              Brought-forward Short-Term Capital Loss (STCL) is versatile and can offset both STCG
              and LTCG of subsequent years. Brought-forward Long-Term Capital Loss (LTCL) can offset
              LTCG ONLY and cannot touch STCG.
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "var(--surface-1)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.accent, marginBottom: 4 }}>
              Section 74(2): 8-Assessment-Year Ceiling
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, lineHeight: 1.5 }}>
              Both STCL and LTCL can be carried forward for a maximum of 8 Assessment Years
              immediately succeeding the assessment year for which the loss was first computed.
              Losses from AY 2018-19 must be absorbed in AY 2026-27 or they will permanently lapse.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
