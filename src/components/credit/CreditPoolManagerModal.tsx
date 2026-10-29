import { useState, useMemo } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Check,
  CreditCard,
  X,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINR, fmtINRFull, ccOutstanding, computeCreditPortfolioSummary } from "../../utils/finance";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Form";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { BankLogo } from "../ui/BrandLogos";

export interface CreditPoolManagerModalProps {
  creditCards: any[];
  onClose: () => void;
  onSaveBatch: (updates: { id: string; patch: any }[]) => Promise<void>;
  saving?: boolean;
}

const COMMON_BANKS = [
  { prefix: "hdfc", name: "HDFC Bank", defaultPool: "HDFC Pool" },
  { prefix: "icici", name: "ICICI Bank", defaultPool: "ICICI Pool" },
  { prefix: "axis", name: "Axis Bank", defaultPool: "Axis Pool" },
  { prefix: "sbi", name: "State Bank of India", defaultPool: "SBI Pool" },
  { prefix: "kotak", name: "Kotak Mahindra Bank", defaultPool: "Kotak Pool" },
  { prefix: "indusind", name: "IndusInd Bank", defaultPool: "IndusInd Pool" },
  { prefix: "rbl", name: "RBL Bank", defaultPool: "RBL Pool" },
  { prefix: "amex", name: "American Express", defaultPool: "Amex Pool" },
  { prefix: "american express", name: "American Express", defaultPool: "Amex Pool" },
  { prefix: "standard chartered", name: "Standard Chartered", defaultPool: "StanChart Pool" },
  { prefix: "hsbc", name: "HSBC Bank", defaultPool: "HSBC Pool" },
  { prefix: "bob", name: "Bank of Baroda", defaultPool: "BOB Pool" },
  { prefix: "bank of baroda", name: "Bank of Baroda", defaultPool: "BOB Pool" },
  { prefix: "idfc", name: "IDFC FIRST Bank", defaultPool: "IDFC Pool" },
  { prefix: "au small", name: "AU Small Finance Bank", defaultPool: "AU Pool" },
  { prefix: "federal", name: "Federal Bank", defaultPool: "Federal Pool" },
  { prefix: "yes", name: "Yes Bank", defaultPool: "Yes Bank Pool" },
];

export function CreditPoolManagerModal({
  creditCards = [],
  onClose,
  onSaveBatch,
  saving = false,
}: CreditPoolManagerModalProps) {
  // Working local copy of cards with pending changes
  const [localCards, setLocalCards] = useState<any[]>(() =>
    creditCards.map((c) => ({
      ...c,
      sharedGroup: typeof c.sharedGroup === "string" ? c.sharedGroup.trim() : "",
      sharedGroupLimit: c.sharedGroupLimit != null ? String(c.sharedGroupLimit) : "",
    }))
  );

  // New pool creation form state
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolLimit, setNewPoolLimit] = useState("");
  const [newPoolSelectedCardIds, setNewPoolSelectedCardIds] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Compute portfolio metrics with current pending edits
  const currentSummary = useMemo(() => computeCreditPortfolioSummary(localCards), [localCards]);

  // Compute raw sum without any pooling for comparison
  const rawSumWithoutPooling = useMemo(() => {
    return currentSummary.activeCards.reduce(
      (sum, c) => sum + (Number(c.limit ?? c.cardLimit) || 0),
      0
    );
  }, [currentSummary.activeCards]);

  const duplicateLimitEliminated = Math.max(0, rawSumWithoutPooling - currentSummary.totalLimit);

  // Smart suggestions: detect banks that have 2+ active cards not in the same pool
  const smartSuggestions = useMemo(() => {
    const unpooledOrSplit: {
      bankName: string;
      defaultPool: string;
      cards: any[];
      suggestedLimit: number;
    }[] = [];

    COMMON_BANKS.forEach((b) => {
      const matchingCards = currentSummary.activeCards.filter((c: any) => {
        const issuer = (c.issuer || "").toLowerCase();
        return issuer.includes(b.prefix);
      });

      if (matchingCards.length >= 2) {
        // Check if they are already in the same pool
        const poolsPresent = new Set(
          matchingCards.map((c: any) => (c.sharedGroup || "").trim().toLowerCase())
        );
        // If not all sharing the exact same non-empty pool, suggest grouping
        const allInSamePool = poolsPresent.size === 1 && !poolsPresent.has("");
        if (!allInSamePool) {
          const maxLimit = Math.max(
            0,
            ...matchingCards.map((c: any) => Number(c.limit ?? c.cardLimit) || 0)
          );
          unpooledOrSplit.push({
            bankName: b.name,
            defaultPool: b.defaultPool,
            cards: matchingCards,
            suggestedLimit: maxLimit || 500000,
          });
        }
      }
    });

    return unpooledOrSplit;
  }, [currentSummary.activeCards]);

  // Apply a smart suggestion
  const applySmartSuggestion = (sug: (typeof smartSuggestions)[0]) => {
    setLocalCards((prev) =>
      prev.map((c) => {
        if (sug.cards.some((sc) => sc.id === c.id)) {
          return {
            ...c,
            sharedGroup: sug.defaultPool,
            sharedGroupLimit: String(sug.suggestedLimit),
          };
        }
        return c;
      })
    );
  };

  // Modify limit for an entire pool
  const handleUpdatePoolLimit = (poolKey: string, newLimitVal: string) => {
    setLocalCards((prev) =>
      prev.map((c) => {
        if ((c.sharedGroup || "").trim().toLowerCase() === poolKey) {
          return {
            ...c,
            sharedGroupLimit: newLimitVal,
          };
        }
        return c;
      })
    );
  };

  // Rename a pool across all cards in that pool
  const handleRenamePool = (oldKey: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setLocalCards((prev) =>
      prev.map((c) => {
        if ((c.sharedGroup || "").trim().toLowerCase() === oldKey) {
          return {
            ...c,
            sharedGroup: trimmed,
          };
        }
        return c;
      })
    );
  };

  // Remove a single card from a pool
  const handleRemoveCardFromPool = (cardId: string) => {
    setLocalCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return {
            ...c,
            sharedGroup: "",
            sharedGroupLimit: "",
          };
        }
        return c;
      })
    );
  };

  // Assign card to an existing pool
  const handleAssignCardToPool = (cardId: string, poolName: string, poolLimit: number) => {
    setLocalCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return {
            ...c,
            sharedGroup: poolName,
            sharedGroupLimit: String(poolLimit),
          };
        }
        return c;
      })
    );
  };

  // Dissolve an entire pool (unassign all its cards)
  const handleDissolvePool = (poolKey: string) => {
    setLocalCards((prev) =>
      prev.map((c) => {
        if ((c.sharedGroup || "").trim().toLowerCase() === poolKey) {
          return {
            ...c,
            sharedGroup: "",
            sharedGroupLimit: "",
          };
        }
        return c;
      })
    );
  };

  // Create a brand new pool with selected cards
  const handleCreatePool = () => {
    if (!newPoolName.trim() || newPoolSelectedCardIds.length === 0) return;
    const poolName = newPoolName.trim();
    const limitVal = newPoolLimit.trim();

    setLocalCards((prev) =>
      prev.map((c) => {
        if (newPoolSelectedCardIds.includes(c.id)) {
          return {
            ...c,
            sharedGroup: poolName,
            sharedGroupLimit: limitVal,
          };
        }
        return c;
      })
    );

    setNewPoolName("");
    setNewPoolLimit("");
    setNewPoolSelectedCardIds([]);
    setShowCreateForm(false);
  };

  // Commit all changes
  const handleSaveAndApply = async () => {
    const updates: { id: string; patch: any }[] = [];
    localCards.forEach((local) => {
      const orig = creditCards.find((c) => c.id === local.id);
      if (orig) {
        const origGroup = (orig.sharedGroup || "").trim();
        const origLimit = orig.sharedGroupLimit != null ? String(orig.sharedGroupLimit) : "";
        const nextGroup = (local.sharedGroup || "").trim();
        const nextLimit = (local.sharedGroupLimit || "").trim();

        if (origGroup !== nextGroup || origLimit !== nextLimit) {
          updates.push({
            id: local.id,
            patch: {
              sharedGroup: nextGroup,
              sharedGroupLimit: nextLimit ? Number(nextLimit) : null,
            },
          });
        }
      }
    });

    if (updates.length > 0) {
      await onSaveBatch(updates);
    }
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "color-mix(in srgb, var(--t-accent) 15%, transparent)",
              color: "var(--t-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Shared Credit Limit Pools</div>
            <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 500 }}>
              Group cards sharing a combined bank credit line to eliminate redundant limit counting
            </div>
          </div>
        </div>
      }
      onClose={onClose}
      maxWidth={880}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ fontSize: 12, color: THEME.muted }}>
            {duplicateLimitEliminated > 0 ? (
              <span style={{ color: THEME.sage, fontWeight: 700 }}>
                ✓ Eliminating {fmtINRFull(duplicateLimitEliminated)} in double-counted limits
              </span>
            ) : (
              "All cards currently standalone"
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={onClose} disabled={saving} type="button">
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSaveAndApply} loading={saving} type="button">
              Save &amp; Apply Pools
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* KPI Summary Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            background: "var(--surface-0)",
            padding: "14px 16px",
            borderRadius: 14,
            border: `1px solid ${THEME.line}`,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 700, textTransform: "uppercase" }}>
              Combined Total Limit
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: THEME.accent, marginTop: 2 }}>
              {fmtINRFull(currentSummary.totalLimit)}
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              {currentSummary.activeCards.length} active cards
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 700, textTransform: "uppercase" }}>
              Active Shared Pools
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: THEME.ink, marginTop: 2 }}>
              {currentSummary.poolList.length}
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              {currentSummary.activeCards.length - currentSummary.standaloneCards.length} pooled cards
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 700, textTransform: "uppercase" }}>
              Redundant Limit Removed
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: THEME.sage, marginTop: 2 }}>
              {fmtINRFull(duplicateLimitEliminated)}
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              Raw sum: {fmtINRFull(rawSumWithoutPooling)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 700, textTransform: "uppercase" }}>
              Overall Utilization
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: currentSummary.utilizationPct > 30 ? THEME.gold : THEME.sage,
                marginTop: 2,
              }}
            >
              {currentSummary.utilizationPct}%
            </div>
            <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
              {fmtINRFull(currentSummary.totalOutstanding)} used
            </div>
          </div>
        </div>

        {/* Smart Bank Suggestions */}
        {smartSuggestions.length > 0 && (
          <div
            style={{
              background: "color-mix(in srgb, var(--t-accent) 8%, var(--surface-0))",
              border: "1.5px solid color-mix(in srgb, var(--t-accent) 30%, transparent)",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Sparkles size={15} color="var(--t-accent)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>
                Detected Same-Bank Shared Limit Cards
              </span>
            </div>
            <p style={{ fontSize: 12, color: THEME.muted, margin: "0 0 10px 0" }}>
              In Indian banking, cards from the same issuer (e.g. HDFC, ICICI, Axis) share one aggregate credit line.
              Click to group them into a single pool so their combined limit is counted once:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {smartSuggestions.map((sug) => {
                const totalIndiv = sug.cards.reduce(
                  (sum, c) => sum + (Number(c.limit ?? c.cardLimit) || 0),
                  0
                );
                return (
                  <div
                    key={sug.bankName}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--surface-0)",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1px solid ${THEME.line}`,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BankLogo bankName={sug.bankName} size={18} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>
                          {sug.bankName}
                        </span>
                        <Badge variant="neutral">{sug.cards.length} Cards</Badge>
                      </div>
                      <div style={{ fontSize: 11.5, color: THEME.muted, marginTop: 4 }}>
                        Individual sum: <strong>{fmtINRFull(totalIndiv)}</strong> → Pool Combined Limit:{" "}
                        <strong style={{ color: THEME.sage }}>{fmtINRFull(sug.suggestedLimit)}</strong> (Saves{" "}
                        {fmtINRFull(totalIndiv - sug.suggestedLimit)})
                      </div>
                    </div>

                    <Button
                      variant="accent"
                      size="sm"
                      icon={<Check size={13} />}
                      onClick={() => applySmartSuggestion(sug)}
                      type="button"
                    >
                      Group into {sug.defaultPool}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Existing Shared Pools */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={16} />
              Configured Shared Pools ({currentSummary.poolList.length})
            </div>
            {!showCreateForm && (
              <Button
                variant="outline"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setShowCreateForm(true)}
                type="button"
              >
                + New Pool
              </Button>
            )}
          </div>

          {currentSummary.poolList.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                borderRadius: 12,
                border: `1.5px dashed ${THEME.line}`,
                background: "var(--surface-0)",
              }}
            >
              <CreditCard size={28} color={THEME.muted} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                No shared credit pools configured yet
              </div>
              <div style={{ fontSize: 12, color: THEME.muted, marginTop: 4, maxWidth: 440, margin: "4px auto 12px" }}>
                All {currentSummary.activeCards.length} cards currently count toward your limit individually. Use the
                smart suggestions above or click "+ New Pool" below to group cards.
              </div>
              <Button
                variant="accent"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setShowCreateForm(true)}
                type="button"
              >
                Create Shared Pool
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {currentSummary.poolList.map((pool) => {
                const barColor = pool.utilizationPct > 70 ? THEME.rust : pool.utilizationPct > 30 ? THEME.gold : THEME.sage;

                return (
                  <div
                    key={pool.key}
                    style={{
                      background: "var(--surface-0)",
                      borderRadius: 14,
                      border: `1.5px solid color-mix(in srgb, ${barColor} 30%, var(--t-line))`,
                      padding: 16,
                    }}
                  >
                    {/* Pool Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: THEME.ink }}>
                            {pool.name}
                          </span>
                          <Badge variant="neutral">{pool.cards.length} Cards</Badge>
                          <span style={{ fontSize: 11, color: THEME.muted }}>
                            Key: <code>{pool.key}</code>
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: THEME.muted, marginTop: 4 }}>
                          Spent: <strong>{fmtINRFull(pool.totalOutstanding)}</strong> · Avail:{" "}
                          <strong style={{ color: THEME.sage }}>{fmtINRFull(pool.available)}</strong> ({pool.utilizationPct}% pool used)
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: THEME.muted }}>
                            Pool Limit (₹):
                          </label>
                          <input
                            type="number"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: `1.5px solid ${THEME.line}`,
                              background: "var(--surface-1)",
                              color: THEME.ink,
                              fontSize: 13,
                              fontWeight: 800,
                              width: 130,
                            }}
                            value={pool.poolLimit || ""}
                            onChange={(e) => handleUpdatePoolLimit(pool.key, e.target.value)}
                            placeholder="500000"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          onClick={() => handleDissolvePool(pool.key)}
                          title="Dissolve this pool and unassign cards"
                          type="button"
                          style={{ color: THEME.rust }}
                        >
                          Dissolve
                        </Button>
                      </div>
                    </div>

                    {/* Cards Inside This Pool */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: 8,
                        background: "var(--surface-1)",
                        padding: 10,
                        borderRadius: 10,
                      }}
                    >
                      {pool.cards.map((c: any) => {
                        const out = ccOutstanding(c);
                        return (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "var(--surface-0)",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: `1px solid ${THEME.line}`,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: THEME.ink }}>
                                {c.issuer}
                              </div>
                              <div style={{ fontSize: 10.5, color: THEME.muted }}>
                                {c.last4 ? `•••• ${c.last4} · ` : ""}Spent: {fmtINRFull(out)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCardFromPool(c.id)}
                              title="Remove card from this pool"
                              style={{
                                background: "transparent",
                                border: "none",
                                color: THEME.muted,
                                cursor: "pointer",
                                padding: 4,
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add unpooled card to this pool dropdown */}
                      {currentSummary.standaloneCards.length > 0 && (
                        <select
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: `1px dashed ${THEME.line}`,
                            background: "transparent",
                            color: THEME.muted,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignCardToPool(e.target.value, pool.name, pool.poolLimit);
                            }
                          }}
                        >
                          <option value="">+ Add unpooled card...</option>
                          {currentSummary.standaloneCards.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.issuer} {sc.last4 ? `(•••• ${sc.last4})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create New Pool Modal / Drawer */}
        {showCreateForm && (
          <div
            style={{
              background: "var(--surface-0)",
              border: `1.5px solid ${THEME.accent}`,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: THEME.ink }}>
                Create New Shared Credit Pool
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{ background: "transparent", border: "none", color: THEME.muted, cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 14 }}>
              <Field label="Pool Name">
                <input
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${THEME.line}`,
                    background: "var(--surface-1)",
                    color: THEME.ink,
                    fontSize: 13,
                  }}
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="e.g. HDFC Shared Pool"
                />
              </Field>
              <Field label="Combined Pool Limit (₹)">
                <input
                  type="number"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${THEME.line}`,
                    background: "var(--surface-1)",
                    color: THEME.ink,
                    fontSize: 13,
                  }}
                  value={newPoolLimit}
                  onChange={(e) => setNewPoolLimit(e.target.value)}
                  placeholder="e.g. 500000"
                />
              </Field>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: THEME.muted, display: "block", marginBottom: 6 }}>
                Select Cards to Include in this Pool ({newPoolSelectedCardIds.length} selected):
              </label>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: `1px solid ${THEME.line}`,
                  borderRadius: 8,
                  padding: 8,
                  background: "var(--surface-1)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 6,
                }}
              >
                {currentSummary.activeCards.map((c) => {
                  const isSelected = newPoolSelectedCardIds.includes(c.id);
                  const currentPool = (c.sharedGroup || "").trim();
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        background: isSelected ? "color-mix(in srgb, var(--t-accent) 15%, var(--surface-0))" : "var(--surface-0)",
                        borderRadius: 6,
                        border: isSelected ? `1.5px solid var(--t-accent)` : `1px solid ${THEME.line}`,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPoolSelectedCardIds([...newPoolSelectedCardIds, c.id]);
                            if (!newPoolLimit && Number(c.limit ?? c.cardLimit)) {
                              setNewPoolLimit(String(c.limit ?? c.cardLimit));
                            }
                          } else {
                            setNewPoolSelectedCardIds(newPoolSelectedCardIds.filter((id) => id !== c.id));
                          }
                        }}
                      />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: 700, color: THEME.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.issuer}
                        </div>
                        <div style={{ fontSize: 10.5, color: THEME.muted }}>
                          Limit: {fmtINR(Number(c.limit ?? c.cardLimit) || 0)}
                          {currentPool ? ` · In ${currentPool}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <Button variant="secondary" size="sm" onClick={() => setShowCreateForm(false)} type="button">
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                disabled={!newPoolName.trim() || newPoolSelectedCardIds.length === 0}
                onClick={handleCreatePool}
                type="button"
              >
                Create Pool ({newPoolSelectedCardIds.length} Cards)
              </Button>
            </div>
          </div>
        )}

        {/* Unpooled Standalone Cards */}
        {currentSummary.standaloneCards.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.muted, marginBottom: 8 }}>
              Standalone Cards ({currentSummary.standaloneCards.length}) — Limit Counted Separately
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 8,
              }}
            >
              {currentSummary.standaloneCards.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "var(--surface-0)",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${THEME.line}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: THEME.ink }}>
                      {c.issuer}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.muted }}>
                      Limit: {fmtINRFull(Number(c.limit ?? c.cardLimit) || 0)}
                    </div>
                  </div>
                  {currentSummary.poolList.length > 0 && (
                    <select
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${THEME.line}`,
                        background: "var(--surface-1)",
                        color: THEME.ink,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const pool = currentSummary.poolList.find((p) => p.name === e.target.value);
                          if (pool) handleAssignCardToPool(c.id, pool.name, pool.poolLimit);
                        }
                      }}
                    >
                      <option value="">Move to pool...</option>
                      {currentSummary.poolList.map((p) => (
                        <option key={p.key} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
