/* eslint-disable */
import React, { useState, useMemo } from "react";
import {
  Calculator,
  Zap,
  CheckCircle2,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
  IndianRupee,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINR, fmtINRFull } from "../../utils/finance";
import { Money } from "../ui/Money";
import { Modal } from "../ui/Modal";

interface LoanPrepaymentDrawerProps {
  loan: any;
  onClose: () => void;
  onApplyPrepayment?: (amount: number) => void;
}

export function LoanPrepaymentDrawer({
  loan,
  onClose,
  onApplyPrepayment,
}: LoanPrepaymentDrawerProps) {
  const [mode, setMode] = useState<"lumpsum" | "stepup">("lumpsum");
  const [lumpSumStr, setLumpSumStr] = useState<string>("");
  const [extraMonthlyStr, setExtraMonthlyStr] = useState<string>("");

  const outstanding = Number(loan.outstanding ?? loan.principal) || 0;
  const principal = Number(loan.principal) || 0;
  const emi = Number(loan.emi) || 0;
  const rate = Number(loan.rate) || 0;
  const monthsRemaining = Number(loan.monthsRemaining) || 0;

  const currentMonths = useMemo(() => {
    if (monthsRemaining > 0) return monthsRemaining;
    const r = rate / 100 / 12;
    if (r > 0 && emi > r * outstanding) {
      return Math.ceil(-Math.log(1 - (r * outstanding) / emi) / Math.log(1 + r));
    }
    return emi > 0 ? Math.ceil(outstanding / emi) : 12;
  }, [outstanding, rate, emi, monthsRemaining]);

  const currentInterestRemaining = useMemo(() => {
    return Math.max(0, emi * currentMonths - outstanding);
  }, [emi, currentMonths, outstanding]);

  // Lump sum calculations
  const lumpSumAmount = Number(lumpSumStr) || 0;
  const lumpSumResults = useMemo(() => {
    if (lumpSumAmount <= 0) return null;
    if (lumpSumAmount >= outstanding) {
      return {
        isFullSettlement: true,
        newOutstanding: 0,
        newMonths: 0,
        monthsSaved: currentMonths,
        interestSaved: currentInterestRemaining,
        newPayoffDate: "Immediately (Today)",
      };
    }

    const newBal = outstanding - lumpSumAmount;
    const r = rate / 100 / 12;
    let newMonths: number;
    if (r > 0 && emi > r * newBal) {
      newMonths = Math.ceil(-Math.log(1 - (r * newBal) / emi) / Math.log(1 + r));
    } else {
      newMonths = emi > 0 ? Math.ceil(newBal / emi) : currentMonths;
    }

    const newInterest = Math.max(0, emi * newMonths - newBal);
    const interestSaved = Math.max(0, currentInterestRemaining - newInterest);
    const monthsSaved = Math.max(0, currentMonths - newMonths);

    const payoff = new Date();
    payoff.setMonth(payoff.getMonth() + newMonths);

    return {
      isFullSettlement: false,
      newOutstanding: newBal,
      newMonths,
      monthsSaved,
      interestSaved,
      newPayoffDate: payoff.toLocaleString("en-IN", { month: "short", year: "numeric" }),
    };
  }, [lumpSumAmount, outstanding, rate, emi, currentMonths, currentInterestRemaining]);

  // Step-up Monthly EMI calculations
  const extraMonthlyAmount = Number(extraMonthlyStr) || 0;
  const stepUpResults = useMemo(() => {
    if (extraMonthlyAmount <= 0) return null;
    const newEmi = emi + extraMonthlyAmount;
    const r = rate / 100 / 12;
    let newMonths: number;
    if (r > 0 && newEmi > r * outstanding) {
      newMonths = Math.ceil(-Math.log(1 - (r * outstanding) / newEmi) / Math.log(1 + r));
    } else {
      newMonths = newEmi > 0 ? Math.ceil(outstanding / newEmi) : currentMonths;
    }

    const newTotalPaid = newEmi * newMonths;
    const newInterest = Math.max(0, newTotalPaid - outstanding);
    const interestSaved = Math.max(0, currentInterestRemaining - newInterest);
    const monthsSaved = Math.max(0, currentMonths - newMonths);

    const payoff = new Date();
    payoff.setMonth(payoff.getMonth() + newMonths);

    return {
      newEmi,
      newMonths,
      monthsSaved,
      interestSaved,
      newPayoffDate: payoff.toLocaleString("en-IN", { month: "short", year: "numeric" }),
    };
  }, [extraMonthlyAmount, emi, rate, outstanding, currentMonths, currentInterestRemaining]);

  const setLumpPreset = (pctOrVal: number, isPercent = false) => {
    if (isPercent) {
      const val = Math.round((outstanding * pctOrVal) / 100);
      setLumpSumStr(String(val));
    } else {
      setLumpSumStr(String(Math.min(outstanding, pctOrVal)));
    }
  };

  return (
    <Modal title={`Prepayment & Fast-Payoff Simulator — ${loan.lender || "Loan"}`} onClose={onClose} maxWidth={780}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: "100%" }}>
        {/* Loan Baseline Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            padding: "12px 14px",
            background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
            borderRadius: 12,
            border: `1px solid var(--t-line)`,
          }}
        >
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Current Balance</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-rust)", marginTop: 2 }}>
              <Money value={outstanding} variant="exact" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Monthly EMI</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-accent)", marginTop: 2 }}>
              <Money value={emi} variant="exact" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Rate / Tenure</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-ink)", marginTop: 2 }}>
              {rate}% · {currentMonths}m
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Est. Interest Left</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-rust)", marginTop: 2 }}>
              <Money value={currentInterestRemaining} variant="exact" />
            </div>
          </div>
        </div>

        {/* Strategy Selector Tabs */}
        <div style={{ display: "flex", gap: 8, background: "var(--surface-1)", padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setMode("lumpsum")}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: mode === "lumpsum" ? "var(--surface-0)" : "transparent",
              color: mode === "lumpsum" ? "var(--t-ink)" : "var(--t-muted)",
              boxShadow: mode === "lumpsum" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} color="var(--t-accent)" /> Lump-Sum Prepayment
          </button>
          <button
            onClick={() => setMode("stepup")}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: mode === "stepup" ? "var(--surface-0)" : "transparent",
              color: mode === "stepup" ? "var(--t-ink)" : "var(--t-muted)",
              boxShadow: mode === "stepup" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Zap size={14} color="var(--t-gold)" /> Extra Monthly EMI Step-Up
          </button>
        </div>

        {/* Lump Sum Mode Inputs */}
        {mode === "lumpsum" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Prepayment Amount (₹)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "var(--t-muted)" }}>
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="Enter lump-sum prepayment amount"
                  value={lumpSumStr}
                  onChange={(e) => setLumpSumStr(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 28px",
                    borderRadius: 10,
                    border: `1px solid var(--t-line)`,
                    background: "var(--surface-0)",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--t-ink)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { label: "10% of Balance", action: () => setLumpPreset(10, true) },
                { label: "25% of Balance", action: () => setLumpPreset(25, true) },
                { label: "50% of Balance", action: () => setLumpPreset(50, true) },
                { label: "Full Foreclosure", action: () => setLumpPreset(100, true) },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid var(--t-line)`,
                    background: "var(--surface-1)",
                    color: "var(--t-ink)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Result Simulation */}
            {lumpSumResults && (
              <div
                style={{
                  marginTop: 6,
                  padding: 16,
                  borderRadius: 12,
                  background: lumpSumResults.isFullSettlement
                    ? "color-mix(in srgb, var(--t-sage) 10%, transparent)"
                    : "color-mix(in srgb, var(--t-accent) 8%, transparent)",
                  border: `1px solid ${
                    lumpSumResults.isFullSettlement
                      ? "color-mix(in srgb, var(--t-sage) 30%, transparent)"
                      : "color-mix(in srgb, var(--t-accent) 25%, transparent)"
                  }`,
                  borderLeft: `4px solid ${lumpSumResults.isFullSettlement ? "var(--t-sage)" : "var(--t-accent)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <CheckCircle2 size={18} color={lumpSumResults.isFullSettlement ? "var(--t-sage)" : "var(--t-accent)"} />
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--t-ink)" }}>
                    {lumpSumResults.isFullSettlement ? "100% Debt Elimination" : "Payoff Acceleration Impact"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div style={{ padding: "10px 12px", background: "var(--surface-0)", borderRadius: 10, border: `1px solid var(--t-line)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Interest Saved</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--t-sage)", marginTop: 2 }}>
                      <Money value={lumpSumResults.interestSaved} variant="full" />
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--surface-0)", borderRadius: 10, border: `1px solid var(--t-line)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Tenure Saved</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--t-accent)", marginTop: 2 }}>
                      {lumpSumResults.monthsSaved} months
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--surface-0)", borderRadius: 10, border: `1px solid var(--t-line)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>New Payoff Date</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-ink)", marginTop: 2 }}>
                      {lumpSumResults.newPayoffDate}
                    </div>
                  </div>
                </div>

                {onApplyPrepayment && (
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        onApplyPrepayment(lumpSumAmount);
                        onClose();
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "var(--t-sage)",
                        color: THEME.darkInk,
                        fontWeight: 900,
                        fontSize: 12,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={14} /> Record this Prepayment Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step-up Mode Inputs */}
        {mode === "stepup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Extra Monthly Contribution (+₹ / month)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "var(--t-muted)" }}>
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={extraMonthlyStr}
                  onChange={(e) => setExtraMonthlyStr(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 28px",
                    borderRadius: 10,
                    border: `1px solid var(--t-line)`,
                    background: "var(--surface-0)",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--t-ink)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Quick Step-Up Presets */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { label: "+ ₹1,000/mo", val: 1000 },
                { label: "+ ₹2,500/mo", val: 2500 },
                { label: "+ ₹5,000/mo", val: 5000 },
                { label: "+ ₹10,000/mo", val: 10000 },
              ].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => setExtraMonthlyStr(String(val))}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid var(--t-line)`,
                    background: "var(--surface-1)",
                    color: "var(--t-ink)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Step-Up Results */}
            {stepUpResults && (
              <div
                style={{
                  marginTop: 6,
                  padding: 16,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--t-gold) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--t-gold) 30%, transparent)",
                  borderLeft: `4px solid var(--t-gold)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Zap size={18} color="var(--t-gold)" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--t-ink)" }}>
                    Step-Up Acceleration Impact (New EMI: <Money value={stepUpResults.newEmi} variant="exact" />/mo)
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div style={{ padding: "10px 12px", background: "var(--surface-0)", borderRadius: 10, border: `1px solid var(--t-line)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Interest Saved</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--t-sage)", marginTop: 2 }}>
                      <Money value={stepUpResults.interestSaved} variant="full" />
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--surface-0)", borderRadius: 10, border: `1px solid var(--t-line)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>Months Saved</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--t-gold)", marginTop: 2 }}>
                      {stepUpResults.monthsSaved} months
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--surface-0)", borderRadius: 10, border: `1px solid var(--t-line)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--t-muted)" }}>New Payoff Date</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "var(--t-ink)", marginTop: 2 }}>
                      {stepUpResults.newPayoffDate}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
