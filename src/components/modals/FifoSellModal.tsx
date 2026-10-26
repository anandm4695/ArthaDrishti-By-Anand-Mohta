import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Percent,
  Plus,
  Minus,
  Layers,
  ArrowLeftRight,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field } from "../ui/Form";
import { StockLogo } from "../ui/BrandLogos";
import { Money } from "../ui/Money";
import { today } from "../../utils/finance";
import { FifoAlloc, computeFifoAlloc } from "../tabs/DematTab";

export interface FifoSellModalProps {
  group: {
    base: string;
    exchange: string;
    yfSym?: string;
    lots: any[];
  };
  currentPrice?: number | string;
  demats?: any[];
  saving?: boolean;
  onClose: () => void;
  onSave: (allocs: FifoAlloc[], sellPrice: number, sellDate: string, broker: string) => void;
}

export function FifoSellModal({
  group,
  currentPrice,
  demats = [],
  saving = false,
  onClose,
  onSave,
}: FifoSellModalProps) {
  const totalQty = useMemo(() => {
    return group.lots.reduce((s: number, l: any) => s + Number(l.qty || 0), 0);
  }, [group.lots]);

  const [f, setF] = useState({
    sellQty: String(totalQty),
    sellPrice: currentPrice ? String(Number(currentPrice).toFixed(2)) : "",
    sellDate: today(),
    broker: demats[0]?.broker || "",
  });

  const sellQtyNum = Number(f.sellQty) || 0;
  const sellPriceNum = Number(f.sellPrice) || 0;

  const actualSellQty = Math.abs(sellQtyNum - totalQty) <= 0.0001 ? totalQty : sellQtyNum;

  const allocs: FifoAlloc[] = useMemo(() => {
    if (sellQtyNum > 0 && sellPriceNum > 0 && sellQtyNum <= totalQty + 0.0001) {
      return computeFifoAlloc(group.lots, actualSellQty, sellPriceNum, f.sellDate);
    }
    return [];
  }, [group.lots, actualSellQty, sellPriceNum, f.sellDate, sellQtyNum, totalQty]);

  const totalProceeds = actualSellQty * sellPriceNum;
  const totalCost = allocs.reduce((s, a) => s + a.consume * a.buyPrice, 0);
  const totalPnl = totalProceeds - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const ltcgAllocs = allocs.filter((a) => a.isLTCG);
  const stcgAllocs = allocs.filter((a) => !a.isLTCG);

  const ltcgPnl = ltcgAllocs.reduce((s, a) => s + a.pnl, 0);
  const stcgPnl = stcgAllocs.reduce((s, a) => s + a.pnl, 0);
  const ltcgShares = ltcgAllocs.reduce((s, a) => s + a.consume, 0);
  const stcgShares = stcgAllocs.reduce((s, a) => s + a.consume, 0);

  const remainingAfter = Math.max(0, totalQty - actualSellQty);

  const isValid =
    sellQtyNum > 0 &&
    sellPriceNum > 0 &&
    sellQtyNum <= totalQty + 0.0001 &&
    !!f.sellDate &&
    allocs.length > 0;

  // Preset Handlers
  const handlePercentPreset = (pct: number) => {
    const qty = Number(((totalQty * pct) / 100).toFixed(4));
    setF((prev) => ({ ...prev, sellQty: String(qty) }));
  };

  const handleAdjustQty = (delta: number) => {
    const cur = Number(f.sellQty) || 0;
    const next = Math.max(0, Math.min(totalQty, cur + delta));
    setF((prev) => ({ ...prev, sellQty: next > 0 ? String(next) : "" }));
  };

  const handleUseLtp = () => {
    if (currentPrice != null) {
      setF((prev) => ({ ...prev, sellPrice: String(Number(currentPrice).toFixed(2)) }));
    }
  };

  const handleSave = useCallback(() => {
    if (!isValid) return;
    onSave(allocs, sellPriceNum, f.sellDate, f.broker);
  }, [isValid, onSave, allocs, sellPriceNum, f]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isValid && !saving) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, saving, handleSave]);

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
              background: "color-mix(in srgb, var(--t-accent) 15%, transparent)",
              color: "var(--t-accent)",
            }}
          >
            <ArrowLeftRight size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-ink)" }}>
              FIFO Share Sell — {group.base}
            </div>
            <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 500 }}>
              Automated First-In-First-Out Execution • Optimized LTCG Tax Shielding
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
          {/* ════════════ LEFT COLUMN: SELL PARAMETERS & ORDER CONFIG ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Scrip Overview Card */}
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
                      Portfolio Holding across <strong>{group.lots.length} lot{group.lots.length === 1 ? "" : "s"}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Total Holdings Available</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)" }}>
                    {totalQty} shares
                  </div>
                </div>
              </div>

              {/* Quantity Selection with Steppers & Quick % Buttons */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={labelStyle}>Total Sell Quantity *</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      { label: "25%", pct: 25 },
                      { label: "50%", pct: 50 },
                      { label: "75%", pct: 75 },
                      { label: "All (100%)", pct: 100 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handlePercentPreset(btn.pct)}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: "1px solid var(--t-line)",
                          background: "var(--surface-1)",
                          color: "var(--t-muted)",
                          cursor: "pointer",
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(-1)}
                    style={stepperBtnStyle}
                    title="Decrease by 1"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    aria-label="Total Sell Qty"
                    style={{ ...inputBaseStyle, textAlign: "center", fontWeight: 700 }}
                    type="number"
                    min="0.0001"
                    max={totalQty}
                    step="any"
                    value={f.sellQty}
                    onChange={(e) => setF({ ...f, sellQty: e.target.value })}
                    placeholder={`Max: ${totalQty}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(1)}
                    style={stepperBtnStyle}
                    title="Increase by 1"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Price & Execution Parameters Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "16px 18px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <Field
                  label={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>Sell Price (₹) *</span>
                      {currentPrice != null && (
                        <button
                          type="button"
                          onClick={handleUseLtp}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--t-accent)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Use LTP (₹{Number(currentPrice).toFixed(2)})
                        </button>
                      )}
                    </div>
                  }
                >
                  <input
                    aria-label="Sell Price (₹)"
                    style={inputBaseStyle}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={f.sellPrice}
                    onChange={(e) => setF({ ...f, sellPrice: e.target.value })}
                    placeholder="e.g. 2850.00"
                    required
                  />
                </Field>

                <Field label="Execution / Sell Date *">
                  <input
                    aria-label="Sell Date"
                    style={inputBaseStyle}
                    type="date"
                    max={today()}
                    value={f.sellDate}
                    onChange={(e) => setF({ ...f, sellDate: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <Field label="Executing Demat Broker">
                <select
                  aria-label="Executing Demat Broker"
                  style={inputBaseStyle}
                  value={f.broker}
                  onChange={(e) => setF({ ...f, broker: e.target.value })}
                >
                  {demats.map((d: any) => (
                    <option key={d.id} value={d.broker}>
                      {d.broker} {d.clientId ? `(${d.clientId})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ════════════ RIGHT COLUMN: FIFO LOT EXECUTION & FINANCIAL BREAKDOWN ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Realization & Proceeds Summary Card */}
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
                Realized Capital Gains &amp; Tax Shielding
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ padding: "12px 14px", background: "var(--surface-1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Gross Sell Proceeds</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginTop: 4 }}>
                    <Money value={totalProceeds} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    {actualSellQty} shares @ ₹{sellPriceNum.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "var(--surface-1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Total Cost Basis</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginTop: 4 }}>
                    <Money value={totalCost} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    Avg basis: ₹{(actualSellQty > 0 ? totalCost / actualSellQty : 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Realized Profit Badge */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background:
                    totalPnl >= 0
                      ? "color-mix(in srgb, var(--t-sage) 10%, transparent)"
                      : "color-mix(in srgb, var(--t-rust) 10%, transparent)",
                  border: `1px solid ${
                    totalPnl >= 0
                      ? "color-mix(in srgb, var(--t-sage) 25%, transparent)"
                      : "color-mix(in srgb, var(--t-rust) 25%, transparent)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: totalPnl >= 0 ? "var(--t-sage)" : "var(--t-rust)" }}>
                    Net Realized Capital {totalPnl >= 0 ? "Gain" : "Loss"}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: totalPnl >= 0 ? "var(--t-sage)" : "var(--t-rust)", marginTop: 2 }}>
                    {totalPnl >= 0 ? "+" : ""}
                    <Money value={totalPnl} /> ({totalPnl >= 0 ? "+" : ""}
                    {totalReturnPct.toFixed(2)}%)
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>Lots Consumed</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-ink)" }}>
                    {allocs.length} of {group.lots.length} lot{group.lots.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              {/* Tax Class Split: LTCG vs STCG */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: "10px 12px", background: "var(--surface-1)", borderRadius: 8, fontSize: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t-sage)", fontWeight: 700 }}>
                    <ShieldCheck size={14} />
                    <span>LTCG (12.5%)</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-ink)", marginTop: 3 }}>
                    <Money value={ltcgPnl} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)" }}>{ltcgShares} shares held &gt; 12m</div>
                </div>

                <div style={{ padding: "10px 12px", background: "var(--surface-1)", borderRadius: 8, fontSize: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t-gold)", fontWeight: 700 }}>
                    <ShieldCheck size={14} />
                    <span>STCG (20.0%)</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-ink)", marginTop: 3 }}>
                    <Money value={stcgPnl} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)" }}>{stcgShares} shares held &le; 12m</div>
                </div>
              </div>
            </div>

            {/* FIFO Lot Allocation Breakdown Table */}
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
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Layers size={14} style={{ color: "var(--t-accent)" }} />
                  <span>Chronological FIFO Allocation Ledger</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>
                  Oldest Lots Sourced First
                </span>
              </div>

              {allocs.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--t-muted)", textAlign: "center", padding: 16 }}>
                  Enter sell quantity and price to preview FIFO lot execution.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--t-line)", textAlign: "left", color: "var(--t-muted)" }}>
                        <th style={{ padding: "6px 8px" }}>Lot Date</th>
                        <th style={{ padding: "6px 8px" }}>Cost Basis</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Consumed</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Realized P&amp;L</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Tax Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocs.map((a, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--t-line)" }}>
                          <td style={{ padding: "8px", fontWeight: 700, color: "var(--t-ink)" }}>
                            {a.lot.buyDate || "Unknown"}
                          </td>
                          <td style={{ padding: "8px", color: "var(--t-muted)" }}>
                            ₹{a.buyPrice.toFixed(2)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>
                            {a.consume} sh
                            {a.fullyConsumed && (
                              <span style={{ fontSize: 9, color: "var(--t-rust)", display: "block" }}>
                                Full Lot
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: a.pnl >= 0 ? "var(--t-sage)" : "var(--t-rust)",
                            }}
                          >
                            {a.pnl >= 0 ? "+" : ""}₹{a.pnl.toFixed(2)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: a.isLTCG
                                  ? "color-mix(in srgb, var(--t-sage) 15%, transparent)"
                                  : "color-mix(in srgb, var(--t-gold) 15%, transparent)",
                                color: a.isLTCG ? "var(--t-sage)" : "var(--t-gold)",
                              }}
                            >
                              {a.isLTCG ? "LTCG (12.5%)" : "STCG (20%)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Remaining Holdings Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px dashed var(--t-line)",
                  fontSize: 11,
                }}
              >
                <span style={{ color: "var(--t-muted)" }}>Remaining Position after Sell:</span>
                <strong style={{ color: remainingAfter > 0 ? "var(--t-accent)" : "var(--t-muted)" }}>
                  {remainingAfter > 0 ? `${remainingAfter} shares retained` : "Position completely exited"}
                </strong>
              </div>
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
                  Ready to execute FIFO sell of <strong>{actualSellQty} shares</strong> of {group.base} @ ₹{sellPriceNum.toFixed(2)}
                </span>
              </span>
            ) : (
              <span>Specify sell quantity and price to proceed.</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSave}
              disabled={!isValid || saving}
              icon={<ArrowRight size={14} />}
            >
              {saving ? "Executing FIFO Sell…" : "Confirm FIFO Sell"}
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

const stepperBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--surface-1)",
  border: "1.5px solid var(--t-line)",
  borderRadius: "var(--radius-md, 8px)",
  color: "var(--t-ink)",
  cursor: "pointer",
};
