import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Home,
  Landmark,
  Building,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  Clock,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINRFull, today } from "../../utils/finance";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Money } from "../ui/Money";

/* ══════════════════════════════════════════════════════════════════
   STATUTORY CONSTANTS & COMPUTATION ENGINES
   ══════════════════════════════════════════════════════════════════ */

export const SEC_54_CAP = 100000000; // ₹10 Crore cap introduced by Finance Act 2023
export const SEC_54EC_ANNUAL_CAP = 5000000; // ₹50 Lakhs statutory cap u/s 54EC(1)
export const SEC_54F_CONSIDERATION_CAP = 100000000; // ₹10 Crore cap u/s 54F
export const LTCG_STATUTORY_TAX_RATE = 0.125; // 12.5% post-Finance Act (No. 2) 2024
export const HEALTH_EDU_CESS_RATE = 0.04; // 4% Health & Education Cess
export const EFFECTIVE_LTCG_RATE = LTCG_STATUTORY_TAX_RATE * (1 + HEALTH_EDU_CESS_RATE); // 13.0%

export interface ExemptionCalculationResult {
  section54Exemption: number;
  section54ECExemption: number;
  section54FExemption: number;
  totalExemption: number;
  netTaxableLTCG: number;
  taxSaved: number;
  notes: string[];
}

/**
 * Calculates Section 54 exemption for residential property transfer.
 */
export function calculateSection54Exemption({
  ltcg,
  newHouseInvestment,
  cgasDeposit = 0,
}: {
  ltcg: number;
  newHouseInvestment: number;
  cgasDeposit?: number;
}): { exemption: number; notes: string[] } {
  const notes: string[] = [];
  if (ltcg <= 0) return { exemption: 0, notes: ["No LTCG available for Section 54 exemption."] };

  const totalReinvested = Math.max(0, newHouseInvestment) + Math.max(0, cgasDeposit);
  let exemption = Math.min(ltcg, totalReinvested);

  if (exemption > SEC_54_CAP) {
    exemption = SEC_54_CAP;
    notes.push("Section 54 deduction capped at ₹10 Crore under Finance Act 2023 amendment.");
  }

  if (totalReinvested >= ltcg) {
    notes.push("100% Capital Gains sheltered under Section 54.");
  } else if (totalReinvested > 0) {
    notes.push(`Partial exemption claimed: ${fmtINRFull(exemption)} of ${fmtINRFull(ltcg)}.`);
  }

  return { exemption, notes };
}

/**
 * Calculates Section 54EC exemption for land/building transfer into specified bonds.
 */
export function calculateSection54ECExemption({
  ltcg,
  bondInvestment,
  existing54ECInvestmentsInFY = 0,
}: {
  ltcg: number;
  bondInvestment: number;
  existing54ECInvestmentsInFY?: number;
}): { exemption: number; notes: string[] } {
  const notes: string[] = [];
  if (ltcg <= 0) return { exemption: 0, notes: ["No LTCG available for Section 54EC exemption."] };

  const headroom = Math.max(0, SEC_54EC_ANNUAL_CAP - existing54ECInvestmentsInFY);
  const eligibleInvestment = Math.min(Math.max(0, bondInvestment), headroom);
  const exemption = Math.min(ltcg, eligibleInvestment);

  if (bondInvestment > headroom) {
    notes.push(
      `Statutory cap enforced: Section 54EC allows maximum ₹50,00,000 across specified bonds (REC/NHAI/PFC/IRFC) per FY.`
    );
  }

  return { exemption, notes };
}

/**
 * Calculates Section 54F proportional exemption for non-residential capital assets.
 */
export function calculateSection54FExemption({
  ltcg,
  netConsideration,
  newHouseInvestment,
  cgasDeposit = 0,
  residentialHousesOwned = 0,
}: {
  ltcg: number;
  netConsideration: number;
  newHouseInvestment: number;
  cgasDeposit?: number;
  residentialHousesOwned?: number;
}): { exemption: number; notes: string[] } {
  const notes: string[] = [];
  if (residentialHousesOwned > 1) {
    return {
      exemption: 0,
      notes: [
        "Ineligible: Assessee owns more than 1 residential house property on the date of transfer (Section 54F proviso).",
      ],
    };
  }
  if (ltcg <= 0 || netConsideration <= 0) {
    return { exemption: 0, notes: ["LTCG and Net Consideration must be positive."] };
  }

  const totalReinvested = Math.max(0, newHouseInvestment) + Math.max(0, cgasDeposit);
  const cappedConsideration = Math.min(netConsideration, SEC_54F_CONSIDERATION_CAP);
  const cappedReinvestment = Math.min(totalReinvested, cappedConsideration);

  let exemption = Math.round((ltcg * cappedReinvestment) / cappedConsideration);
  exemption = Math.min(ltcg, exemption);

  if (netConsideration > SEC_54F_CONSIDERATION_CAP) {
    notes.push("Net consideration capped at ₹10 Crore under Section 54F (Finance Act 2023).");
  }

  notes.push(
    `Proportional exemption formula applied: LTCG (${fmtINRFull(ltcg)}) × Reinvested (${fmtINRFull(cappedReinvestment)}) / Consideration (${fmtINRFull(cappedConsideration)}).`
  );

  return { exemption, notes };
}

/**
 * Calculates statutory deadlines based on date of transfer.
 */
export function calculateStatutoryDeadlines(transferDateStr: string) {
  const base = transferDateStr ? new Date(transferDateStr) : new Date();
  const validBase = isNaN(base.getTime()) ? new Date() : base;

  // 1. 54EC Bonds: 6 calendar months
  const bondDeadline = new Date(validBase);
  bondDeadline.setMonth(bondDeadline.getMonth() + 6);

  // 2. CGAS Deposit: July 31 of AY following the FY of transfer
  const fyYear = validBase.getMonth() >= 3 ? validBase.getFullYear() : validBase.getFullYear() - 1;
  const ayYear = fyYear + 1;
  const cgasDeadline = new Date(ayYear, 6, 31); // July 31

  // 3. House Purchase: 2 years after transfer
  const purchaseDeadline = new Date(validBase);
  purchaseDeadline.setFullYear(purchaseDeadline.getFullYear() + 2);

  // 4. House Construction: 3 years after transfer
  const constructDeadline = new Date(validBase);
  constructDeadline.setFullYear(constructDeadline.getFullYear() + 3);

  const now = new Date();
  const getDaysLeft = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return [
    {
      key: "54ec_bond",
      title: "Section 54EC Bond Subscription",
      section: "Sec 54EC",
      deadlineDate: fmt(bondDeadline),
      daysLeft: getDaysLeft(bondDeadline),
      description: "Must invest in NHAI, REC, PFC or IRFC 54EC bonds within 6 months of sale.",
      badge: "6 Months statutory limit",
    },
    {
      key: "cgas_deposit",
      title: "CGAS 1988 Bank Deposit",
      section: "Sec 54 / 54F / CGAS",
      deadlineDate: fmt(cgasDeadline),
      daysLeft: getDaysLeft(cgasDeadline),
      description: "Unutilized capital gains must be deposited in designated bank account before ITR filing due date.",
      badge: "Sec 139(1) ITR Filing",
    },
    {
      key: "house_purchase",
      title: "New House Purchase Completion",
      section: "Sec 54 / 54F",
      deadlineDate: fmt(purchaseDeadline),
      daysLeft: getDaysLeft(purchaseDeadline),
      description: "Purchase completed within 2 years after transfer (or 1 year prior).",
      badge: "2 Years timeline",
    },
    {
      key: "house_construction",
      title: "New House Construction Handover",
      section: "Sec 54 / 54F",
      deadlineDate: fmt(constructDeadline),
      daysLeft: getDaysLeft(constructDeadline),
      description: "Construction of residential house completed within 3 years from transfer date.",
      badge: "3 Years timeline",
    },
  ];
}

/* ══════════════════════════════════════════════════════════════════
   STUDIO COMPONENT
   ══════════════════════════════════════════════════════════════════ */

interface CapitalGainsExemptionStudioProps {
  state: any;
  currentFYLTCG?: number;
  showToast?: (msg: string, type?: string) => void;
  setTab?: (tab: string) => void;
}

export const CapitalGainsExemptionStudio: React.FC<CapitalGainsExemptionStudioProps> = ({
  state,
  currentFYLTCG = 0,
  showToast,
  setTab,
}) => {
  // Mode: "simulator" | "deadlines" | "portfolio_crosscheck" | "rules"
  const [studioTab, setStudioTab] = useState<"simulator" | "deadlines" | "crosscheck" | "rules">("simulator");

  // Transfer Details Inputs
  const [assetType, setAssetType] = useState<"residential_house" | "land_or_commercial" | "securities_or_gold">("residential_house");
  const [transferDate, setTransferDate] = useState<string>(today());
  const [netConsideration, setNetConsideration] = useState<number>(15000000); // 1.5 Cr default
  const [indexedCost, setIndexedCost] = useState<number>(6000000); // 60 Lakhs default
  const [manualLTCG, setManualLTCG] = useState<number>(9000000); // 90 Lakhs default
  const [useCalculatedLTCG, setUseCalculatedLTCG] = useState<boolean>(true);

  // Exemption Reinvestment Inputs
  const [newHouseInvestment, setNewHouseInvestment] = useState<number>(6000000);
  const [cgasDeposit, setCgasDeposit] = useState<number>(1000000);
  const [sec54ECBonds, setSec54ECBonds] = useState<number>(2000000);
  const [existingHousesOwned, setExistingHousesOwned] = useState<number>(1);
  const [copiedScheduleCG, setCopiedScheduleCG] = useState(false);

  // Auto-detect 54EC Bonds in state
  const existing54ECBonds = useMemo(() => {
    return (state.bonds || []).filter((b: any) => {
      const name = (b.issuerName || b.name || b.securityNature || "").toLowerCase();
      return name.includes("54ec") || name.includes("nhai") || name.includes("rec") || name.includes("pfc") || name.includes("irfc");
    });
  }, [state.bonds]);

  const existing54ECTotal = useMemo(() => {
    return existing54ECBonds.reduce((acc: number, b: any) => {
      return (
        acc +
        Number(
          b.totalInvestmentAmount ||
            b.totalPrincipalAmount ||
            Number(b.numberOfUnits || 0) * Number(b.faceValuePerUnit || 0) ||
            b.principal ||
            b.faceValue ||
            0
        )
      );
    }, 0);
  }, [existing54ECBonds]);

  // Actual LTCG base for calculation
  const effectiveLTCG = useMemo(() => {
    if (useCalculatedLTCG) {
      return Math.max(0, netConsideration - indexedCost);
    }
    return Math.max(0, manualLTCG);
  }, [useCalculatedLTCG, netConsideration, indexedCost, manualLTCG]);

  // Calculate Exemptions based on Asset Type
  const computationResult: ExemptionCalculationResult = useMemo(() => {
    let s54 = 0;
    let s54ec = 0;
    let s54f = 0;
    const notes: string[] = [];

    if (assetType === "residential_house") {
      // Eligible for Section 54 & Section 54EC
      const res54 = calculateSection54Exemption({
        ltcg: effectiveLTCG,
        newHouseInvestment,
        cgasDeposit,
      });
      s54 = res54.exemption;
      notes.push(...res54.notes);

      // Section 54EC for remaining gain (if residential building included land)
      const remainingGain = Math.max(0, effectiveLTCG - s54);
      if (sec54ECBonds > 0 && remainingGain > 0) {
        const res54EC = calculateSection54ECExemption({
          ltcg: remainingGain,
          bondInvestment: sec54ECBonds,
          existing54ECInvestmentsInFY: existing54ECTotal,
        });
        s54ec = res54EC.exemption;
        notes.push(...res54EC.notes);
      }
    } else if (assetType === "land_or_commercial") {
      // Eligible for Section 54EC & Section 54F
      const res54EC = calculateSection54ECExemption({
        ltcg: effectiveLTCG,
        bondInvestment: sec54ECBonds,
        existing54ECInvestmentsInFY: existing54ECTotal,
      });
      s54ec = res54EC.exemption;
      notes.push(...res54EC.notes);

      const remainingGain = Math.max(0, effectiveLTCG - s54ec);
      if ((newHouseInvestment > 0 || cgasDeposit > 0) && remainingGain > 0) {
        const res54F = calculateSection54FExemption({
          ltcg: remainingGain,
          netConsideration,
          newHouseInvestment,
          cgasDeposit,
          residentialHousesOwned: existingHousesOwned,
        });
        s54f = res54F.exemption;
        notes.push(...res54F.notes);
      }
    } else {
      // Securities, Mutual Funds, Gold (other than residential house) -> Section 54F only
      const res54F = calculateSection54FExemption({
        ltcg: effectiveLTCG,
        netConsideration,
        newHouseInvestment,
        cgasDeposit,
        residentialHousesOwned: existingHousesOwned,
      });
      s54f = res54F.exemption;
      notes.push(...res54F.notes);
    }

    const totalExemption = Math.min(effectiveLTCG, s54 + s54ec + s54f);
    const netTaxableLTCG = Math.max(0, effectiveLTCG - totalExemption);
    const taxSaved = Math.round(totalExemption * EFFECTIVE_LTCG_RATE);

    return {
      section54Exemption: s54,
      section54ECExemption: s54ec,
      section54FExemption: s54f,
      totalExemption,
      netTaxableLTCG,
      taxSaved,
      notes,
    };
  }, [
    assetType,
    effectiveLTCG,
    netConsideration,
    newHouseInvestment,
    cgasDeposit,
    sec54ECBonds,
    existing54ECTotal,
    existingHousesOwned,
  ]);

  // Deadlines calculation
  const statutoryDeadlines = useMemo(
    () => calculateStatutoryDeadlines(transferDate),
    [transferDate]
  );

  // Quick Preset Handlers
  const handleApplyPreset = (preset: "res_to_res" | "land_to_bonds" | "shares_to_house") => {
    if (preset === "res_to_res") {
      setAssetType("residential_house");
      setNetConsideration(20000000);
      setIndexedCost(8000000);
      setNewHouseInvestment(10000000);
      setCgasDeposit(2000000);
      setSec54ECBonds(0);
      showToast?.("Applied Residential Flat Sale → Sec 54 Reinvestment Preset", "info");
    } else if (preset === "land_to_bonds") {
      setAssetType("land_or_commercial");
      setNetConsideration(12000000);
      setIndexedCost(4000000);
      setSec54ECBonds(5000000);
      setNewHouseInvestment(0);
      setCgasDeposit(0);
      showToast?.("Applied Land/Commercial Sale → Sec 54EC Max ₹50L Bonds Preset", "info");
    } else if (preset === "shares_to_house") {
      setAssetType("securities_or_gold");
      setNetConsideration(10000000);
      setIndexedCost(2500000);
      setNewHouseInvestment(8000000);
      setCgasDeposit(2000000);
      setSec54ECBonds(0);
      setExistingHousesOwned(1);
      showToast?.("Applied Shares/MF Portfolio Sale → Sec 54F Proportional Preset", "info");
    }
  };

  const handleCopyScheduleCGText = () => {
    const text = `
ITR SCHEDULE CG EXEMPTION DISCLOSURE REPORT
════════════════════════════════════════════════════════════════
Asset Nature: ${assetType.replace(/_/g, " ").toUpperCase()}
Transfer Date: ${transferDate}
Gross Sale Consideration: ₹${netConsideration.toLocaleString("en-IN")}
Cost of Acquisition / Indexed Cost: ₹${indexedCost.toLocaleString("en-IN")}
Long-Term Capital Gain: ₹${effectiveLTCG.toLocaleString("en-IN")}

EXEMPTIONS CLAIMED UNDER CHAPTER IV-E:
• Section 54 (Residential House): ₹${computationResult.section54Exemption.toLocaleString("en-IN")}
• Section 54EC (Capital Gains Bonds): ₹${computationResult.section54ECExemption.toLocaleString("en-IN")}
• Section 54F (Proportional Exemption): ₹${computationResult.section54FExemption.toLocaleString("en-IN")}
• CGAS 1988 Deposit Claimed: ₹${cgasDeposit.toLocaleString("en-IN")}

NET TAXABLE LTCG: ₹${computationResult.netTaxableLTCG.toLocaleString("en-IN")}
ESTIMATED TAX SAVED (12.5% + 4% CESS): ₹${computationResult.taxSaved.toLocaleString("en-IN")}
════════════════════════════════════════════════════════════════
Generated by ArthaDrishti Capital Gains & Tax Studio
`.trim();

    navigator.clipboard.writeText(text);
    setCopiedScheduleCG(true);
    setTimeout(() => setCopiedScheduleCG(false), 2500);
    showToast?.("Schedule CG Exemption Disclosure copied to clipboard", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Studio Header Banner ─────────────────────────────────── */}
      <Card
        style={{
          padding: 20,
          background: `linear-gradient(135deg, color-mix(in srgb, ${THEME.accent} 10%, transparent), color-mix(in srgb, ${THEME.sage} 8%, transparent))`,
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
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: THEME.accent,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                  Capital Gains Exemption Studio (Sec 54, 54EC, 54F & CGAS)
                </h3>
                <p style={{ fontSize: 12, color: THEME.muted, margin: "3px 0 0" }}>
                  Model statutory tax shelters, calculate proportional 54F deductions, enforce ₹50L / ₹10Cr limits & track compliance deadlines
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              icon={copiedScheduleCG ? <Check size={14} color="var(--t-sage)" /> : <Copy size={14} />}
              onClick={handleCopyScheduleCGText}
            >
              {copiedScheduleCG ? "Copied Disclosure" : "Copy Schedule CG Disclosure"}
            </Button>
          </div>
        </div>

        {/* Studio Sub-Navigation */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 16,
            padding: 4,
            background: "var(--t-paper)",
            borderRadius: 10,
            border: `1px solid ${THEME.line}`,
            overflowX: "auto",
          }}
        >
          {[
            { id: "simulator", label: "Interactive Exemption Simulator", icon: Sparkles },
            { id: "deadlines", label: "Statutory Deadlines Radar", icon: Calendar },
            { id: "crosscheck", label: "Portfolio Cross-Reference", icon: Layers, count: existing54ECBonds.length },
            { id: "rules", label: "Tax Law Provisions & Caps", icon: FileText },
          ].map((tab) => {
            const active = studioTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setStudioTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : THEME.muted,
                  background: active ? THEME.accent : "transparent",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: active ? "rgba(255,255,255,0.25)" : "var(--surface-2)",
                      color: active ? "#fff" : THEME.ink,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── TAB 1: INTERACTIVE EXEMPTION SIMULATOR ─────────────────── */}
      {studioTab === "simulator" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick Scenario Presets */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              padding: "10px 14px",
              background: "var(--surface-1)",
              borderRadius: 10,
              border: `1px solid ${THEME.line}`,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: THEME.muted, textTransform: "uppercase" }}>
              Quick Presets:
            </span>
            <button
              onClick={() => handleApplyPreset("res_to_res")}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${THEME.line}`,
                background: "var(--t-paper)",
                color: THEME.ink,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Home size={12} color="var(--t-sage)" /> Residential House (Sec 54)
            </button>
            <button
              onClick={() => handleApplyPreset("land_to_bonds")}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${THEME.line}`,
                background: "var(--t-paper)",
                color: THEME.ink,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Landmark size={12} color="var(--t-accent)" /> Land / Plot → 54EC Bonds (₹50L Cap)
            </button>
            <button
              onClick={() => handleApplyPreset("shares_to_house")}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${THEME.line}`,
                background: "var(--t-paper)",
                color: THEME.ink,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Building size={12} color="var(--t-gold)" /> Shares / MF → House (Sec 54F Proportional)
            </button>
          </div>

          {/* Key Stat Radar Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                Gross Capital Gain (LTCG)
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: THEME.ink, marginTop: 4 }}>
                <Money value={effectiveLTCG} variant="full" />
              </div>
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
                Net Consideration: {fmtINRFull(netConsideration)}
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                Total Exemption Claimed
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t-sage)", marginTop: 4 }}>
                <Money value={computationResult.totalExemption} variant="full" />
              </div>
              <div style={{ fontSize: 11, color: "var(--t-sage)", marginTop: 4 }}>
                {effectiveLTCG > 0
                  ? `${Math.round((computationResult.totalExemption / effectiveLTCG) * 100)}% Sheltered`
                  : "0%"}
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                Net Taxable LTCG
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: computationResult.netTaxableLTCG > 0 ? "var(--t-rust)" : "var(--t-sage)", marginTop: 4 }}>
                <Money value={computationResult.netTaxableLTCG} variant="full" />
              </div>
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
                Taxed @ 12.5% + 4% cess u/s 112/112A
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                Direct Tax Saved
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: THEME.accent, marginTop: 4 }}>
                <Money value={computationResult.taxSaved} variant="full" />
              </div>
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
                Effective 13.0% statutory savings
              </div>
            </Card>
          </div>

          {/* Form & Controls Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {/* Left Card: Original Asset Transfer Details */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Building size={16} color={THEME.accent} />
                <h4 style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                  1. Original Asset Transfer Details
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted, display: "block", marginBottom: 4 }}>
                    Asset Transferred / Sold:
                  </label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as any)}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="residential_house">Residential House Property (Sec 54 & Sec 54EC eligible)</option>
                    <option value="land_or_commercial">Land, Commercial Plot or Office (Sec 54EC & Sec 54F eligible)</option>
                    <option value="securities_or_gold">Listed Equities, Mutual Funds or Gold (Sec 54F eligible)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted, display: "block", marginBottom: 4 }}>
                    Date of Transfer / Deed Registration:
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted, display: "block", marginBottom: 4 }}>
                    Gross Net Consideration / Sale Value (₹):
                  </label>
                  <input
                    type="number"
                    value={netConsideration}
                    onChange={(e) => setNetConsideration(Math.max(0, Number(e.target.value)))}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Formatted: {fmtINRFull(netConsideration)}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted, display: "block", marginBottom: 4 }}>
                    Cost of Acquisition / Indexed Cost (₹):
                  </label>
                  <input
                    type="number"
                    value={indexedCost}
                    onChange={(e) => setIndexedCost(Math.max(0, Number(e.target.value)))}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}
                  />
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Formatted: {fmtINRFull(indexedCost)}
                  </div>
                </div>

                {assetType !== "residential_house" && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted, display: "block", marginBottom: 4 }}>
                      Existing Residential Houses Owned on Transfer Date:
                    </label>
                    <select
                      value={existingHousesOwned}
                      onChange={(e) => setExistingHousesOwned(Number(e.target.value))}
                      className="form-input"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}
                    >
                      <option value={0}>0 Houses (Fully Eligible for Sec 54F)</option>
                      <option value={1}>1 House (Fully Eligible for Sec 54F)</option>
                      <option value={2}>2 or more Houses (INELIGIBLE for Sec 54F)</option>
                    </select>
                    {existingHousesOwned > 1 && (
                      <div style={{ fontSize: 11, color: "var(--t-rust)", marginTop: 4, fontWeight: 600 }}>
                        ⚠️ Disqualified u/s 54F: Assessee cannot own more than 1 residential house.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Right Card: Reinvestment & Exemption Deployment */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Landmark size={16} color="var(--t-sage)" />
                <h4 style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                  2. Reinvestment & Exemption Shelter
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Section 54 / 54F Residential House Investment */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted }}>
                      Investment in New Residential House (₹):
                    </label>
                    <Badge variant="outline">
                      {assetType === "residential_house" ? "Sec 54" : "Sec 54F"}
                    </Badge>
                  </div>
                  <input
                    type="number"
                    value={newHouseInvestment}
                    onChange={(e) => setNewHouseInvestment(Math.max(0, Number(e.target.value)))}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Formatted: {fmtINRFull(newHouseInvestment)} · Max ₹10 Crore
                  </div>
                </div>

                {/* Capital Gains Account Scheme (CGAS 1988) */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted }}>
                      Deposit in CGAS Account (Type A / B) (₹):
                    </label>
                    <Badge variant="neutral">CGAS 1988</Badge>
                  </div>
                  <input
                    type="number"
                    value={cgasDeposit}
                    onChange={(e) => setCgasDeposit(Math.max(0, Number(e.target.value)))}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}
                  />
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Formatted: {fmtINRFull(cgasDeposit)} · Deposit before July 31 return due date
                  </div>
                </div>

                {/* Section 54EC Bonds */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: THEME.muted }}>
                      Specified Capital Gains Bonds (NHAI / REC / PFC) (₹):
                    </label>
                    <Badge variant={sec54ECBonds > SEC_54EC_ANNUAL_CAP ? "danger" : "outline"}>
                      Sec 54EC (Max ₹50L)
                    </Badge>
                  </div>
                  <input
                    type="number"
                    value={sec54ECBonds}
                    onChange={(e) => setSec54ECBonds(Math.max(0, Number(e.target.value)))}
                    disabled={assetType === "securities_or_gold"}
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      opacity: assetType === "securities_or_gold" ? 0.5 : 1,
                    }}
                  />
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Formatted: {fmtINRFull(sec54ECBonds)}
                    {existing54ECTotal > 0 && ` (Existing portfolio bonds: ${fmtINRFull(existing54ECTotal)})`}
                  </div>
                  {sec54ECBonds > SEC_54EC_ANNUAL_CAP && (
                    <div style={{ fontSize: 11, color: "var(--t-rust)", marginTop: 2, fontWeight: 600 }}>
                      ⚠️ Statutory ceiling: Max ₹50,00,000 allowed per FY under Section 54EC.
                    </div>
                  )}
                </div>

                {/* Auditor Observations Strip */}
                {computationResult.notes.length > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "var(--surface-1)",
                      border: `1px solid ${THEME.line}`,
                      marginTop: 4,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
                      Auditor Compliance Notes:
                    </div>
                    {computationResult.notes.map((note, idx) => (
                      <div
                        key={idx}
                        style={{ fontSize: 11, color: THEME.ink, marginTop: 3, display: "flex", gap: 5 }}
                      >
                        <Info size={12} color={THEME.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: STATUTORY DEADLINES RADAR ───────────────────────── */}
      {studioTab === "deadlines" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
              Statutory Compliance Timelines based on Transfer Date ({transferDate}):
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {statutoryDeadlines.map((dl) => {
              const isUrgent = dl.daysLeft <= 60 && dl.daysLeft > 0;
              const isExpired = dl.daysLeft <= 0;
              return (
                <Card
                  key={dl.key}
                  style={{
                    padding: 16,
                    border: isExpired
                      ? "1px solid color-mix(in srgb, var(--t-rust) 35%, transparent)"
                      : isUrgent
                      ? "1px solid color-mix(in srgb, var(--t-gold) 45%, transparent)"
                      : `1px solid ${THEME.line}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Badge variant={isExpired ? "danger" : isUrgent ? "warning" : "success"}>
                      {dl.section}
                    </Badge>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isExpired ? "var(--t-rust)" : isUrgent ? "var(--t-gold)" : "var(--t-sage)" }}>
                      {isExpired ? "DEADLINE LAPSED" : `${dl.daysLeft} days left`}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, marginTop: 8 }}>
                    {dl.title}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: THEME.accent, marginTop: 2 }}>
                    Due on: {dl.deadlineDate}
                  </div>
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 6, lineHeight: 1.5 }}>
                    {dl.description}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: PORTFOLIO CROSS-REFERENCE ──────────────────────── */}
      {studioTab === "crosscheck" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Landmark size={18} color={THEME.accent} />
                <h4 style={{ fontSize: 15, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                  Active Section 54EC Bonds in Portfolio ({existing54ECBonds.length})
                </h4>
              </div>
              <Badge variant="outline">
                Total Invested: {fmtINRFull(existing54ECTotal)} / ₹50L Cap
              </Badge>
            </div>

            {existing54ECBonds.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 16px", color: THEME.muted, fontSize: 13 }}>
                No active Section 54EC capital gains bonds found in Investments.
                <div style={{ marginTop: 8 }}>
                  {setTab && (
                    <Button variant="secondary" size="sm" onClick={() => setTab("investments")}>
                      View Investments Workspace
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                {existing54ECBonds.map((b: any, idx: number) => {
                  const amt = Number(
                    b.totalInvestmentAmount ||
                      b.totalPrincipalAmount ||
                      Number(b.numberOfUnits || 0) * Number(b.faceValuePerUnit || 0) ||
                      b.principal ||
                      b.faceValue ||
                      0
                  );
                  return (
                    <div
                      key={b.id || idx}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "var(--surface-1)",
                        border: `1px solid ${THEME.line}`,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                        {b.issuerName || b.name || "54EC Capital Gains Bond"}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--t-sage)", marginTop: 4 }}>
                        {fmtINRFull(amt)}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
                        Coupon: {b.couponRate || 5.25}% p.a. · 5-Year Lock-in
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Current FY Stock/MF Realized LTCG Eligible for 54F */}
          {currentFYLTCG > 0 && (
            <Card
              style={{
                padding: 16,
                border: "1px solid color-mix(in srgb, var(--t-sage) 35%, transparent)",
                background: "color-mix(in srgb, var(--t-sage) 5%, transparent)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>
                    Current FY Realized Long-Term Capital Gains: {fmtINRFull(currentFYLTCG)}
                  </div>
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Eligible for Section 54F shelter by investing sale proceeds into a residential house or CGAS.
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAssetType("securities_or_gold");
                    setManualLTCG(currentFYLTCG);
                    setUseCalculatedLTCG(false);
                    setStudioTab("simulator");
                    showToast?.(`Imported ₹${Math.round(currentFYLTCG).toLocaleString("en-IN")} into Simulator`, "success");
                  }}
                >
                  Import into Sec 54F Simulator
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB 4: TAX LAW PROVISIONS & CAPS ──────────────────────── */}
      {studioTab === "rules" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          <Card style={{ padding: 16 }}>
            <Badge variant="success">Section 54</Badge>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, margin: "8px 0 4px" }}>
              Residential House Transfer
            </h4>
            <div style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.6 }}>
              • Reinvest LTCG from residential house into 1 new residential house in India (or 2 if LTCG ≤ ₹2 Cr once in lifetime).<br />
              • Purchase within 1 year before or 2 years after sale, OR construct within 3 years.<br />
              • Budget 2023 Cap: Maximum exemption is strictly capped at ₹10 Crore.<br />
              • Lock-in: 3 years for new house property.
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <Badge variant="outline">Section 54EC</Badge>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, margin: "8px 0 4px" }}>
              Capital Gains Bonds
            </h4>
            <div style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.6 }}>
              • Transfer of land or building reinvested in specified bonds: NHAI, REC, PFC, IRFC.<br />
              • Investment must occur within 6 months of sale date.<br />
              • Statutory Cap: Maximum deduction is ₹50,00,000 (₹50 Lakhs) per financial year.<br />
              • Lock-in: 5 years (cannot be transferred, pledged, or encashed prematurely).
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <Badge variant="warning">Section 54F</Badge>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, margin: "8px 0 4px" }}>
              Non-Residential Capital Assets
            </h4>
            <div style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.6 }}>
              • Transfer of any long-term asset other than a residential house (shares, mutual funds, gold, commercial plot).<br />
              • Must reinvest Net Sale Consideration into 1 residential house.<br />
              • Proportional Formula: Exemption = LTCG × (Amount Reinvested / Net Consideration).<br />
              • Disqualification: Assessee must not own more than 1 residential house on transfer date.
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <Badge variant="neutral">CGAS 1988</Badge>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, margin: "8px 0 4px" }}>
              Capital Gains Account Scheme
            </h4>
            <div style={{ fontSize: 12, color: THEME.muted, lineHeight: 1.6 }}>
              • If new house is not purchased/constructed before return filing due date u/s 139(1) (July 31), deposit unutilized gains in CGAS.<br />
              • Type A (Savings Account) or Type B (Term Deposit) with authorized banks.<br />
              • Funds must be utilized within statutory 2 or 3 years, else unutilized amount is taxed in expiry year.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
