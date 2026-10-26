import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Building2,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Percent,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field } from "../ui/Form";
import { StockLogo } from "../ui/BrandLogos";
import { Money } from "../ui/Money";
import { useMasterData, formatProfileOption } from "../../utils/masterData";
import { today } from "../../utils/finance";
import { isLongTerm } from "../tabs/CapitalGainsTab";
import {
  searchIndianStocks,
  findIndianStock,
  POPULAR_SCRIP_CHIPS,
  INVESTMENT_STRATEGIES,
  IndianStockItem,
} from "../../utils/indianStocks";

export interface StockScripModalProps {
  initial?: any;
  defaults?: any;
  demats?: any[];
  marketData?: Record<string, any>;
  existingStocks?: any[];
  activeProfile?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (stockData: any) => void;
}

export function StockScripModal({
  initial = null,
  defaults = null,
  demats = [],
  marketData = {},
  existingStocks = [],
  activeProfile = "all",
  saving = false,
  onClose,
  onSave,
}: StockScripModalProps) {
  const { familyProfiles } = useMasterData();
  const defaultOwner = activeProfile !== "all" ? activeProfile : "self";

  // Form State
  const [f, setF] = useState({
    symbol: initial?.symbol || defaults?.symbol || "",
    exchange: initial?.exchange || defaults?.exchange || "NSE",
    dematId: initial?.dematId || defaults?.dematId || demats[0]?.id || "",
    qty: initial?.qty != null ? String(initial.qty) : "",
    avgPrice: initial?.avgPrice != null ? String(initial.avgPrice) : defaults?.avgPrice ? String(defaults.avgPrice) : "",
    currentPrice: initial?.currentPrice != null ? String(initial.currentPrice) : "",
    buyDate: initial?.buyDate || today(),
    owner: initial?.owner || defaultOwner,
    strategy: initial?.strategy || "core_compounder",
    sector: initial?.sector || "",
    notes: initial?.notes || "",
  });

  // Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchedQuote, setFetchedQuote] = useState<any>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [manualPriceOverride, setManualPriceOverride] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cleanSymbol = useMemo(() => {
    return (f.symbol || "").toUpperCase().replace(/\.(NS|BO)$/i, "").trim();
  }, [f.symbol]);

  const yfSym = useMemo(() => {
    if (!cleanSymbol) return "";
    return `${cleanSymbol}.${f.exchange === "BSE" ? "BO" : "NS"}`;
  }, [cleanSymbol, f.exchange]);

  // Match against Indian stocks directory
  const stockMeta: IndianStockItem | undefined = useMemo(() => {
    return findIndianStock(cleanSymbol);
  }, [cleanSymbol]);

  // Read market quote from passed marketData or dynamic fetch
  const liveQuote = useMemo(() => {
    if (fetchedQuote && fetchedQuote.price != null) return fetchedQuote;
    if (yfSym && marketData[yfSym]) return marketData[yfSym];
    return null;
  }, [fetchedQuote, yfSym, marketData]);

  // Fetch live price quote if not available in marketData
  useEffect(() => {
    if (!cleanSymbol || !yfSym) {
      setFetchedQuote(null);
      return;
    }
    if (marketData[yfSym]?.price != null) {
      setFetchedQuote(marketData[yfSym]);
      return;
    }

    let active = true;
    setFetchingQuote(true);
    fetch(`/api/stock-price?symbols=${encodeURIComponent(yfSym)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Price lookup failed");
        return res.json();
      })
      .then((data) => {
        if (active && data && data[yfSym]) {
          setFetchedQuote(data[yfSym]);
        }
      })
      .catch(() => {
        // Fallback silently if offline or symbol invalid
      })
      .finally(() => {
        if (active) setFetchingQuote(false);
      });

    return () => {
      active = false;
    };
  }, [cleanSymbol, yfSym, marketData]);

  // Auto-fill sector if available and not yet modified
  useEffect(() => {
    if (stockMeta?.sector && !f.sector) {
      setF((prev) => ({ ...prev, sector: stockMeta.sector }));
    } else if (liveQuote?.sector && !f.sector) {
      setF((prev) => ({ ...prev, sector: liveQuote.sector }));
    }
  }, [stockMeta, liveQuote, f.sector]);

  // Handle auto-syncing Current Price with liveQuote unless user explicitly overrides
  useEffect(() => {
    if (!manualPriceOverride && liveQuote?.price != null) {
      setF((prev) => {
        // Only update if current price is empty or was previously auto-filled
        if (!prev.currentPrice || !initial) {
          return { ...prev, currentPrice: String(liveQuote.price) };
        }
        return prev;
      });
    }
  }, [liveQuote, manualPriceOverride, initial]);

  // Select stock from search autocomplete
  const handleSelectStock = (item: IndianStockItem) => {
    setF((prev) => ({
      ...prev,
      symbol: item.symbol,
      exchange: item.exchange || "NSE",
      sector: item.sector || prev.sector,
    }));
    setSearchQuery("");
    setShowDropdown(false);
    setManualPriceOverride(false);
  };

  // Quick Preset Handlers
  const handleUseLtp = () => {
    if (liveQuote?.price != null) {
      setF((prev) => ({
        ...prev,
        avgPrice: String(liveQuote.price),
        currentPrice: String(liveQuote.price),
      }));
    }
  };

  const handleAdjustQty = (delta: number) => {
    const cur = Number(f.qty) || 0;
    const next = Math.max(0, cur + delta);
    setF((prev) => ({ ...prev, qty: next > 0 ? String(next) : "" }));
  };

  const handleDatePreset = (preset: "today" | "yesterday" | "1m" | "6m" | "1y") => {
    const d = new Date();
    if (preset === "yesterday") {
      d.setDate(d.getDate() - 1);
    } else if (preset === "1m") {
      d.setMonth(d.getMonth() - 1);
    } else if (preset === "6m") {
      d.setMonth(d.getMonth() - 6);
    } else if (preset === "1y") {
      d.setFullYear(d.getFullYear() - 1);
      d.setDate(d.getDate() - 1); // 1 year + 1 day to be strictly > 12 months for Section 2(42A)
    }
    const iso = d.toISOString().split("T")[0];
    setF((prev) => ({ ...prev, buyDate: iso }));
  };

  // Calculations
  const qtyNum = Number(f.qty) || 0;
  const avgPriceNum = Number(f.avgPrice) || 0;
  const currentPriceNum = Number(f.currentPrice) || (liveQuote?.price ?? avgPriceNum);

  const totalInvested = qtyNum * avgPriceNum;
  const currentTotalVal = qtyNum * currentPriceNum;
  const unrealizedPnl = currentTotalVal - totalInvested;
  const unrealizedPct = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;

  // Tax calculations based on Indian FY regulations (Sec 112A & Sec 111A revised in Budget 2024)
  const holdingDays = useMemo(() => {
    if (!f.buyDate) return 0;
    const b = new Date(f.buyDate).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((now - b) / (1000 * 60 * 60 * 24)));
  }, [f.buyDate]);

  const isLTCG = useMemo(() => {
    return f.buyDate ? isLongTerm(f.buyDate, today(), 12) : false;
  }, [f.buyDate]);

  // Statutory delivery charges estimate for Indian equities:
  // STT: 0.1% on buy & sell turnover
  // Stamp duty: 0.015% on buy turnover
  // Exchange turnover + SEBI: ~0.0035%
  // GST (18% on exchange & SEBI): ~0.00063%
  const sttEstimate = totalInvested * 0.001;
  const stampDutyEstimate = totalInvested * 0.00015;
  const exchangeLevies = totalInvested * 0.000035;
  const gstLevies = (totalInvested * 0.000035) * 0.18;
  const totalChargesEstimate = sttEstimate + stampDutyEstimate + exchangeLevies + gstLevies;
  const breakEvenPrice = qtyNum > 0 ? (totalInvested + totalChargesEstimate) / qtyNum : 0;

  // Portfolio concentration impact
  const existingPortfolioTotal = useMemo(() => {
    return existingStocks.reduce((sum: number, s: any) => {
      const q = Number(s.qty) || 0;
      const p = Number(s.currentPrice || s.avgPrice) || 0;
      return sum + q * p;
    }, 0);
  }, [existingStocks]);

  const projectedPortfolioTotal = existingPortfolioTotal + currentTotalVal;
  const projectedWeight = projectedPortfolioTotal > 0 ? (currentTotalVal / projectedPortfolioTotal) * 100 : 100;

  // Validation
  const isValid =
    !!cleanSymbol &&
    !!f.dematId &&
    qtyNum > 0 &&
    avgPriceNum > 0 &&
    (f.currentPrice === "" || (Number.isFinite(currentPriceNum) && currentPriceNum >= 0));

  const handleSave = useCallback(() => {
    if (!isValid) return;
    onSave({
      ...f,
      symbol: cleanSymbol,
      qty: String(qtyNum),
      avgPrice: String(avgPriceNum),
      currentPrice: f.currentPrice ? String(currentPriceNum) : "",
    });
  }, [isValid, onSave, f, cleanSymbol, qtyNum, avgPriceNum, currentPriceNum]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchIndianStocks(searchQuery, 7);
  }, [searchQuery]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-ink)" }}>
              {initial ? "Edit Stock Scrip" : "Add Stock Scrip"}
            </div>
            <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 500 }}>
              Smart Equity Command Terminal • Live Portfolio Intelligence
            </div>
          </div>
          {cleanSymbol && (
            <div
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "color-mix(in srgb, var(--t-accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--t-accent) 25%, transparent)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--t-accent)",
              }}
            >
              <span>{cleanSymbol}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>{f.exchange}</span>
              {liveQuote?.price != null && (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span>₹{liveQuote.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </>
              )}
            </div>
          )}
        </div>
      }
      onClose={onClose}
      maxWidth={1080}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Responsive Dual-Pane Command Center Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {/* ════════════ LEFT COLUMN: SCRIP DISCOVERY & TRANSACTION INPUTS ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Scrip Selection & Autocomplete Card */}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--t-line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Search size={15} style={{ color: "var(--t-accent)" }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--t-ink)",
                    }}
                  >
                    Scrip &amp; Exchange Selection
                  </span>
                </div>
                {fetchingQuote && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "var(--t-accent)",
                    }}
                  >
                    <RefreshCw size={11} className="spin" />
                    Fetching quote…
                  </span>
                )}
              </div>

              {/* Instant Search Bar */}
              <div ref={searchContainerRef} style={{ position: "relative", marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      color: "var(--t-muted)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    style={{
                      ...inputBaseStyle,
                      paddingLeft: 38,
                      background: "var(--surface-1)",
                      fontSize: 13,
                    }}
                    placeholder="Search 100+ Indian Stocks by Name or Ticker (e.g. Reliance, TCS, HDFC)…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                </div>

                {/* Dropdown Suggestions */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "var(--surface-0)",
                      border: "1px solid var(--t-line)",
                      borderRadius: 10,
                      boxShadow: "var(--shadow-xl)",
                      maxHeight: 260,
                      overflowY: "auto",
                      padding: 4,
                    }}
                  >
                    {searchResults.map((item) => (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => handleSelectStock(item)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "8px 12px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          borderRadius: 8,
                          textAlign: "left",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--surface-1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <StockLogo symbol={item.symbol} exchange={item.exchange} size={28} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--t-ink)" }}>
                                {item.symbol}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  background: "var(--surface-2)",
                                  color: "var(--t-muted)",
                                  fontWeight: 600,
                                }}
                              >
                                {item.exchange}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--t-muted)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 220,
                              }}
                            >
                              {item.name}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--t-accent)",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "color-mix(in srgb, var(--t-accent) 10%, transparent)",
                          }}
                        >
                          {item.sector}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Pick Chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-muted)", marginBottom: 6 }}>
                  Popular Indian Leaders (Quick Select):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {POPULAR_SCRIP_CHIPS.map((chip) => {
                    const isSelected = cleanSymbol === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setF((prev) => ({ ...prev, symbol: chip, exchange: "NSE" }));
                          setManualPriceOverride(false);
                        }}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          border: isSelected
                            ? "1px solid var(--t-accent)"
                            : "1px solid var(--t-line)",
                          background: isSelected
                            ? "color-mix(in srgb, var(--t-accent) 15%, transparent)"
                            : "var(--surface-1)",
                          color: isSelected ? "var(--t-accent)" : "var(--t-ink)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symbol & Exchange Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12 }}>
                <Field label="Scrip Symbol / Ticker *">
                  <input
                    style={inputBaseStyle}
                    value={f.symbol}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/\.(NS|BO)$/i, "");
                      setF({ ...f, symbol: val });
                      setManualPriceOverride(false);
                    }}
                    placeholder="e.g. RELIANCE, TCS, INFY"
                    required
                  />
                </Field>
                <Field label="Exchange">
                  <select
                    style={inputBaseStyle}
                    value={f.exchange || "NSE"}
                    onChange={(e) => setF({ ...f, exchange: e.target.value })}
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Demat Account & Ownership Card */}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--t-line)",
                }}
              >
                <Building2 size={15} style={{ color: "var(--t-accent)" }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--t-ink)",
                  }}
                >
                  Portfolio &amp; Demat Assignment
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <Field label="Demat Account *">
                  <select
                    style={inputBaseStyle}
                    value={f.dematId}
                    onChange={(e) => setF({ ...f, dematId: e.target.value })}
                    required
                  >
                    {demats.length === 0 && (
                      <option value="">No Demat Account Available</option>
                    )}
                    {demats.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.broker || "Demat"} {d.clientId ? `(${d.clientId})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Family / Owner Profile">
                  <select
                    style={inputBaseStyle}
                    value={f.owner || "self"}
                    onChange={(e) => setF({ ...f, owner: e.target.value })}
                  >
                    {familyProfiles.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {formatProfileOption(p)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {demats.length === 0 && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "color-mix(in srgb, var(--t-rust) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--t-rust) 25%, transparent)",
                    fontSize: 12,
                    color: "var(--t-rust)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>No Demat Account found. Please add a Demat Account first before saving scrips.</span>
                </div>
              )}
            </div>

            {/* Transaction Parameters Card */}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--t-line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={15} style={{ color: "var(--t-accent)" }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--t-ink)",
                    }}
                  >
                    Transaction &amp; Price Parameters
                  </span>
                </div>
                {liveQuote?.price != null && (
                  <button
                    type="button"
                    onClick={handleUseLtp}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--t-accent)",
                      background: "color-mix(in srgb, var(--t-accent) 10%, transparent)",
                      border: "none",
                      borderRadius: 6,
                      padding: "3px 8px",
                      cursor: "pointer",
                    }}
                    title="Fill Buy Price with Current Market LTP"
                  >
                    Use Live LTP: ₹{liveQuote.price.toFixed(2)}
                  </button>
                )}
              </div>

              {/* Quantity Field with +/- Steppers & Presets */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={labelStyle}>Quantity (Shares) *</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[5, 10, 25, 50, 100].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleAdjustQty(inc)}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: "1px solid var(--t-line)",
                          background: "var(--surface-1)",
                          color: "var(--t-muted)",
                          cursor: "pointer",
                        }}
                      >
                        +{inc}
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
                    aria-label="Quantity (Shares)"
                    style={{ ...inputBaseStyle, textAlign: "center", fontWeight: 700 }}
                    type="number"
                    min="0.0001"
                    step="any"
                    value={f.qty}
                    onChange={(e) => setF({ ...f, qty: e.target.value })}
                    placeholder="e.g. 50"
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

              {/* Buy Price and Current Price Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <Field label="Avg Buy Price (₹) *">
                  <input
                    aria-label="Avg Buy Price (₹)"
                    style={inputBaseStyle}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={f.avgPrice}
                    onChange={(e) => setF({ ...f, avgPrice: e.target.value })}
                    placeholder="e.g. 2450.50"
                    required
                  />
                </Field>

                <Field
                  label={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>Current Price (₹)</span>
                      {liveQuote?.price != null && !manualPriceOverride && (
                        <span style={{ fontSize: 9, color: "var(--t-sage)", fontWeight: 700 }}>
                          ● Live Feed
                        </span>
                      )}
                    </div>
                  }
                >
                  <input
                    aria-label="Current Price (₹)"
                    style={inputBaseStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={f.currentPrice}
                    onChange={(e) => {
                      setManualPriceOverride(true);
                      setF({ ...f, currentPrice: e.target.value });
                    }}
                    placeholder={liveQuote?.price ? String(liveQuote.price) : "Auto-synced live"}
                  />
                </Field>
              </div>

              {/* Buy Date Field with Quick Shortcut Chips */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={labelStyle}>Acquisition / Buy Date *</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      { key: "today", label: "Today" },
                      { key: "yesterday", label: "Yesterday" },
                      { key: "1m", label: "1M Ago" },
                      { key: "1y", label: "1Y Ago" },
                    ].map((p: any) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleDatePreset(p.key)}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: "1px solid var(--t-line)",
                          background: "var(--surface-1)",
                          color: "var(--t-muted)",
                          cursor: "pointer",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  style={inputBaseStyle}
                  type="date"
                  max={today()}
                  value={f.buyDate || ""}
                  onChange={(e) => setF({ ...f, buyDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Optional Strategy & Metadata Card */}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--t-line)",
                }}
              >
                <Layers size={15} style={{ color: "var(--t-accent)" }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--t-ink)",
                  }}
                >
                  Strategy &amp; Investment Thesis (Optional)
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <Field label="Investment Strategy">
                  <select
                    style={inputBaseStyle}
                    value={f.strategy}
                    onChange={(e) => setF({ ...f, strategy: e.target.value })}
                  >
                    {INVESTMENT_STRATEGIES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Industry Sector">
                  <input
                    style={inputBaseStyle}
                    value={f.sector}
                    onChange={(e) => setF({ ...f, sector: e.target.value })}
                    placeholder="e.g. IT, Energy, Banking"
                  />
                </Field>
              </div>

              <Field label="Notes / Rationale">
                <input
                  style={inputBaseStyle}
                  value={f.notes}
                  onChange={(e) => setF({ ...f, notes: e.target.value })}
                  placeholder="e.g. Core long-term holding, Q3 earnings breakout"
                />
              </Field>
            </div>
          </div>

          {/* ════════════ RIGHT COLUMN: LIVE INTELLIGENCE & FINANCIAL SIMULATION ════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Live Scrip Intelligence Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "18px 20px",
                boxShadow: "var(--shadow-sm)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <StockLogo
                    symbol={cleanSymbol || "NSE"}
                    exchange={f.exchange}
                    size={48}
                    borderRadius={10}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)" }}>
                        {cleanSymbol || "SELECT A SCRIP"}
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
                        {f.exchange}
                      </span>
                      {stockMeta?.cap && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                            color: "var(--t-accent)",
                            textTransform: "uppercase",
                          }}
                        >
                          {stockMeta.cap} CAP
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t-muted)", marginTop: 2, fontWeight: 500 }}>
                      {stockMeta?.name || (cleanSymbol ? `${cleanSymbol} Equity` : "Enter a symbol to view live quote")}
                    </div>
                    {(f.sector || stockMeta?.sector) && (
                      <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                        Sector: <strong style={{ color: "var(--t-ink)" }}>{f.sector || stockMeta?.sector}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t-ink)" }}>
                    ₹
                    {(currentPriceNum || liveQuote?.price || avgPriceNum || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  {liveQuote?.changePercent != null && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginTop: 4,
                        background:
                          liveQuote.changePercent >= 0
                            ? "color-mix(in srgb, var(--t-sage) 15%, transparent)"
                            : "color-mix(in srgb, var(--t-rust) 15%, transparent)",
                        color: liveQuote.changePercent >= 0 ? "var(--t-sage)" : "var(--t-rust)",
                      }}
                    >
                      {liveQuote.changePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>
                        {liveQuote.changePercent >= 0 ? "+" : ""}
                        {liveQuote.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 52-Week Range Progress Slider */}
              {liveQuote?.weekLow52 != null && liveQuote?.weekHigh52 != null && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-1)",
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--t-muted)",
                      marginBottom: 6,
                    }}
                  >
                    <span>52W Low: ₹{liveQuote.weekLow52.toFixed(2)}</span>
                    <span style={{ color: "var(--t-ink)", fontWeight: 700 }}>52-Week Range</span>
                    <span>52W High: ₹{liveQuote.weekHigh52.toFixed(2)}</span>
                  </div>
                  {/* Range Bar */}
                  {(() => {
                    const low = liveQuote.weekLow52;
                    const high = liveQuote.weekHigh52;
                    const cur = currentPriceNum || liveQuote.price || low;
                    const pct = high > low ? Math.max(0, Math.min(100, ((cur - low) / (high - low)) * 100)) : 50;
                    return (
                      <div
                        style={{
                          position: "relative",
                          height: 6,
                          background: "var(--t-line)",
                          borderRadius: 999,
                          overflow: "visible",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, var(--t-accent), var(--t-sage))",
                            borderRadius: 999,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: -3,
                            left: `calc(${pct}% - 6px)`,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: "var(--t-ink)",
                            border: "2px solid #ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                          }}
                          title={`Current Price Position: ${pct.toFixed(1)}% of 52W Range`}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Financial Order Math & P&L Simulation Card */}
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
                Investment Order Math &amp; Simulation
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-1)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Total Outlay (Invested)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginTop: 4 }}>
                    <Money value={totalInvested} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    {qtyNum} shares @ ₹{avgPriceNum.toFixed(2)}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-1)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--t-muted)", fontWeight: 600 }}>Current Market Value</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-ink)", marginTop: 4 }}>
                    <Money value={currentTotalVal} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--t-muted)", marginTop: 2 }}>
                    {qtyNum} shares @ ₹{currentPriceNum.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Unrealized P&L Badge Card */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background:
                    unrealizedPnl >= 0
                      ? "color-mix(in srgb, var(--t-sage) 10%, transparent)"
                      : "color-mix(in srgb, var(--t-rust) 10%, transparent)",
                  border: `1px solid ${
                    unrealizedPnl >= 0
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
                      color: unrealizedPnl >= 0 ? "var(--t-sage)" : "var(--t-rust)",
                    }}
                  >
                    Unrealized {unrealizedPnl >= 0 ? "Profit" : "Loss"}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: unrealizedPnl >= 0 ? "var(--t-sage)" : "var(--t-rust)",
                      marginTop: 2,
                    }}
                  >
                    {unrealizedPnl >= 0 ? "+" : ""}
                    <Money value={unrealizedPnl} /> ({unrealizedPnl >= 0 ? "+" : ""}
                    {unrealizedPct.toFixed(2)}%)
                  </div>
                </div>
                {holdingDays > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>Holding Horizon</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-ink)" }}>
                      {holdingDays} days {holdingDays > 365 ? `(${Math.floor(holdingDays / 365)}y ${holdingDays % 365}d)` : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Classification Bar (Budget 2024 revised rates) */}
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
                    style={{ color: isLTCG ? "var(--t-sage)" : "var(--t-gold)" }}
                  />
                  <span>
                    Tax Status:{" "}
                    <strong style={{ color: isLTCG ? "var(--t-sage)" : "var(--t-gold)" }}>
                      {isLTCG ? "LTCG (Long-Term Capital Gain)" : "STCG (Short-Term Capital Gain)"}
                    </strong>
                  </span>
                </div>
                <span style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>
                  {isLTCG ? "12.5% Tax (Sec 112A)" : "20% Tax (Sec 111A)"}
                </span>
              </div>
            </div>

            {/* Estimated Statutory Charges & Breakeven Card */}
            <div
              style={{
                background: "var(--surface-0)",
                border: "1px solid var(--t-line)",
                borderRadius: "var(--radius-lg, 12px)",
                padding: "14px 18px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <button
                type="button"
                onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={14} style={{ color: "var(--t-accent)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-ink)" }}>
                    Estimated Statutory Levies &amp; Breakeven (Indian Delivery)
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)" }}>
                    ~₹{totalChargesEstimate.toFixed(2)}
                  </span>
                  {showCostBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {showCostBreakdown && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: "1px solid var(--t-line)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--t-muted)" }}>
                    <span>Securities Transaction Tax (STT 0.1%):</span>
                    <span style={{ fontWeight: 600, color: "var(--t-ink)" }}>₹{sttEstimate.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--t-muted)" }}>
                    <span>Stamp Duty (0.015% on buy):</span>
                    <span style={{ fontWeight: 600, color: "var(--t-ink)" }}>₹{stampDutyEstimate.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--t-muted)" }}>
                    <span>Exchange Turnover &amp; SEBI Fee (~0.0035%):</span>
                    <span style={{ fontWeight: 600, color: "var(--t-ink)" }}>₹{exchangeLevies.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--t-muted)" }}>
                    <span>GST (18% on exchange charges):</span>
                    <span style={{ fontWeight: 600, color: "var(--t-ink)" }}>₹{gstLevies.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--t-ink)",
                      fontWeight: 700,
                      marginTop: 4,
                      paddingTop: 6,
                      borderTop: "1px dashed var(--t-line)",
                    }}
                  >
                    <span>Net Effective Breakeven per share:</span>
                    <span style={{ color: "var(--t-accent)" }}>₹{breakEvenPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Allocation & Concentration Impact Card */}
            {projectedPortfolioTotal > 0 && (
              <div
                style={{
                  background: "var(--surface-0)",
                  border: "1px solid var(--t-line)",
                  borderRadius: "var(--radius-lg, 12px)",
                  padding: "14px 18px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-ink)" }}>
                    Portfolio Allocation Impact
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: projectedWeight > 15 ? "var(--t-rust)" : "var(--t-sage)",
                    }}
                  >
                    {projectedWeight.toFixed(1)}% of Portfolio
                  </span>
                </div>

                <div
                  style={{
                    height: 6,
                    background: "var(--surface-2)",
                    borderRadius: 999,
                    overflow: "hidden",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, projectedWeight)}%`,
                      background:
                        projectedWeight > 15
                          ? "var(--t-rust)"
                          : "var(--t-accent)",
                      borderRadius: 999,
                    }}
                  />
                </div>

                <div style={{ fontSize: 10, color: "var(--t-muted)" }}>
                  {projectedWeight > 15 ? (
                    <span style={{ color: "var(--t-rust)", fontWeight: 600 }}>
                      ⚠️ Concentration note: This scrip will represent &gt;15% of your equity portfolio.
                    </span>
                  ) : (
                    <span>Balanced diversification within recommended allocation guidelines.</span>
                  )}
                </div>
              </div>
            )}
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
          <div style={{ fontSize: 12, color: "var(--t-muted)", display: "flex", alignItems: "center", gap: 8 }}>
            {isValid ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t-sage)", fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>
                  Ready to commit: <strong>{qtyNum} shares</strong> of <strong>{cleanSymbol}</strong> (Outlay: ₹
                  {totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                </span>
              </div>
            ) : (
              <span>Fill in required fields (Symbol, Demat Account, Qty &gt; 0, Buy Price &gt; 0).</span>
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
              icon={saving ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
            >
              {saving ? "Saving Scrip…" : initial ? "Save Changes" : "Add Scrip to Portfolio"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Reusable Component Styling ──────────────────────────────────────────
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
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
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
  transition: "background 0.15s ease",
};
