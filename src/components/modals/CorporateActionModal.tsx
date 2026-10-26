import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Scissors,
  Gift,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Percent,
  Layers,
  Info,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field } from "../ui/Form";
import { StockLogo } from "../ui/BrandLogos";
import { Money } from "../ui/Money";
import { today } from "../../utils/finance";

export interface CorporateActionModalProps {
  group: {
    base: string;
    exchange: string;
    lots: any[];
  };
  saving?: boolean;
  onClose: () => void;
  onApply: (updates: any[], actionLog: any, removals: string[]) => void;
}

export function CorporateActionModal({
  group,
  saving = false,
  onClose,
  onApply,
}: CorporateActionModalProps) {
  const [type, setType] = useState<"split" | "bonus">("split");
  const [ratioN, setRatioN] = useState("2");
  const [ratioM, setRatioM] = useState("1");
  const [actionDate, setActionDate] = useState(today());

  const n = Number(ratioN) || 0;
  const m = Number(ratioM) || 0;

  const totalQty = useMemo(() => {
    return group.lots.reduce((s: number, l: any) => s + Number(l.qty || 0), 0);
  }, [group.lots]);

  const totalInv = useMemo(() => {
    return group.lots.reduce((s: number, l: any) => s + Number(l.qty || 0) * Number(l.avgPrice || 0), 0);
  }, [group.lots]);

  const oldWeightedAvg = totalQty > 0 ? totalInv / totalQty : 0;

  let newTotalQty = 0;
  if (n > 0 && m > 0) {
    newTotalQty = type === "split" ? Math.floor((totalQty * n) / m) : Math.floor((totalQty * (m + n)) / m);
  }

  const newAvgPreview = newTotalQty > 0 ? totalInv / newTotalQty : 0;
  const netExtraShares = newTotalQty - totalQty;

  const isValid = n > 0 && m > 0 && !!actionDate && (type === "split" ? n !== m : true);

  // Lot-by-lot detailed adjustment calculation
  const lotAdjustments = useMemo(() => {
    if (!isValid || newTotalQty <= 0) return [];

    const calcs = group.lots.map((lot: any) => {
      const oldQty = Number(lot.qty);
      const oldAvg = Number(lot.avgPrice);
      const exact = type === "split" ? (oldQty * n) / m : (oldQty * (m + n)) / m;
      return {
        lot,
        oldQty,
        oldAvg,
        floored: Math.floor(exact),
        remainder: exact - Math.floor(exact),
      };
    });

    let shortfall = newTotalQty - calcs.reduce((s: number, c: any) => s + c.floored, 0);
    const sorted = [...calcs].sort((a: any, b: any) => b.remainder - a.remainder);
    for (const c of sorted) {
      if (shortfall <= 0) break;
      c.floored += 1;
      shortfall -= 1;
    }

    return calcs.map((c: any) => {
      const newAvg = c.floored > 0 ? (c.oldQty * c.oldAvg) / c.floored : 0;
      return {
        lot: c.lot,
        oldQty: c.oldQty,
        oldAvg: c.oldAvg,
        newQty: c.floored,
        newAvg: Number(newAvg.toFixed(4)),
        lotExtraShares: c.floored - c.oldQty,
      };
    });
  }, [group.lots, isValid, newTotalQty, type, n, m]);

  // Ratio Preset Handlers
  const handleSetRatioPreset = (newN: string, newM: string) => {
    setRatioN(newN);
    setRatioM(newM);
  };

  const handleApply = useCallback(() => {
    if (!isValid) return;

    const updates = lotAdjustments
      .filter((c: any) => c.newQty > 0)
      .map((c: any) => ({
        id: c.lot.id,
        qty: String(c.newQty),
        avgPrice: String(Number(c.newAvg.toFixed(4))),
      }));

    const removals = lotAdjustments
      .filter((c: any) => c.newQty <= 0)
      .map((c: any) => c.lot.id);

    const actionLog = {
      symbol: group.base,
      exchange: group.exchange,
      actionType: type,
      ratioN: n,
      ratioM: m,
      actionDate,
      oldQty: totalQty,
      newQty: newTotalQty,
      oldAvgPrice: Number(oldWeightedAvg.toFixed(2)),
      newAvgPrice: Number(newAvgPreview.toFixed(2)),
    };

    onApply(updates, actionLog, removals);
  }, [isValid, lotAdjustments, group, type, n, m, actionDate, totalQty, newTotalQty, oldWeightedAvg, newAvgPreview, onApply]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to apply
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isValid && !saving) {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, saving, handleApply]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "color-mix(in srgb, var(--t-gold) 15%, transparent)",
              color: "var(--t-gold)",
            }}
          >
            {type === "split" ? <Scissors size={18} /> : <Gift size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-ink)" }}>
              Corporate Action — {group.base}
            </div>
            <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 500 }}>
              Stock Splits &amp; Bonus Issue Ledger • Capital-Preserving Cost Basis Readjustment
            </div>
          </div>
        </div>
      }
      onClose={onClose}
      maxWidth={1080}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Responsive Dual-Pane Workstation Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {/* ════════════ LEFT COLUMN: ACTION SETUP & RATIO CONFIGURATION ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Scrip Current Position Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "16px 18px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StockLogo symbol={group.base} exchange={group.exchange} size={42} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)" }}>
                        {group.base}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--surface-2)",
                          color: "var(--t-ink)",
                        }}
                      >
                        {group.exchange}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                      Holding: <strong>{totalQty} shares</strong> across {group.lots.length} lot{group.lots.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Total Cost Basis</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)" }}>
                    <Money value={totalInv} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t-muted)" }}>
                    Avg: ₹{oldWeightedAvg.toFixed(2)}/sh
                  </div>
                </div>
              </div>

              {/* Action Type Selector Cards */}
              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Corporate Action Mechanism *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setType("split");
                      setRatioN("2");
                      setRatioM("1");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      border: type === "split" ? "2px solid var(--t-accent)" : "1px solid var(--t-line)",
                      background: type === "split" ? "color-mix(in srgb, var(--t-accent) 10%, transparent)" : "var(--surface-1)",
                      color: "var(--t-ink)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Scissors size={18} style={{ color: "var(--t-accent)", marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: type === "split" ? "var(--t-accent)" : "var(--t-ink)" }}>
                        Stock Split
                      </div>
                      <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2, lineHeight: 1.3 }}>
                        Face value sub-division (e.g. 10 to 1). Increases share count proportionally.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType("bonus");
                      setRatioN("1");
                      setRatioM("1");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      border: type === "bonus" ? "2px solid var(--t-gold)" : "1px solid var(--t-line)",
                      background: type === "bonus" ? "color-mix(in srgb, var(--t-gold) 10%, transparent)" : "var(--surface-1)",
                      color: "var(--t-ink)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Gift size={18} style={{ color: "var(--t-gold)", marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: type === "bonus" ? "var(--t-gold)" : "var(--t-ink)" }}>
                        Bonus Issue
                      </div>
                      <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2, lineHeight: 1.3 }}>
                        Allotment of additional free shares from reserves (e.g. 1 bonus for 1 held).
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Ratio Configuration Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "16px 18px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Ratio Quick Pick Chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-muted)", marginBottom: 6 }}>
                  Common {type === "split" ? "Stock Split" : "Bonus Issue"} Ratios:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {type === "split" ? (
                    <>
                      {[
                        { label: "10 : 1 (FV 10 to 1)", n: "10", m: "1" },
                        { label: "5 : 1 (FV 10 to 2)", n: "5", m: "1" },
                        { label: "2 : 1 (FV 10 to 5)", n: "2", m: "1" },
                        { label: "5 : 2 (FV 5 to 2)", n: "5", m: "2" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSetRatioPreset(preset.n, preset.m)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: ratioN === preset.n && ratioM === preset.m ? "1px solid var(--t-accent)" : "1px solid var(--t-line)",
                            background: ratioN === preset.n && ratioM === preset.m ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "var(--surface-1)",
                            color: ratioN === preset.n && ratioM === preset.m ? "var(--t-accent)" : "var(--t-ink)",
                            cursor: "pointer",
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { label: "1 : 1 (1 Bonus per 1)", n: "1", m: "1" },
                        { label: "1 : 2 (1 Bonus per 2)", n: "1", m: "2" },
                        { label: "2 : 1 (2 Bonus per 1)", n: "2", m: "1" },
                        { label: "3 : 1 (3 Bonus per 1)", n: "3", m: "1" },
                        { label: "4 : 1 (4 Bonus per 1)", n: "4", m: "1" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSetRatioPreset(preset.n, preset.m)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: ratioN === preset.n && ratioM === preset.m ? "1px solid var(--t-gold)" : "1px solid var(--t-line)",
                            background: ratioN === preset.n && ratioM === preset.m ? "color-mix(in srgb, var(--t-gold) 15%, transparent)" : "var(--surface-1)",
                            color: ratioN === preset.n && ratioM === preset.m ? "var(--t-gold)" : "var(--t-ink)",
                            cursor: "pointer",
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Ratio N : M Input Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 10, alignItems: "end", marginBottom: 12 }}>
                <Field label={type === "split" ? "New Shares (Ratio N) *" : "Bonus Shares (Ratio N) *"}>
                  <input
                    aria-label={type === "split" ? "New Shares" : "Bonus Shares"}
                    style={{ ...inputBaseStyle, textAlign: "center", fontWeight: 800, fontSize: 16 }}
                    type="number"
                    min="1"
                    value={ratioN}
                    onChange={(e) => setRatioN(e.target.value)}
                    required
                  />
                </Field>

                <div style={{ paddingBottom: 10, fontWeight: 800, fontSize: 22, color: "var(--t-muted)", textAlign: "center" }}>
                  :
                </div>

                <Field label="Existing Shares (Ratio M) *">
                  <input
                    aria-label="Existing Shares"
                    style={{ ...inputBaseStyle, textAlign: "center", fontWeight: 800, fontSize: 16 }}
                    type="number"
                    min="1"
                    value={ratioM}
                    onChange={(e) => setRatioM(e.target.value)}
                    required
                  />
                </Field>
              </div>

              {/* Live Explanatory Text */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--surface-1)",
                  fontSize: 11,
                  color: "var(--t-ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Info size={14} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
                <span>
                  {type === "split" ? (
                    <>
                      <strong>Split Definition:</strong> Every {m} existing share(s) will be divided into {n} new shares ({ratioN}:{ratioM} split).
                    </>
                  ) : (
                    <>
                      <strong>Bonus Definition:</strong> For every {m} existing share(s) held, you will receive {n} bonus share(s) free of cost ({ratioN}:{ratioM} bonus).
                    </>
                  )}
                </span>
              </div>

              {/* Corporate Action Date */}
              <Field label="Ex-Date / Execution Date *">
                <input
                  aria-label="Corporate Action Date"
                  style={inputBaseStyle}
                  type="date"
                  max={today()}
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  required
                />
              </Field>
            </div>
          </div>

          {/* ════════════ RIGHT COLUMN: BEFORE VS AFTER SIMULATION & LOT LEDGER ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Visual Before vs After Comparison Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "18px 20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--t-ink)",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Percent size={14} style={{ color: "var(--t-accent)" }} />
                Position Readjustment Simulation
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ padding: "12px 14px", background: "var(--surface-1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Total Holdings Qty</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 14, color: "var(--t-muted)", textDecoration: "line-through" }}>
                      {totalQty}
                    </span>
                    <ArrowRight size={13} style={{ color: "var(--t-muted)" }} />
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--t-accent)" }}>
                      {newTotalQty}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-sage)", fontWeight: 700, marginTop: 2 }}>
                    +{netExtraShares} {type === "split" ? "split shares" : "bonus shares"}
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "var(--surface-1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Adjusted Cost Basis</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 14, color: "var(--t-muted)", textDecoration: "line-through" }}>
                      ₹{oldWeightedAvg.toFixed(2)}
                    </span>
                    <ArrowRight size={13} style={{ color: "var(--t-muted)" }} />
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--t-ink)" }}>
                      ₹{newAvgPreview.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    Proportionally adjusted per share
                  </div>
                </div>
              </div>

              {/* Capital Preservation Guarantee Banner */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "color-mix(in srgb, var(--t-sage) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--t-sage) 25%, transparent)",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t-sage)", fontWeight: 700 }}>
                  <ShieldCheck size={15} />
                  <span>Total Capital Preserved</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--t-ink)" }}>
                  <Money value={totalInv} /> (Zero Inflow / Outflow)
                </span>
              </div>
            </div>

            {/* Lot-by-Lot Adjustment Table Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "16px 18px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--t-ink)",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Layers size={14} style={{ color: "var(--t-accent)" }} />
                <span>Lot-by-Lot Adjustment Ledger Preview</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--t-line)", textAlign: "left", color: "var(--t-muted)" }}>
                      <th style={{ padding: "6px 8px" }}>Acquisition Date</th>
                      <th style={{ padding: "6px 8px" }}>Old Qty</th>
                      <th style={{ padding: "6px 8px" }}>Old Avg</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>New Qty</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>New Avg Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotAdjustments.map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--t-line)" }}>
                        <td style={{ padding: "8px", fontWeight: 700, color: "var(--t-ink)" }}>
                          {c.lot.buyDate || "Unknown Date"}
                        </td>
                        <td style={{ padding: "8px", color: "var(--t-muted)" }}>
                          {c.oldQty} sh
                        </td>
                        <td style={{ padding: "8px", color: "var(--t-muted)" }}>
                          ₹{c.oldAvg.toFixed(2)}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 800, color: "var(--t-accent)" }}>
                          {c.newQty} sh
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "var(--t-ink)" }}>
                          ₹{c.newAvg.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Indian Income Tax Compliance Reference Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "12px 16px",
                fontSize: 10,
                color: "var(--t-muted)",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "var(--t-ink)", display: "block", marginBottom: 2 }}>
                Indian Income Tax Compliance (Section 47 &amp; 55(2)(aa)):
              </strong>
              {type === "split"
                ? "Sub-division of share face value is not considered a transfer under Section 47. The holding period of the original lot is grandfathered, and the cost basis is proportionally allocated."
                : "Under Section 55(2)(aa), the acquisition cost of bonus shares is zero for tax computation. However, ArthaDrishti adjusts your weighted cost basis per lot to accurately track overall return."}
            </div>
          </div>
        </div>

        {/* ════════════ MODAL FOOTER & ACTION CONTROLS ════════════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            borderTop: "1px solid var(--t-line)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--t-muted)" }}>
            {isValid ? (
              <span style={{ color: "var(--t-sage)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} />
                <span>
                  Confirm {type === "split" ? "Stock Split" : "Bonus Issue"} of {ratioN}:{ratioM} for {group.base} ({totalQty} → {newTotalQty} shares)
                </span>
              </span>
            ) : (
              <span>Specify a valid ratio (N &gt; 0, M &gt; 0).</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleApply}
              disabled={!isValid || saving}
              icon={<ArrowRight size={14} />}
            >
              {saving ? "Applying Action…" : `Apply ${type === "split" ? "Split" : "Bonus Issue"}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid var(--t-line)",
  borderRadius: "var(--radius-md, 8px)",
  color: "var(--t-ink)",
  fontSize: 14,
  background: "var(--surface-0)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--t-ink)",
};
