import { STORAGE_KEY } from "./constants";
import { getCurrentFY, getCurrentFYStartYear } from "./appConstants";
import { isSeniorCitizen, calculateAge } from "./masterData";

export const loadState = () => {
  try {
    const raw =
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null) ||
      (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStateLocal = (s: any) => {
  try {
    const serialized = JSON.stringify({ ...s, _ts: Date.now() });
    // Audit L3 & S7: Store in sessionStorage so full financial ledger never survives browser restarts
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, serialized);
    }
    // Remove persistent copy from localStorage to prevent unencrypted disk persistence
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
};

export const fmtINR = (n: number | string | null | undefined) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "₹0";
  const num = Number(n);
  const abs = Math.abs(num);
  if (Math.round(abs) === 0) return "₹0";
  const sign = num < 0 ? "-" : "";
  // parseFloat strips trailing zeros: 50.0 → "50", 1.50 → "1.5", 2.00 → "2"
  const fmt = (val: number, dec: number) => parseFloat(val.toFixed(dec)).toString();
  if (abs >= 10000000) return `${sign}₹${fmt(abs / 10000000, 2)}Cr`;
  if (abs >= 100000) return `${sign}₹${fmt(abs / 100000, 2)}L`;
  if (abs >= 1000) return `${sign}₹${fmt(abs / 1000, 1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
};

export const fmtINRFull = (n: number | string | null | undefined) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "₹0";
  const rounded = Math.round(Number(n));
  if (rounded === 0) return "₹0";
  const sign = rounded < 0 ? "-" : "";
  return `${sign}₹${Math.abs(rounded).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

export const fmtINRExact = (n: number | string | null | undefined) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "₹0";
  const rounded = Math.round(Number(n) * 100) / 100;
  if (rounded === 0) return "₹0";
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? "-" : "";
  const hasPaisa = Math.round(abs * 100) % 100 !== 0;
  return `${sign}₹${abs.toLocaleString("en-IN", { minimumFractionDigits: hasPaisa ? 2 : 0, maximumFractionDigits: 2 })}`;
};

export const fmtDate = (d?: string | null): string => {
  if (!d) return "—";
  try {
    const parts = d.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
  } catch {}
  return String(d);
};

// Some strings (audit log descriptions, reminder subtitles) are pre-built free
// text with a rupee amount embedded — e.g. "Added Transaction: Groceries — ₹5,240"
// — so they can't be wrapped field-by-field with <Prv>/<Money>. Mask the ₹
// amounts embedded in the text instead.
export const maskCurrencyInText = (text: string, privacyMode: boolean): string => {
  if (!privacyMode || !text) return text;
  return text.replace(/₹\s?-?[\d,]+(\.\d+)?/g, "₹••••");
};

// LIC/Term/Investment-plan records carry a pre-annualized `annualPremium`.
// Health-insurance records don't — they only have `premium` + `premiumFrequency`
// (e.g. monthly) — so using the raw `premium` as-is understates the true
// annual cost by up to 12x for monthly-billed policies. This table and helper
// used to be copy-pasted independently in FinancialCalendarTab and
// PaymentCalendarTab; FinancialCalendarTab's copy was missing the multiplier
// entirely for LIC/Term/Investment plans (only its separate health-insurance
// block had it), understating those premiums the same way until this was
// shared. Both calendars, and anywhere else needing "true annual premium
// cost", should go through this one function.
export const PREMIUM_FREQ_MULT: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  semi_annual: 2,
  annual: 1,
};
export const annualizePremium = (
  premium: number | string | null | undefined,
  frequency: string | null | undefined,
  preAnnualized?: number | string | null | undefined
): number => {
  if (preAnnualized) return Number(preAnnualized);
  return Number(premium || 0) * (PREMIUM_FREQ_MULT[frequency || "annual"] || 1);
};

export const DEFAULT_GOLD_PRICE_PER_GRAM = 7200; // ₹ per gram for 24K, last-resort fallback only

export const GOLD_PURITY_FACTOR: Record<string, number> = {
  "24K": 1,
  "22K": 22 / 24,
  "18K": 18 / 24,
  "14K": 14 / 24,
};

// Gold price per gram is entered once (GoldSGBTab) and consumed by many modules
// (net worth, analytics, rebalancing, family view, benchmark). It's synced to
// `user_settings.gold_price_per_gram` so it's available across devices — but
// every consumer used to read `localStorage` directly instead, so the price set
// on one device silently fell back to the stale default on any other device/
// browser. Centralizing here: state (DB-synced) wins, localStorage is only a
// same-device cache for callers that don't have `state` in scope.
export const getGoldPricePerGram = (state?: any): number => {
  const fromState = Number(state?.settings?.goldPricePerGram);
  if (fromState > 0) return fromState;
  try {
    const fromLocal = Number(localStorage.getItem("gold_price_per_gram"));
    if (fromLocal > 0) return fromLocal;
  } catch {}
  return DEFAULT_GOLD_PRICE_PER_GRAM;
};

// FIRE (Financial Independence): single source of truth for the "corpus
// needed" formula (annual expense, inflation-projected to `yearsOut`, divided
// by the safe withdrawal rate). Previously AnalyticsTab's dashboard widget,
// AnalyticsTab's Planning projection chart, and the standalone FIREPlannerTab
// each reimplemented this independently — the dashboard/chart hardcoded a flat
// 25x multiplier (implying a fixed 4% SWR) while the Planner exposed SWR as a
// user-adjustable input, so the same household could see disagreeing FIRE
// targets across tabs with no explanation. Centralizing the formula here means
// every consumer computes the same number for the same inputs; the Dashboard/
// chart intentionally still pass the fixed default SWR (a quick heuristic),
// while FIREPlannerTab passes the user's chosen SWR (a tunable model) — that
// difference is by design, but the underlying math can never drift apart again.
export const DEFAULT_FIRE_SWR = 4; // Safe Withdrawal Rate %, i.e. a flat 25x rule

export const computeFireTarget = (
  annualExpense: number,
  yearsOut: number = 0,
  swrPercent: number = DEFAULT_FIRE_SWR,
  inflationPercent: number = 0
): number => {
  const infl = Math.pow(1 + inflationPercent / 100, yearsOut);
  const swr = swrPercent > 0 ? swrPercent : DEFAULT_FIRE_SWR;
  return (Math.max(0, annualExpense) * infl) / (swr / 100);
};

// Emergency Fund: this and the two helpers below (getEmergencyFundLiquidAssets,
// getEmergencyFundMonthlyExpense) are the single source of truth for "months of
// expenses covered by liquid assets" — used by useMetrics (metrics.emergencyFund)
// and every tab/alert that surfaces this figure. Previously each consumer
// (EmergencyFundTab, AnalyticsTab's dashboard widget, its Financial Health Score,
// Smart Insights, gamification badges, useAlerts, AIAssistantTab, SmartAlertsTab,
// PerformanceBenchmarkTab) recomputed its own version of "liquid assets" with
// different asset sets (some included near-term FDs, some liquid mutual funds,
// some prepaid cards, some none of the above) and different month thresholds for
// the same status label — so the same household could see e.g. "2.1 months /
// Critical" on one tab and "5.4 months / Building" on another for the exact same
// underlying data. Centralizing here keeps every surface in sync.
export const EMERGENCY_FUND_TARGET_MONTHS = 6;

// FDs maturing within this window count as "near-liquid" for emergency-fund
// purposes (breaking an FD outside this window still leaves the fund usable, but
// isn't treated as instantly accessible liquidity).
const EMERGENCY_FUND_FD_WINDOW_DAYS = 90;

export type EmergencyFundTier = "critical" | "building" | "healthy" | "excellent";

// Single tier→label→color mapping for the emergency-fund status badge/gauge/etc.
// `badgeVariant` matches the `Badge` component's variant prop so callers can pass
// it straight through without re-deriving a color.
export const getEmergencyFundStatus = (
  monthsCovered: number
): { tier: EmergencyFundTier; label: string; badgeVariant: "rust" | "gold" | "accent" | "sage" } => {
  if (monthsCovered >= 12) return { tier: "excellent", label: "Excellent", badgeVariant: "sage" };
  if (monthsCovered >= EMERGENCY_FUND_TARGET_MONTHS)
    return { tier: "healthy", label: "Healthy", badgeVariant: "accent" };
  if (monthsCovered >= 3) return { tier: "building", label: "Needs Improvement", badgeVariant: "gold" };
  return { tier: "critical", label: "Critical", badgeVariant: "rust" };
};

// Liquid assets counted toward the emergency fund: bank balances, FDs maturing
// within EMERGENCY_FUND_FD_WINDOW_DAYS days (principal), liquid/money-market/
// overnight/ultra-short mutual funds (current value), and prepaid card balances.
// `prepaidValue` is passed in rather than re-derived here because the correct
// calculation (load/spend ledger, closed-card exclusion) already lives in
// useMetrics — re-deriving it independently is what caused prior drift (one
// earlier version filtered on transaction types that don't exist in the data
// model and always evaluated to zero).
export const getEmergencyFundLiquidAssets = (
  state: any,
  cashInBanks: number,
  prepaidValue: number
): { liquidAssets: number; nearTermFDValue: number; liquidMFValue: number } => {
  const nearTermFDValue = (state?.fixedDeposits || []).reduce((sum: number, fd: any) => {
    if (!fd.maturityDate) return sum;
    // Parse at local midnight, not UTC, to match the local Date.now() comparison.
    const matMs = new Date(fd.maturityDate + "T00:00:00").getTime();
    const nowMs = Date.now();
    if (matMs >= nowMs && matMs <= nowMs + EMERGENCY_FUND_FD_WINDOW_DAYS * 86400000) {
      return sum + Number(fd.principal || 0);
    }
    return sum;
  }, 0);

  const liquidMFValue = (state?.mutualFunds || []).reduce((sum: number, m: any) => {
    const cat = (m.category || m.type || "").toLowerCase();
    if (
      cat.includes("liquid") ||
      cat.includes("money market") ||
      cat.includes("overnight") ||
      cat.includes("ultra short")
    ) {
      return sum + (Number(m.units) || 0) * (Number(m.currentNav) || Number(m.buyNav) || 0);
    }
    return sum;
  }, 0);

  return {
    liquidAssets: cashInBanks + nearTermFDValue + liquidMFValue + Math.max(0, prepaidValue),
    nearTermFDValue,
    liquidMFValue,
  };
};

// Monthly expense base for the emergency-fund runway. Prefers the user's own
// budget (excluding Transfer/Self Transfer/Investment categories, which are
// budget-able but aren't real spend — see MonthlyReportModal's same exclusion),
// then falls back to a bottom-up sum of known recurring commitments, then to
// the transaction-derived `monthExpense` metric.
export const getEmergencyFundMonthlyExpense = (state: any, fallbackMonthExpense: number = 0): number => {
  const isNonExpenseBudgetCat = (cat: string) =>
    ["Transfer", "Self Transfer", "Self-Transfer", "Investment"].includes(cat || "");
  const budgetTotal = (state?.budgets || [])
    .filter((b: any) => !isNonExpenseBudgetCat(b.category))
    .reduce((s: number, b: any) => s + Number(b.monthly || b.monthlyLimit || 0), 0);
  if (budgetTotal > 0) return budgetTotal;

  const emis = (state?.loansTaken || [])
    .filter(
      (l: any) =>
        (l.status || "").toLowerCase() !== "closed" &&
        (l.outstanding == null || Number(l.outstanding) > 0 || Number(l.principal || 0) > 0)
    )
    .reduce((s: number, l: any) => s + Number(l.emi || 0), 0);
  const sips = (state?.sips || [])
    .filter((s: any) => s.status !== "stopped")
    .reduce((s: number, si: any) => s + Number(si.amount || 0), 0);
  const subs = (state?.subscriptions || [])
    .filter((s: any) => !s.paused)
    .reduce((s: number, sub: any) => s + getSubscriptionMonthlyEquivalent(sub.amount, sub.cycle), 0);
  const recurring = (state?.recurringExpenses || []).reduce(
    (s: number, r: any) => s + Number(r.amount || 0),
    0
  );
  const rent = (state?.rentedProperties || [])
    .filter((p: any) => p.isActive !== false)
    .reduce((s: number, p: any) => s + getEffectiveRent(p), 0);
  const insurance = [
    ...(state?.lic || []),
    ...(state?.termPlans || []),
    ...(state?.investmentPlans || []),
    ...(state?.healthInsurance || []),
  ].reduce((s: number, p: any) => s + annualizePremium(p.premium, p.premiumFrequency, p.annualPremium) / 12, 0);
  const bottomUp = emis + sips + subs + recurring + rent + insurance;

  return bottomUp > 0 ? bottomUp : fallbackMonthExpense || 0;
};

export const uid = () => {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getLocalDateString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const today = () => getLocalDateString(new Date());

// Alert titles like "HDFC CC due in 5d" or "Credit utilization at 78%" embed a
// number that changes daily even though the user is dismissing/snoozing the same
// underlying condition. Keying dismissal off the raw title means a snooze (or even
// a "permanent" dismiss) silently re-expires the moment that number ticks over —
// e.g. a 7-day snooze on "due in 5d" no longer matches "due in 4d" the next day.
// Stripping digits gives a stable key for the same alert across its lifetime while
// still keeping different alerts (different issuer/policy/name in the title) distinct.
export const alertDismissKey = (title: string) => title.replace(/\d+(\.\d+)?/g, "#");

export const monthsBetween = (d1: string, d2: string) => {
  const a = new Date(d1),
    b = new Date(d2);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
};

// Add `monthsToAdd` calendar months to a "YYYY-MM-DD" date string, clamping the day-of-month so
// it never overflows into a later month (e.g. Jan 31 + 1 month must land on Feb 28/29, not roll
// over into March — plain Date.setMonth silently overflows for day 29-31 starting dates when the
// target month is shorter). Operates entirely on Y-M-D components (no Date-object round trip),
// so it's also immune to the UTC/local-timezone off-by-one that `new Date(str).toISOString()`
// patterns are prone to for users outside IST. Mirrors XIRRReportTab's Date-object version of
// the same fix, for call sites that work with date strings instead.
export const addMonthsToDateStr = (dateStr: string, monthsToAdd: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const total = m - 1 + monthsToAdd;
  const newY = y + Math.floor(total / 12);
  const newM = ((total % 12) + 12) % 12;
  const daysInMonth = new Date(newY, newM + 1, 0).getDate();
  const newD = Math.min(d, daysInMonth);
  return `${newY}-${String(newM + 1).padStart(2, "0")}-${String(newD).padStart(2, "0")}`;
};

// Returns the next occurrence (this year, or next if already past) of
// `startDate`'s month/day on or after `refDate` — both "YYYY-MM-DD". Used for
// annual-renewal due dates (insurance premiums etc). Built entirely from
// local Y-M-D components (never a bare `new Date("YYYY-MM-DD")` parse, which
// is UTC and can land on the wrong local day) and clamps the day-of-month so
// e.g. a Feb 29 anniversary doesn't overflow into March on a non-leap year —
// same class of bug documented on `getCCDueDate` above.
export const nextAnnualOccurrence = (startDate: string, refDate: string): string => {
  const [, m, d] = startDate.split("-").map(Number);
  const [refY] = refDate.split("-").map(Number);
  const clampedDate = (y: number) => {
    const lastDay = new Date(y, m, 0).getDate();
    return new Date(y, m - 1, Math.min(d, lastDay));
  };
  let occStr = getLocalDateString(clampedDate(refY));
  if (occStr < refDate) occStr = getLocalDateString(clampedDate(refY + 1));
  return occStr;
};

export const getSubscriptionCycleStep = (cycle?: string): number => {
  const c = (cycle || "monthly").toLowerCase();
  if (c === "yearly" || c === "annual") return 12;
  if (c === "half-yearly" || c === "semi-annual" || c === "half_yearly") return 6;
  if (c === "quarterly") return 3;
  return 1;
};

export const getSubscriptionMonthlyEquivalent = (amount: number | string, cycle?: string): number => {
  const amt = Number(amount || 0);
  const step = getSubscriptionCycleStep(cycle);
  return amt / step;
};

export const getNextSubscriptionRenewal = (renewalDate?: string, cycle?: string, refDate?: string): string => {
  if (!renewalDate) return "";
  const targetRef = refDate || today();
  if (renewalDate >= targetRef) return renewalDate;
  const step = getSubscriptionCycleStep(cycle);
  let dateStr = renewalDate;
  let guard = 0;
  while (dateStr < targetRef && guard < 1200) {
    dateStr = addMonthsToDateStr(dateStr, step);
    guard++;
  }
  return dateStr;
};

// ── Rental Escalation Tier Helpers ────────────────────────────────────────────

export const getEffectiveRent = (p: any, yearMonth?: string): number => {
  if (!p || p.isActive === false) return 0;
  const refMonth = yearMonth || today().slice(0, 7);
  if (p.agreementStart && refMonth < p.agreementStart.slice(0, 7)) return 0;
  if (p.agreementEnd && refMonth > p.agreementEnd.slice(0, 7)) return 0;

  const tiers = p.escalationTiers;
  if (!tiers || !tiers.length || !p.agreementStart) return Number(p.monthlyRent || 0);
  const [refY, refM] = refMonth.split("-").map(Number);
  const [startY, startM] = p.agreementStart.slice(0, 7).split("-").map(Number);
  const monthsElapsed = (refY - startY) * 12 + (refM - startM);
  if (monthsElapsed < 0) return 0;
  let cumulative = 0;
  for (const tier of tiers) {
    cumulative += Number(tier.durationMonths || 12);
    if (monthsElapsed < cumulative) return Number(tier.amount || 0);
  }
  return Number(tiers[tiers.length - 1]?.amount || p.monthlyRent || 0);
};

export const getCurrentTierIndex = (p: any, yearMonth?: string): number => {
  const tiers = p.escalationTiers;
  if (!tiers || !tiers.length || !p.agreementStart || p.isActive === false) return -1;
  const refMonth = yearMonth || today().slice(0, 7);
  if (p.agreementEnd && refMonth > p.agreementEnd.slice(0, 7)) return -1;
  const [refY, refM] = refMonth.split("-").map(Number);
  const [startY, startM] = p.agreementStart.slice(0, 7).split("-").map(Number);
  const monthsElapsed = (refY - startY) * 12 + (refM - startM);
  if (monthsElapsed < 0) return -1;
  let cumulative = 0;
  for (let i = 0; i < tiers.length; i++) {
    cumulative += Number(tiers[i].durationMonths || 12);
    if (monthsElapsed < cumulative) return i;
  }
  return -1;
};

export const getMonthsToNextEscalation = (p: any, yearMonth?: string): number | null => {
  const tiers = p.escalationTiers;
  if (!tiers || tiers.length < 2 || !p.agreementStart || p.isActive === false) return null;
  const refMonth = yearMonth || today().slice(0, 7);
  if (p.agreementEnd && refMonth >= p.agreementEnd.slice(0, 7)) return null;
  const currentTier = getCurrentTierIndex(p, refMonth);
  if (currentTier === -1 || currentTier >= tiers.length - 1) return null;
  const [refY, refM] = refMonth.split("-").map(Number);
  const [startY, startM] = p.agreementStart.slice(0, 7).split("-").map(Number);
  const monthsElapsed = (refY - startY) * 12 + (refM - startM);
  if (monthsElapsed < 0) return null;
  let cumulative = 0;
  for (let i = 0; i <= currentTier; i++) {
    cumulative += Number(tiers[i].durationMonths || 12);
  }
  return cumulative - monthsElapsed;
};

// ── End Rental Escalation Tier Helpers ────────────────────────────────────────

export const getCCDueDate = (c: any, referenceDate?: Date): string | null => {
  if (!c) return null;
  // Prefer computed due date from dueDay over a stored dueDate.
  // A stored dueDate can go stale (e.g. card's dueDay changed but old dueDate was never cleared).
  // If dueDay is present (or dueDate is numeric), always compute the next occurrence from it.
  const now = referenceDate || new Date();
  const rawDueDay =
    c.dueDay ??
    (typeof c.dueDate === "number" ||
    (typeof c.dueDate === "string" && /^\d{1,2}$/.test(c.dueDate.trim()))
      ? c.dueDate
      : undefined);

  if (rawDueDay !== undefined && rawDueDay !== null && rawDueDay !== "") {
    const day = parseInt(String(rawDueDay), 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      // Clamp to the last day of the target month so a dueDay of 29/30/31 doesn't
      // overflow into the following month (e.g. Feb 31 -> Mar 3) when the target
      // month is shorter (Feb, or any 30-day month).
      const clampedDate = (year: number, month: number) => {
        const lastDay = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(day, lastDay));
      };
      let d = clampedDate(now.getFullYear(), now.getMonth());
      // Compare dates only (not time-of-day): `d` is always midnight, so comparing it
      // against a full `now` timestamp made the due date roll to next month even when
      // today IS the due date (midnight < any later time today). That showed "~30 days"
      // left instead of "due today" on the actual due date.
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (d < nowMidnight) {
        const nextMonth = now.getMonth() + 1;
        d = clampedDate(now.getFullYear() + Math.floor(nextMonth / 12), nextMonth % 12);
      }
      return getLocalDateString(d);
    }
  }
  // Fall back to the stored dueDate only when no valid dueDay is set and dueDate is a valid date string
  if (typeof c.dueDate === "string" && c.dueDate.includes("-")) {
    return c.dueDate;
  }
  return null;
};

export const autoCateg = (note: string): string | null => {
  if (!note) return null;
  const n = note.toLowerCase();
  const rules: [RegExp, string][] = [
    [
      /zomato|swiggy|dunzo|eatsure|domino|pizza|restaurant|cafe|dining|meal|biryani|mcdonalds|kfc|burger|blinkit.*food/i,
      "Food",
    ],
    [
      /grocery|bigbasket|jiomart|zepto|grofers|supermarket|vegetables?|fruits?|departmental/i,
      "Groceries",
    ],
    [
      /\buber\b|ola cab|rapido|auto.*rikshaw|cab ride|taxi|metro|train ticket|bus ticket|flight|airline|petrol|diesel|fuel pump/i,
      "Transport",
    ],
    [/rent|landlord|\bpg\b|hostel|accommodation/i, "Rent"],
    [
      /electricity|water bill|gas bill|internet|broadband|wifi|\bjio\b|\bairtel\b|\bbsnl\b|\bvi\b|vodafone|recharge|postpaid|prepaid/i,
      "Bills",
    ],
    [/salary|payroll|\bctc\b|bonus|incentive|appraisal|stipend/i, "Salary"],
    [
      /\bsip\b|mutual fund|stock purchase|zerodha|groww|nifty|sensex|invest|ppf deposit|nps.*contrib|demat/i,
      "Investment",
    ],
    [
      /credit\s*card|\bcc\b.*(bill|pay|stmt|statement|advance|loan|transfer|cash)|card\s*to\s*bank|cash\s*advance/i,
      "Credit Card",
    ],
    [/\bemi\b|loan repay|hdfc.*loan|sbi.*loan|equitas|debt repay/i, "EMI"],
    [/loan recover|money recover|lent recover/i, "Loan Recovery"],
    [/loan given|lent money|money lent/i, "Loan Given"],
    [
      /insurance|lic.*premium|term.*insur|policy.*premium|health.*insur|star.*health|niva.*bupa|hdfc.*ergo|bajaj.*allianz/i,
      "Insurance",
    ],
    [
      /\bsubscription\b|\brenew\b|netflix|hotstar|prime.*video|disney.*plus|spotify|amazon.*prime|zee5|sonyliv|apple.*tv|crunchyroll/i,
      "Subscription",
    ],
    [/amazon|flipkart|myntra|ajio|meesho|nykaa|snapdeal|shopping|purchase order/i, "Shopping"],
    [/doctor|hospital|pharmacy|medicine|chemist|health|apollo|max.*hosp|fortis|clinic/i, "Medical"],
    [/\bmovie\b|cinema|pvr|multiplex|bookmyshow/i, "Entertainment"],
    [/income tax|tds deposit|\bgst\b|\btax\b/i, "Tax"],
    [/neft|rtgs|imps|upi.*transfer|transfer to/i, "Transfer"],
    [/maintenance|utilities|sewage|society charge/i, "Utilities"],
  ];
  for (const [re, cat] of rules) if (re.test(n)) return cat;
  return null;
};

export const calcCAGR = (invested: number, current: number, buyDate: string): number | null => {
  if (!buyDate || invested <= 0 || current <= 0) return null;
  const msElapsed = Date.now() - new Date(buyDate).getTime();
  if (isNaN(msElapsed) || msElapsed <= 0) return null; // future date or invalid date string
  const years = msElapsed / (365.25 * 24 * 3600 * 1000);
  if (years < 0.08) return null;
  return (Math.pow(current / invested, 1 / years) - 1) * 100;
};

export const fdMaturity = (principal: number, rate: number, years: number, freq = 4) => {
  return principal * Math.pow(1 + rate / 100 / freq, freq * years);
};

export const isDepositClosed = (d: any): boolean => {
  if (!d) return true;
  const status = String(d.status || "").toLowerCase();
  const payoutStatus = String(d.payoutStatus || "").toLowerCase();
  return status === "closed" || status === "matured" || payoutStatus === "credited";
};

export const fdCurrentValue = (f: any, asOfDate: string = today()): number => {
  if (!f || isDepositClosed(f)) return 0;
  const principal = Number(f.principal || 0);
  if (principal <= 0) return 0;
  const payout = String(f.interestPayout || "cumulative").toLowerCase();
  // Periodic payout FDs (monthly, quarterly, half_yearly, annual) pay interest out to bank;
  // their principal balance remains flat at `principal`.
  if (payout !== "cumulative" && payout !== "at_maturity" && payout !== "reinvest") {
    return principal;
  }
  const rate = Number(f.rate || 0);
  if (!f.startDate || rate <= 0 || f.startDate > asOfDate) return principal;
  const capDate = f.maturityDate && f.maturityDate < asOfDate ? f.maturityDate : asOfDate;
  const elapsedDays = Math.max(
    0,
    (new Date(capDate).getTime() - new Date(f.startDate).getTime()) / 86400000
  );
  if (isNaN(elapsedDays) || elapsedDays <= 0) return principal;
  const freq = Number(f.compoundingFrequency) || 4;
  return Math.round(fdMaturity(principal, rate, elapsedDays / 365.25, freq));
};

export const rdMaturity = (monthly: number, rate: number, months: number) => {
  const n = 4,
    r = rate / 100;
  let total = 0;
  for (let i = 0; i < months; i++) {
    const t = (months - i) / 12;
    total += monthly * Math.pow(1 + r / n, n * t);
  }
  return total;
};

/**
 * Calculates number of installments deposited for a Recurring Deposit.
 * Prioritizes explicit paidInstallments count if tracked, otherwise computes elapsed calendar months.
 */
export const rdElapsed = (r: any, asOfDate: string = today()): number => {
  if (!r) return 0;
  const tenure = Number(r.tenureMonths) || 0;
  if (r.paidInstallments !== undefined && r.paidInstallments !== null && r.paidInstallments !== "") {
    const p = Number(r.paidInstallments);
    if (!isNaN(p)) return tenure > 0 ? Math.min(tenure, Math.max(0, p)) : Math.max(0, p);
  }
  if (r.startDate && r.startDate > asOfDate) return 0;
  if (!r.startDate) return tenure;
  const elapsedMonths = Math.max(0, monthsBetween(r.startDate, asOfDate));
  return tenure > 0 ? Math.min(tenure, elapsedMonths) : elapsedMonths;
};

export const calcTaxNew = (income: number) => {
  const res = calcTaxNewByFY(income, "2025-26");
  return { tax: res.tax, cess: res.cess, total: res.total, surcharge: res.surcharge, taxable: res.taxable, stdDed: res.stdDed };
};

export const calcTaxOld = (income: number, deductions = 0) => {
  const taxable = Math.max(0, income - deductions);
  let tax = 0;
  const slabs = [
    [250000, 0],
    [500000, 0.05],
    [1000000, 0.2],
    [Infinity, 0.3],
  ];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxable > prev) {
      tax += (Math.min(taxable, limit) - prev) * rate;
      prev = limit;
    } else break;
  }
  if (taxable <= 500000) tax = 0;
  const cess = tax * 0.04;
  return { tax, cess, total: tax + cess, taxable };
};

// ── Surcharge u/s 115BAC (new) / normal slab (old) ──────────────────────────
// Applies only when gross income > ₹50L. New regime capped at 25%.
function calcSurcharge(grossIncome: number, baseTax: number, regime: "new" | "old"): number {
  if (grossIncome <= 5_000_000) return 0;

  // `threshold` is the surcharge slab boundary just crossed; `prevRate` is the
  // rate that applied at/below that threshold (used for marginal relief below).
  let threshold: number;
  let prevRate: number;
  let rate: number;
  if (grossIncome <= 10_000_000) {
    threshold = 5_000_000;
    prevRate = 0;
    rate = 0.1;
  } else if (grossIncome <= 20_000_000) {
    threshold = 10_000_000;
    prevRate = 0.1;
    rate = 0.15;
  } else if (grossIncome <= 50_000_000) {
    threshold = 20_000_000;
    prevRate = 0.15;
    rate = 0.25;
  } else {
    threshold = 50_000_000;
    prevRate = 0.25;
    rate = regime === "new" ? 0.25 : 0.37; // new regime surcharge capped at 25%
  }

  const uncappedTotal = baseTax * (1 + rate);

  // Statutory marginal relief: total tax+surcharge just above a threshold can
  // never exceed (tax+surcharge at the threshold) + (income beyond the
  // threshold) — i.e. crossing ₹50L/1Cr/2Cr/5Cr can never leave you worse off
  // than someone who earned exactly the threshold amount. All these
  // thresholds sit well past each regime's highest slab breakpoint (₹24L new
  // / ₹10L old), so the marginal slab rate is a flat 30% throughout this
  // range and baseTax scales linearly with income — letting us derive
  // "tax at the threshold" directly instead of re-running the slab calc.
  const MARGINAL_SLAB_RATE = 0.3;
  const baseTaxAtThreshold = baseTax - MARGINAL_SLAB_RATE * (grossIncome - threshold);
  const cappedTotal = baseTaxAtThreshold * (1 + prevRate) + (grossIncome - threshold);

  const total = Math.min(uncappedTotal, cappedTotal);
  return Math.max(0, Math.round(total - baseTax));
};

export interface SlabItem {
  label: string;
  range: string;
  rate: number;
  incomeInSlab: number;
  taxInSlab: number;
}

export interface TaxResult {
  grossIncome: number;
  stdDed: number;
  taxable: number;
  slabs: SlabItem[];
  tax: number; // slab tax before surcharge/cess
  rebateApplied: boolean;
  rebateAmount: number;
  surcharge: number;
  cess: number;
  total: number; // final net tax after all components
  effectiveRate: number; // % of gross income
}

// FY-aware new regime: handles FY 2025-26, 2024-25, 2023-24, 2020-23
// Section 80CCD(2) (Employer NPS contribution) is deductible under Section 115BAC(2) in BOTH regimes.
export function calcTaxNewByFY(
  grossIncome: number,
  fy: string,
  deductions80CCD2: number = 0
): TaxResult {
  const fyStart = Number((fy || getCurrentFY()).split("-")[0]) || getCurrentFYStartYear();

  let stdDed: number;
  let rawSlabs: Array<[number, number]>;
  let rebateThreshold: number; // taxable income limit for 87A
  let fullRebate: boolean; // true = zero tax entirely; false = partial rebate up to maxRebateAmt
  let maxRebateAmt: number;
  let marginalReliefThreshold: number; // income just above rebate limit gets marginal relief

  if (fyStart >= 2025) {
    // Budget 2025 — applicable FY 2025-26 onwards
    stdDed = 75_000;
    rawSlabs = [
      [400000, 0],
      [800000, 0.05],
      [1200000, 0.1],
      [1600000, 0.15],
      [2000000, 0.2],
      [2400000, 0.25],
      [Infinity, 0.3],
    ];
    rebateThreshold = 1_200_000;
    fullRebate = true;
    maxRebateAmt = 0;
    marginalReliefThreshold = 1_310_000; // ~12L + 1.1L buffer
  } else if (fyStart === 2024) {
    // FY 2024-25 (std ded ₹75K, Budget 2024 slab revision)
    stdDed = 75_000;
    rawSlabs = [
      [300000, 0],
      [700000, 0.05],
      [1000000, 0.1],
      [1200000, 0.15],
      [1500000, 0.2],
      [Infinity, 0.3],
    ];
    rebateThreshold = 700_000;
    fullRebate = false;
    maxRebateAmt = 25_000;
    marginalReliefThreshold = 770_000;
  } else if (fyStart === 2023) {
    // FY 2023-24 (std ded ₹50K)
    stdDed = 50_000;
    rawSlabs = [
      [300000, 0],
      [600000, 0.05],
      [900000, 0.1],
      [1200000, 0.15],
      [1500000, 0.2],
      [Infinity, 0.3],
    ];
    rebateThreshold = 700_000;
    fullRebate = false;
    maxRebateAmt = 25_000;
    marginalReliefThreshold = 770_000;
  } else {
    // FY 2020-21, 2021-22, 2022-23 — original new regime
    stdDed = 0;
    rawSlabs = [
      [250000, 0],
      [500000, 0.05],
      [750000, 0.1],
      [1000000, 0.15],
      [1250000, 0.2],
      [1500000, 0.25],
      [Infinity, 0.3],
    ];
    rebateThreshold = 500_000;
    fullRebate = false;
    maxRebateAmt = 12_500;
    marginalReliefThreshold = 0; // no marginal relief in early new regime
  }

  const eligible80CCD2 = Math.max(0, Number(deductions80CCD2 || 0));
  const taxable = Math.max(0, grossIncome - stdDed - eligible80CCD2);
  let tax = 0;
  let prev = 0;
  const slabItems: SlabItem[] = [];

  const slabLabels: Record<number, string> = {
    0: "Exempt slab",
    0.05: "5% slab",
    0.1: "10% slab",
    0.15: "15% slab",
    0.2: "20% slab",
    0.25: "25% slab",
    0.3: "30% slab",
  };

  for (const [limit, rate] of rawSlabs) {
    if (taxable > prev) {
      const incomeInSlab = Math.min(taxable, limit) - prev;
      const taxInSlab = incomeInSlab * rate;
      tax += taxInSlab;
      slabItems.push({
        label: slabLabels[rate] || `${(rate * 100).toFixed(0)}% slab`,
        range:
          limit === Infinity
            ? `Above ₹${(prev / 100000).toFixed(0)}L`
            : `₹${(prev / 100000).toFixed(0)}L – ₹${(limit / 100000).toFixed(0)}L`,
        rate,
        incomeInSlab,
        taxInSlab,
      });
      prev = limit;
    } else {
      // Still add the slab to show it exists, with 0 income
      slabItems.push({
        label: slabLabels[rate] || `${(rate * 100).toFixed(0)}% slab`,
        range:
          limit === Infinity
            ? `Above ₹${(prev / 100000).toFixed(0)}L`
            : `₹${(prev / 100000).toFixed(0)}L – ₹${(limit / 100000).toFixed(0)}L`,
        rate,
        incomeInSlab: 0,
        taxInSlab: 0,
      });
      break;
    }
  }

  // Section 87A rebate
  let rebateApplied = false;
  let rebateAmount = 0;
  if (taxable <= rebateThreshold) {
    if (fullRebate) {
      rebateAmount = tax;
      tax = 0;
    } else {
      rebateAmount = Math.min(tax, maxRebateAmt);
      tax = Math.max(0, tax - rebateAmount);
    }
    rebateApplied = true;
  } else if (marginalReliefThreshold > 0 && taxable < marginalReliefThreshold) {
    // Marginal relief: tax capped at (taxable - rebateThreshold)
    const capped = taxable - rebateThreshold;
    if (tax > capped) {
      rebateAmount = tax - capped;
      tax = capped;
      rebateApplied = true;
    }
  }

  // Statutory surcharge thresholds (₹50L/₹1Cr/₹2Cr/₹5Cr) apply to Total Taxable Income
  const surcharge = calcSurcharge(taxable, tax, "new");
  const cess = Math.round((tax + surcharge) * 0.04);
  const total = tax + surcharge + cess;

  return {
    grossIncome,
    stdDed,
    taxable,
    slabs: slabItems,
    tax,
    rebateApplied,
    rebateAmount,
    surcharge,
    cess,
    total,
    effectiveRate: grossIncome > 0 ? (total / grossIncome) * 100 : 0,
  };
};

// FY-aware old regime: supports Senior Citizen (60-79: ₹3L exempt) & Super-Senior (80+: ₹5L exempt)
export function calcTaxOldByFY(
  grossIncome: number,
  totalDeductions: number,
  fy: string,
  citizenAge: number = 0
): TaxResult {
  const fyStart = Number((fy || getCurrentFY()).split("-")[0]) || getCurrentFYStartYear();
  // Old regime std deduction: ₹40K (FY 2018-19 to 2019-20), ₹50K (FY 2020-21 onwards)
  const stdDed = fyStart >= 2020 ? 50_000 : 40_000;
  // totalDeductions passed in already includes stdDed (callers compute: stdDed + 80C + 80D + …)
  const taxable = Math.max(0, grossIncome - totalDeductions);

  const exemptLimit = citizenAge >= 80 ? 500_000 : citizenAge >= 60 ? 300_000 : 250_000;
  const rawSlabs: Array<[number, number]> =
    citizenAge >= 80
      ? [
          [500_000, 0],
          [1_000_000, 0.2],
          [Infinity, 0.3],
        ]
      : [
          [exemptLimit, 0],
          [500_000, 0.05],
          [1_000_000, 0.2],
          [Infinity, 0.3],
        ];

  let tax = 0;
  let prev = 0;
  const slabItems: SlabItem[] = [];

  for (const [limit, rate] of rawSlabs) {
    if (taxable > prev) {
      const incomeInSlab = Math.min(taxable, limit) - prev;
      const taxInSlab = incomeInSlab * rate;
      tax += taxInSlab;
      slabItems.push({
        label: rate === 0 ? "Exempt slab" : `${(rate * 100).toFixed(0)}% slab`,
        range:
          limit === Infinity
            ? `Above ₹${(prev / 100000).toFixed(0)}L`
            : `₹${(prev / 100000).toFixed(1).replace(/\.0$/, "")}L – ₹${(limit / 100000).toFixed(1).replace(/\.0$/, "")}L`,
        rate,
        incomeInSlab,
        taxInSlab,
      });
      prev = limit;
    } else {
      slabItems.push({
        label: rate === 0 ? "Exempt slab" : `${(rate * 100).toFixed(0)}% slab`,
        range:
          limit === Infinity
            ? `Above ₹${(prev / 100000).toFixed(0)}L`
            : `₹${(prev / 100000).toFixed(1).replace(/\.0$/, "")}L – ₹${(limit / 100000).toFixed(1).replace(/\.0$/, "")}L`,
        rate,
        incomeInSlab: 0,
        taxInSlab: 0,
      });
      break;
    }
  }

  // 87A rebate: max ₹12,500 for old regime; effectively zero tax if taxable ≤ 5L
  let rebateApplied = false;
  let rebateAmount = 0;
  if (taxable <= 500_000) {
    rebateAmount = Math.min(tax, 12_500);
    tax = Math.max(0, tax - rebateAmount);
    rebateApplied = true;
  }

  const surcharge = calcSurcharge(taxable, tax, "old");
  const cess = Math.round((tax + surcharge) * 0.04);
  const total = tax + surcharge + cess;

  return {
    grossIncome,
    stdDed,
    taxable,
    slabs: slabItems,
    tax,
    rebateApplied,
    rebateAmount,
    surcharge,
    cess,
    total,
    effectiveRate: grossIncome > 0 ? (total / grossIncome) * 100 : 0,
  };
};

// A loan's "type" is a user-editable master-data value (Settings → Loan Types),
// so this must match the exact stored string — a substring match like
// `.includes("home")` would also catch a custom type e.g. "Home Renovation Loan"
// that the user never intended to be treated as a Section 24(b) home loan.
export const isHomeLoan = (l: any): boolean => (l?.type || "").trim().toLowerCase() === "home";

// Missing `outstanding` (legacy/imported rows) is treated as "not yet paid down"
// (falls back to the original principal) rather than silently as a zero balance —
// keep this fallback identical everywhere this figure is derived.
export const loanOutstanding = (l: any): number => {
  if ((l?.status || "").toLowerCase() === "closed") return 0;
  if (l?.outstanding != null && l.outstanding !== "") return Number(l.outstanding) || 0;
  return Number(l?.principal || 0);
};

export const loanGivenOutstanding = (l: any): number => {
  if ((l?.status || "").toLowerCase() === "closed") return 0;
  if (l?.outstanding != null && l.outstanding !== "") return Number(l.outstanding) || 0;
  return Number(l?.principal || l?.amount || 0);
};

export const ccOutstanding = (card: any): number => {
  if ((card?.status || "").toLowerCase() === "closed") return 0;
  return Math.max(0, Number(card?.outstanding || 0));
};
export const getCcOutstanding = ccOutstanding;

export interface CreditPoolInfo {
  name: string; // Display canonical name (first-seen capitalization)
  key: string; // Normalized lookup key (trimmed and lowercased)
  cards: any[];
  poolLimit: number;
  totalOutstanding: number;
  available: number;
  utilizationPct: number;
  isOverLimit: boolean;
}

export interface CreditPortfolioSummary {
  activeCards: any[];
  closedCards: any[];
  standaloneCards: any[];
  pools: Record<string, CreditPoolInfo>;
  poolList: CreditPoolInfo[];
  poolBreakdown: CreditPoolInfo[];
  totalLimit: number;
  totalOutstanding: number;
  totalAvailable: number;
  utilizationPct: number;
  isOverLimit: boolean;
  totalAnnualFees: number;
  feeCardCount: number;
  totalRewardPoints: number;
  totalRewardValue: number;
}

/**
 * Computes deduplicated credit portfolio metrics accounting for shared credit pools.
 * Cards sharing a pool (by normalized sharedGroup) contribute their shared pool limit
 * (or max individual card limit) exactly ONCE to totalLimit, avoiding inflating combined limit.
 */
export const computeCreditPortfolioSummary = (cards: any[] = []): CreditPortfolioSummary => {
  const allCards = Array.isArray(cards) ? cards : [];
  const activeCards = allCards.filter(
    (c: any) => (c?.status || "active").toLowerCase() !== "closed"
  );
  const closedCards = allCards.filter(
    (c: any) => (c?.status || "active").toLowerCase() === "closed"
  );

  const pools: Record<string, CreditPoolInfo> = {};
  const standaloneCards: any[] = [];

  activeCards.forEach((c: any) => {
    const rawGroup = typeof c?.sharedGroup === "string" ? c.sharedGroup.trim() : "";
    if (rawGroup) {
      const key = rawGroup.toLowerCase();
      if (!pools[key]) {
        pools[key] = {
          name: rawGroup,
          key,
          cards: [],
          poolLimit: 0,
          totalOutstanding: 0,
          available: 0,
          utilizationPct: 0,
          isOverLimit: false,
        };
      }
      pools[key].cards.push(c);
    } else {
      standaloneCards.push(c);
    }
  });

  const poolList = Object.values(pools);
  poolList.forEach((pool) => {
    const declaredPoolLimit = Math.max(
      0,
      ...pool.cards.map((c: any) => Number(c?.sharedGroupLimit) || 0)
    );
    const maxCardLimit = Math.max(
      0,
      ...pool.cards.map((c: any) => Number(c?.limit ?? c?.cardLimit) || 0)
    );
    // Combined pool limit is the declared pool limit, or falls back to max card limit across the pool
    pool.poolLimit = declaredPoolLimit > 0 ? declaredPoolLimit : maxCardLimit;
    pool.totalOutstanding = pool.cards.reduce(
      (sum: number, c: any) => sum + ccOutstanding(c),
      0
    );
    pool.available = Math.max(0, pool.poolLimit - pool.totalOutstanding);
    pool.isOverLimit = pool.poolLimit > 0 && pool.totalOutstanding > pool.poolLimit;
    pool.utilizationPct =
      pool.poolLimit > 0
        ? Math.max(0, Math.round((pool.totalOutstanding / pool.poolLimit) * 100))
        : pool.totalOutstanding > 0
          ? 100
          : 0;
  });

  const standaloneLimit = standaloneCards.reduce(
    (sum: number, c: any) => sum + (Number(c?.limit ?? c?.cardLimit) || 0),
    0
  );
  const totalPoolLimit = poolList.reduce((sum: number, p: CreditPoolInfo) => sum + p.poolLimit, 0);
  const totalLimit = standaloneLimit + totalPoolLimit;

  const totalOutstanding = activeCards.reduce(
    (sum: number, c: any) => sum + ccOutstanding(c),
    0
  );
  const totalAvailable = Math.max(0, totalLimit - totalOutstanding);
  const isOverLimit = totalLimit > 0 && totalOutstanding > totalLimit;
  const utilizationPct =
    totalLimit > 0
      ? Math.max(0, Math.round((totalOutstanding / totalLimit) * 100))
      : totalOutstanding > 0
        ? 100
        : 0;

  const totalAnnualFees = activeCards
    .filter((c: any) => Number(c?.annualFee) > 0)
    .reduce((sum: number, c: any) => sum + Number(c.annualFee), 0);
  const feeCardCount = activeCards.filter((c: any) => Number(c?.annualFee) > 0).length;

  const totalRewardPoints = activeCards.reduce(
    (sum: number, c: any) => sum + (Number(c?.rewardPointsBalance) || 0),
    0
  );
  const totalRewardValue = activeCards.reduce(
    (sum: number, c: any) =>
      sum + (Number(c?.rewardPointsBalance) || 0) * (Number(c?.rewardPointValue) || 0),
    0
  );

  return {
    activeCards,
    closedCards,
    standaloneCards,
    pools,
    poolList,
    poolBreakdown: poolList,
    totalLimit,
    totalOutstanding,
    totalAvailable,
    utilizationPct,
    isOverLimit,
    totalAnnualFees,
    feeCardCount,
    totalRewardPoints,
    totalRewardValue,
  };
};

export const getCardEffectiveLimitAndAvail = (
  card: any,
  summary: CreditPortfolioSummary
) => {
  const rawGroup = typeof card?.sharedGroup === "string" ? card.sharedGroup.trim() : "";
  if (rawGroup) {
    const key = rawGroup.toLowerCase();
    const pool = summary.pools[key];
    if (pool) {
      return {
        isShared: true,
        poolName: pool.name,
        poolLimit: pool.poolLimit,
        poolOutstanding: pool.totalOutstanding,
        poolAvailable: pool.available,
        poolUtilization: pool.utilizationPct,
        effectiveUtilization: pool.utilizationPct,
        poolCardCount: pool.cards.length,
        effectiveLimit: pool.poolLimit,
        effectiveAvailable: pool.available,
        cardOutstanding: ccOutstanding(card),
      };
    }
  }
  const lim = Number(card?.limit ?? card?.cardLimit) || 0;
  const out = ccOutstanding(card);
  const util = lim > 0 ? Math.round((out / lim) * 100) : (out > 0 ? 100 : 0);
  return {
    isShared: false,
    poolName: "",
    poolLimit: lim,
    poolOutstanding: out,
    poolAvailable: Math.max(0, lim - out),
    poolUtilization: util,
    effectiveUtilization: util,
    poolCardCount: 1,
    effectiveLimit: lim,
    effectiveAvailable: Math.max(0, lim - out),
    cardOutstanding: out,
  };
};

export const informalPersonOutstanding = (person: any): number => {
  if (!person) return 0;
  const tranches: any[] = Array.isArray(person.tranches) ? person.tranches : [];
  const payments: any[] = Array.isArray(person.payments) ? person.payments : [];
  if (tranches.length === 0 && Number(person.amount || 0) > 0) {
    const legacyPrincipal = Number(person.amount || 0);
    const totalP = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    return Math.max(0, legacyPrincipal - totalP);
  }
  const totalT = tranches.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalP = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  return Math.max(0, totalT - totalP);
};

export interface AutoDetectedDeductions {
  d80C: number;
  d80C_sources: string | null;
  d80D: number;
  d80D_source: string | null;
  hra: number;
  hra_source: string | null;
  homeLoan: number;
  homeLoan_source: string | null;
  nps: number;
  nps_source: string | null;
  d80CCD2: number;
  d80CCD2_source: string | null;
}

export const getAutoDetectedDeductions = (state: any, fy: string): AutoDetectedDeductions => {
  const fyParts = (fy || getCurrentFY()).split("-");
  const fyStartYear = Number(fyParts[0]) || getCurrentFYStartYear();
  const fyStartStr = `${fyStartYear}-04-01`;
  const fyEndStr = `${fyStartYear + 1}-03-31`;

  // 80C — ELSS purchases in FY
  const elss = (state.mutualFunds || [])
    .filter(
      (m: any) =>
        (m.type || m.category || "").toUpperCase().includes("ELSS") &&
        m.buyDate &&
        m.buyDate >= fyStartStr &&
        m.buyDate <= fyEndStr
    )
    .reduce((s: number, m: any) => s + Number(m.invested || m.investedAmount || 0), 0);
  const ppfFromTxns = (state.ppf || []).reduce(
    (sum: number, p: any) =>
      sum +
      (p.transactions || [])
        .filter(
          (t: any) => t.date && t.date >= fyStartStr && t.date <= fyEndStr && t.type !== "withdrawal"
        )
        .reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
    0
  );
  const ppfFromLedger = (state.ppfLedger || [])
    .filter(
      (t: any) => t.date && t.date >= fyStartStr && t.date <= fyEndStr && t.type !== "withdrawal"
    )
    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const ppfThisYear = ppfFromTxns > 0 ? ppfFromTxns : ppfFromLedger;
  const ppf =
    ppfThisYear > 0
      ? ppfThisYear
      : (state.ppf || []).reduce(
          (s: number, p: any) =>
            s + Number(p.thisYearContribution || p.yearlyContribution || p.annualContribution || 0),
          0
        );

  // 80C — LIC annual premiums
  const lic = (state.lic || []).reduce((s: number, l: any) => s + Number(l.annualPremium || 0), 0);

  // 80C — EPF employee contributions in FY (passbook transactions first, falling back to salary slip EPF)
  const epfPassbook = (state.epf || []).reduce((s: number, e: any) => {
    const txs = (e.transactions || []).filter(
      (t: any) => t.date >= fyStartStr && t.date <= fyEndStr
    );
    const simple = txs
      .filter((t: any) => t.type === "employee_contribution")
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const passbook = txs
      .filter((t: any) => t.type === "monthly_contribution")
      .reduce((sum: number, t: any) => sum + Number(t.employeeShare || 0), 0);
    return s + simple + passbook;
  }, 0);
  const salarySlipEpf = (state.salarySlips || [])
    .filter(
      (s: any) =>
        s.slipMonth &&
        s.slipMonth >= fyStartStr.slice(0, 7) &&
        s.slipMonth <= fyEndStr.slice(0, 7)
    )
    .reduce(
      (sum: number, s: any) =>
        sum + Number(s.pfEmployee || s.epf || s.providentFund || 0),
      0
    );
  const epf = epfPassbook > 0 ? epfPassbook : salarySlipEpf;

  // 80C — NSC and Sukanya Samriddhi (SSY) Govt schemes
  const annualizeGovt = (amt: number, freq: string) => {
    const num = Number(amt || 0);
    if (freq === "monthly") return num * 12;
    if (freq === "quarterly") return num * 4;
    if (freq === "half_yearly") return num * 2;
    if (freq === "one_time") return 0;
    return num;
  };
  const nsc = (state.govtSchemes || [])
    .filter((sc: any) => (sc.schemeType || "").toUpperCase() === "NSC")
    .reduce(
      (s: number, sc: any) => s + annualizeGovt(sc.contributionAmount, sc.frequency || "annual"),
      0
    );
  const ssy = (state.govtSchemes || [])
    .filter((sc: any) => (sc.schemeType || "").toUpperCase() === "SSY")
    .reduce(
      (s: number, sc: any) => s + annualizeGovt(sc.contributionAmount, sc.frequency || "annual"),
      0
    );

  // 80C — Home Loan Principal Repayment
  const homeLoans = (state.loansTaken || []).filter(isHomeLoan);
  const homeLoanPrincipal = homeLoans.reduce((s: number, l: any) => {
    const outstanding = loanOutstanding(l);
    const rate = Number(l.rate) || 0;
    const annualInterest = Math.round((outstanding * rate) / 100);
    const annualEMI = Number(l.emi || 0) * 12;
    return s + Math.max(0, annualEMI - annualInterest);
  }, 0);

  const d80C_raw = elss + ppf + lic + epf + nsc + ssy + homeLoanPrincipal;
  const d80C_sources =
    [
      elss > 0 ? `ELSS ₹${Math.round(elss).toLocaleString("en-IN")}` : null,
      ppf > 0 ? `PPF ₹${Math.round(ppf).toLocaleString("en-IN")}` : null,
      lic > 0 ? `LIC ₹${Math.round(lic).toLocaleString("en-IN")}` : null,
      epf > 0 ? `EPF ₹${Math.round(epf).toLocaleString("en-IN")}` : null,
      nsc > 0 ? `NSC ₹${Math.round(nsc).toLocaleString("en-IN")}` : null,
      ssy > 0 ? `SSY ₹${Math.round(ssy).toLocaleString("en-IN")}` : null,
      homeLoanPrincipal > 0
        ? `Home Loan Principal ₹${Math.round(homeLoanPrincipal).toLocaleString("en-IN")}`
        : null,
    ]
      .filter(Boolean)
      .join(" + ") || null;

  // 80D — Health insurance premiums (Self/Family + Parents)
  const PARENT_RELATION_RE = /parent|father|mother|dad|mom|papa|mummy|-in-law/i;
  const isParentsPolicy = (p: any) =>
    (p.insuredMembers || []).some((m: any) => PARENT_RELATION_RE.test(m?.relation || ""));
  const healthPolicies = state.healthInsurance || [];
  const selfHealthPremium = healthPolicies
    .filter((p: any) => !isParentsPolicy(p))
    .reduce(
      (s: number, p: any) => s + annualizePremium(p.premium, p.premiumFrequency, p.annualPremium),
      0
    );
  const parentsHealthPremium = healthPolicies
    .filter(isParentsPolicy)
    .reduce(
      (s: number, p: any) => s + annualizePremium(p.premium, p.premiumFrequency, p.annualPremium),
      0
    );

  const selfProfile = (state.masterData?.familyProfiles || []).find((p: any) => p.id === "self");
  const spouseProfile = (state.masterData?.familyProfiles || []).find(
    (p: any) => p.id === "wife" || /spouse|wife|husband/i.test(p?.relation || "")
  );
  const isSelfSenior = isSeniorCitizen(selfProfile?.dob) || (state.profile?.age || 0) >= 60;
  const isSpouseSenior = isSeniorCitizen(spouseProfile?.dob);
  const sec80D_self_limit = isSelfSenior || isSpouseSenior ? 50_000 : 25_000;

  const isAnyParentSenior =
    (state.masterData?.familyProfiles || []).some(
      (p: any) => PARENT_RELATION_RE.test(p?.relation || "") && isSeniorCitizen(p?.dob)
    ) ||
    healthPolicies.some((p: any) =>
      (p.insuredMembers || []).some(
        (m: any) => PARENT_RELATION_RE.test(m?.relation || "") && isSeniorCitizen(m?.dob)
      )
    );
  const sec80D_parents_limit = isAnyParentSenior ? 50_000 : 25_000;
  const sec80D_self_used = Math.min(selfHealthPremium, sec80D_self_limit);
  const sec80D_parents_used = Math.min(parentsHealthPremium, sec80D_parents_limit);
  const d80D_raw = sec80D_self_used + sec80D_parents_used;
  const d80D_sources =
    [
      sec80D_self_used > 0
        ? `Self/Family ₹${Math.round(sec80D_self_used).toLocaleString("en-IN")}`
        : null,
      sec80D_parents_used > 0
        ? `Parents ₹${Math.round(sec80D_parents_used).toLocaleString("en-IN")}`
        : null,
    ]
      .filter(Boolean)
      .join(" + ") || null;

  // HRA — rent paid in FY from rented properties (user is a tenant)
  const hraPayments = (state.rentedProperties || []).reduce((s: number, p: any) => {
    return (
      s +
      (p.payments || [])
        .filter((pay: any) => pay.date && pay.date >= fyStartStr && pay.date <= fyEndStr)
        .reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0)
    );
  }, 0);
  // Escalation-aware (via getEffectiveRent), not the flat `monthlyRent` field, which
  // goes stale the moment a property's rent escalates — AIAssistantTab.tsx's tax
  // optimizer already used this fallback; this was the one place that hadn't caught up.
  const hraMonthly = (state.rentedProperties || []).reduce(
    (s: number, p: any) => s + getEffectiveRent(p),
    0
  );
  const hra_raw = hraPayments > 0 ? hraPayments : hraMonthly > 0 ? hraMonthly * 12 : 0;
  const hra_source =
    hra_raw > 0
      ? hraPayments > 0
        ? `Rent payments logged in FY ${fyStartStr.slice(0, 4)}-${fyEndStr.slice(2, 4)}`
        : "Monthly rent × 12"
      : null;

  // Home Loan Interest — from loansTaken type "Home", approx annual interest = outstanding × rate / 100
  const homeLoanData = (state.loansTaken || [])
    .filter(isHomeLoan)
    .map((l: any) => {
      const outstanding = loanOutstanding(l);
      const rate = Number(l.rate) || 0;
      const annualInterest = Math.round((outstanding * rate) / 100);
      return { lender: l.lender || "Home Loan", annualInterest };
    });
  const homeLoan_raw = homeLoanData.reduce((s: number, l: any) => s + l.annualInterest, 0);
  const homeLoan_source =
    homeLoan_raw > 0
      ? homeLoanData.map((l: any) => l.lender).join(", ") + " (approx. interest)"
      : null;

  // 80CCD(1B) — NPS extra self contribution (max ₹50,000)
  // Checks both account ledger transactions in FY and account-level contribution
  const npsTxnSelf = (state.nps || []).reduce((s: number, n: any) => {
    return (
      s +
      (n.transactions || [])
        .filter((t: any) => t.date && t.date >= fyStartStr && t.date <= fyEndStr)
        .reduce((sum: number, t: any) => sum + Number(t.employeeAmount ?? t.amount ?? 0), 0)
    );
  }, 0);
  const npsAccountSelf = (state.nps || []).reduce(
    (s: number, n: any) => s + Number(n.thisYearContribution || n.yearContribution || 0),
    0
  );
  const npsContrib = npsTxnSelf > 0 ? npsTxnSelf : npsAccountSelf;
  const nps_used = Math.min(npsContrib, 50_000);
  const nps_source =
    nps_used > 0 ? `NPS ₹${Math.round(nps_used).toLocaleString("en-IN")}` : null;

  // 80CCD(2) — Employer NPS contribution
  // Checks both account ledger transactions in FY and account-level employerContribution
  const npsTxnEmployer = (state.nps || []).reduce((s: number, n: any) => {
    return (
      s +
      (n.transactions || [])
        .filter((t: any) => t.date && t.date >= fyStartStr && t.date <= fyEndStr)
        .reduce((sum: number, t: any) => sum + Number(t.employerAmount || 0), 0)
    );
  }, 0);
  const npsAccountEmployer = (state.nps || []).reduce(
    (s: number, n: any) => s + Number(n.employerContribution || 0),
    0
  );
  const npsEmployer = npsTxnEmployer > 0 ? npsTxnEmployer : npsAccountEmployer;
  const d80CCD2_source =
    npsEmployer > 0 ? `Employer NPS ₹${Math.round(npsEmployer).toLocaleString("en-IN")}` : null;

  return {
    d80C: Math.min(d80C_raw, 150_000),
    d80C_sources,
    d80D: d80D_raw,
    d80D_source: d80D_sources,
    hra: Math.round(hra_raw),
    hra_source,
    homeLoan: Math.min(homeLoan_raw, 200_000),
    homeLoan_source,
    nps: nps_used,
    nps_source,
    d80CCD2: npsEmployer,
    d80CCD2_source,
  };
};

export const getTaxDueForDashboard = (state: any, annualIncome: number): number => {
  const fy = state.profile?.fy || getCurrentFY();
  const regime = state.profile?.regime || "new";
  const auto = getAutoDetectedDeductions(state, fy);
  const overrides = state.masterData?.taxDeductions?.[fy] || {};
  const d80CCD2 = overrides.d80CCD2 !== undefined ? overrides.d80CCD2 : auto.d80CCD2;

  if (regime === "new") {
    // Standard deduction + Sec 80CCD(2) employer NPS are allowed in the New Regime u/s 115BAC(2)
    const taxRes = calcTaxNewByFY(annualIncome, fy, d80CCD2 || 0);
    return taxRes.total;
  } else {
    // Old regime: standard deduction + auto-detected deductions + manual overrides
    const d80C = overrides.d80C !== undefined ? overrides.d80C : auto.d80C;
    const d80D = overrides.d80D !== undefined ? overrides.d80D : auto.d80D;
    const hra = overrides.hra !== undefined ? overrides.hra : auto.hra;
    const homeLoan = overrides.homeLoan !== undefined ? overrides.homeLoan : auto.homeLoan;
    const nps = overrides.nps !== undefined ? overrides.nps : auto.nps;
    const d80G = overrides.d80G !== undefined ? overrides.d80G : 0;
    const d80E = overrides.d80E !== undefined ? overrides.d80E : 0;
    const d80TTA = overrides.d80TTA !== undefined ? overrides.d80TTA : 0;

    const fyParts = fy.split("-");
    const fyStartYear = Number(fyParts[0]) || getCurrentFYStartYear();
    const stdDedOld = fyStartYear >= 2020 ? 50_000 : 40_000;

    const selfProfile = (state.masterData?.familyProfiles || []).find((p: any) => p.id === "self");
    const citizenAge =
      Number(state.profile?.age || 0) ||
      (selfProfile?.dob ? (calculateAge(selfProfile.dob) ?? 0) : 0);
    const isSenior = citizenAge >= 60 || isSeniorCitizen(selfProfile?.dob);
    // Section 80TTB allows up to ₹50,000 on deposits for senior citizens, vs ₹10,000 u/s 80TTA for non-seniors
    const max80TTA = isSenior ? 50_000 : 10_000;

    const totalOldDeductions =
      stdDedOld +
      Math.min(d80C, 150_000) +
      Math.min(d80D, 100_000) +
      hra +
      Math.min(homeLoan, 200_000) +
      Math.min(nps, 50_000) +
      (d80CCD2 || 0) +
      (d80G || 0) +
      (d80E || 0) +
      Math.min(d80TTA || 0, max80TTA);

    const taxRes = calcTaxOldByFY(annualIncome, totalOldDeductions, fy, citizenAge);
    return taxRes.total;
  }
};

export const calculateEpfBalance = (e: any, asOf?: string): number => {
  if (!e) return 0;
  const txs = e.transactions || [];
  const ests = e.establishments || [];

  // hasPassbook is computed from the UNFILTERED transactions — a passbook record must still
  // resolve via the passbook math (correctly returning 0 for months before its first entry),
  // rather than falling through to the static e.balance fallback just because every qualifying
  // transaction happens to be filtered out for an early asOf month.
  // Bug fix: this previously only counted "monthly_contribution"/"interest_credit"/"transfer_in"
  // as evidence of a passbook, so an account tracked purely via the simpler "employee_contribution"
  // / "employer_contribution" / "withdrawal" entry types (a normal, UI-offered way to log EPF —
  // see EPF_TX_TYPES in InvestmentsTab.tsx) had every entered transaction silently ignored in
  // favor of the stale static e.balance field. Any non-empty ledger should win over that fallback.
  const hasPassbook = txs.length > 0;

  if (!hasPassbook) {
    return Number(e.balance || 0);
  }

  const dateFilteredTxs = asOf
    ? txs.filter((t: any) => !t.date || t.date.slice(0, 7) <= asOf)
    : txs;

  // Establishments whose balance has been transferred out via Form 13 (transfer_in recorded).
  // Their individual transactions must NOT be summed — the transfer_in amount already captures them.
  const transferredOutEstIds = new Set<string>(
    dateFilteredTxs
      .filter((x: any) => x.type === "transfer_in" && x.fromEmployer)
      .map((x: any) => {
        const est = ests.find((estItem: any) => estItem.employerName === x.fromEmployer);
        return est ? est.id : null;
      })
      .filter(Boolean)
  );

  // activeTxs = everything except transactions explicitly tagged to transferred-out establishments
  const activeTxs = dateFilteredTxs.filter(
    (t: any) => !t.estId || !transferredOutEstIds.has(t.estId)
  );

  const byType = (type: string) =>
    activeTxs
      .filter((x: any) => x.type === type)
      .reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const monthlyRows = activeTxs.filter((x: any) => x.type === "monthly_contribution");
  const interestRows = activeTxs.filter((x: any) => x.type === "interest_credit");
  const transferRows = dateFilteredTxs.filter((x: any) => x.type === "transfer_in"); // all date-eligible txs — all transfer_ins count

  const totalEmployee =
    byType("employee_contribution") +
    monthlyRows.reduce((s: number, x: any) => s + Number(x.employeeShare || 0), 0);
  const totalEmployer =
    byType("employer_contribution") +
    monthlyRows.reduce((s: number, x: any) => s + Number(x.employerShare || 0), 0);
  const totalPension = monthlyRows.reduce(
    (s: number, x: any) => s + Number(x.pensionShare || 0),
    0
  );
  const totalTransferIn = transferRows.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const totalWithdrawal = byType("withdrawal");

  // Compute closing balances per EPFO passbook column
  const empInterest = interestRows.reduce((s: number, x: any) => {
    if (x.employeeShare !== undefined) return s + Number(x.employeeShare || 0);
    return s + Number(x.amount || 0); // backward compat: old single-amount interest → employee
  }, 0);
  const erInterest = interestRows.reduce(
    (s: number, x: any) => s + Number(x.employerShare || 0),
    0
  );
  const penInterest = interestRows.reduce(
    (s: number, x: any) => s + Number(x.pensionShare || 0),
    0
  );
  // employee gets remainder: total - er - pen (handles partial splits and no-splits correctly)
  const transferInEr = transferRows.reduce(
    (s: number, x: any) => s + Number(x.employerShare || 0),
    0
  );
  const transferInPen = transferRows.reduce(
    (s: number, x: any) => s + Number(x.pensionShare || 0),
    0
  );
  const transferInEmp = totalTransferIn - transferInEr - transferInPen;

  const closingEmployee = totalEmployee + empInterest + transferInEmp;
  const closingEmployer = totalEmployer + erInterest + transferInEr;
  const closingPension = totalPension + transferInPen + penInterest;
  const closingTotal = closingEmployee + closingEmployer + closingPension - totalWithdrawal;

  return closingTotal;
};

// ── XIRR Calculation Helper ──────────────────────────────────────────────────

export interface CashFlow {
  date: Date | string;
  amount: number;
}

export const calcXIRR = (cashFlows: CashFlow[]): number | null => {
  if (!cashFlows || !Array.isArray(cashFlows)) return null;

  // Filter out zero amounts and invalid dates
  const flows = cashFlows
    .map((f) => {
      if (!f) return null;
      let d: Date;
      if (f.date instanceof Date) {
        d = f.date;
      } else {
        const clean = String(f.date || "").trim();
        if (clean === "" || clean === "null" || clean === "undefined") {
          d = new Date(NaN); // Invalid Date
        } else {
          // Parse YYYY-MM-DD cleanly in local timezone to avoid off-by-one errors from UTC conversion
          const parts = clean.split("-");
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            d = new Date(y, m, day);
          } else {
            d = new Date(clean);
          }
        }
      }
      return {
        date: d,
        amount: Number(f.amount),
      };
    })
    .filter(
      (f): f is { date: Date; amount: number } =>
        f !== null && !isNaN(f.date.getTime()) && f.amount !== 0
    );

  if (flows.length < 2) return null;

  // Sort chronologically
  flows.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check signs (must have at least one positive and one negative cash flow)
  let hasPos = false;
  let hasNeg = false;
  for (const f of flows) {
    if (f.amount > 0) hasPos = true;
    if (f.amount < 0) hasNeg = true;
  }
  if (!hasPos || !hasNeg) return null;

  const t0 = flows[0].date.getTime();
  const totalDays = (flows[flows.length - 1].date.getTime() - t0) / (24 * 3600 * 1000);
  if (totalDays <= 0) return null;

  // NPV function
  const npv = (r: number): number => {
    let sum = 0;
    for (const f of flows) {
      const t = (f.date.getTime() - t0) / (365 * 24 * 3600 * 1000);
      sum += f.amount / Math.pow(1 + r, t);
    }
    return sum;
  };

  // Derivative of NPV function
  const dNpv = (r: number): number => {
    let sum = 0;
    for (const f of flows) {
      const t = (f.date.getTime() - t0) / (365 * 24 * 3600 * 1000);
      sum += (-t * f.amount) / Math.pow(1 + r, t + 1);
    }
    return sum;
  };

  // Newton-Raphson Method
  let r = 0.1; // initial guess: 10%
  const maxIter = 100;
  const tol = 1e-6;

  for (let i = 0; i < maxIter; i++) {
    const val = npv(r);
    const deriv = dNpv(r);
    if (Math.abs(deriv) < 1e-12) break; // Slope flat, fallback to bisection
    const nextR = r - val / deriv;
    if (Math.abs(nextR - r) < tol) {
      if (!isNaN(nextR) && isFinite(nextR) && nextR > -0.99) {
        return nextR * 100;
      }
    }
    r = nextR;
  }

  // Bisection Method Fallback
  let low = -0.99;
  let high = 50.0; // 5000%
  let mid = 0.0;

  let valLow = npv(low);
  let valHigh = npv(high);

  if (valLow * valHigh > 0) {
    // Try to expand search space to find a sign change
    for (let h = 50.0; h <= 1000.0; h *= 2) {
      const vh = npv(h);
      if (valLow * vh < 0) {
        high = h;
        valHigh = vh;
        break;
      }
    }
  }

  if (valLow * valHigh > 0) {
    // Try adjusting low bound
    for (let l = -0.95; l <= -0.1; l += 0.1) {
      const vl = npv(l);
      if (vl * valHigh < 0) {
        low = l;
        valLow = vl;
        break;
      }
    }
  }

  if (valLow * valHigh < 0) {
    for (let i = 0; i < 100; i++) {
      mid = (low + high) / 2;
      const val = npv(mid);
      if (Math.abs(val) < tol) {
        return mid * 100;
      }
      if (valLow * val < 0) {
        high = mid;
      } else {
        low = mid;
        valLow = val;
      }
    }
  }

  if (mid > -0.99 && !isNaN(mid) && isFinite(mid)) {
    return mid * 100;
  }

  return null;
};

// ── Section 2(42A) Long Term Holding Period Checker ──────────────────────────
export const isLongTerm = (
  buyDate: string,
  sellDate: string,
  monthsThreshold: number = 12
): boolean => {
  if (!buyDate || !sellDate) return false;
  const parseLocalDate = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  };
  const buy = parseLocalDate(buyDate);
  const sell = parseLocalDate(sellDate);
  const anniversary = new Date(buy.getFullYear(), buy.getMonth() + monthsThreshold, buy.getDate());
  return sell > anniversary;
};

// ── CSV Export Utility ─────────────────────────────────────────────────────────
export const exportArrayToCSV = (
  data: any[],
  columnsOrFilename: { key: string; label: string }[] | string,
  optionalFilename?: string
) => {
  if (!data || data.length === 0) return;

  let columns: { key: string; label: string }[];
  let filename: string;

  if (typeof columnsOrFilename === "string") {
    filename = columnsOrFilename;
    const keys = Object.keys(data[0] || {});
    columns = keys.map((k) => ({ key: k, label: k }));
  } else {
    columns = columnsOrFilename;
    filename = optionalFilename || "export.csv";
  }

  if (!filename.endsWith(".csv")) {
    filename += ".csv";
  }

  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════════════════════
   STATUTORY ADVANCE TAX & SECTION 234 PENALTY PROJECTOR
   Income Tax Act 1961 — Sections 207, 208, 211, 234A, 234B, 234C, 234F
   ══════════════════════════════════════════════════════════════════ */

export interface AdvanceTaxQuarter {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  dueDate: string; // YYYY-MM-DD
  label: string; // e.g. "15 Jun"
  cumulativePct: number; // 15, 45, 75, 100
  safeHarborPct: number; // 12, 36, 75, 100
  statutoryMonths: number; // 3, 3, 3, 1
  requiredAmount: number;
  paidAmount: number;
  shortfall: number;
  isPast: boolean;
  penalty234C: number;
}

export interface AdvanceTaxAnalysis {
  isSubjectToAdvanceTax: boolean;
  exemptionReason?: string;
  grossTaxLiability: number;
  tdsCredit: number;
  netTaxPayable: number;
  totalAdvancePaid: number;
  remainingTaxPayable: number;
  quarters: AdvanceTaxQuarter[];
  penalty234C: number;
  penalty234B: number;
  penalty234A: number;
  penalty234F: number;
  totalStatutoryPenalty: number;
}

export function computeAdvanceTaxSchedule(
  fyStartYear: number,
  grossTax: number,
  tdsCredit: number,
  totalAdvancePaid: number,
  asOfDateStr: string = today(),
  isSeniorCitizenWithoutBusinessIncome: boolean = false,
  quarterlyAdvancePaid?: { Q1?: number; Q2?: number; Q3?: number; Q4?: number }
): AdvanceTaxAnalysis {
  const netTaxPayable = Math.max(0, Math.round(grossTax - tdsCredit));
  const remainingTaxPayable = Math.max(0, netTaxPayable - totalAdvancePaid);

  // Section 207(2): Resident Senior Citizen without business income is exempt
  if (isSeniorCitizenWithoutBusinessIncome) {
    return {
      isSubjectToAdvanceTax: false,
      exemptionReason: "Senior citizen (aged 60+) without business/profession income is exempt u/s 207(2).",
      grossTaxLiability: grossTax,
      tdsCredit,
      netTaxPayable,
      totalAdvancePaid,
      remainingTaxPayable,
      quarters: [],
      penalty234C: 0,
      penalty234B: 0,
      penalty234A: 0,
      penalty234F: 0,
      totalStatutoryPenalty: 0,
    };
  }

  // Section 208: Advance tax applies only if net tax payable >= ₹10,000
  const isSubject = netTaxPayable >= 10_000;

  const rawQuarters: Array<{
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    datePart: string;
    label: string;
    pct: number;
    safeHarbor: number;
    months: number;
  }> = [
    { quarter: "Q1", datePart: "06-15", label: "15 Jun", pct: 15, safeHarbor: 12, months: 3 },
    { quarter: "Q2", datePart: "09-15", label: "15 Sep", pct: 45, safeHarbor: 36, months: 3 },
    { quarter: "Q3", datePart: "12-15", label: "15 Dec", pct: 75, safeHarbor: 75, months: 3 },
    { quarter: "Q4", datePart: "03-15", label: "15 Mar", pct: 100, safeHarbor: 100, months: 1 },
  ];

  let total234C = 0;

  const quarters: AdvanceTaxQuarter[] = rawQuarters.map((q) => {
    const year = q.quarter === "Q4" ? fyStartYear + 1 : fyStartYear;
    const dueDate = `${year}-${q.datePart}`;
    const isPast = dueDate < asOfDateStr;

    // Determine cumulative amount paid by this quarter
    let paidByQuarter = 0;
    if (quarterlyAdvancePaid) {
      if (q.quarter === "Q1") paidByQuarter = quarterlyAdvancePaid.Q1 || 0;
      else if (q.quarter === "Q2") paidByQuarter = (quarterlyAdvancePaid.Q1 || 0) + (quarterlyAdvancePaid.Q2 || 0);
      else if (q.quarter === "Q3") paidByQuarter = (quarterlyAdvancePaid.Q1 || 0) + (quarterlyAdvancePaid.Q2 || 0) + (quarterlyAdvancePaid.Q3 || 0);
      else paidByQuarter = totalAdvancePaid;
    } else {
      paidByQuarter = isPast ? totalAdvancePaid : 0;
    }

    const requiredAmount = Math.round((netTaxPayable * q.pct) / 100);
    const safeHarborAmount = Math.round((netTaxPayable * q.safeHarbor) / 100);

    let penalty = 0;
    let shortfall = 0;

    if (isSubject && isPast) {
      if (paidByQuarter < safeHarborAmount) {
        shortfall = Math.max(0, requiredAmount - paidByQuarter);
        // Section 234C: 1% simple interest per month for statutory months
        penalty = Math.round(shortfall * 0.01 * q.months);
      }
    } else if (isSubject && !isPast) {
      shortfall = Math.max(0, requiredAmount - paidByQuarter);
    }

    total234C += penalty;

    return {
      quarter: q.quarter,
      dueDate,
      label: q.label,
      cumulativePct: q.pct,
      safeHarborPct: q.safeHarbor,
      statutoryMonths: q.months,
      requiredAmount,
      paidAmount: paidByQuarter,
      shortfall,
      isPast,
      penalty234C: penalty,
    };
  });

  // Section 234B penalty: applies after 31 March of FY if total advance paid < 90% of assessed net tax
  const march31OfFY = `${fyStartYear + 1}-03-31`;
  let penalty234B = 0;
  if (isSubject && asOfDateStr > march31OfFY && totalAdvancePaid < netTaxPayable * 0.9) {
    const assessedShortfall = Math.max(0, netTaxPayable - totalAdvancePaid);
    const ayStart = new Date(`${fyStartYear + 1}-04-01T00:00:00`);
    const curr = new Date(`${asOfDateStr}T00:00:00`);
    const monthsElapsed = Math.max(1, Math.ceil((curr.getTime() - ayStart.getTime()) / (30.44 * 86400000)));
    penalty234B = Math.round(assessedShortfall * 0.01 * monthsElapsed);
  }

  // Section 234A penalty: Interest for default in furnishing return of income
  // 1% simple interest per month (or part thereof) on unpaid tax commencing after the statutory return filing due date (July 31 of AY)
  const july31OfAY = `${fyStartYear + 1}-07-31`;
  let penalty234A = 0;
  if (isSubject && asOfDateStr > july31OfAY && remainingTaxPayable > 0) {
    const dueTime = new Date(`${july31OfAY}T00:00:00`);
    const curr = new Date(`${asOfDateStr}T00:00:00`);
    const monthsDelay = Math.max(1, Math.ceil((curr.getTime() - dueTime.getTime()) / (30.44 * 86400000)));
    penalty234A = Math.round(remainingTaxPayable * 0.01 * monthsDelay);
  }

  // Section 234F fee: ₹5,000 (or ₹1,000 if taxable income <= 5L) if filed after 31 July
  let penalty234F = 0;
  if (asOfDateStr > july31OfAY && remainingTaxPayable > 0) {
    penalty234F = netTaxPayable <= 500_000 ? 1000 : 5000;
  }

  return {
    isSubjectToAdvanceTax: isSubject,
    exemptionReason: isSubject ? undefined : "Net tax liability after TDS is under ₹10,000 threshold u/s 208.",
    grossTaxLiability: grossTax,
    tdsCredit,
    netTaxPayable,
    totalAdvancePaid,
    remainingTaxPayable,
    quarters,
    penalty234C: total234C,
    penalty234B,
    penalty234A,
    penalty234F,
    totalStatutoryPenalty: total234C + penalty234B + penalty234A + penalty234F,
  };
}

