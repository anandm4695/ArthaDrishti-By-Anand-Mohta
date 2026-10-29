import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import {
  fmtINRFull,
  exportArrayToCSV,
  today,
  rdMaturity,
  rdElapsed,
  isDepositClosed,
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

interface SolvencyScorecardProps {
  state: any;
  metrics: any;
  showToast?: (msg: string, type?: string) => void;
}

type StressScenarioId =
  | "BASELINE"
  | "EQUITY_CRASH_20"
  | "EQUITY_CRASH_40"
  | "RATE_HIKE_200BPS"
  | "INCOME_LOSS_6M";

const STRESS_SCENARIOS: {
  id: StressScenarioId;
  label: string;
  description: string;
  equityHaircut: number;
  emiMultiplier: number;
  liquidDrawdownMonths: number;
}[] = [
  {
    id: "BASELINE",
    label: "Baseline (Current)",
    description: "Unstressed current balance sheet & cash flows",
    equityHaircut: 0,
    emiMultiplier: 1,
    liquidDrawdownMonths: 0,
  },
  {
    id: "EQUITY_CRASH_20",
    label: "Market Correction (-20%)",
    description: "20% drawdown across listed equities & mutual funds",
    equityHaircut: 0.2,
    emiMultiplier: 1,
    liquidDrawdownMonths: 0,
  },
  {
    id: "EQUITY_CRASH_40",
    label: "Severe Bear Crash (-40%)",
    description: "2008/2020-style 40% equity & MF shock",
    equityHaircut: 0.4,
    emiMultiplier: 1,
    liquidDrawdownMonths: 0,
  },
  {
    id: "RATE_HIKE_200BPS",
    label: "Rate Shock (+200 bps)",
    description: "+2% floating interest rate hike (~12% EMI increase)",
    equityHaircut: 0,
    emiMultiplier: 1.12,
    liquidDrawdownMonths: 0,
  },
  {
    id: "INCOME_LOSS_6M",
    label: "6-Mo Income Disruption",
    description: "6 months of living expenses + EMIs funded from liquid reserves",
    equityHaircut: 0,
    emiMultiplier: 1,
    liquidDrawdownMonths: 6,
  },
];

export const SolvencyScorecard: React.FC<SolvencyScorecardProps> = ({ state, metrics, showToast }) => {
  const [scenarioId, setScenarioId] = useState<StressScenarioId>("BASELINE");

  const calculations = useMemo(() => {
    // 1. Liquid Assets (Banks + FDs + active RDs + Prepaid Cards)
    const bankBal = (state.bankAccounts || []).reduce(
      (sum: number, b: any) => sum + Number(b.balance || 0),
      0
    );
    const fdVal = (state.fixedDeposits || []).reduce((sum: number, f: any) => {
      if (isDepositClosed(f)) return sum;
      return sum + Number(f.principal || 0);
    }, 0);
    const rdVal = (state.recurringDeposits || []).reduce((sum: number, r: any) => {
      if (r.payoutStatus === "credited" || r.status === "closed") return sum;
      const monthly = Number(r.monthly || 0);
      const rate = Number(r.rate || 0);
      const elapsed = rdElapsed(r, today());
      return sum + (rate > 0 ? rdMaturity(monthly, rate, elapsed) : monthly * elapsed);
    }, 0);
    const prepaidVal = (state.prepaidCards || [])
      .filter((pc: any) => (pc.status || "").toLowerCase() !== "closed")
      .reduce((sum: number, pc: any) => {
        const txns = pc.transactions || [];
        const loaded = txns
          .filter((t: any) => t.type === "load")
          .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
        const spent = txns
          .filter((t: any) => t.type === "spend")
          .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
        return sum + (loaded - spent);
      }, 0);

    const liquidAssets = Math.max(0, bankBal + fdVal + rdVal + prepaidVal);

    // 2. Marketable & Fixed-Income Investments (Stocks + MFs + Gold + Bonds)
    const stockVal = (state.stocks || []).reduce(
      (sum: number, s: any) => sum + Number(s.currentPrice || s.avgPrice || 0) * Number(s.qty || 0),
      0
    );
    const mfVal = (state.mutualFunds || []).reduce((sum: number, m: any) => {
      const units = Number(m.units || 0);
      const nav =
        Number(m.currentNav || 0) ||
        Number(m.nav || 0) ||
        Number(m.buyNav || 0) ||
        (units > 0 ? Number(m.invested || 0) / units : 0);
      return sum + (Number(m.current || 0) > 0 ? Number(m.current) : units * nav);
    }, 0);
    const goldPrice = getGoldPricePerGram(state);
    const goldVal = (state.goldHoldings || []).reduce((sum: number, g: any) => {
      const grams = Number(g.grams || g.weightGrams || 0);
      const purityMul = g.type === "physical" ? GOLD_PURITY_FACTOR[g.purity] || 1 : 1;
      const val = Number(g.currentValue || 0) > 0 ? Number(g.currentValue) : grams * goldPrice * purityMul;
      return sum + val;
    }, 0);
    const bondVal = (state.bonds || []).reduce(
      (sum: number, b: any) =>
        sum +
        Number(
          b.totalInvestmentAmount ||
            b.totalPrincipalAmount ||
            Number(b.numberOfUnits || 0) * Number(b.faceValuePerUnit || 0) ||
            b.faceValue ||
            b.principal ||
            0
        ),
      0
    );

    const equityAndMfAssets = stockVal + mfVal;
    const investmentAssets = equityAndMfAssets + goldVal + bondVal;

    // 3. Retirement, Insurance & Govt Schemes
    const ppfVal = (state.ppf || []).reduce((sum: number, p: any) => sum + Number(p.balance || 0), 0);
    const epfVal = (state.epf || []).reduce((sum: number, e: any) => {
      const calc = calculateEpfBalance(e);
      return sum + (calc > 0 ? calc : Number(e.currentBalance || e.balance || 0));
    }, 0);
    const npsVal = (state.nps || []).reduce((sum: number, n: any) => {
      const bal = Number(n.balance || 0);
      if (bal > 0) return sum + bal;
      return (
        sum +
        (n.transactions || []).reduce(
          (ss: number, t: any) => ss + (Number(t.employeeAmount) || 0) + (Number(t.employerAmount) || 0),
          0
        )
      );
    }, 0);
    const govtVal = (state.govtSchemes || []).reduce(
      (sum: number, sc: any) => sum + Number(sc.currentBalance || sc.investedAmount || 0),
      0
    );
    const licAndInvVal =
      (state.lic || []).reduce((sum: number, l: any) => {
        const tx = (l.transactions || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
        return sum + (tx > 0 ? tx : Number(l.premiumPaid || 0));
      }, 0) +
      (state.investmentPlans || []).reduce((sum: number, ip: any) => {
        const tx = (ip.transactions || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
        return sum + (tx > 0 ? tx : Number(ip.premiumPaid || 0));
      }, 0);

    const retirementAssets = ppfVal + epfVal + npsVal + govtVal + licAndInvVal;

    // 4. Real Assets & Receivables
    const realEstateVal = (state.realEstateProperties || [])
      .filter((r: any) => r.status !== "sold")
      .reduce((sum: number, r: any) => {
        const val = Number(r.marketValue || r.agreementValue || r.propertyValue || r.purchasePrice || 0);
        const owners = Array.isArray(r.owners) ? r.owners : null;
        const share =
          owners && owners.length > 0
            ? owners.reduce(
                (acc: number, o: any) => (o?.id !== "external" ? acc + Number(o.sharePct || 0) : acc),
                0
              ) / 100
            : 1;
        return sum + val * share;
      }, 0);
    const rentalPropVal = (state.rentalProperties || []).reduce(
      (sum: number, r: any) => sum + Number(r.propertyValue || 0),
      0
    );
    const vehicleVal = (state.vehicles || []).reduce(
      (sum: number, v: any) => sum + Number(v.currentValue || v.purchasePrice || 0),
      0
    );
    const receivablesVal =
      (state.loansGiven || []).reduce((sum: number, l: any) => sum + loanGivenOutstanding(l), 0) +
      (state.informalLent || []).reduce(
        (sum: number, i: any) => sum + informalPersonOutstanding(i),
        0
      ) +
      (state.rentedProperties || []).reduce((sum: number, rp: any) => {
        const actual =
          rp.depositTransactions && rp.depositTransactions.length > 0
            ? rp.depositTransactions.reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0)
            : Number(rp.securityDeposit || 0);
        return sum + Math.max(0, actual - Number(rp.depositReturned || 0));
      }, 0);

    const realAssets = realEstateVal + rentalPropVal + vehicleVal + receivablesVal;

    const totalGrossAssets = liquidAssets + investmentAssets + retirementAssets + realAssets;

    // 5. Liabilities
    const shortTermLiabilities =
      (state.creditCards || [])
        .filter((c: any) => (c.status || "").toLowerCase() !== "closed")
        .reduce((sum: number, c: any) => sum + getCcOutstanding(c), 0) +
      (state.informalBorrowed || []).reduce(
        (sum: number, i: any) => sum + informalPersonOutstanding(i),
        0
      );

    const rentalDepositLiability = (state.rentalProperties || []).reduce((s: number, p: any) => {
      const actualDeposit =
        p.depositTransactions && p.depositTransactions.length > 0
          ? p.depositTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0)
          : Number(p.securityDeposit || 0);
      const deducted = (p.depositDeductions || []).reduce(
        (a: number, d: any) => a + Number(d.amount || 0),
        0
      );
      const returned = Number(p.depositReturned || 0);
      return s + Math.max(0, actualDeposit - deducted - returned);
    }, 0);

    const realEstateOutstanding = (state.realEstateProperties || [])
      .filter((p: any) => p.status === "under-construction")
      .reduce((total: number, p: any) => {
        const demanded = (state.realEstateDemands || [])
          .filter((d: any) => d.propertyId === p.id)
          .reduce((s: number, d: any) => s + Number(d.totalAmount || d.amount || 0), 0);
        const paid = (state.realEstatePayments || [])
          .filter((pm: any) => pm.propertyId === p.id)
          .reduce((s: number, pm: any) => s + Number(pm.amount || 0), 0);
        const owners = Array.isArray(p.owners) ? p.owners : null;
        const share =
          owners && owners.length > 0
            ? owners.reduce(
                (acc: number, o: any) => (o?.id !== "external" ? acc + Number(o.sharePct || 0) : acc),
                0
              ) / 100
            : 1;
        return total + Math.max(0, demanded - paid) * share;
      }, 0);

    const totalLongTermDebt = (state.loansTaken || []).reduce(
      (sum: number, l: any) => sum + loanOutstanding(l),
      0
    );
    const totalLiabilities =
      shortTermLiabilities + totalLongTermDebt + rentalDepositLiability + realEstateOutstanding;

    const netWorth = totalGrossAssets - totalLiabilities;

    // 6. Cash Flow Metrics
    const monthlyIncome =
      Number(metrics?.monthIncome || (metrics?.annualIncome ? metrics.annualIncome / 12 : 0)) || 1;
    const monthlyExpense = Number(metrics?.monthExpense || 0) || 1;
    const monthlyTotalEmi = (state.loansTaken || [])
      .filter((l: any) => loanOutstanding(l) > 0)
      .reduce((sum: number, l: any) => sum + Number(l.emi || 0), 0);

    // 7. Ratios
    const solvencyRatio = totalGrossAssets > 0 ? (netWorth / totalGrossAssets) * 100 : 100;
    const shortTermObligations = shortTermLiabilities + monthlyTotalEmi * 12;
    const liquidRatio =
      shortTermObligations > 0 ? liquidAssets / shortTermObligations : liquidAssets > 0 ? 5.0 : 1.0;
    const dsrPct = monthlyIncome > 0 ? (monthlyTotalEmi / monthlyIncome) * 100 : 0;
    const emergencyRunwayMonths = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 12;
    const investmentRatio = netWorth > 0 ? ((investmentAssets + retirementAssets) / netWorth) * 100 : 0;

    const computeHealthScore = (
      solv: number,
      runway: number,
      dsr: number,
      liq: number
    ): number => {
      let sc = 0;
      if (solv >= 80) sc += 25;
      else if (solv >= 60) sc += 18;
      else sc += 10;

      if (runway >= 6) sc += 25;
      else if (runway >= 3) sc += 15;
      else sc += 5;

      if (dsr <= 30) sc += 25;
      else if (dsr <= 45) sc += 15;
      else sc += 5;

      if (liq >= 1.5) sc += 25;
      else if (liq >= 1.0) sc += 15;
      else sc += 8;
      return sc;
    };

    const score = computeHealthScore(solvencyRatio, emergencyRunwayMonths, dsrPct, liquidRatio);

    // 8. Stress Scenario Computation
    const activeScenario = STRESS_SCENARIOS.find((s) => s.id === scenarioId) || STRESS_SCENARIOS[0];
    const equityLoss = equityAndMfAssets * activeScenario.equityHaircut;
    const stressedEmi = monthlyTotalEmi * activeScenario.emiMultiplier;
    const liquidBurn =
      activeScenario.liquidDrawdownMonths * (monthlyExpense + stressedEmi);
    const stressedLiquid = Math.max(0, liquidAssets - liquidBurn);
    const stressedGrossAssets = Math.max(0, totalGrossAssets - equityLoss - liquidBurn);
    const stressedNetWorth = stressedGrossAssets - totalLiabilities;
    const stressedSolvencyRatio =
      stressedGrossAssets > 0 ? (stressedNetWorth / stressedGrossAssets) * 100 : 0;
    const stressedDsrPct = monthlyIncome > 0 ? (stressedEmi / monthlyIncome) * 100 : 0;
    const stressedRunwayMonths = monthlyExpense > 0 ? stressedLiquid / monthlyExpense : 0;
    const stressedShortTermObligations = shortTermLiabilities + stressedEmi * 12;
    const stressedLiquidRatio =
      stressedShortTermObligations > 0
        ? stressedLiquid / stressedShortTermObligations
        : stressedLiquid > 0
          ? 5.0
          : 0;
    const stressedScore = computeHealthScore(
      stressedSolvencyRatio,
      stressedRunwayMonths,
      stressedDsrPct,
      stressedLiquidRatio
    );

    return {
      totalGrossAssets,
      totalLiabilities,
      netWorth,
      liquidAssets,
      investmentAssets,
      retirementAssets,
      realAssets,
      monthlyIncome,
      monthlyExpense,
      monthlyTotalEmi,
      solvencyRatio,
      liquidRatio,
      dsrPct,
      emergencyRunwayMonths,
      investmentRatio,
      score,
      stress: {
        scenario: activeScenario,
        stressedNetWorth,
        nwDelta: stressedNetWorth - netWorth,
        stressedSolvencyRatio,
        stressedDsrPct,
        stressedRunwayMonths,
        stressedLiquidRatio,
        stressedScore,
      },
    };
  }, [state, metrics, scenarioId]);

  const handleExportCSV = () => {
    const rows = [
      { Metric: "Total Gross Assets", Value: calculations.totalGrossAssets, Benchmark: "N/A" },
      { Metric: "Total Liabilities", Value: calculations.totalLiabilities, Benchmark: "N/A" },
      { Metric: "Net Worth (Owner Capital)", Value: calculations.netWorth, Benchmark: "Positive Growth" },
      { Metric: "Solvency Ratio (%)", Value: `${calculations.solvencyRatio.toFixed(1)}%`, Benchmark: "> 70%" },
      { Metric: "Liquid Coverage Ratio", Value: `${calculations.liquidRatio.toFixed(2)}x`, Benchmark: "> 1.50x" },
      { Metric: "Debt Service Ratio (EMI/Income)", Value: `${calculations.dsrPct.toFixed(1)}%`, Benchmark: "< 30%" },
      { Metric: "Emergency Runway (Months)", Value: `${calculations.emergencyRunwayMonths.toFixed(1)} mos`, Benchmark: ">= 6.0 mos" },
      { Metric: "Auditor Health Score", Value: `${calculations.score} / 100`, Benchmark: ">= 80 (Prime)" },
    ];
    exportArrayToCSV(rows, `Financial-Solvency-Diagnostic-${new Date().toISOString().split("T")[0]}`);
    showToast?.("Solvency Scorecard exported to CSV", "success");
  };

  const isStressed = scenarioId !== "BASELINE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Executive Auditor Opinion Banner ── */}
      <Card
        style={{
          padding: 20,
          background: `linear-gradient(135deg, color-mix(in srgb, ${THEME.accent} 10%, transparent), color-mix(in srgb, ${THEME.sage} 6%, transparent))`,
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: THEME.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                Senior Auditor Solvency & Balance Sheet Health Diagnostic
              </h2>
              <p style={{ fontSize: 12, color: THEME.muted, margin: "2px 0 0" }}>
                Comprehensive liquidity, leverage ratios, capital structure integrity, and treasury stress tests
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
              Export Diagnostic
            </Button>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "var(--t-paper)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted }}>AUDITOR HEALTH SCORE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: calculations.score >= 80 ? "var(--t-sage)" : THEME.accent, marginTop: 2 }}>
              {calculations.score} <span style={{ fontSize: 13, color: THEME.muted }}>/ 100</span>
            </div>
            <Badge variant={calculations.score >= 80 ? "success" : calculations.score >= 60 ? "warning" : "danger"} style={{ marginTop: 6 }}>
              {calculations.score >= 80 ? "PRIME SOLVENCY" : calculations.score >= 60 ? "ADEQUATE" : "HIGH LEVERAGE"}
            </Badge>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "var(--t-paper)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted }}>SOLVENCY RATIO</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: THEME.ink, marginTop: 2 }}>
              {calculations.solvencyRatio.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
              Net Worth is {calculations.solvencyRatio.toFixed(1)}% of Gross Assets (Target: &gt; 70%)
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "var(--t-paper)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted }}>LIQUIDITY COVERAGE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: THEME.ink, marginTop: 2 }}>
              {calculations.liquidRatio.toFixed(2)}x
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
              Liquid funds cover short-term dues {calculations.liquidRatio.toFixed(2)} times
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "var(--t-paper)",
              border: `1px solid ${THEME.line}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted }}>DEBT SERVICE (DSR)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: calculations.dsrPct > 40 ? "var(--t-rust)" : THEME.ink, marginTop: 2 }}>
              {calculations.dsrPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
              EMIs consume {calculations.dsrPct.toFixed(1)}% of monthly income (Safe &lt; 30%)
            </div>
          </div>
        </div>
      </Card>

      {/* ── Interactive Treasury Stress-Test Simulator (New Feature) ── */}
      <Card style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} color="var(--t-gold)" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                Interactive Treasury Stress-Test Simulator
              </h3>
              <p style={{ fontSize: 11.5, color: THEME.muted, margin: "2px 0 0" }}>
                Simulate macro-economic shocks to test family balance sheet resilience
              </p>
            </div>
          </div>
          {isStressed && (
            <Badge variant="warning">
              STRESS ACTIVE: {calculations.stress.scenario.label.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Scenario Selector Pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {STRESS_SCENARIOS.map((sc) => {
            const active = scenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScenarioId(sc.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: active
                    ? `1.5px solid ${THEME.accent}`
                    : `1px solid ${THEME.line}`,
                  background: active
                    ? `color-mix(in srgb, ${THEME.accent} 12%, transparent)`
                    : "var(--t-paper)",
                  color: active ? THEME.accent : THEME.ink,
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {sc.label}
              </button>
            );
          })}
        </div>

        {/* Stress Impact Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            padding: 14,
            borderRadius: 10,
            background: isStressed
              ? "color-mix(in srgb, var(--t-gold) 6%, transparent)"
              : "color-mix(in srgb, var(--t-paper) 60%, transparent)",
            border: `1px solid ${isStressed ? "color-mix(in srgb, var(--t-gold) 35%, transparent)" : THEME.line}`,
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
              Simulated Net Worth
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, marginTop: 4 }}>
              <Money value={calculations.stress.stressedNetWorth} variant="full" />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: calculations.stress.nwDelta < 0 ? "var(--t-rust)" : "var(--t-sage)",
                marginTop: 2,
              }}
            >
              {calculations.stress.nwDelta < 0
                ? `Impact: −${fmtINRFull(Math.abs(calculations.stress.nwDelta))}`
                : "No Drawdown (Baseline)"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
              Stressed Solvency Ratio
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, marginTop: 4 }}>
              {calculations.stress.stressedSolvencyRatio.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              Baseline: {calculations.solvencyRatio.toFixed(1)}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
              Stressed Runway
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, marginTop: 4 }}>
              {calculations.stress.stressedRunwayMonths.toFixed(1)} mos
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              Baseline: {calculations.emergencyRunwayMonths.toFixed(1)} mos
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.muted, textTransform: "uppercase" }}>
              Stressed Health Score
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color:
                  calculations.stress.stressedScore >= 75
                    ? "var(--t-sage)"
                    : calculations.stress.stressedScore >= 55
                      ? "var(--t-gold)"
                      : "var(--t-rust)",
                marginTop: 4,
              }}
            >
              {calculations.stress.stressedScore} / 100
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              {calculations.stress.scenario.description}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Detailed Auditor Findings & Actionable Recommendations ── */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: THEME.ink, margin: "0 0 14px" }}>
          Senior Auditor Assessment & Treasury Recommendations
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {calculations.emergencyRunwayMonths < 6 && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--t-gold) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--t-gold) 30%, transparent)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <AlertTriangle size={20} color="var(--t-gold)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                  Emergency Cash Runway Below Recommended 6-Month Benchmark
                </div>
                <div style={{ fontSize: 12, color: THEME.muted, marginTop: 2 }}>
                  Your current liquid reserves (₹{Math.round(calculations.liquidAssets).toLocaleString("en-IN")}) provide approximately {calculations.emergencyRunwayMonths.toFixed(1)} months of expense coverage. We recommend parking an additional ₹{Math.max(0, Math.round((6 - calculations.emergencyRunwayMonths) * calculations.monthlyExpense)).toLocaleString("en-IN")} in high-yield sweep-in FDs or liquid debt mutual funds.
                </div>
              </div>
            </div>
          )}

          {calculations.dsrPct > 35 && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--t-rust) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--t-rust) 30%, transparent)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <ShieldAlert size={20} color="var(--t-rust)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                  Elevated Debt Service Burden ({calculations.dsrPct.toFixed(1)}% of Monthly Inflow)
                </div>
                <div style={{ fontSize: 12, color: THEME.muted, marginTop: 2 }}>
                  Your recurring loan EMIs of ₹{Math.round(calculations.monthlyTotalEmi).toLocaleString("en-IN")}/mo exceed the conservative 30% ceiling. Prioritize prepaying high-interest personal loans or accelerating principal reduction.
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "color-mix(in srgb, var(--t-sage) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--t-sage) 30%, transparent)",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <CheckCircle2 size={20} color="var(--t-sage)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                Capital Structure & Solvency Integrity is Solid ({calculations.solvencyRatio.toFixed(1)}%)
              </div>
              <div style={{ fontSize: 12, color: THEME.muted, marginTop: 2 }}>
                The family balance sheet is backed by ₹{Math.round(calculations.netWorth).toLocaleString("en-IN")} in accumulated net worth, representing {calculations.solvencyRatio.toFixed(1)}% ownership of total gross assets (₹{Math.round(calculations.totalGrossAssets).toLocaleString("en-IN")}).
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
