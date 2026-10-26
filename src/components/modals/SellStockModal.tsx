import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Percent,
  Plus,
  Minus,
  DollarSign,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field } from "../ui/Form";
import { StockLogo } from "../ui/BrandLogos";
import { Money } from "../ui/Money";
import { today } from "../../utils/finance";
import { isLongTerm } from "../tabs/CapitalGainsTab";

export interface SellStockModalProps {
  lot: any;
  currentPrice?: number | string;
  saving?: boolean;
  onClose: () => void;
  onSave: (sellRecord: any, remainingQty: number) => void;
}

export function SellStockModal({
  lot,
  currentPrice,
  saving = false,
  onClose,
  onSave,
}: SellStockModalProps) {
  const baseSymbol = lot.base || (lot.symbol || "").replace(/\.(NS|BO)$/i, "").toUpperCase();
  const exchange = lot.exchange || "NSE";
  const totalLotQty = Number(lot.qty) || 0;
  const costBasis = Number(lot.avgPrice ?? lot.buyPrice) || 0;
  const initialPrice = currentPrice || lot.currentPrice || lot.avgPrice || lot.buyPrice || "";

  const [f, setF] = useState({
    sellQty: String(totalLotQty),
    sellPrice: initialPrice ? String(Number(initialPrice).toFixed(2)) : "",
    sellDate: today(),
    broker: lot.broker || "",
  });

  const sellQtyNum = Number(f.sellQty) || 0;
  const sellPriceNum = Number(f.sellPrice) || 0;
  const actualSellQty = Math.abs(sellQtyNum - totalLotQty) <= 0.0001 ? totalLotQty : sellQtyNum;
  const remainingQty = Math.max(0, totalLotQty - actualSellQty) <= 0.0001 ? 0 : totalLotQty - actualSellQty;

  const totalProceeds = actualSellQty * sellPriceNum;
  const totalCost = actualSellQty * costBasis;
  const profit = totalProceeds - totalCost;
  const returnPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  const isLtcg = useMemo(() => {
    return lot.buyDate ? isLongTerm(lot.buyDate, f.sellDate, 12) : false;
  }, [lot.buyDate, f.sellDate]);

  const holdingDays = useMemo(() => {
    if (!lot.buyDate || !f.sellDate) return 0;
    const b = new Date(lot.buyDate).getTime();
    const s = new Date(f.sellDate).getTime();
    return Math.max(0, Math.floor((s - b) / (1000 * 60 * 60 * 24)));
  }, [lot.buyDate, f.sellDate]);

  const isValid =
    sellQtyNum > 0 &&
    sellPriceNum > 0 &&
    sellQtyNum <= totalLotQty + 0.0001 &&
    !!f.sellDate;

  // Preset Handlers
  const handlePercentPreset = (pct: number) => {
    const qty = Number(((totalLotQty * pct) / 100).toFixed(4));
    setF((prev) => ({ ...prev, sellQty: String(qty) }));
  };

  const handleAdjustQty = (delta: number) => {
    const cur = Number(f.sellQty) || 0;
    const next = Math.max(0, Math.min(totalLotQty, cur + delta));
    setF((prev) => ({ ...prev, sellQty: next > 0 ? String(next) : "" }));
  };

  const handleUseLtp = () => {
    if (currentPrice != null) {
      setF((prev) => ({ ...prev, sellPrice: String(Number(currentPrice).toFixed(2)) }));
    }
  };

  const handleSave = useCallback(() => {
    if (!isValid) return;
    const record = {
      id: `ss-${Date.now()}`,
      owner: lot.owner || "self",
      symbol: baseSymbol,
      exchange,
      qty: actualSellQty,
      buyPrice: costBasis,
      buyDate: lot.buyDate || "",
      sellPrice: sellPriceNum,
      sellDate: f.sellDate,
      broker: f.broker,
      dematId: lot.dematId || "",
      profit: Number(profit.toFixed(2)),
    };
    onSave(record, remainingQty);
  }, [isValid, lot, baseSymbol, exchange, actualSellQty, costBasis, sellPriceNum, f, profit, onSave, remainingQty]);

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
              background: "color-mix(in srgb, var(--t-rust) 15%, transparent)",
              color: "var(--t-rust)",
            }}
          >
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-ink)" }}>
              Sell Shares — {baseSymbol}
            </div>
            <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 500 }}>
              Specific Lot Liquidation • Realized P&amp;L &amp; Capital Gains Calculator
            </div>
          </div>
        </div>
      }
      onClose={onClose}
      maxWidth={960}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Responsive Dual-Pane Workstation Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {/* ════════════ LEFT COLUMN: SELL PARAMETERS & ORDER SETUP ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Scrip & Lot Identity Card */}
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
                  <StockLogo symbol={baseSymbol} exchange={exchange} size={42} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)" }}>
                        {baseSymbol}
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
                        {exchange}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                      Acquired on: <strong>{lot.buyDate || "Unknown Date"}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Available in Lot</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-ink)" }}>
                    {totalLotQty} shares
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t-muted)" }}>
                    Basis: ₹{costBasis.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quantity Selection with Steppers & Quick % Buttons */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={labelStyle}>Sell Quantity *</label>
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
                    aria-label="Sell Quantity"
                    style={{ ...inputBaseStyle, textAlign: "center", fontWeight: 700 }}
                    type="number"
                    min="0.0001"
                    max={totalLotQty}
                    step="any"
                    value={f.sellQty}
                    onChange={(e) => setF({ ...f, sellQty: e.target.value })}
                    placeholder={`Max: ${totalLotQty}`}
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

            {/* Price & Execution Date Card */}
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
                    min={lot.buyDate || undefined}
                    max={today()}
                    value={f.sellDate}
                    onChange={(e) => setF({ ...f, sellDate: e.target.value })}
                    required
                  />
                </Field>
              </div>

              {lot.broker && (
                <div style={{ fontSize: 11, color: "var(--t-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 size={13} />
                  <span>
                    Demat Broker: <strong>{lot.broker}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ════════════ RIGHT COLUMN: LIVE REALIZATION & TAX IMPACT ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Realized Capital Gain / Loss Simulation Card */}
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
                Realization &amp; Financial Simulation
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ padding: "12px 14px", background: "var(--surface-1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Gross Sell Proceeds</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginTop: 4 }}>
                    <Money value={totalProceeds} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    {actualSellQty} sh @ ₹{sellPriceNum.toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "var(--surface-1)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Cost Basis (Invested)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginTop: 4 }}>
                    <Money value={totalCost} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    {actualSellQty} sh @ ₹{costBasis.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Net Realized Profit / Loss Badge */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background:
                    profit >= 0
                      ? "color-mix(in srgb, var(--t-sage) 10%, transparent)"
                      : "color-mix(in srgb, var(--t-rust) 10%, transparent)",
                  border: `1px solid ${
                    profit >= 0
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
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: profit >= 0 ? "var(--t-sage)" : "var(--t-rust)",
                    }}
                  >
                    Net Realized {profit >= 0 ? "Profit" : "Loss"}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: profit >= 0 ? "var(--t-sage)" : "var(--t-rust)",
                      marginTop: 2,
                    }}
                  >
                    {profit >= 0 ? "+" : ""}
                    <Money value={profit} /> ({profit >= 0 ? "+" : ""}
                    {returnPct.toFixed(2)}%)
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>Holding Horizon</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-ink)" }}>
                    {holdingDays} days
                  </div>
                </div>
              </div>

              {/* Tax Status Banner */}
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--surface-1)",
                  borderRadius: 10,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck
                    size={15}
                    style={{ color: isLtcg ? "var(--t-sage)" : "var(--t-gold)" }}
                  />
                  <span>
                    Classification:{" "}
                    <strong style={{ color: isLtcg ? "var(--t-sage)" : "var(--t-gold)" }}>
                      {isLtcg ? "LTCG (Long-Term Capital Gain)" : "STCG (Short-Term Capital Gain)"}
                    </strong>
                  </span>
                </div>
                <span style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>
                  {isLtcg ? "12.5% Tax (Section 112A)" : "20.0% Flat Tax (Section 111A)"}
                </span>
              </div>
            </div>

            {/* Position Remaining After Execution Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "14px 18px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-ink)" }}>
                  Remaining in this Lot
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: remainingQty > 0 ? "var(--t-accent)" : "var(--t-muted)", marginTop: 2 }}>
                  {remainingQty > 0 ? `${remainingQty} shares remaining` : "Lot will be fully closed (0 shares remaining)"}
                </div>
              </div>

              {remainingQty > 0 && (
                <div style={{ textAlign: "right", fontSize: 11, color: "var(--t-muted)" }}>
                  Retained Value: <strong style={{ color: "var(--t-ink)" }}>₹{(remainingQty * costBasis).toFixed(2)}</strong>
                </div>
              )}
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
                  Confirm selling <strong>{actualSellQty} shares</strong> of {baseSymbol} @ ₹{sellPriceNum.toFixed(2)}
                </span>
              </span>
            ) : (
              <span>Enter a valid quantity (1 to {totalLotQty}) and sell price.</span>
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
              {saving ? "Recording Sale…" : "Confirm Sell Order"}
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
