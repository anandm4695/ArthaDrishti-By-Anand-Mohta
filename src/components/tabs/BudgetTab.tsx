/* eslint-disable */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  AlertCircle,
  Plus,
  Wallet,
  Receipt,
  TrendingUp,
  Target,
  Pencil,
  Trash2,
  BarChart2,
  Check,
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Zap,
  Stethoscope,
  Film,
  Landmark,
  ArrowRightLeft,
  Wrench,
  HelpCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Play,
  Pause,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  PieChart as PieIcon,
  Sparkles,
  Layers,
  Clock,
  ExternalLink,
  SlidersHorizontal,
  Copy,
  ChevronDown,
  Wifi,
  Tv,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { THEME } from "../../utils/constants";
import { fmtINR, fmtINRFull, today, getEffectiveRent } from "../../utils/finance";
import { useMasterData, formatProfileOption } from "../../utils/masterData";
import { Modal, ModalActions } from "../ui/Modal";
import { Drawer } from "../ui/Drawer";
import { Field } from "../ui/Form";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { SectionTitle } from "../ui/SectionTitle";
import { usePrivacy } from "../../context/PrivacyContext";
import { Money } from "../ui/Money";
import { EmptyState } from "../ui/EmptyState";
import { Badge } from "../ui/Badge";
import { StatCard } from "../ui/StatCard";
import { ConfirmDialog } from "../ui/Feedback";

// Category Icons Dictionary
const CATEGORY_ICONS: Record<string, any> = {
  Food: Utensils,
  Dining: Utensils,
  Groceries: ShoppingBag,
  Transport: Car,
  Fuel: Car,
  Rent: Home,
  Bills: Zap,
  Salary: Wallet,
  Investment: TrendingUp,
  Investments: TrendingUp,
  EMI: CreditCard,
  Shopping: ShoppingBag,
  Medical: Stethoscope,
  Healthcare: Stethoscope,
  Entertainment: Film,
  Tax: Landmark,
  Transfer: ArrowRightLeft,
  Utilities: Wrench,
  Maintenance: Wrench,
  Travel: Car,
  Education: Wallet,
  Uncategorized: HelpCircle,
};

function getCatIcon(cat: string) {
  return CATEGORY_ICONS[cat] || HelpCircle;
}

const fmtDate = (dateStr: string) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export function numToIndianWords(n: number | string | null | undefined): string {
  const num = Math.floor(Number(n) || 0);
  if (num <= 0 || isNaN(num)) return "";
  if (num > 999999999) return "";

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertTwoDigits = (v: number): string => {
    if (v < 20) return units[v];
    return tens[Math.floor(v / 10)] + (v % 10 !== 0 ? " " + units[v % 10] : "");
  };

  const convertThreeDigits = (v: number): string => {
    let str = "";
    if (Math.floor(v / 100) > 0) {
      str += units[Math.floor(v / 100)] + " Hundred";
      if (v % 100 > 0) str += " and ";
    }
    if (v % 100 > 0) {
      str += convertTwoDigits(v % 100);
    }
    return str;
  };

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = rem;

  let res = "";
  if (crore > 0) res += convertThreeDigits(crore) + " Crore ";
  if (lakh > 0) res += convertTwoDigits(lakh) + " Lakh ";
  if (thousand > 0) res += convertTwoDigits(thousand) + " Thousand ";
  if (hundred > 0) res += convertThreeDigits(hundred) + " ";

  return res.trim() + " Rupees";
}

export function getNextOccurrence(frequency: string, dueDay: number, startDateStr?: string) {
  try {
    const todayDate = new Date();
    const curYear = todayDate.getFullYear();
    const curMonth = todayDate.getMonth();
    const curDay = todayDate.getDate();

    if (frequency === "weekly") {
      const dayOfWeek = todayDate.getDay();
      const currentIsoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      const targetDay = Math.min(7, Math.max(1, dueDay || 1));
      let diff = targetDay - currentIsoDay;
      if (diff < 0) diff += 7;
      const nextDate = new Date(todayDate);
      nextDate.setDate(curDay + diff);
      const daysAway = diff;
      const formatted = nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const daysText = daysAway === 0 ? "Due today" : daysAway === 1 ? "Due tomorrow" : `in ${daysAway} days`;
      return { date: formatted, daysText, daysAway };
    }

    if (frequency === "yearly") {
      const startMonth = startDateStr ? new Date(startDateStr).getMonth() : curMonth;
      let targetYear = curYear;
      const thisYearDate = new Date(targetYear, startMonth, dueDay || 1);
      if (thisYearDate.getTime() < todayDate.getTime()) {
        targetYear += 1;
      }
      const nextDate = new Date(targetYear, startMonth, dueDay || 1);
      const daysAway = Math.max(0, Math.ceil((nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
      const formatted = nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return { date: formatted, daysText: `in ${daysAway} days`, daysAway };
    }

    if (frequency === "quarterly") {
      let candidate = new Date(curYear, curMonth, dueDay || 1);
      if (candidate.getTime() < todayDate.getTime()) {
        candidate = new Date(curYear, curMonth + 3, dueDay || 1);
      }
      const daysAway = Math.max(0, Math.ceil((candidate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
      const formatted = candidate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return { date: formatted, daysText: `in ${daysAway} days`, daysAway };
    }

    // Default: monthly
    const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const clampedDay = Math.min(daysInCurMonth, Math.max(1, Number(dueDay) || 1));
    let targetYear = curYear;
    let targetMonth = curMonth;

    if (curDay > clampedDay) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const finalDay = Math.min(daysInTargetMonth, clampedDay);
    const targetDate = new Date(targetYear, targetMonth, finalDay);
    const diffTime = targetDate.getTime() - todayDate.getTime();
    const daysAway = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const formatted = targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const daysText = daysAway === 0 ? "Due today" : daysAway === 1 ? "Due tomorrow" : `in ${daysAway} days`;
    return { date: formatted, daysText, daysAway };
  } catch {
    return { date: "—", daysText: "", daysAway: 0 };
  }
}

// 50/30/20 Classification rules
const NEEDS_CATEGORIES = new Set([
  "Rent",
  "Groceries",
  "Bills",
  "Utilities",
  "Medical",
  "Healthcare",
  "Transport",
  "Fuel",
  "EMI",
  "Maintenance",
  "Education",
  "Tax",
]);

const WANTS_CATEGORIES = new Set([
  "Food",
  "Dining",
  "Shopping",
  "Entertainment",
  "Travel",
  "Personal Care",
  "Subscriptions",
  "Hobbies",
  "Gifts",
]);

const SAVINGS_CATEGORIES = new Set([
  "Investment",
  "Investments",
  "SIP",
  "Savings",
  "Mutual Funds",
  "Stocks",
  "FD",
  "RD",
  "Gold",
  "PPF",
  "NPS",
]);

export function BudgetTab({
  state,
  addItem,
  removeItem,
  updateItem,
  metrics: _metrics,
  activeProfile = "all",
  showToast,
}: any) {
  const { privacyMode } = usePrivacy();
  const { familyProfiles } = useMasterData();
  const [postingId, setPostingId] = useState<string | null>(null);

  const getOwnerName = (ownerId: string) =>
    familyProfiles.find((p: any) => p.id === ownerId)?.name || ownerId || "Self";

  // Subtabs: "budget" | "recurring" | "analytics"
  const [activeSubTab, setActiveSubTab] = useState<"budget" | "recurring" | "analytics">("budget");
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState(() => today().slice(0, 7)); // YYYY-MM
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [editRecurring, setEditRecurring] = useState<any>(null);
  const [togglingRecurringId, setTogglingRecurringId] = useState<string | null>(null);
  const [removingRecurringId, setRemovingRecurringId] = useState<string | null>(null);

  // Search, Filter & Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "over" | "near" | "ontrack" | "unbudgeted">("all");
  const [sortBy, setSortBy] = useState<"spent-desc" | "budget-desc" | "util-desc" | "name-asc">("spent-desc");

  // Category Detail Drawer state
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);
  const [drawerSearch, setDrawerSearch] = useState("");

  useEffect(() => {
    setDrawerSearch("");
  }, [selectedCategoryDetail]);

  // Recurring filter states
  const [recurringSearch, setRecurringSearch] = useState("");
  const [recurringStatusFilter, setRecurringStatusFilter] = useState<"all" | "due" | "paid" | "overdue" | "paused">("all");

  const toggleRecurringActive = async (re: any) => {
    setTogglingRecurringId(re.id);
    try {
      await updateItem("recurringExpenses", re.id, { isActive: !re.isActive });
    } catch (e: any) {
      showToast?.(`Failed to update recurring expense: ${e?.message || "Unknown error"}`, "error");
    } finally {
      setTogglingRecurringId(null);
    }
  };

  const removeRecurring = async (re: any) => {
    setRemovingRecurringId(re.id);
    try {
      await removeItem("recurringExpenses", re.id);
    } catch (e: any) {
      showToast?.(`Failed to delete recurring expense: ${e?.message || "Unknown error"}`, "error");
    } finally {
      setRemovingRecurringId(null);
    }
  };

  const { run: saveNewBudget, loading: savingNewBudget } = useAsyncAction(
    async (v: any) => {
      await addItem("budgets", { ...v, budgetMonth: selectedMonth });
    },
    {
      onSuccess: () => setShowAddBudget(false),
      onError: (e: any) =>
        showToast?.(`Failed to add budget category: ${e?.message || "Unknown error"}`, "error"),
    }
  );

  const { run: saveBudgetEdit, loading: savingBudgetEdit } = useAsyncAction(
    async (v: any) => {
      const isInheritedItem = editBudget.budgetMonth !== selectedMonth;
      if (isInheritedItem) {
        await addItem("budgets", { ...v, budgetMonth: selectedMonth });
      } else {
        await updateItem("budgets", editBudget.id, {
          ...v,
          budgetMonth: editBudget.budgetMonth || selectedMonth,
        });
      }
    },
    {
      onSuccess: () => setEditBudget(null),
      onError: (e: any) =>
        showToast?.(`Failed to save budget category: ${e?.message || "Unknown error"}`, "error"),
    }
  );

  const { run: saveNewRecurring, loading: savingNewRecurring } = useAsyncAction(
    async (v: any) => {
      await addItem("recurringExpenses", v);
    },
    {
      onSuccess: () => setShowAddRecurring(false),
      onError: (e: any) =>
        showToast?.(`Failed to add recurring expense: ${e?.message || "Unknown error"}`, "error"),
    }
  );

  const { run: saveRecurringEdit, loading: savingRecurringEdit } = useAsyncAction(
    async (v: any) => {
      await updateItem("recurringExpenses", editRecurring.id, v);
    },
    {
      onSuccess: () => setEditRecurring(null),
      onError: (e: any) =>
        showToast?.(`Failed to save recurring expense: ${e?.message || "Unknown error"}`, "error"),
    }
  );

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    let newM = m - 1;
    let newY = y;
    if (newM < 1) {
      newM = 12;
      newY = y - 1;
    }
    setSelectedMonth(`${newY}-${String(newM).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    let newM = m + 1;
    let newY = y;
    if (newM > 12) {
      newM = 1;
      newY = y + 1;
    }
    setSelectedMonth(`${newY}-${String(newM).padStart(2, "0")}`);
  };

  const selectedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  // Compute month spending dynamically based on selected month
  const monthSpending = useMemo(() => {
    const spending = state.transactions
      .filter(
        (t: any) =>
          t.date &&
          t.date.startsWith(selectedMonth) &&
          t.type === "debit" &&
          t.category !== "Transfer" &&
          t.category !== "Self Transfer" &&
          t.category !== "Self-Transfer"
      )
      .reduce((acc: any, t: any) => {
        const cat = t.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + Number(t.amount || 0);
        return acc;
      }, {});

    const rentPaidThisMonth = (state.rentedProperties || []).reduce((sum: number, p: any) => {
      const paymentsThisMonth = (p.payments || [])
        .filter((pay: any) => pay.date && pay.date.startsWith(selectedMonth))
        .reduce((s: number, pay: any) => s + Number(pay.amount || 0), 0);
      return sum + paymentsThisMonth;
    }, 0);

    if (rentPaidThisMonth > 0 && !spending["Rent"]) {
      spending["Rent"] = rentPaidThisMonth;
    }

    return spending;
  }, [state.transactions, state.rentedProperties, selectedMonth]);

  // Previous month spending for MoM comparisons
  const prevMonthSpending = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    let pm = m - 1,
      py = y;
    if (pm < 1) {
      pm = 12;
      py = y - 1;
    }
    const prevMonthStr = `${py}-${String(pm).padStart(2, "0")}`;
    const spending = state.transactions
      .filter(
        (t: any) =>
          t.date &&
          t.date.startsWith(prevMonthStr) &&
          t.type === "debit" &&
          t.category !== "Transfer" &&
          t.category !== "Self Transfer" &&
          t.category !== "Self-Transfer"
      )
      .reduce((acc: any, t: any) => {
        const cat = t.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + Number(t.amount || 0);
        return acc;
      }, {});
    const prevRent = (state.rentedProperties || []).reduce((sum: number, p: any) => {
      return (
        sum +
        (p.payments || [])
          .filter((pay: any) => pay.date && pay.date.startsWith(prevMonthStr))
          .reduce((s: number, pay: any) => s + Number(pay.amount || 0), 0)
      );
    }, 0);
    if (prevRent > 0 && !spending["Rent"]) spending["Rent"] = prevRent;
    return spending;
  }, [state.transactions, state.rentedProperties, selectedMonth]);

  // 3-Month Historical Spending Average per Category
  const historicalAverages = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevMonths: string[] = [];
    for (let i = 1; i <= 3; i++) {
      let pm = m - i;
      let py = y;
      while (pm < 1) {
        pm += 12;
        py -= 1;
      }
      prevMonths.push(`${py}-${String(pm).padStart(2, "0")}`);
    }

    const catTotals: Record<string, { total: number; count: number; byMonth: Record<string, number> }> = {};
    state.transactions.forEach((t: any) => {
      if (!t.date || t.type !== "debit") return;
      const tMonth = t.date.slice(0, 7);
      if (prevMonths.includes(tMonth)) {
        const cat = t.category || "Uncategorized";
        if (!catTotals[cat]) {
          catTotals[cat] = { total: 0, count: 0, byMonth: {} };
        }
        catTotals[cat].total += Number(t.amount || 0);
        catTotals[cat].byMonth[tMonth] = (catTotals[cat].byMonth[tMonth] || 0) + Number(t.amount || 0);
      }
    });

    const result: Record<string, { avg: number; byMonth: Record<string, number> }> = {};
    Object.entries(catTotals).forEach(([cat, data]) => {
      result[cat] = {
        avg: data.total / 3,
        byMonth: data.byMonth,
      };
    });
    return { averages: result, prevMonths };
  }, [state.transactions, selectedMonth]);

  // Month-Wise Budget Selection & Inheritance Logic
  const { budgetsToUse, isInherited, inheritedFrom } = useMemo(() => {
    const specific = state.budgets.filter((b: any) => b.budgetMonth === selectedMonth);
    if (specific.length > 0) {
      return { budgetsToUse: specific, isInherited: false, inheritedFrom: null };
    }

    // Look for previous months with budgets to inherit
    const otherBudgets = state.budgets.filter(
      (b: any) => b.budgetMonth && b.budgetMonth < selectedMonth
    );
    if (otherBudgets.length > 0) {
      const months = Array.from(new Set(otherBudgets.map((b: any) => b.budgetMonth))).sort();
      const latestMonth = months[months.length - 1];
      const inherited = state.budgets.filter((b: any) => b.budgetMonth === latestMonth);
      return { budgetsToUse: inherited, isInherited: true, inheritedFrom: latestMonth };
    }

    // Fallback to legacy default templates
    const legacy = state.budgets.filter((b: any) => !b.budgetMonth);
    if (legacy.length > 0) {
      return { budgetsToUse: legacy, isInherited: true, inheritedFrom: "Default Template" };
    }

    return { budgetsToUse: [], isInherited: false, inheritedFrom: null };
  }, [state.budgets, selectedMonth]);

  // Lock and duplicate inherited budgets to the selected month
  const { run: handleLockAndCustomize, loading: lockingBudgets } = useAsyncAction(
    async () => {
      if (!isInherited || budgetsToUse.length === 0) return;
      const alreadySet = new Set(
        state.budgets.filter((b: any) => b.budgetMonth === selectedMonth).map((b: any) => b.category)
      );
      for (const b of budgetsToUse) {
        if (alreadySet.has(b.category)) continue;
        await addItem("budgets", {
          owner: b.owner || "self",
          category: b.category,
          monthly: b.monthly || b.monthlyLimit || 0,
          budgetMonth: selectedMonth,
          rollover: !!b.rollover,
        });
      }
      showToast?.(`Locked ${budgetsToUse.length} budgets for ${selectedMonthLabel}`, "success");
    },
    {
      onError: (e: any) =>
        showToast?.(`Failed to lock budgets: ${e?.message || "Unknown error"}`, "error"),
    }
  );

  // Safe removal of budgets
  const { run: handleRemoveBudget, loading: removingBudget } = useAsyncAction(
    async (b: any) => {
      const isInheritedItem = b.budgetMonth !== selectedMonth;
      if (isInheritedItem) {
        const alreadySet = new Set(
          state.budgets
            .filter((x: any) => x.budgetMonth === selectedMonth)
            .map((x: any) => x.category)
        );
        for (const otherB of budgetsToUse) {
          if (otherB.id !== b.id && !alreadySet.has(otherB.category)) {
            await addItem("budgets", {
              owner: otherB.owner || "self",
              category: otherB.category,
              monthly: otherB.monthly || otherB.monthlyLimit || 0,
              budgetMonth: selectedMonth,
              rollover: !!otherB.rollover,
            });
          }
        }
      } else {
        await removeItem("budgets", b.id);
      }
      if (selectedCategoryDetail === b.category) {
        setSelectedCategoryDetail(null);
      }
      showToast?.(`Deleted "${b.category}" budget`, "info");
    },
    {
      onError: (e: any) =>
        showToast?.(`Failed to remove budget category: ${e?.message || "Unknown error"}`, "error"),
    }
  );

  // Rollover calculation
  const getRolloverAmount = (b: any) => {
    if (!b.rollover) return 0;
    const [y, m] = selectedMonth.split("-").map(Number);
    let pm = m - 1,
      py = y;
    if (pm < 1) {
      pm = 12;
      py = y - 1;
    }
    const prevMonthStr = `${py}-${String(pm).padStart(2, "0")}`;
    const prevBudget = state.budgets.find(
      (x: any) =>
        x.budgetMonth === prevMonthStr &&
        x.category === b.category &&
        (x.owner || "self") === (b.owner || "self")
    );
    if (!prevBudget) return 0;
    const prevLimit = Number(prevBudget.monthly || 0);
    const prevSpent = prevMonthSpending[b.category] || 0;
    return Math.max(0, prevLimit - prevSpent);
  };

  const getEffectiveBudget = (b: any) => Number(b.monthly || 0) + getRolloverAmount(b);

  const totalBudget = budgetsToUse.reduce((s: number, b: any) => s + getEffectiveBudget(b), 0);
  const totalSpent = budgetsToUse.reduce(
    (s: number, b: any) => s + (monthSpending[b.category] || 0),
    0
  );

  const animatedSpentPct = useAnimatedNumber(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0);

  const overBudgetCount = budgetsToUse.filter((b: any) => {
    const spent = monthSpending[b.category] || 0;
    return spent > getEffectiveBudget(b);
  }).length;

  const approachingBudgetCount = budgetsToUse.filter((b: any) => {
    const spent = monthSpending[b.category] || 0;
    const budget = getEffectiveBudget(b);
    if (budget <= 0) return false;
    const pct = (spent / budget) * 100;
    return pct > 80 && pct <= 100;
  }).length;

  // Unbudgeted spending
  const { unbudgetedSpending, totalUnbudgetedSpent } = useMemo(() => {
    const budgetedCats = new Set(budgetsToUse.map((b: any) => b.category));
    const result: Record<string, number> = {};
    Object.entries(monthSpending).forEach(([cat, amt]) => {
      if (!budgetedCats.has(cat) && (amt as number) > 0) result[cat] = amt as number;
    });
    const total = Object.values(result).reduce((s, v) => s + v, 0);
    return { unbudgetedSpending: result, totalUnbudgetedSpent: total };
  }, [monthSpending, budgetsToUse]);

  // Monthly income for selected month
  const selectedMonthIncome = useMemo(() => {
    const fromIncome = (state.income || [])
      .filter((e: any) => e.date && e.date.startsWith(selectedMonth))
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    if (fromIncome > 0) return fromIncome;
    const TRANSFER_CATS = new Set(["transfer", "self transfer", "self-transfer", "investment"]);
    return state.transactions
      .filter((t: any) => {
        if (!t.date || !t.date.startsWith(selectedMonth) || t.type !== "credit") return false;
        const cat = (t.category || "").toLowerCase();
        return !TRANSFER_CATS.has(cat);
      })
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  }, [state.income, state.transactions, selectedMonth]);

  // 50 / 30 / 20 Rule Allocation Computation
  const rule503020 = useMemo(() => {
    let needsSpent = 0;
    let wantsSpent = 0;
    let savingsSpent = 0;
    let otherSpent = 0;

    Object.entries(monthSpending).forEach(([cat, amt]) => {
      const val = amt as number;
      if (NEEDS_CATEGORIES.has(cat)) {
        needsSpent += val;
      } else if (WANTS_CATEGORIES.has(cat)) {
        wantsSpent += val;
      } else if (SAVINGS_CATEGORIES.has(cat)) {
        savingsSpent += val;
      } else {
        wantsSpent += val;
      }
    });

    const totalCalculated = needsSpent + wantsSpent + savingsSpent + otherSpent;
    const baseIncome = selectedMonthIncome > 0 ? selectedMonthIncome : totalCalculated;

    const needsPct = baseIncome > 0 ? (needsSpent / baseIncome) * 100 : 0;
    const wantsPct = baseIncome > 0 ? (wantsSpent / baseIncome) * 100 : 0;
    const savingsPct = baseIncome > 0 ? (savingsSpent / baseIncome) * 100 : 0;

    return {
      needsSpent,
      wantsSpent,
      savingsSpent,
      needsPct,
      wantsPct,
      savingsPct,
      baseIncome,
    };
  }, [monthSpending, selectedMonthIncome]);

  // Filtered & Sorted Budgets List
  const filteredBudgets = useMemo(() => {
    let list = [...budgetsToUse];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b: any) => b.category.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((b: any) => {
        const spent = monthSpending[b.category] || 0;
        const budget = getEffectiveBudget(b);
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        if (statusFilter === "over") return pct > 100;
        if (statusFilter === "near") return pct >= 80 && pct <= 100;
        if (statusFilter === "ontrack") return pct < 80;
        return true;
      });
    }

    // Sorting
    list.sort((a: any, b: any) => {
      const spentA = monthSpending[a.category] || 0;
      const spentB = monthSpending[b.category] || 0;
      const budgetA = getEffectiveBudget(a);
      const budgetB = getEffectiveBudget(b);
      const utilA = budgetA > 0 ? spentA / budgetA : 0;
      const utilB = budgetB > 0 ? spentB / budgetB : 0;

      if (sortBy === "spent-desc") return spentB - spentA;
      if (sortBy === "budget-desc") return budgetB - budgetA;
      if (sortBy === "util-desc") return utilB - utilA;
      if (sortBy === "name-asc") return a.category.localeCompare(b.category);
      return 0;
    });

    return list;
  }, [budgetsToUse, searchQuery, statusFilter, sortBy, monthSpending]);

  // Active Recurring Expenses filter & matching
  const activeRecurringExpenses = useMemo(() => {
    const items = state.recurringExpenses || [];
    return items.filter((re: any) => {
      const selMonthStartStr = `${selectedMonth}-01`;
      const [y, m] = selectedMonth.split("-").map(Number);
      const daysInSelMonth = new Date(y, m, 0).getDate();
      const selMonthEndStr = `${selectedMonth}-${daysInSelMonth}`;

      if (re.startDate > selMonthEndStr) return false;
      if (re.endDate && re.endDate < selMonthStartStr) return false;
      return true;
    });
  }, [state.recurringExpenses, selectedMonth]);

  // Match actual transactions to recurring expenses
  const recurringPaymentMatches = useMemo(() => {
    const usedTxnIds = new Set<string>();
    const map: Record<string, any> = {};
    activeRecurringExpenses.forEach((re: any) => {
      if (!re.isActive) return;
      const nameLower = (re.name || "").toLowerCase();
      const cat = re.category;
      const amount = Number(re.amount);
      if (amount <= 0) return;

      const match = state.transactions.find((t: any) => {
        if (usedTxnIds.has(t.id)) return false;
        if (!t.date || !t.date.startsWith(selectedMonth) || t.type !== "debit") return false;
        const noteMatches = t.note && t.note.toLowerCase().includes(nameLower);
        const catMatches = t.category === cat;
        const tAmt = Number(t.amount);
        const amtMatches = Math.abs(tAmt - amount) / amount <= 0.05;
        return (noteMatches || catMatches) && amtMatches;
      });
      if (match) {
        usedTxnIds.add(match.id);
        map[re.id] = match;
      }
    });
    return map;
  }, [activeRecurringExpenses, state.transactions, selectedMonth]);

  // Recurring stats
  const recurringStats = useMemo(() => {
    const list = activeRecurringExpenses;
    const monthlyCommitment = list
      .filter((x: any) => x.isActive)
      .reduce((acc: number, re: any) => {
        const amt = Number(re.amount) || 0;
        if (re.frequency === "weekly") return acc + amt * 4.33;
        if (re.frequency === "quarterly") return acc + amt / 3;
        if (re.frequency === "yearly") return acc + amt / 12;
        return acc + amt;
      }, 0);

    let paidCount = 0;
    let paidTotal = 0;
    let dueCount = 0;
    let dueTotal = 0;
    let overdueCount = 0;
    let overdueTotal = 0;

    const now = new Date();
    const curMonthStr = today().slice(0, 7);
    const todayDay = now.getDate();

    list.forEach((re: any) => {
      if (!re.isActive) return;
      const match = recurringPaymentMatches[re.id];
      if (match) {
        paidCount++;
        paidTotal += Number(match.amount || re.amount);
      } else {
        dueCount++;
        dueTotal += Number(re.amount);

        if (selectedMonth === curMonthStr && todayDay > Number(re.dueDay)) {
          overdueCount++;
          overdueTotal += Number(re.amount);
        } else if (selectedMonth < curMonthStr) {
          overdueCount++;
          overdueTotal += Number(re.amount);
        }
      }
    });

    return {
      monthlyCommitment,
      annualCost: monthlyCommitment * 12,
      paidCount,
      paidTotal,
      dueCount,
      dueTotal,
      overdueCount,
      overdueTotal,
    };
  }, [activeRecurringExpenses, selectedMonth, recurringPaymentMatches]);

  // Filtered Recurring items
  const filteredRecurring = useMemo(() => {
    let list = [...activeRecurringExpenses];

    if (recurringSearch.trim()) {
      const q = recurringSearch.toLowerCase();
      list = list.filter(
        (re: any) =>
          re.name?.toLowerCase().includes(q) ||
          re.category?.toLowerCase().includes(q)
      );
    }

    const now = new Date();
    const curMonthStr = today().slice(0, 7);
    const todayDay = now.getDate();

    if (recurringStatusFilter !== "all") {
      list = list.filter((re: any) => {
        const hasPaid = !!recurringPaymentMatches[re.id];
        if (recurringStatusFilter === "paused") return !re.isActive;
        if (recurringStatusFilter === "paid") return hasPaid;
        if (recurringStatusFilter === "overdue") {
          if (hasPaid || !re.isActive) return false;
          if (selectedMonth < curMonthStr) return true;
          if (selectedMonth === curMonthStr && todayDay > Number(re.dueDay)) return true;
          return false;
        }
        if (recurringStatusFilter === "due") {
          return re.isActive && !hasPaid;
        }
        return true;
      });
    }

    list.sort((a: any, b: any) => (Number(a.dueDay) || 0) - (Number(b.dueDay) || 0));
    return list;
  }, [activeRecurringExpenses, recurringSearch, recurringStatusFilter, recurringPaymentMatches, selectedMonth]);

  // One-click Quick Pay
  const handleQuickPostTransaction = async (expense: any) => {
    const curMonthStr = today().slice(0, 7);
    const [selY, selM] = selectedMonth.split("-").map(Number);
    const daysInSelMonth = new Date(selY, selM, 0).getDate();
    const clampedDay = Math.min(Number(expense.dueDay), daysInSelMonth);

    let payDate = `${selectedMonth}-${String(clampedDay).padStart(2, "0")}`;
    if (selectedMonth === curMonthStr) {
      payDate = today();
    }

    const defaultAccId = expense.accountId || state.bankAccounts[0]?.id || "";

    setPostingId(expense.id);
    try {
      await addItem("transactions", {
        owner: expense.owner || "self",
        date: payDate,
        accountId: defaultAccId,
        amount: expense.amount,
        type: "debit",
        category: expense.category,
        note: `${expense.name} (Recurring)`,
      });
      showToast?.(`Recorded ₹${expense.amount} for "${expense.name}"`, "success");
    } catch (e: any) {
      showToast?.(`Failed to record payment: ${e?.message || "Unknown error"}`, "error");
    } finally {
      setPostingId(null);
    }
  };

  // Populate from 3-Month Average
  const handleApply3MonthAverage = async () => {
    try {
      let count = 0;
      for (const [cat, data] of Object.entries(historicalAverages.averages)) {
        if (data.avg <= 0) continue;
        const rounded = Math.ceil(data.avg / 500) * 500;
        const existing = budgetsToUse.find((b: any) => b.category === cat);
        if (existing) {
          if (existing.budgetMonth === selectedMonth) {
            await updateItem("budgets", existing.id, { monthly: rounded });
          } else {
            await addItem("budgets", {
              owner: existing.owner || "self",
              category: cat,
              monthly: rounded,
              budgetMonth: selectedMonth,
              rollover: !!existing.rollover,
            });
          }
        } else {
          await addItem("budgets", {
            owner: "self",
            category: cat,
            monthly: rounded,
            budgetMonth: selectedMonth,
            rollover: false,
          });
        }
        count++;
      }
      showToast?.(`Applied 3-month average targets to ${count} categories`, "success");
    } catch (e: any) {
      showToast?.(`Failed to apply averages: ${e?.message || "Unknown error"}`, "error");
    }
  };

  // CSV Export
  const downloadCSV = () => {
    const q = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      "Category,Owner,Budget (₹),Rolled Over (₹),Spent (₹),Remaining (₹),% Used,MoM Change (₹),Status",
    ];
    budgetsToUse.forEach((b: any) => {
      const spent = monthSpending[b.category] || 0;
      const rolledOver = getRolloverAmount(b);
      const budget = getEffectiveBudget(b);
      const remaining = budget - spent;
      const pctUsed = budget > 0 ? ((spent / budget) * 100).toFixed(1) : "0";
      const prev = prevMonthSpending[b.category] || 0;
      const delta = spent - prev;
      const deltaStr = prev > 0 ? (delta >= 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0)) : "";
      const status =
        spent > budget ? "Over Budget" : spent > budget * 0.8 ? "Near Limit" : "On Track";
      rows.push(
        [
          q(b.category),
          q(getOwnerName(b.owner || "self")),
          q(budget),
          q(rolledOver ? rolledOver.toFixed(0) : ""),
          q(spent.toFixed(0)),
          q(remaining.toFixed(0)),
          q(pctUsed + "%"),
          q(deltaStr),
          q(status),
        ].join(",")
      );
    });
    if (totalUnbudgetedSpent > 0) {
      Object.entries(unbudgetedSpending).forEach(([cat, amt]) => {
        rows.push(
          [
            q(cat),
            q(""),
            q("No Budget"),
            q(""),
            q((amt as number).toFixed(0)),
            q("N/A"),
            q("N/A"),
            q(""),
            q("Unbudgeted"),
          ].join(",")
        );
      });
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Category Detail Transactions
  const categoryTransactions = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return state.transactions
      .filter(
        (t: any) =>
          t.date &&
          t.date.startsWith(selectedMonth) &&
          t.type === "debit" &&
          (t.category || "Uncategorized") === selectedCategoryDetail
      )
      .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
  }, [state.transactions, selectedCategoryDetail, selectedMonth]);

  const filteredCategoryTransactions = useMemo(() => {
    if (!drawerSearch.trim()) return categoryTransactions;
    const q = drawerSearch.toLowerCase();
    return categoryTransactions.filter(
      (t: any) =>
        t.note?.toLowerCase().includes(q) ||
        String(t.amount).includes(q) ||
        t.date?.includes(q)
    );
  }, [categoryTransactions, drawerSearch]);

  const activeDetailBudget = useMemo(() => {
    if (!selectedCategoryDetail) return null;
    return budgetsToUse.find((b: any) => b.category === selectedCategoryDetail) || null;
  }, [budgetsToUse, selectedCategoryDetail]);

  return (
    <div className="tab-content-enter">
      {/* ── HEADER & NAVIGATION BAR ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          padding: "16px 20px",
          background: "var(--surface-0)",
          border: "1px solid var(--t-line)",
          borderRadius: 16,
        }}
      >
        {/* Month Selector & Jump */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              background: "var(--t-paper)",
              borderRadius: 10,
              padding: 3,
              border: "1px solid var(--t-line)",
              alignItems: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              style={{ padding: "6px 8px", borderRadius: 8, height: "auto" }}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </Button>
            <div
              style={{
                padding: "4px 14px",
                fontWeight: 800,
                fontSize: 14,
                minWidth: 140,
                textAlign: "center",
                color: THEME.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Calendar size={14} color={THEME.accent} />
              {selectedMonthLabel}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              style={{ padding: "6px 8px", borderRadius: 8, height: "auto" }}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Month input / quick jump */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid var(--t-line)",
              background: "var(--t-paper)",
              color: THEME.ink,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Pick specific month"
          />

          {/* Today Shortcut Button */}
          {selectedMonth !== today().slice(0, 7) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMonth(today().slice(0, 7))}
              style={{
                border: "1px solid var(--t-line)",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--t-paper)",
              }}
            >
              <Clock size={13} />
              Current Month
            </Button>
          )}
        </div>

        {/* Sub Navigation Segmented Control + Adaptive Action CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="demat-portfolio-bar no-scrollbar" style={{ marginBottom: 0 }}>
            {(
              [
                { id: "budget", label: "Budget Tracker", icon: BarChart2 },
                { id: "recurring", label: "Fixed & Recurring", icon: Repeat },
                { id: "analytics", label: "Analytics & Trends", icon: TrendingUp },
              ] as const
            ).map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setActiveSubTab(id)}
                aria-pressed={activeSubTab === id}
                className={`demat-portfolio-pill ${activeSubTab === id ? "active" : ""}`}
                style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700 }}
              >
                <TabIcon size={14} />
                {label}
              </button>
            ))}
          </div>

          {activeSubTab === "budget" && (
            <Button
              onClick={() => setShowAddBudget(true)}
              variant="accent"
              icon={<Plus size={14} />}
              style={{ fontWeight: 700, borderRadius: 10, padding: "8px 16px", whiteSpace: "nowrap" }}
            >
              Add Budget Category
            </Button>
          )}
          {activeSubTab === "recurring" && (
            <Button
              onClick={() => setShowAddRecurring(true)}
              variant="accent"
              icon={<Plus size={14} />}
              style={{ fontWeight: 700, borderRadius: 10, padding: "8px 16px", whiteSpace: "nowrap" }}
            >
              Add Recurring Expense
            </Button>
          )}
          {activeSubTab === "analytics" && (
            <Button
              onClick={() => setShowAddBudget(true)}
              variant="accent"
              icon={<Plus size={14} />}
              style={{ fontWeight: 700, borderRadius: 10, padding: "8px 16px", whiteSpace: "nowrap" }}
            >
              Add Category
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/*                     1. BUDGET TRACKER VIEW               */}
      {/* ======================================================== */}
      {activeSubTab === "budget" && (
        <>
          {/* Budget Alert Banner */}
          {(overBudgetCount > 0 || approachingBudgetCount > 0) && (
            <Card
              style={{
                background:
                  overBudgetCount > 0
                    ? `color-mix(in srgb, ${THEME.rust} 5%, var(--t-paper))`
                    : `color-mix(in srgb, ${THEME.gold} 5%, var(--t-paper))`,
                border: `1px solid color-mix(in srgb, ${overBudgetCount > 0 ? THEME.rust : THEME.gold} 30%, transparent)`,
                padding: "14px 20px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderRadius: 14,
              }}
            >
              {overBudgetCount > 0 ? (
                <AlertCircle size={20} color={THEME.rust} />
              ) : (
                <AlertTriangle size={20} color={THEME.gold} />
              )}
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: overBudgetCount > 0 ? THEME.rust : THEME.gold,
                  }}
                >
                  {overBudgetCount > 0 && (
                    <span>
                      {overBudgetCount} {overBudgetCount === 1 ? "category" : "categories"} exceeded
                      target limit
                    </span>
                  )}
                  {overBudgetCount > 0 && approachingBudgetCount > 0 && (
                    <span style={{ color: THEME.muted }}> · </span>
                  )}
                  {approachingBudgetCount > 0 && (
                    <span style={{ color: THEME.gold }}>
                      {approachingBudgetCount} approaching warning limit (80%+)
                    </span>
                  )}
                </span>
                <div style={{ fontSize: 11.5, color: THEME.muted, marginTop: 2, fontWeight: 500 }}>
                  Click any category card below to inspect all matching ledger transactions.
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(overBudgetCount > 0 ? "over" : "near")}
                style={{
                  border: `1px solid color-mix(in srgb, ${overBudgetCount > 0 ? THEME.rust : THEME.gold} 40%, transparent)`,
                  color: overBudgetCount > 0 ? THEME.rust : THEME.gold,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Filter Flagged
              </Button>
            </Card>
          )}

          {/* Budget Inheritance Notification Banner */}
          {isInherited && budgetsToUse.length > 0 && (
            <Card
              style={{
                background: `color-mix(in srgb, ${THEME.accent} 4%, var(--t-paper))`,
                border: `1px dashed color-mix(in srgb, ${THEME.accent} 40%, transparent)`,
                padding: "14px 20px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                borderRadius: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Repeat
                  size={18}
                  color={THEME.accent}
                  style={{ animation: "spin 14s linear infinite" }}
                />
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: THEME.ink }}>
                    Showing inherited budget limits from{" "}
                    <strong>
                      {inheritedFrom === "Default Template"
                        ? "Baseline Template"
                        : new Date(inheritedFrom + "-01").toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                    </strong>
                  </span>
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                    Lock these limits to customize individual category budgets for {selectedMonthLabel}.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  onClick={handleLockAndCustomize}
                  disabled={lockingBudgets}
                  loading={lockingBudgets}
                  size="sm"
                  variant="accent"
                  style={{ fontWeight: 700, borderRadius: 8 }}
                >
                  <Copy size={13} style={{ marginRight: 4 }} />
                  Lock & Customize Month
                </Button>
              </div>
            </Card>
          )}

          {/* ── Summary KPI Tiles ── */}
          {(() => {
            const allSpent = totalSpent + totalUnbudgetedSpent;
            const savingsAmt = selectedMonthIncome - allSpent;
            const savingsRate =
              selectedMonthIncome > 0 ? (savingsAmt / selectedMonthIncome) * 100 : null;
            const savingsColor =
              savingsRate === null
                ? THEME.muted
                : savingsRate >= 20
                  ? THEME.sage
                  : savingsRate >= 10
                    ? THEME.gold
                    : THEME.rust;
            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    label: "Total Budgeted",
                    value: fmtINRFull(totalBudget),
                    numericValue: totalBudget,
                    formatValue: fmtINRFull,
                    sub: `Target for ${selectedMonthLabel}`,
                    color: THEME.accent,
                    Icon: Target,
                  },
                  {
                    label: "Actual Spent",
                    value: fmtINRFull(allSpent),
                    numericValue: allSpent,
                    formatValue: fmtINRFull,
                    sub:
                      `${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% of budget used` +
                      (totalUnbudgetedSpent > 0
                        ? ` · ${privacyMode ? "••••" : fmtINRFull(totalUnbudgetedSpent)} unbudgeted`
                        : ""),
                    color: totalSpent > totalBudget ? THEME.rust : THEME.accent,
                    Icon: Receipt,
                  },
                  {
                    label: "Remaining Capacity",
                    value: fmtINRFull(Math.max(0, totalBudget - totalSpent)),
                    numericValue: Math.max(0, totalBudget - totalSpent),
                    formatValue: fmtINRFull,
                    sub: totalBudget - totalSpent >= 0 ? "Under budget" : "Budget exceeded",
                    color: totalBudget - totalSpent >= 0 ? THEME.sage : THEME.rust,
                    Icon: Wallet,
                  },
                  {
                    label: "Active Categories",
                    value: String(budgetsToUse.length),
                    numericValue: budgetsToUse.length,
                    formatValue: (n: number) => Math.round(n).toString(),
                    sub:
                      totalUnbudgetedSpent > 0
                        ? `+${Object.keys(unbudgetedSpending).length} unbudgeted`
                        : "All tracked",
                    color: THEME.muted,
                    Icon: BarChart2,
                  },
                  {
                    label: "Monthly Savings Rate",
                    value: savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "—",
                    numericValue: savingsRate !== null ? savingsRate : undefined,
                    formatValue: (n: number) => `${n.toFixed(1)}%`,
                    sub:
                      selectedMonthIncome > 0
                        ? `Income: ${privacyMode ? "••••" : fmtINRFull(selectedMonthIncome)}`
                        : "No income recorded",
                    color: savingsColor,
                    Icon: TrendingUp,
                  },
                ].map(({ label, value, numericValue, formatValue, sub, color, Icon }) => (
                  <StatCard
                    key={label}
                    label={label}
                    value={value}
                    numericValue={numericValue}
                    formatValue={formatValue}
                    sub={sub}
                    color={color}
                    icon={<Icon />}
                  />
                ))}
              </div>
            );
          })()}

          {/* ── 50 / 30 / 20 Budget Rule Breakdown ── */}
          <Card
            style={{
              marginBottom: 24,
              padding: "18px 24px",
              border: "1px solid var(--t-line)",
              borderRadius: 16,
              background: "var(--surface-0)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color={THEME.accent} />
                <span style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>
                  50 / 30 / 20 Financial Wellness Rule
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: THEME.muted,
                    background: "rgba(128,128,128,0.08)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  Standard Guideline
                </span>
              </div>
              <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>
                Total Spend Analyzed:{" "}
                <strong style={{ color: THEME.ink }}>
                  <Money value={rule503020.needsSpent + rule503020.wantsSpent + rule503020.savingsSpent} variant="full" />
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {/* Needs (50%) */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: `color-mix(in srgb, ${THEME.accent} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${THEME.accent} 20%, transparent)`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: THEME.ink }}>
                    Needs (Target ≤ 50%)
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: THEME.accent }}>
                    {rule503020.needsPct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: THEME.ink, marginBottom: 8 }}>
                  <Money value={rule503020.needsSpent} variant="full" />
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(rule503020.needsPct, 100)}%`,
                      background: rule503020.needsPct > 55 ? THEME.rust : THEME.accent,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10.5, color: THEME.muted, marginTop: 6 }}>
                  Rent, Groceries, Utilities, Bills, EMIs, Health
                </div>
              </div>

              {/* Wants (30%) */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: `color-mix(in srgb, ${THEME.gold} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${THEME.gold} 20%, transparent)`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: THEME.ink }}>
                    Wants (Target ≤ 30%)
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: THEME.gold }}>
                    {rule503020.wantsPct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: THEME.ink, marginBottom: 8 }}>
                  <Money value={rule503020.wantsSpent} variant="full" />
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(rule503020.wantsPct, 100)}%`,
                      background: rule503020.wantsPct > 35 ? THEME.rust : THEME.gold,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10.5, color: THEME.muted, marginTop: 6 }}>
                  Dining, Shopping, Entertainment, Travel, Hobbies
                </div>
              </div>

              {/* Savings & Investments (20%) */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: `color-mix(in srgb, ${THEME.sage} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${THEME.sage} 20%, transparent)`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: THEME.ink }}>
                    Savings (Target ≥ 20%)
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: THEME.sage }}>
                    {rule503020.savingsPct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: THEME.ink, marginBottom: 8 }}>
                  <Money value={rule503020.savingsSpent} variant="full" />
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(rule503020.savingsPct, 100)}%`,
                      background: THEME.sage,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10.5, color: THEME.muted, marginTop: 6 }}>
                  Investments, SIPs, PPF, NPS, Fixed Deposits
                </div>
              </div>
            </div>
          </Card>

          {/* ── Burn Rate Pacing Widget ── */}
          {totalBudget > 0 &&
            (() => {
              const now = new Date();
              const currentMonthStr = today().slice(0, 7);
              const isCurrentMonth = selectedMonth === currentMonthStr;

              const [selYear, selMonth] = selectedMonth.split("-").map(Number);
              const daysInMonth = new Date(selYear, selMonth, 0).getDate();
              const daysPassed = isCurrentMonth ? now.getDate() : daysInMonth;

              const monthElapsedPct = (daysPassed / daysInMonth) * 100;
              const spentPct = (totalSpent / totalBudget) * 100;
              const onTrack = spentPct <= monthElapsedPct + 5;
              const burnColor =
                spentPct > monthElapsedPct + 10
                  ? THEME.rust
                  : spentPct > monthElapsedPct - 5
                    ? THEME.gold
                    : THEME.sage;
              const r = 46,
                sz = 116,
                circ = 2 * Math.PI * r;

              return (
                <Card style={{ marginBottom: 28, padding: "24px 28px", borderRadius: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: THEME.muted,
                      marginBottom: 20,
                      fontWeight: 800,
                    }}
                  >
                    Budget Burn Rate & Pacing — Day {daysPassed} of {daysInMonth} ({selectedMonthLabel})
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <svg
                        width={sz}
                        height={sz}
                        style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.06))" }}
                      >
                        <circle
                          cx={sz / 2}
                          cy={sz / 2}
                          r={r}
                          fill="none"
                          stroke={THEME.line}
                          strokeWidth="11"
                        />
                        <circle
                          cx={sz / 2}
                          cy={sz / 2}
                          r={r}
                          fill="none"
                          stroke={THEME.muted}
                          strokeWidth="11"
                          opacity="0.15"
                          strokeDasharray={`${(monthElapsedPct / 100) * circ} ${circ}`}
                          strokeDashoffset={circ / 4}
                          strokeLinecap="round"
                        />
                        <circle
                          cx={sz / 2}
                          cy={sz / 2}
                          r={r}
                          fill="none"
                          stroke={burnColor}
                          strokeWidth="11"
                          strokeDasharray={`${Math.min(spentPct / 100, 1) * circ} ${circ}`}
                          strokeDashoffset={circ / 4}
                          strokeLinecap="round"
                          style={{
                            transition: "stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                        <text
                          x={sz / 2}
                          y={sz / 2 - 4}
                          textAnchor="middle"
                          fontFamily="var(--font-display)"
                          fontSize="19"
                          fontWeight="700"
                          fill={THEME.ink}
                        >
                          {animatedSpentPct.toFixed(0)}%
                        </text>
                        <text
                          x={sz / 2}
                          y={sz / 2 + 15}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill={THEME.muted}
                          style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                          spent
                        </text>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ display: "grid", gap: 12 }}>
                        {[
                          {
                            label: "Month Progress Elapsed",
                            val: `${monthElapsedPct.toFixed(0)}% (${daysPassed}/${daysInMonth} days)`,
                            color: THEME.muted,
                          },
                          {
                            label: "Budget Spent",
                            val: `${spentPct.toFixed(0)}% (${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%)`,
                            color: burnColor,
                          },
                          {
                            label: "Daily Average Spending",
                            val: (
                              <>
                                <Money value={daysPassed > 0 ? totalSpent / daysPassed : 0} variant="full" />{" "}
                                / day
                              </>
                            ),
                            color: THEME.ink,
                          },
                          {
                            label: "Projected Month-End Outgo",
                            val: (
                              <Money
                                value={daysPassed > 0 ? (totalSpent / daysPassed) * daysInMonth : 0}
                                variant="full"
                              />
                            ),
                            color: burnColor,
                          },
                        ].map(({ label, val, color }) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 13.5,
                            }}
                          >
                            <span style={{ color: THEME.muted, fontWeight: 600 }}>{label}</span>
                            <span
                              style={{ fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}
                            >
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          marginTop: 18,
                          fontSize: 12.5,
                          padding: "10px 16px",
                          borderRadius: 10,
                          background: onTrack
                            ? `color-mix(in srgb, ${THEME.sage} 7%, transparent)`
                            : `color-mix(in srgb, ${THEME.rust} 7%, transparent)`,
                          color: onTrack ? THEME.sage : THEME.rust,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {onTrack ? <Check size={16} /> : <AlertCircle size={16} />}
                        {onTrack
                          ? "Spending is pacing smoothly in line with the month calendar."
                          : "You are overpacing — spending velocity is higher than month progress."}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}

          {/* ── TOOLBAR: SEARCH, FILTERS, SORTS & ACTIONS ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: 220, flex: "1 1 220px", maxWidth: 360 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: THEME.muted,
                }}
              />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: 10,
                  border: "1px solid var(--t-line)",
                  background: "var(--surface-0)",
                  color: THEME.ink,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {(
                [
                  { id: "all", label: `All (${budgetsToUse.length})`, color: THEME.accent },
                  { id: "over", label: `Over Budget (${overBudgetCount})`, color: THEME.rust },
                  { id: "near", label: `Near Limit (${approachingBudgetCount})`, color: THEME.gold },
                  { id: "ontrack", label: `On Track`, color: THEME.sage },
                ] as const
              ).map(({ id, label, color }) => (
                <button
                  key={id}
                  onClick={() => setStatusFilter(id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid",
                    borderColor:
                      statusFilter === id
                        ? (color || THEME.accent)
                        : "var(--t-line)",
                    background:
                      statusFilter === id
                        ? `color-mix(in srgb, ${color || THEME.accent} 12%, transparent)`
                        : "var(--surface-0)",
                    color: statusFilter === id ? (color || THEME.accent) : THEME.muted,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort & Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--t-line)",
                  background: "var(--surface-0)",
                  color: THEME.ink,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="spent-desc">Sort: Highest Spend</option>
                <option value="budget-desc">Sort: Highest Budget</option>
                <option value="util-desc">Sort: % Utilized</option>
                <option value="name-asc">Sort: A-Z</option>
              </select>

              {budgetsToUse.length === 0 && (
                <Button
                  onClick={handleApply3MonthAverage}
                  variant="ghost"
                  icon={<Sparkles size={13} />}
                  style={{ border: "1px solid var(--t-line)", borderRadius: 8, fontSize: 12 }}
                >
                  Auto-Populate from 3-Mo Avg
                </Button>
              )}

              <Button
                onClick={downloadCSV}
                variant="ghost"
                icon={<Download size={13} />}
                style={{ border: "1px solid var(--t-line)", borderRadius: 8, fontSize: 12 }}
              >
                Export CSV
              </Button>

              <Button
                onClick={() => setShowAddBudget(true)}
                variant="accent"
                icon={<Plus size={14} />}
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                Add Category
              </Button>
            </div>
          </div>

          {/* ── Category Cards Grid ── */}
          {filteredBudgets.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title={
                searchQuery || statusFilter !== "all"
                  ? "No matching categories found"
                  : `No Budgets Set for ${selectedMonthLabel}`
              }
              description={
                searchQuery || statusFilter !== "all"
                  ? "Try clearing your search query or filter chips above."
                  : "Set monthly spending limits per category — Food, Rent, Entertainment, Transport — and track real-time pacing with drilldowns."
              }
              pills={["Category Limits", "Spend Drilldown", "Pacing Meters", "Rollover Balances"]}
              buttonLabel="Create Budget Category"
              onAdd={() => setShowAddBudget(true)}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
                gap: 16,
              }}
            >
              {filteredBudgets.map((b: any) => {
                const spent = monthSpending[b.category] || 0;
                const prevSpent = prevMonthSpending[b.category] || 0;
                const rolledOver = getRolloverAmount(b);
                const budget = getEffectiveBudget(b);
                const pct = budget > 0 ? (spent / budget) * 100 : 0;
                const over = pct > 100;
                const barColor = over ? THEME.rust : pct > 80 ? THEME.gold : THEME.sage;
                const Icon = getCatIcon(b.category);

                const statusBadge = (() => {
                  if (over) {
                    return {
                      label: `Over by ${privacyMode ? "••••" : fmtINRFull(spent - budget)}`,
                      color: THEME.rust,
                      icon: AlertCircle,
                    };
                  } else if (pct >= 80) {
                    return {
                      label: `${pct.toFixed(0)}% used`,
                      color: THEME.gold,
                      icon: AlertTriangle,
                    };
                  } else {
                    return {
                      label: "On track",
                      color: THEME.sage,
                      icon: CheckCircle2,
                    };
                  }
                })();

                const StatusIcon = statusBadge.icon;

                return (
                  <Card
                    key={b.id}
                    onClick={() => setSelectedCategoryDetail(b.category)}
                    style={{
                      padding: "18px 20px",
                      borderTop: `4px solid ${barColor}`,
                      cursor: "pointer",
                      borderRadius: 14,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      position: "relative",
                    }}
                    className="hover-card"
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      {/* Category Icon */}
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: `color-mix(in srgb, ${barColor} 10%, var(--surface-0))`,
                          border: `1px solid color-mix(in srgb, ${barColor} 25%, transparent)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <Icon size={20} color={barColor} />
                      </div>

                      {/* Header & Limits */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 16,
                                color: THEME.ink,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {b.category}
                            </span>
                            {b.budgetMonth !== selectedMonth && (
                              <Badge variant="muted" style={{ fontSize: 9 }}>
                                INHERITED
                              </Badge>
                            )}
                            {activeProfile === "all" && (
                              <Badge variant="muted" style={{ fontSize: 9 }}>
                                {getOwnerName(b.owner || "self")}
                              </Badge>
                            )}
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 900,
                              color: over ? THEME.rust : THEME.ink,
                              fontSize: 16,
                            }}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>

                        {/* Money figures */}
                        <div
                          style={{
                            fontSize: 12.5,
                            color: THEME.muted,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ color: THEME.ink, fontWeight: 700 }}>
                            <Money value={spent} variant="full" />
                          </span>
                          <span style={{ opacity: 0.6 }}>of</span>
                          <span>
                            <Money value={budget} variant="full" />
                          </span>
                          <span style={{ marginLeft: 4, color: over ? THEME.rust : THEME.sage }}>
                            {over ? (
                              <>
                                (<Money value={spent - budget} variant="full" /> over)
                              </>
                            ) : (
                              <>
                                (<Money value={budget - spent} variant="full" /> left)
                              </>
                            )}
                          </span>
                        </div>

                        {rolledOver > 0 && (
                          <div
                            style={{
                              fontSize: 11,
                              color: THEME.accent,
                              fontWeight: 700,
                              marginTop: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Repeat size={11} />
                            <Money value={rolledOver} variant="full" /> rolled over from previous month
                          </div>
                        )}
                      </div>

                      {/* Edit & Delete Action buttons */}
                      <div
                        style={{ display: "flex", gap: 2, flexShrink: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditBudget(b)}
                          style={{ padding: 6, borderRadius: 6 }}
                          title="Edit limit"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removingBudget}
                          onClick={() =>
                            setConfirmAction({
                              message: `Delete "${b.category}" budget? This cannot be undone.`,
                              onConfirm: () => handleRemoveBudget(b),
                            })
                          }
                          style={{ padding: 6, color: THEME.rust, borderRadius: 6 }}
                          title="Delete category"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="progress-track" style={{ marginTop: 14, marginBottom: 10, height: 7 }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                      />
                    </div>

                    {/* Bottom Status Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 11,
                        color: THEME.muted,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color: statusBadge.color,
                          fontWeight: 700,
                        }}
                      >
                        <StatusIcon size={11} />
                        {statusBadge.label}
                      </span>

                      {prevSpent > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            color: spent > prevSpent ? THEME.rust : THEME.sage,
                            fontWeight: 700,
                          }}
                        >
                          {spent > prevSpent ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}
                          <Money value={Math.abs(spent - prevSpent)} variant="full" /> MoM
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── Unbudgeted Spending Section ── */}
          {totalUnbudgetedSpent > 0 && (
            <Card
              style={{
                marginTop: 28,
                padding: "20px 24px",
                border: `1px dashed color-mix(in srgb, ${THEME.gold} 40%, transparent)`,
                background: `color-mix(in srgb, ${THEME.gold} 4%, var(--t-paper))`,
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={18} color={THEME.gold} />
                  <span style={{ fontWeight: 800, fontSize: 14.5, color: THEME.ink }}>
                    Unbudgeted Spending Detected — <Money value={totalUnbudgetedSpent} variant="full" />
                  </span>
                </div>
                <span style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>
                  {Object.keys(unbudgetedSpending).length}{" "}
                  {Object.keys(unbudgetedSpending).length === 1 ? "category" : "categories"} untracked
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {Object.entries(unbudgetedSpending)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([cat, amt]) => {
                    const Icon = getCatIcon(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategoryDetail(cat)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 14px",
                          borderRadius: 10,
                          background: "var(--t-paper)",
                          border: "1px solid var(--t-line)",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: THEME.ink,
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                        title="Click to view transactions or set a budget"
                      >
                        <Icon size={14} color={THEME.gold} />
                        <span>{cat}</span>
                        <span style={{ color: THEME.gold }}>
                          <Money value={amt as number} variant="full" />
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditBudget({ category: cat, monthly: amt, owner: "self" });
                          }}
                          style={{
                            padding: "2px 6px",
                            fontSize: 10,
                            borderRadius: 6,
                            border: `1px solid color-mix(in srgb, ${THEME.accent} 40%, transparent)`,
                            color: THEME.accent,
                          }}
                        >
                          + Set Budget
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/*               2. FIXED & RECURRING EXPENSES VIEW         */}
      {/* ======================================================== */}
      {activeSubTab === "recurring" && (
        <>
          <SectionTitle
            sub="Track EMIs, salaries, house rent, and utility commitments with day-of-month schedules"
            rightElement={
              <Button
                onClick={() => setShowAddRecurring(true)}
                variant="accent"
                icon={<Plus size={14} />}
                style={{ fontWeight: 700 }}
              >
                Add Recurring Expense
              </Button>
            }
          >
            Fixed & Recurring Outflows
          </SectionTitle>

          {/* Stats Summary Tiles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {[
              {
                label: "Monthly Commitment",
                value: fmtINRFull(recurringStats.monthlyCommitment),
                numericValue: recurringStats.monthlyCommitment,
                formatValue: fmtINRFull,
                sub: "Sum of active recurring costs",
                color: THEME.accent,
                Icon: Repeat,
              },
              {
                label: "Annual Equivalent",
                value: fmtINRFull(recurringStats.annualCost),
                numericValue: recurringStats.annualCost,
                formatValue: fmtINRFull,
                sub: "Projected yearly outgo",
                color: THEME.gold,
                Icon: Calendar,
              },
              {
                label: "Paid This Month",
                value: `${recurringStats.paidCount} / ${activeRecurringExpenses.filter((x: any) => x.isActive).length}`,
                numericValue: undefined as number | undefined,
                formatValue: undefined as ((n: number) => string) | undefined,
                sub: `Recorded: ${privacyMode ? "••••" : fmtINRFull(recurringStats.paidTotal)}`,
                color: THEME.sage,
                Icon: CheckCircle2,
              },
              {
                label: "Overdue / Pending",
                value: String(recurringStats.overdueCount),
                numericValue: recurringStats.overdueCount,
                formatValue: (n: number) => Math.round(n).toString(),
                sub: `Pending: ${privacyMode ? "••••" : fmtINRFull(recurringStats.overdueTotal)}`,
                color: recurringStats.overdueCount > 0 ? THEME.rust : THEME.sage,
                Icon: AlertCircle,
              },
            ].map(({ label, value, numericValue, formatValue, sub, color, Icon }) => (
              <StatCard
                key={label}
                label={label}
                value={value}
                numericValue={numericValue}
                formatValue={formatValue}
                sub={sub}
                color={color}
                icon={<Icon />}
              />
            ))}
          </div>

          {/* Search and Filters for Recurring */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ position: "relative", minWidth: 220, flex: "1 1 220px", maxWidth: 360 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: THEME.muted,
                }}
              />
              <input
                type="text"
                placeholder="Search recurring commitments..."
                value={recurringSearch}
                onChange={(e) => setRecurringSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: 10,
                  border: "1px solid var(--t-line)",
                  background: "var(--surface-0)",
                  color: THEME.ink,
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {(
                [
                  { id: "all", label: `All (${activeRecurringExpenses.length})`, color: THEME.accent },
                  { id: "due", label: "Due / Pending", color: THEME.gold },
                  { id: "paid", label: "Paid", color: THEME.sage },
                  { id: "overdue", label: "Overdue", color: THEME.rust },
                  { id: "paused", label: "Paused", color: THEME.muted },
                ] as const
              ).map(({ id, label, color }) => (
                <button
                  key={id}
                  onClick={() => setRecurringStatusFilter(id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid",
                    borderColor:
                      recurringStatusFilter === id
                        ? (color || THEME.accent)
                        : "var(--t-line)",
                    background:
                      recurringStatusFilter === id
                        ? `color-mix(in srgb, ${color || THEME.accent} 12%, transparent)`
                        : "var(--surface-0)",
                    color: recurringStatusFilter === id ? (color || THEME.accent) : THEME.muted,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredRecurring.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No Recurring Expenses Found"
              description="Define regular bills, rent, household wages, gym memberships or custom EMIs and quick-post them directly as ledger transactions."
              pills={["Fixed Expenses", "Custom Ranges", "Quick Record", "Ledger Auto-Match"]}
              buttonLabel="Add Recurring Expense"
              onAdd={() => setShowAddRecurring(true)}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
                gap: 16,
              }}
            >
              {filteredRecurring.map((re: any) => {
                const match = recurringPaymentMatches[re.id];
                const hasPaid = !!match;

                const now = new Date();
                const curMonthStr = today().slice(0, 7);
                const todayDay = now.getDate();

                let statusText = "Upcoming";
                let statusColor = THEME.gold;
                let statusBg = `color-mix(in srgb, ${THEME.gold} 10%, transparent)`;

                if (hasPaid) {
                  statusText = "Paid";
                  statusColor = THEME.sage;
                  statusBg = `color-mix(in srgb, ${THEME.sage} 10%, transparent)`;
                } else if (!re.isActive) {
                  statusText = "Paused";
                  statusColor = THEME.muted;
                  statusBg = `color-mix(in srgb, ${THEME.muted} 10%, transparent)`;
                } else {
                  if (selectedMonth < curMonthStr) {
                    statusText = "Unpaid";
                    statusColor = THEME.rust;
                    statusBg = `color-mix(in srgb, ${THEME.rust} 10%, transparent)`;
                  } else if (selectedMonth === curMonthStr) {
                    if (todayDay > Number(re.dueDay)) {
                      statusText = "Overdue";
                      statusColor = THEME.rust;
                      statusBg = `color-mix(in srgb, ${THEME.rust} 10%, transparent)`;
                    } else {
                      const daysLeft = Number(re.dueDay) - todayDay;
                      statusText =
                        daysLeft === 0
                          ? "Due Today"
                          : daysLeft === 1
                            ? "Due Tomorrow"
                            : `Due in ${daysLeft} days`;
                      statusColor = THEME.gold;
                      statusBg = `color-mix(in srgb, ${THEME.gold} 10%, transparent)`;
                    }
                  } else {
                    statusText = "Scheduled";
                    statusColor = THEME.accent;
                    statusBg = `color-mix(in srgb, ${THEME.accent} 10%, transparent)`;
                  }
                }

                const bank = state.bankAccounts.find((b: any) => b.id === re.accountId);

                return (
                  <Card
                    key={re.id}
                    style={{
                      padding: "18px 20px",
                      borderTop: `3px solid ${re.isActive ? (hasPaid ? THEME.sage : statusColor) : THEME.line}`,
                      opacity: re.isActive ? 1 : 0.75,
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: statusBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {(() => {
                          const CatIcon = getCatIcon(re.category);
                          return <CatIcon size={20} color={statusColor} />;
                        })()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            title={re.name}
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              color: THEME.ink,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {re.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: statusColor,
                              background: statusBg,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-xs)",
                              textTransform: "uppercase",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {statusText}
                          </span>
                          {activeProfile === "all" && (
                            <Badge variant="muted" style={{ fontSize: 9 }}>
                              {getOwnerName(re.owner || "self")}
                            </Badge>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 12.5,
                            color: THEME.muted,
                            fontWeight: 600,
                            display: "flex",
                            flexWrap: "wrap",
                            columnGap: 6,
                            rowGap: 2,
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: THEME.ink, fontWeight: 800, fontSize: 14 }}>
                            <Money value={re.amount} variant="full" />
                          </span>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span style={{ textTransform: "capitalize" }}>
                            {re.frequency} (Day {re.dueDay})
                          </span>
                          {bank && (
                            <>
                              <span style={{ opacity: 0.4 }}>·</span>
                              <span
                                style={{
                                  fontSize: 11,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Landmark size={11} /> {bank.bankName}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Repeat Range */}
                        <div
                          style={{
                            fontSize: 11,
                            color: THEME.muted,
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Calendar size={11} />
                          <span>{fmtDate(re.startDate)}</span>
                          {re.endDate ? (
                            <>
                              <ArrowRight size={10} style={{ margin: "0 2px" }} />
                              <span>{fmtDate(re.endDate)}</span>
                            </>
                          ) : (
                            <span style={{ fontStyle: "italic", marginLeft: 4 }}>
                              (No end date)
                            </span>
                          )}
                        </div>

                        {/* Match details if paid */}
                        {hasPaid && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 11,
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: `color-mix(in srgb, ${THEME.sage} 6%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${THEME.sage} 20%, transparent)`,
                              color: THEME.sage,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Matched Ledger:</span>
                            <span>
                              <Money value={match.amount} variant="full" /> on {fmtDate(match.date)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          flexShrink: 0,
                          alignItems: "flex-end",
                        }}
                      >
                        <div style={{ display: "flex", gap: 2 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRecurringActive(re)}
                            loading={togglingRecurringId === re.id}
                            disabled={togglingRecurringId === re.id || removingRecurringId === re.id}
                            style={{ padding: 6, color: re.isActive ? THEME.gold : THEME.sage }}
                            title={re.isActive ? "Pause" : "Resume"}
                          >
                            {re.isActive ? <Pause size={14} /> : <Play size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditRecurring(re)}
                            style={{ padding: 6 }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfirmAction({
                                message: `Delete "${re.name}"? This cannot be undone.`,
                                onConfirm: () => removeRecurring(re),
                              })
                            }
                            loading={removingRecurringId === re.id}
                            disabled={togglingRecurringId === re.id || removingRecurringId === re.id}
                            style={{ padding: 6, color: THEME.rust }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        {/* Quick Pay Button */}
                        {re.isActive && !hasPaid && selectedMonth <= curMonthStr && (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleQuickPostTransaction(re)}
                            loading={postingId === re.id}
                            disabled={postingId === re.id}
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              borderRadius: 6,
                              background:
                                statusText === "Overdue" || statusText === "Unpaid"
                                  ? THEME.rust
                                  : THEME.accent,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CreditCard size={11} /> Quick Pay
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── Rental Commitments ── */}
          {(state.rentedProperties || []).filter((p: any) => p.isActive !== false).length > 0 && (
            <div style={{ marginTop: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Home size={16} color={THEME.rust} />
                <span style={{ fontSize: 14, fontWeight: 800, color: THEME.ink }}>
                  Rental Commitments · {selectedMonthLabel}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: THEME.muted,
                    background: "rgba(128,128,128,0.08)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  Auto-derived from agreements
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
                  gap: 12,
                }}
              >
                {(state.rentedProperties || [])
                  .filter((p: any) => p.isActive !== false)
                  .map((p: any) => {
                    const effectiveRent = getEffectiveRent(p, selectedMonth);
                    const paidThisMonth = (p.payments || [])
                      .filter((pay: any) => pay.date && pay.date.startsWith(selectedMonth))
                      .reduce((s: number, pay: any) => s + Number(pay.amount || 0), 0);
                    const isPaid = paidThisMonth > 0;
                    const now = new Date();
                    const curMonthStr = today().slice(0, 7);
                    const dueDay = Number(p.dueDay || 5);
                    const isOverdue =
                      !isPaid &&
                      selectedMonth <= curMonthStr &&
                      (selectedMonth < curMonthStr || now.getDate() > dueDay);
                    const statusColor = isPaid ? THEME.sage : isOverdue ? THEME.rust : THEME.gold;
                    const rentDisplay = (n: number) => (privacyMode ? "••••" : fmtINRFull(n));
                    const statusText = isPaid
                      ? `Paid · ${rentDisplay(paidThisMonth)}`
                      : isOverdue
                        ? `Overdue · ${rentDisplay(effectiveRent)} due`
                        : `Due on ${dueDay}th · ${rentDisplay(effectiveRent)}`;

                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: "16px",
                          borderRadius: 14,
                          background: `color-mix(in srgb, ${statusColor} 4%, var(--surface-0))`,
                          border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)`,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div style={{ color: statusColor, flexShrink: 0 }}>
                          <Home size={22} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14.5, color: THEME.ink }}>
                            {p.propertyName}
                          </div>
                          <div style={{ fontSize: 11.5, color: THEME.muted, fontWeight: 600 }}>
                            {p.landlordName || p.landlords?.[0]?.name || "Landlord"}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: statusColor,
                              marginTop: 4,
                            }}
                          >
                            {statusText}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: 17,
                              fontWeight: 800,
                              color: statusColor,
                            }}
                          >
                            <Money value={effectiveRent} variant="full" />
                          </div>
                          <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 700 }}>
                            / month
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/*               3. ANALYTICS & TRENDS VIEW                 */}
      {/* ======================================================== */}
      {activeSubTab === "analytics" && (
        <>
          <SectionTitle sub="Side-by-side budget vs actual comparison and category distribution trends">
            Budget Analytics & Trends
          </SectionTitle>

          {/* Charts Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
              gap: 20,
              marginBottom: 28,
            }}
          >
            {/* 1. Budget vs Actual Comparison Chart */}
            <Card style={{ padding: "20px 24px", borderRadius: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, marginBottom: 16 }}>
                Budget Target vs Actual Spend ({selectedMonthLabel})
              </div>
              {budgetsToUse.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: THEME.muted, fontSize: 13 }}>
                  No budget categories set for this month.
                </div>
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={budgetsToUse.map((b: any) => ({
                        category: b.category,
                        Budget: getEffectiveBudget(b),
                        Actual: monthSpending[b.category] || 0,
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--t-line)" opacity={0.5} />
                      <XAxis
                        dataKey="category"
                        stroke={THEME.muted}
                        fontSize={11}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        stroke={THEME.muted}
                        fontSize={11}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div
                                style={{
                                  background: "var(--t-paper)",
                                  border: "1px solid var(--t-line)",
                                  borderRadius: 10,
                                  padding: "10px 14px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}
                              >
                                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
                                  {label}
                                </div>
                                {payload.map((entry: any, index: number) => (
                                  <div
                                    key={`item-${index}`}
                                    style={{
                                      fontSize: 12,
                                      color: entry.color,
                                      fontWeight: 600,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: 16,
                                    }}
                                  >
                                    <span>{entry.name}:</span>
                                    <span>{fmtINRFull(entry.value)}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar dataKey="Budget" fill={THEME.accent} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Actual" fill={THEME.sage} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* 2. Spend Allocation Donut */}
            <Card style={{ padding: "20px 24px", borderRadius: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, marginBottom: 16 }}>
                Spending Allocation by Category
              </div>
              {Object.keys(monthSpending).length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: THEME.muted, fontSize: 13 }}>
                  No spending recorded for this month.
                </div>
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(monthSpending).map(([cat, amt]) => ({
                          name: cat,
                          value: amt as number,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {Object.keys(monthSpending).map((_, index) => {
                          const COLORS = [
                            THEME.accent,
                            THEME.sage,
                            THEME.gold,
                            THEME.rust,
                            "#8b5cf6",
                            "#ec4899",
                            "#06b6d4",
                            "#14b8a6",
                            "#f97316",
                          ];
                          return (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [fmtINRFull(Number(val)), "Spent"]}
                        contentStyle={{
                          background: "var(--t-paper)",
                          border: "1px solid var(--t-line)",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* 3. Multi-Month Trend Table */}
          <Card style={{ padding: "20px 24px", borderRadius: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: THEME.ink, marginBottom: 16 }}>
              3-Month Historical Spending vs Current Month
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--t-line)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", color: THEME.muted, fontWeight: 700 }}>
                      Category
                    </th>
                    {historicalAverages.prevMonths.map((m) => (
                      <th
                        key={m}
                        style={{
                          padding: "10px 12px",
                          color: THEME.muted,
                          fontWeight: 700,
                          textAlign: "right",
                        }}
                      >
                        {new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                      </th>
                    ))}
                    <th
                      style={{
                        padding: "10px 12px",
                        color: THEME.ink,
                        fontWeight: 800,
                        textAlign: "right",
                      }}
                    >
                      {selectedMonthLabel} (Current)
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        color: THEME.accent,
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                    >
                      3-Mo Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set([
                      ...budgetsToUse.map((b: any) => b.category),
                      ...Object.keys(monthSpending),
                      ...Object.keys(historicalAverages.averages),
                    ])
                  )
                    .sort()
                    .map((cat) => {
                      const currentVal = monthSpending[cat] || 0;
                      const avgData = historicalAverages.averages[cat];
                      const avgVal = avgData?.avg || 0;
                      const Icon = getCatIcon(cat);

                      return (
                        <tr
                          key={cat}
                          style={{
                            borderBottom: "1px solid var(--t-line)",
                            transition: "background 0.15s",
                          }}
                        >
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: THEME.ink }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Icon size={14} color={THEME.accent} />
                              {cat}
                            </div>
                          </td>
                          {historicalAverages.prevMonths.map((m) => (
                            <td
                              key={m}
                              style={{
                                padding: "10px 12px",
                                textAlign: "right",
                                color: THEME.muted,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              <Money value={avgData?.byMonth?.[m] || 0} variant="full" />
                            </td>
                          ))}
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: currentVal > (avgVal * 1.2) && avgVal > 0 ? THEME.rust : THEME.ink,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            <Money value={currentVal} variant="full" />
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: THEME.accent,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            <Money value={avgVal} variant="full" />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ======================================================== */}
      {/*         CATEGORY TRANSACTION DRILLDOWN DRAWER            */}
      {/* ======================================================== */}
      {selectedCategoryDetail && (
        <Drawer
          title={`${selectedCategoryDetail} — Details & Transactions`}
          onClose={() => {
            setSelectedCategoryDetail(null);
            setDrawerSearch("");
          }}
        >
          {(() => {
            const spent = monthSpending[selectedCategoryDetail] || 0;
            const b = activeDetailBudget;
            const budget = b ? getEffectiveBudget(b) : 0;
            const rolledOver = b ? getRolloverAmount(b) : 0;
            const remaining = budget - spent;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const histAvg = historicalAverages.averages[selectedCategoryDetail]?.avg || 0;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Metric Strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 10,
                    padding: "14px",
                    borderRadius: 12,
                    background: "var(--surface-0)",
                    border: "1px solid var(--t-line)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                      Budget Target
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: THEME.accent }}>
                      {budget > 0 ? <Money value={budget} variant="full" /> : "No Limit"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                      Total Spent
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: budget > 0 && spent > budget ? THEME.rust : THEME.ink,
                      }}
                    >
                      <Money value={spent} variant="full" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                      Remaining / Variance
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: remaining >= 0 ? THEME.sage : THEME.rust,
                      }}
                    >
                      {budget > 0 ? (
                        remaining >= 0 ? (
                          <Money value={remaining} variant="full" />
                        ) : (
                          <>
                            -<Money value={Math.abs(remaining)} variant="full" />
                          </>
                        )
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                      3-Mo Average
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: THEME.muted }}>
                      <Money value={histAvg} variant="full" />
                    </div>
                  </div>
                </div>

                {/* Rollover notice */}
                {rolledOver > 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: THEME.accent,
                      background: `color-mix(in srgb, ${THEME.accent} 8%, transparent)`,
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Repeat size={14} />
                    <span>
                      Includes <Money value={rolledOver} variant="full" /> carried forward from last month
                    </span>
                  </div>
                )}

                {/* Edit Budget Shortcut */}
                <div style={{ display: "flex", gap: 8 }}>
                  {b ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditBudget(b)}
                      icon={<Pencil size={13} />}
                      style={{ border: "1px solid var(--t-line)", borderRadius: 8, fontSize: 12 }}
                    >
                      Edit Budget Limit
                    </Button>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() =>
                        setEditBudget({
                          category: selectedCategoryDetail,
                          monthly: spent,
                          owner: "self",
                        })
                      }
                      icon={<Plus size={13} />}
                      style={{ borderRadius: 8, fontSize: 12 }}
                    >
                      Set Monthly Budget
                    </Button>
                  )}
                </div>

                {/* Transactions Section */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>
                      Transactions in {selectedMonthLabel} ({categoryTransactions.length})
                    </span>
                  </div>

                  {/* Drawer search */}
                  {categoryTransactions.length > 5 && (
                    <div style={{ position: "relative", marginBottom: 12 }}>
                      <Search
                        size={13}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: THEME.muted,
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Filter transactions in this category..."
                        value={drawerSearch}
                        onChange={(e) => setDrawerSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 10px 6px 30px",
                          borderRadius: 8,
                          border: "1px solid var(--t-line)",
                          background: "var(--surface-0)",
                          color: THEME.ink,
                          fontSize: 12,
                        }}
                      />
                    </div>
                  )}

                  {filteredCategoryTransactions.length === 0 ? (
                    <div
                      style={{
                        padding: "30px 20px",
                        textAlign: "center",
                        color: THEME.muted,
                        fontSize: 13,
                        background: "var(--surface-0)",
                        borderRadius: 12,
                        border: "1px dashed var(--t-line)",
                      }}
                    >
                      No debit transactions recorded for this category in {selectedMonthLabel}.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredCategoryTransactions.map((t: any) => {
                        const bank = state.bankAccounts?.find((a: any) => a.id === t.accountId);
                        return (
                          <div
                            key={t.id}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 10,
                              background: "var(--surface-0)",
                              border: "1px solid var(--t-line)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: THEME.ink }}>
                                {t.note || "Expense"}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: THEME.muted,
                                  display: "flex",
                                  gap: 6,
                                  alignItems: "center",
                                  marginTop: 2,
                                }}
                              >
                                <span>{fmtDate(t.date)}</span>
                                {bank && (
                                  <>
                                    <span>·</span>
                                    <span>{bank.bankName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 800,
                                fontSize: 14,
                                color: THEME.rust,
                              }}
                            >
                              -<Money value={t.amount} variant="full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Drawer>
      )}

      {/* ======================================================== */}
      {/*                        MODALS                            */}
      {/* ======================================================== */}

      {/* 1. Add Budget Category Modal */}
      {showAddBudget && (
        <BudgetModal
          existing={budgetsToUse.map((b: any) => b.category)}
          activeProfile={activeProfile}
          monthSpending={monthSpending}
          prevMonthSpending={prevMonthSpending}
          historicalAverages={historicalAverages.averages}
          selectedMonthLabel={selectedMonthLabel}
          onClose={() => setShowAddBudget(false)}
          onSave={saveNewBudget}
          saving={savingNewBudget}
        />
      )}

      {/* 2. Edit Budget Category Modal */}
      {editBudget && (
        <BudgetModal
          existing={budgetsToUse
            .filter((b: any) => b.id !== editBudget.id)
            .map((b: any) => b.category)}
          initialValues={editBudget}
          activeProfile={activeProfile}
          monthSpending={monthSpending}
          prevMonthSpending={prevMonthSpending}
          historicalAverages={historicalAverages.averages}
          selectedMonthLabel={selectedMonthLabel}
          onClose={() => setEditBudget(null)}
          onSave={saveBudgetEdit}
          saving={savingBudgetEdit}
        />
      )}

      {/* 3. Add Recurring Expense Modal */}
      {showAddRecurring && (
        <RecurringModal
          accounts={state.bankAccounts}
          activeProfile={activeProfile}
          selectedMonth={selectedMonth}
          onClose={() => setShowAddRecurring(false)}
          onSave={saveNewRecurring}
          saving={savingNewRecurring}
        />
      )}

      {/* 4. Edit Recurring Expense Modal */}
      {editRecurring && (
        <RecurringModal
          accounts={state.bankAccounts}
          initialValues={editRecurring}
          activeProfile={activeProfile}
          selectedMonth={selectedMonth}
          onClose={() => setEditRecurring(null)}
          onSave={saveRecurringEdit}
          saving={savingRecurringEdit}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// ── BUDGET MODAL COMPONENT ──
export function BudgetModal({
  onClose,
  onSave,
  initialValues = null,
  existing = [],
  activeProfile = "all",
  saving = false,
  monthSpending = {},
  prevMonthSpending = {},
  historicalAverages = {},
  selectedMonthLabel = "",
}: any) {
  const { transactionCategories: allCats, familyProfiles } = useMasterData();
  const availableCats = allCats.filter((c: string) => !existing.includes(c));
  const defaultCat = initialValues?.category || availableCats[0] || allCats[0];
  const defaultOwner = activeProfile !== "all" ? activeProfile : "self";

  const [f, setF] = useState(
    initialValues
      ? {
          owner: initialValues.owner || "self",
          category: initialValues.category,
          monthly: initialValues.monthly || "",
          rollover: !!initialValues.rollover,
        }
      : { owner: defaultOwner, category: defaultCat, monthly: "", rollover: false }
  );

  const currentSpent = Number(monthSpending[f.category] || 0);
  const prevSpent = Number(prevMonthSpending[f.category] || 0);
  const histAvg = Number(historicalAverages[f.category]?.avg || 0);
  const roundedAvg = Math.ceil(histAvg / 500) * 500;
  const bufferAmt = Math.ceil((Math.max(histAvg, prevSpent) * 1.1) / 100) * 100;

  const monthlyNum = Number(f.monthly) || 0;
  const dailyAllowance = monthlyNum > 0 ? Math.round(monthlyNum / 30) : 0;
  const remainingCapacity = monthlyNum - currentSpent;
  const inWords = numToIndianWords(f.monthly);

  const categoryMeta = useMemo(() => {
    if (NEEDS_CATEGORIES.has(f.category)) {
      return {
        tag: "50% Needs",
        color: THEME.accent,
        bg: `color-mix(in srgb, ${THEME.accent} 12%, transparent)`,
        desc: "Essential living expenses (Housing, Groceries, Utilities, Bills, Health)",
      };
    }
    if (WANTS_CATEGORIES.has(f.category)) {
      return {
        tag: "30% Wants",
        color: THEME.gold,
        bg: `color-mix(in srgb, ${THEME.gold} 12%, transparent)`,
        desc: "Discretionary lifestyle spending (Dining, Entertainment, Shopping, Travel)",
      };
    }
    if (SAVINGS_CATEGORIES.has(f.category)) {
      return {
        tag: "20% Savings",
        color: THEME.sage,
        bg: `color-mix(in srgb, ${THEME.sage} 12%, transparent)`,
        desc: "Wealth building & long-term assets (Investments, SIPs, Gold, NPS)",
      };
    }
    return {
      tag: "Flexible",
      color: THEME.muted,
      bg: "rgba(128,128,128,0.1)",
      desc: "General budget category",
    };
  }, [f.category]);

  const CatIcon = getCatIcon(f.category);

  const suggestions = useMemo(() => {
    const list: { label: string; val: number }[] = [];
    if (roundedAvg > 0) {
      list.push({ label: `3-Mo Avg: ₹${fmtINRFull(roundedAvg)}`, val: roundedAvg });
    }
    if (prevSpent > 0 && Math.round(prevSpent) !== roundedAvg) {
      list.push({ label: `Last Month: ₹${fmtINRFull(Math.round(prevSpent))}`, val: Math.round(prevSpent) });
    }
    if (bufferAmt > 0 && bufferAmt !== roundedAvg && bufferAmt !== Math.round(prevSpent)) {
      list.push({ label: `+10% Buffer: ₹${fmtINRFull(bufferAmt)}`, val: bufferAmt });
    }
    const presets = [2500, 5000, 10000, 20000, 50000];
    presets.forEach((p) => {
      if (!list.some((item) => item.val === p)) {
        list.push({ label: `₹${fmtINR(p)}`, val: p });
      }
    });
    return list.slice(0, 5);
  }, [roundedAvg, prevSpent, bufferAmt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && monthlyNum > 0 && !saving) {
      e.preventDefault();
      onSave(f);
    }
  };

  return (
    <Modal
      title={initialValues ? "Edit Budget Limit" : "Add Budget Category"}
      onClose={onClose}
      maxWidth={660}
    >
      <form onSubmit={(e) => { e.preventDefault(); if (monthlyNum > 0) onSave(f); }}>
        {/* Category Header Preview Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 18px",
            borderRadius: 14,
            background: `color-mix(in srgb, ${categoryMeta.color} 5%, var(--surface-0))`,
            border: `1px solid color-mix(in srgb, ${categoryMeta.color} 20%, transparent)`,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `color-mix(in srgb, ${categoryMeta.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${categoryMeta.color} 30%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: categoryMeta.color,
              flexShrink: 0,
            }}
          >
            <CatIcon size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: THEME.ink }}>
                {f.category}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: categoryMeta.bg,
                  color: categoryMeta.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {categoryMeta.tag}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: THEME.muted, marginTop: 2 }}>
              {categoryMeta.desc}
            </div>
          </div>
        </div>

        {/* 2-Column Row: Category & Owner */}
        <div className="form-grid-2">
          <Field label="Category">
            <select
              className="form-input"
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
            >
              {initialValues && <option key={initialValues.category}>{initialValues.category}</option>}
              {availableCats
                .filter((c: string) => !initialValues || c !== initialValues.category)
                .map((c: string) => (
                  <option key={c}>{c}</option>
                ))}
              {availableCats.length === 0 && !initialValues && (
                <option disabled>All categories budgeted</option>
              )}
            </select>
          </Field>

          <Field label="Owner / Profile">
            <select
              className="form-input"
              value={f.owner || "self"}
              onChange={(e) => setF({ ...f, owner: e.target.value })}
            >
              {familyProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProfileOption(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Spend Benchmarks Banner if available */}
        {(currentSpent > 0 || prevSpent > 0 || histAvg > 0) && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--surface-0)",
              border: "1px solid var(--t-line)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: THEME.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={12} color={THEME.accent} />
              <span>Historical Spend Benchmarks</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(128,128,128,0.05)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div style={{ fontSize: 10.5, color: THEME.muted, fontWeight: 600 }}>This Month</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: THEME.ink, marginTop: 2 }}>
                  {fmtINRFull(currentSpent)}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(128,128,128,0.05)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div style={{ fontSize: 10.5, color: THEME.muted, fontWeight: 600 }}>Last Month</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: THEME.ink, marginTop: 2 }}>
                  {fmtINRFull(prevSpent)}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(128,128,128,0.05)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div style={{ fontSize: 10.5, color: THEME.muted, fontWeight: 600 }}>3-Mo Average</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: THEME.accent, marginTop: 2 }}>
                  {fmtINRFull(histAvg)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Limit Field */}
        <Field label="Monthly Target Limit (₹)">
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                fontWeight: 700,
                color: THEME.muted,
                pointerEvents: "none",
              }}
            >
              ₹
            </span>
            <input
              className="form-input"
              type="number"
              min="0"
              inputMode="decimal"
              value={f.monthly}
              onChange={(e) => setF({ ...f, monthly: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 5000"
              style={{ paddingLeft: 32, fontSize: 16, fontWeight: 700 }}
              autoFocus
            />
          </div>
        </Field>

        {/* Indian Currency in Words */}
        {inWords && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: THEME.accent,
              marginTop: -10,
              marginBottom: 12,
              paddingLeft: 2,
            }}
          >
            {inWords}
          </div>
        )}

        {/* Quick Suggestion Chips */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, marginBottom: 6 }}>
              Quick Suggestions:
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setF({ ...f, monthly: String(s.val) })}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 700,
                    border: "1px solid var(--t-line)",
                    background:
                      Number(f.monthly) === s.val
                        ? `color-mix(in srgb, ${THEME.accent} 15%, transparent)`
                        : "var(--surface-0)",
                    color: Number(f.monthly) === s.val ? THEME.accent : THEME.ink,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pacing & Capacity Simulator */}
        {monthlyNum > 0 && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background:
                remainingCapacity < 0
                  ? `color-mix(in srgb, ${THEME.rust} 8%, transparent)`
                  : `color-mix(in srgb, ${THEME.sage} 6%, transparent)`,
              border: `1px solid ${
                remainingCapacity < 0
                  ? `color-mix(in srgb, ${THEME.rust} 25%, transparent)`
                  : `color-mix(in srgb, ${THEME.sage} 20%, transparent)`
              }`,
              marginBottom: 18,
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: THEME.ink, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} color={remainingCapacity < 0 ? THEME.rust : THEME.sage} />
                Daily Spending Allowance
              </span>
              <span style={{ fontWeight: 800, color: THEME.ink }}>
                ₹{fmtINRFull(dailyAllowance)} / day
              </span>
            </div>
            {currentSpent > 0 && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px dashed rgba(128,128,128,0.2)",
                  color: remainingCapacity < 0 ? THEME.rust : THEME.sage,
                  fontWeight: 600,
                  fontSize: 11.5,
                }}
              >
                {remainingCapacity >= 0
                  ? `₹${fmtINRFull(remainingCapacity)} capacity remaining for ${selectedMonthLabel || "this month"}.`
                  : `⚠️ Warning: Limit is ₹${fmtINRFull(Math.abs(remainingCapacity))} less than current month spending (₹${fmtINRFull(currentSpent)}).`}
              </div>
            )}
          </div>
        )}

        {/* Rollover Toggle Switch Card */}
        <div
          onClick={() => setF({ ...f, rollover: !f.rollover })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: 12,
            border: `1px solid ${f.rollover ? THEME.accent : "var(--t-line)"}`,
            background: f.rollover
              ? `color-mix(in srgb, ${THEME.accent} 6%, var(--surface-0))`
              : "var(--surface-0)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: f.rollover
                  ? `color-mix(in srgb, ${THEME.accent} 18%, transparent)`
                  : "rgba(128,128,128,0.08)",
                color: f.rollover ? THEME.accent : THEME.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Repeat size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                Rollover Unused Budget
              </div>
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                Carry over surplus into next month to expand your budget ceiling
              </div>
            </div>
          </div>
          {/* Custom Toggle Switch */}
          <div
            style={{
              width: 42,
              height: 24,
              borderRadius: 12,
              background: f.rollover ? THEME.accent : "var(--t-line)",
              position: "relative",
              transition: "background 0.2s ease",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 3,
                left: f.rollover ? 21 : 3,
                transition: "left 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          </div>
        </div>

        <ModalActions
          onSave={() => f.monthly && Number(f.monthly) > 0 && onSave(f)}
          onClose={onClose}
          disabled={!(Number(f.monthly) > 0) || saving}
          loading={saving}
          saveLabel={initialValues ? "Save Changes" : "Add Budget"}
        />
      </form>
    </Modal>
  );
}

// ── RECURRING EXPENSES MODAL COMPONENT ──
const RECURRING_PRESETS = [
  { name: "Maid / Cook Salary", category: "Food", amount: "5000", frequency: "monthly", dueDay: 1, icon: Home },
  { name: "Broadband Wi-Fi", category: "Bills", amount: "999", frequency: "monthly", dueDay: 10, icon: Wifi },
  { name: "Electricity Bill", category: "Bills", amount: "2500", frequency: "monthly", dueDay: 20, icon: Zap },
  { name: "OTT / Subscriptions", category: "Entertainment", amount: "649", frequency: "monthly", dueDay: 15, icon: Film },
  { name: "Mobile Postpaid", category: "Bills", amount: "599", frequency: "monthly", dueDay: 12, icon: CreditCard },
  { name: "Gym Membership", category: "Healthcare", amount: "2000", frequency: "monthly", dueDay: 1, icon: Stethoscope },
  { name: "Vehicle EMI", category: "EMI", amount: "15000", frequency: "monthly", dueDay: 5, icon: Car },
  { name: "Term / Life Insurance", category: "Tax", amount: "18000", frequency: "yearly", dueDay: 1, icon: Landmark },
];

export function RecurringModal({
  onClose,
  onSave,
  initialValues = null,
  accounts = [],
  activeProfile = "all",
  saving = false,
  selectedMonth = today().slice(0, 7),
}: any) {
  const { transactionCategories: cats, familyProfiles } = useMasterData();
  const defaultOwner = activeProfile !== "all" ? activeProfile : "self";

  const [f, setF] = useState(
    initialValues
      ? {
          name: initialValues.name,
          category: initialValues.category,
          amount: initialValues.amount,
          frequency: initialValues.frequency || "monthly",
          dueDay: initialValues.dueDay || 5,
          startDate: initialValues.startDate || today(),
          endDate: initialValues.endDate || "",
          accountId: initialValues.accountId || accounts[0]?.id || "",
          owner: initialValues.owner || "self",
          isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
        }
      : {
          name: "",
          category: cats[0] || "General",
          amount: "",
          frequency: "monthly",
          dueDay: 5,
          startDate: today(),
          endDate: "",
          accountId: accounts[0]?.id || "",
          owner: defaultOwner,
          isActive: true,
        }
  );

  const amt = Number(f.amount) || 0;
  const computedMonthlyImpact = (() => {
    if (f.frequency === "weekly") return amt * 4.33;
    if (f.frequency === "quarterly") return amt / 3;
    if (f.frequency === "yearly") return amt / 12;
    return amt;
  })();
  const computedAnnualImpact = computedMonthlyImpact * 12;

  const nextSchedule = useMemo(() => {
    return getNextOccurrence(f.frequency, Number(f.dueDay), f.startDate);
  }, [f.frequency, f.dueDay, f.startDate]);

  const inWords = numToIndianWords(f.amount);
  const CatIcon = getCatIcon(f.category);

  const applyPreset = (preset: typeof RECURRING_PRESETS[0]) => {
    setF((prev: any) => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      amount: preset.amount,
      frequency: preset.frequency,
      dueDay: preset.dueDay,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && f.name.trim() && amt > 0 && !saving) {
      e.preventDefault();
      onSave(f);
    }
  };

  const selectedBank = accounts.find((a: any) => a.id === f.accountId);

  return (
    <Modal
      title={initialValues ? "Edit Recurring Expense" : "Add Recurring Expense"}
      onClose={onClose}
      maxWidth={760}
    >
      <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim() && amt > 0) onSave(f); }}>
        {/* Preset Templates Gallery (Especially helpful on new creation) */}
        {!initialValues && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: THEME.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={12} color={THEME.accent} />
              <span>Quick Preset Templates</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 6,
              }}
              className="no-scrollbar"
            >
              {RECURRING_PRESETS.map((p, idx) => {
                const PIcon = p.icon;
                const isSelected = f.name === p.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? THEME.accent : "var(--t-line)"}`,
                      background: isSelected
                        ? `color-mix(in srgb, ${THEME.accent} 12%, var(--surface-0))`
                        : "var(--surface-0)",
                      color: isSelected ? THEME.accent : THEME.ink,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <PIcon size={13} color={isSelected ? THEME.accent : THEME.muted} />
                    <span>{p.name}</span>
                    <span style={{ color: THEME.muted, fontWeight: 500 }}>
                      ₹{fmtINR(p.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 1: Name & Category */}
        <div className="form-grid-2">
          <Field label="Expense Name">
            <input
              className="form-input"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Maid Salary, Broadband Bill"
              autoFocus
            />
          </Field>

          <Field label="Category">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `color-mix(in srgb, ${THEME.accent} 12%, transparent)`,
                  color: THEME.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CatIcon size={18} />
              </div>
              <select
                className="form-input"
                style={{ flex: 1 }}
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              >
                {cats.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        {/* Row 2: Amount with Quick Increments */}
        <div style={{ marginBottom: 16 }}>
          <Field label="Amount (₹)">
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: THEME.muted,
                  pointerEvents: "none",
                }}
              >
                ₹
              </span>
              <input
                className="form-input"
                type="number"
                min="0"
                inputMode="decimal"
                value={f.amount}
                onChange={(e) => setF({ ...f, amount: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 5000"
                style={{ paddingLeft: 32, fontSize: 16, fontWeight: 700 }}
              />
            </div>
          </Field>

          {/* Currency Words */}
          {inWords && (
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: THEME.accent,
                marginTop: -10,
                marginBottom: 10,
                paddingLeft: 2,
              }}
            >
              {inWords}
            </div>
          )}

          {/* Quick Increment Buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: THEME.muted }}>Quick Add:</span>
            {[500, 1000, 5000, 10000].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => setF({ ...f, amount: String((Number(f.amount) || 0) + inc) })}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  border: "1px solid var(--t-line)",
                  background: "var(--surface-0)",
                  color: THEME.ink,
                  cursor: "pointer",
                }}
              >
                +₹{fmtINR(inc)}
              </button>
            ))}
            {amt > 0 && (
              <button
                type="button"
                onClick={() => setF({ ...f, amount: "" })}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid transparent",
                  background: "transparent",
                  color: THEME.muted,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Frequency & Due Day / Schedule */}
        <div className="form-grid-2">
          <Field label="Recurrence Frequency">
            <select
              className="form-input"
              value={f.frequency}
              onChange={(e) => setF({ ...f, frequency: e.target.value })}
            >
              <option value="monthly">Monthly (Most common)</option>
              <option value="weekly">Weekly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>

          {f.frequency === "weekly" ? (
            <Field label="Recurring Day of Week">
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                  { label: "Mon", day: 1 },
                  { label: "Tue", day: 2 },
                  { label: "Wed", day: 3 },
                  { label: "Thu", day: 4 },
                  { label: "Fri", day: 5 },
                  { label: "Sat", day: 6 },
                  { label: "Sun", day: 7 },
                ].map((item) => (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => setF({ ...f, dueDay: item.day })}
                    style={{
                      flex: "1 1 36px",
                      padding: "8px 4px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: `1px solid ${Number(f.dueDay) === item.day ? THEME.accent : "var(--t-line)"}`,
                      background:
                        Number(f.dueDay) === item.day
                          ? `color-mix(in srgb, ${THEME.accent} 15%, transparent)`
                          : "var(--surface-0)",
                      color: Number(f.dueDay) === item.day ? THEME.accent : THEME.ink,
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
          ) : (
            <Field label={`Due Day of ${f.frequency === "yearly" ? "Billing Month" : "Month"} (1-31)`}>
              <div>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={31}
                  value={f.dueDay}
                  onChange={(e) =>
                    setF({ ...f, dueDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })
                  }
                  style={{ marginBottom: 6 }}
                />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[1, 5, 10, 15, 20, 25, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setF({ ...f, dueDay: d })}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 10.5,
                        fontWeight: 700,
                        border: `1px solid ${Number(f.dueDay) === d ? THEME.accent : "var(--t-line)"}`,
                        background:
                          Number(f.dueDay) === d
                            ? `color-mix(in srgb, ${THEME.accent} 15%, transparent)`
                            : "var(--surface-0)",
                        color: Number(f.dueDay) === d ? THEME.accent : THEME.muted,
                        cursor: "pointer",
                      }}
                    >
                      {d === 30 ? "End (30th)" : `${d}th`}
                    </button>
                  ))}
                </div>
              </div>
            </Field>
          )}
        </div>

        {/* Row 4: Account & Owner */}
        <div className="form-grid-2">
          <Field label="Paid From (Bank Account)">
            <select
              className="form-input"
              value={f.accountId}
              onChange={(e) => setF({ ...f, accountId: e.target.value })}
            >
              <option value="">No linked account</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} (•••• {a.accountNumber?.slice(-4)})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Owner / Profile">
            <select
              className="form-input"
              value={f.owner}
              onChange={(e) => setF({ ...f, owner: e.target.value })}
            >
              {familyProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProfileOption(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Row 5: Start Date & Optional End Date */}
        <div className="form-grid-2">
          <Field label="Start Date">
            <input
              className="form-input"
              type="date"
              value={f.startDate}
              onChange={(e) => setF({ ...f, startDate: e.target.value })}
            />
          </Field>
          <Field label="End Date (Optional)">
            <input
              className="form-input"
              type="date"
              value={f.endDate}
              onChange={(e) => setF({ ...f, endDate: e.target.value })}
              placeholder="Repeat indefinitely if blank"
            />
          </Field>
        </div>

        {/* Row 6: Active Status Switch Card */}
        <div
          onClick={() => setF({ ...f, isActive: !f.isActive })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: 12,
            border: `1px solid ${f.isActive ? THEME.sage : "var(--t-line)"}`,
            background: f.isActive
              ? `color-mix(in srgb, ${THEME.sage} 6%, var(--surface-0))`
              : "var(--surface-0)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: f.isActive
                  ? `color-mix(in srgb, ${THEME.sage} 18%, transparent)`
                  : "rgba(128,128,128,0.08)",
                color: f.isActive ? THEME.sage : THEME.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {f.isActive ? <CheckCircle2 size={18} /> : <Pause size={18} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink }}>
                {f.isActive ? "Active Commitment" : "Paused / On Hold"}
              </div>
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                {f.isActive
                  ? "Track on calendar, calculate monthly cash burn, and auto-match debits"
                  : "Hold payment schedule without deleting record"}
              </div>
            </div>
          </div>
          <div
            style={{
              width: 42,
              height: 24,
              borderRadius: 12,
              background: f.isActive ? THEME.sage : "var(--t-line)",
              position: "relative",
              transition: "background 0.2s ease",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 3,
                left: f.isActive ? 21 : 3,
                transition: "left 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          </div>
        </div>

        {/* Live Cadence & Schedule Projection Card */}
        {amt > 0 && (
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 14,
              background: `color-mix(in srgb, ${THEME.accent} 6%, var(--surface-0))`,
              border: `1px solid color-mix(in srgb, ${THEME.accent} 22%, transparent)`,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: THEME.accent,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Calendar size={13} />
                Financial Impact & Next Due Date
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: f.isActive
                    ? `color-mix(in srgb, ${THEME.sage} 15%, transparent)`
                    : "rgba(128,128,128,0.12)",
                  color: f.isActive ? THEME.sage : THEME.muted,
                }}
              >
                {f.isActive ? "Active Schedule" : "Paused"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--surface-0)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                  Monthly Commitment
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: THEME.ink, marginTop: 2 }}>
                  {fmtINRFull(computedMonthlyImpact)}
                </div>
                <div style={{ fontSize: 10, color: THEME.muted, marginTop: 2 }}>
                  {f.frequency} recurring cadence
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--surface-0)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                  Annual Outflow
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: THEME.gold, marginTop: 2 }}>
                  {fmtINRFull(computedAnnualImpact)}
                </div>
                <div style={{ fontSize: 10, color: THEME.muted, marginTop: 2 }}>
                  12-month commitment
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--surface-0)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>
                  Next Occurrence
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: THEME.accent, marginTop: 2 }}>
                  {nextSchedule.date}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.accent, marginTop: 2 }}>
                  {nextSchedule.daysText}
                </div>
              </div>
            </div>

            {selectedBank && (
              <div
                style={{
                  fontSize: 11,
                  color: THEME.muted,
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Landmark size={12} />
                <span>
                  Will auto-match bank debits in <strong>{selectedBank.bankName}</strong> (•••• {selectedBank.accountNumber?.slice(-4)}).
                </span>
              </div>
            )}
          </div>
        )}

        <ModalActions
          onSave={() => f.name.trim() && Number(f.amount) > 0 && onSave(f)}
          onClose={onClose}
          disabled={!f.name.trim() || !(Number(f.amount) > 0) || saving}
          loading={saving}
          saveLabel={initialValues ? "Save Changes" : "Add Recurring Expense"}
        />
      </form>
    </Modal>
  );
}
