import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ArrowRight,
  Eye,
  EyeOff,
  Plus,
  Sun,
  Moon,
  Download,
  HelpCircle,
  User,
  Calculator,
  FileText,
  Zap,
} from "lucide-react";
import { NAV_GROUPS } from "../../utils/appConstants";

export interface CommandKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string, subTab?: string) => void;
  onSelectSubTab?: (subTab: string | null) => void;
  togglePrivacy?: () => void;
  isPrivacyMode?: boolean;
  onQuickAdd?: () => void;
  toggleDarkMode?: () => void;
  isDarkMode?: boolean;
  onExportJSON?: () => void;
  onShowShortcuts?: () => void;
  familyProfiles?: any[];
  onSelectProfile?: (profileId: string) => void;
  activeProfile?: string;
}

export interface CommandItem {
  id: string;
  subTab?: string;
  label: string;
  group: string;
  icon?: any;
  action?: () => void;
  shortcut?: string;
  keywords?: string[];
  isAction?: boolean;
}

const CMDK_FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const RECENT_KEY = "cmd_recent_commands_v1";

// Subsequence fuzzy match with keyword and literal scoring
function fuzzyScore(text: string, query: string, keywords: string[] = []): number | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  // Exact or prefix match on label gets highest priority
  if (t === q) return 2000;
  if (t.startsWith(q)) return 1500;
  const literalIdx = t.indexOf(q);
  if (literalIdx !== -1) return 1000 - literalIdx;

  // Keyword match
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (k === q) return 900;
    if (k.startsWith(q)) return 850;
    if (k.includes(q)) return 800;
  }

  // Character subsequence match
  let tIdx = 0;
  let score = 0;
  let consecutive = 0;
  for (let i = 0; i < q.length; i++) {
    const foundIdx = t.indexOf(q[i], tIdx);
    if (foundIdx === -1) return null;
    consecutive = foundIdx === tIdx ? consecutive + 1 : 0;
    score += 2 + consecutive;
    tIdx = foundIdx + 1;
  }
  return score;
}

export const CommandKModal: React.FC<CommandKModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectSubTab,
  togglePrivacy,
  isPrivacyMode,
  onQuickAdd,
  toggleDarkMode,
  isDarkMode,
  onExportJSON,
  onShowShortcuts,
  familyProfiles,
  onSelectProfile,
  activeProfile,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : ["analytics", "banks", "cc", "demat", "calculators"];
    } catch {
      return ["analytics", "banks", "cc", "demat", "calculators"];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Body scroll lock, initial focus, and focus-restore-on-close
  useEffect(() => {
    if (isOpen) {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        document.body.style.overflow = previousOverflow;
        previouslyFocused?.focus?.();
      };
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Master list of commands: actions + navigation + calculators + profiles
  const allCommands = useMemo(() => {
    const items: CommandItem[] = [];

    // 1. Quick Actions
    if (onQuickAdd) {
      items.push({
        id: "action-quick-add",
        label: "Quick Add Transaction",
        group: "Quick Actions",
        icon: Plus,
        shortcut: "Q",
        keywords: ["add", "new", "transaction", "expense", "income", "record"],
        action: onQuickAdd,
        isAction: true,
      });
    }

    if (togglePrivacy) {
      items.push({
        id: "action-privacy",
        label: isPrivacyMode ? "Disable Privacy Mode (Reveal Amounts)" : "Enable Privacy Mode (Mask Amounts)",
        group: "Quick Actions",
        icon: isPrivacyMode ? Eye : EyeOff,
        shortcut: "P",
        keywords: ["privacy", "hide", "mask", "reveal", "show", "amounts", "numbers"],
        action: togglePrivacy,
        isAction: true,
      });
    }

    if (toggleDarkMode) {
      items.push({
        id: "action-theme",
        label: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
        group: "Quick Actions",
        icon: isDarkMode ? Sun : Moon,
        keywords: ["theme", "dark", "light", "mode", "color", "sun", "moon", "appearance"],
        action: toggleDarkMode,
        isAction: true,
      });
    }

    if (onExportJSON) {
      items.push({
        id: "action-export-json",
        label: "Download Full JSON Backup",
        group: "Quick Actions",
        icon: Download,
        keywords: ["backup", "export", "download", "json", "save", "data"],
        action: onExportJSON,
        isAction: true,
      });
    }

    if (onShowShortcuts) {
      items.push({
        id: "action-shortcuts",
        label: "Keyboard Shortcuts Guide",
        group: "Quick Actions",
        icon: HelpCircle,
        shortcut: "?",
        keywords: ["shortcuts", "hotkeys", "help", "keys", "commands"],
        action: onShowShortcuts,
        isAction: true,
      });
    }

    // 2. Family Profile Switchers
    if (familyProfiles && familyProfiles.length > 0 && onSelectProfile) {
      if (activeProfile !== "all") {
        items.push({
          id: "action-profile-all",
          label: "Switch View to All Family Profiles",
          group: "Profiles",
          icon: User,
          keywords: ["profile", "family", "all", "switch"],
          action: () => onSelectProfile("all"),
          isAction: true,
        });
      }
      familyProfiles.forEach((p) => {
        if (p.id !== activeProfile) {
          items.push({
            id: `action-profile-${p.id}`,
            label: `Switch Profile to ${p.name || p.relationship}`,
            group: "Profiles",
            icon: User,
            keywords: ["profile", "switch", p.name, p.relationship],
            action: () => onSelectProfile(p.id),
            isAction: true,
          });
        }
      });
    }

    // 3. Navigation Groups
    NAV_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        const isDirect = Boolean((item as any).directChildren && item.children?.length);
        items.push({
          id: isDirect ? item.children![0].id : item.id,
          subTab: undefined,
          label: item.label,
          group: group.title,
          icon: item.icon,
          keywords: [group.title, item.label],
        });
        if (item.children) {
          item.children.forEach((child) => {
            items.push({
              id: isDirect ? child.id : item.id,
              subTab: isDirect ? undefined : child.id,
              label: `${item.label} › ${child.label}`,
              group: group.title,
              icon: child.icon || item.icon,
              keywords: [group.title, item.label, child.label],
            });
          });
        }
      });
    });

    // 4. Financial Calculators & Tools
    const extraTools: CommandItem[] = [
      { id: "calculators", subTab: "emi", label: "EMI Loan Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["loan", "emi", "interest", "home loan", "car loan"] },
      { id: "calculators", subTab: "sip", label: "SIP Returns Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["sip", "mutual fund", "compounding", "returns"] },
      { id: "calculators", subTab: "step-sip", label: "Step-Up SIP Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["step up", "annual increment", "sip"] },
      { id: "calculators", subTab: "swp", label: "SWP Retirement Cashflow Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["swp", "systematic withdrawal", "pension"] },
      { id: "calculators", subTab: "cagr", label: "CAGR Growth Rate Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["cagr", "annualized", "growth"] },
      { id: "calculators", subTab: "fire", label: "FIRE Retirement Independence Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["fire", "financial independence", "retire early"] },
      { id: "calculators", subTab: "fdrd", label: "FD & RD Maturity Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["fd", "rd", "fixed deposit", "recurring deposit"] },
      { id: "calculators", subTab: "loan-invest", label: "Loan Prepay vs Reinvest Advisor", group: "Financial Calculators", icon: Calculator, keywords: ["prepay", "invest", "arbitrage"] },
      { id: "calculators", subTab: "projection", label: "Wealth & Net Worth Multi-Year Projection", group: "Financial Calculators", icon: Calculator, keywords: ["projection", "future net worth", "wealth"] },
      { id: "calculators", subTab: "stress", label: "Crisis Runway Stress Tester", group: "Financial Calculators", icon: Calculator, keywords: ["runway", "emergency", "crisis", "stress test"] },
      { id: "calculators", subTab: "monte-carlo", label: "Monte Carlo Wealth Simulator", group: "Financial Calculators", icon: Calculator, keywords: ["monte carlo", "probability", "simulation"] },
      { id: "calculators", subTab: "indexation", label: "CII Capital Gains Indexation Calculator", group: "Financial Calculators", icon: Calculator, keywords: ["indexation", "cii", "cost inflation", "capital gains"] },
      { id: "calculators", subTab: "retirement-income", label: "Retirement Multi-Stream Income Planner", group: "Financial Calculators", icon: Calculator, keywords: ["retirement", "annuity", "income"] },
      { id: "calculators", subTab: "nps", label: "NPS Tier-1 Pension & Annuity Analyzer", group: "Financial Calculators", icon: Calculator, keywords: ["nps", "pension", "annuity", "tier 1"] },
      { id: "taxtools", subTab: "advance", label: "Advance Tax Quarterly Calculator (Q1/Q2/Q3/Q4)", group: "Tax & Compliance", icon: FileText, keywords: ["advance tax", "quarterly", "tds"] },
      { id: "taxtools", subTab: "26as", label: "Form 26AS Tax Credit Reconciliation", group: "Tax & Compliance", icon: FileText, keywords: ["26as", "ais", "tax credit", "reconciliation"] },
      { id: "taxtools", subTab: "hra", label: "HRA Exemption & Rent Receipts Generator", group: "Tax & Compliance", icon: FileText, keywords: ["hra", "rent receipt", "house rent allowance"] },
      { id: "taxtools", subTab: "gst-tds", label: "Income Tax TDS Rate Reckoner", group: "Tax & Compliance", icon: FileText, keywords: ["tds", "withholding", "rates"] },
    ];

    extraTools.forEach((tool) => items.push(tool));

    return items;
  }, [
    onQuickAdd,
    togglePrivacy,
    isPrivacyMode,
    toggleDarkMode,
    isDarkMode,
    onExportJSON,
    onShowShortcuts,
    familyProfiles,
    onSelectProfile,
    activeProfile,
  ]);

  // Record item into recent command history
  const recordRecent = (item: CommandItem) => {
    try {
      const key = item.id;
      const next = [key, ...recentIds.filter((id) => id !== key)].slice(0, 8);
      setRecentIds(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* best-effort: storage/parse unavailable */
    }
  };

  const executeItem = (item: CommandItem) => {
    recordRecent(item);
    if (item.action) {
      item.action();
    } else {
      onSelectTab(item.id, item.subTab);
      if (item.subTab) {
        onSelectSubTab?.(item.subTab);
      } else {
        onSelectSubTab?.(null as any);
      }
    }
    onClose();
  };

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // Prioritize actions, then recents, then primary workspaces
      const actionItems = allCommands.filter((c) => c.isAction);
      const recentItems = recentIds
        .map((rid) => allCommands.find((c) => c.id === rid && !c.isAction))
        .filter((c): c is CommandItem => Boolean(c))
        .slice(0, 4);

      const standardFavorites = ["analytics", "banks", "cc", "demat", "calculators", "budget", "tax"]
        .map((fid) => allCommands.find((c) => c.id === fid && !c.subTab))
        .filter((c): c is CommandItem => Boolean(c));

      // Combine unique items
      const set = new Set<string>();
      const result: CommandItem[] = [];
      [...actionItems, ...recentItems, ...standardFavorites].forEach((item) => {
        const key = `${item.id}-${item.subTab || ""}`;
        if (!set.has(key)) {
          set.add(key);
          result.push(item);
        }
      });
      return result.slice(0, 15);
    }

    return allCommands
      .map((item) => {
        const labelScore = fuzzyScore(item.label, q, item.keywords);
        const groupScore = fuzzyScore(item.group, q);
        if (labelScore === null && groupScore === null) return null;
        const score = Math.max(labelScore ?? -Infinity, (groupScore ?? -Infinity) - 400);
        return { item, score };
      })
      .filter((x): x is { item: CommandItem; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item)
      .slice(0, 25);
  }, [allCommands, query, recentIds]);

  // Keep selection in range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        return;
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (filteredItems.length ? (i + 1) % filteredItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          filteredItems.length ? (i - 1 + filteredItems.length) % filteredItems.length : 0
        );
      } else if (e.key === "Enter") {
        const item = filteredItems[selectedIndex];
        if (item) {
          e.preventDefault();
          executeItem(item);
        }
      } else if (e.key === "Tab" && containerRef.current) {
        const focusable = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(CMDK_FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-cmdk, 600)",
        background: "rgba(0, 0, 0, 0.68)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        paddingLeft: "16px",
        paddingRight: "16px",
        animation: "fadeIn 0.15s ease-out",
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="cmd-modal-container"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "var(--surface-0)",
          border: "1px solid var(--t-line)",
          borderRadius: "18px",
          boxShadow: "0 28px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--t-line)",
          overflow: "hidden",
          animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid var(--t-line)",
            background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
          }}
        >
          <Search size={20} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page, calculator or action... (⌘K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--t-ink)",
              fontSize: "15.5px",
              fontWeight: 500,
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              style={{
                background: "color-mix(in srgb, var(--t-muted) 15%, transparent)",
                border: "none",
                borderRadius: "50%",
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--t-muted)",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                fontSize: 14,
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "color-mix(in srgb, var(--t-muted) 12%, transparent)",
              border: "1px solid var(--t-line)",
              borderRadius: "6px",
              padding: "4px 8px",
              color: "var(--t-muted)",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            ESC
          </button>
        </div>

        {/* Quick Commands & Navigation List */}
        <div style={{ maxHeight: "420px", overflowY: "auto", padding: "10px" }}>
          {filteredItems.map((item, idx) => {
            const Icon = item.icon || ArrowRight;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={`${item.id}-${item.subTab || idx}`}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                className="cmd-item"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => executeItem(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  color: "var(--t-ink)",
                  background: isSelected
                    ? "color-mix(in srgb, var(--t-accent) 14%, transparent)"
                    : "transparent",
                  borderLeft: isSelected ? "3.5px solid var(--t-accent)" : "3.5px solid transparent",
                  transition: "background 0.12s ease, border-color 0.12s ease, transform 0.12s ease",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: isSelected
                      ? "var(--t-accent)"
                      : item.isAction
                        ? "color-mix(in srgb, var(--state-warning, #f59e0b) 15%, transparent)"
                        : "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                    color: isSelected
                      ? "#ffffff"
                      : item.isAction
                        ? "var(--state-warning, #f59e0b)"
                        : "var(--t-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.12s ease, color 0.12s ease",
                  }}
                >
                  <Icon size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: isSelected ? 600 : 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--t-ink)",
                    }}
                  >
                    {item.label}
                  </div>
                </div>

                {item.shortcut && (
                  <kbd
                    style={{
                      fontSize: "10px",
                      color: "var(--t-muted)",
                      background: "color-mix(in srgb, var(--t-muted) 12%, transparent)",
                      border: "1px solid var(--t-line)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.shortcut}
                  </kbd>
                )}

                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    background: "color-mix(in srgb, var(--t-muted) 12%, transparent)",
                    color: "var(--t-muted)",
                    flexShrink: 0,
                  }}
                >
                  {item.group}
                </span>

                <ArrowRight
                  size={14}
                  style={{
                    color: isSelected ? "var(--t-accent)" : "var(--t-muted)",
                    opacity: isSelected ? 1 : 0.4,
                    flexShrink: 0,
                    transform: isSelected ? "translateX(2px)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                />
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--t-muted)", fontSize: "14px" }}>
              No matching commands or pages found for &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 16px",
            background: "color-mix(in srgb, var(--surface-1) 80%, transparent)",
            borderTop: "1px solid var(--t-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--t-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span>
              <kbd style={{ background: "color-mix(in srgb, var(--t-muted) 15%, transparent)", border: "1px solid var(--t-line)", padding: "2px 5px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>↑</kbd> <kbd style={{ background: "color-mix(in srgb, var(--t-muted) 15%, transparent)", border: "1px solid var(--t-line)", padding: "2px 5px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>↓</kbd> Navigate
            </span>
            <span>
              <kbd style={{ background: "color-mix(in srgb, var(--t-muted) 15%, transparent)", border: "1px solid var(--t-line)", padding: "2px 5px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>↵</kbd> Select
            </span>
            <span>
              <kbd style={{ background: "color-mix(in srgb, var(--t-muted) 15%, transparent)", border: "1px solid var(--t-line)", padding: "2px 5px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>ESC</kbd> Close
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "11px", letterSpacing: "0.02em", color: "var(--t-muted)" }}>
            <Zap size={12} style={{ color: "var(--t-accent)" }} />
            ArthaDrishti Executive OS
          </div>
        </div>
      </div>
    </div>
  );
};
