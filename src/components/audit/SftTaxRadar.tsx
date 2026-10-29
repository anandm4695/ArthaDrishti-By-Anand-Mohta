import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  Download,
  Info,
  Search,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import {
  exportArrayToCSV,
  informalPersonOutstanding,
  getGoldPricePerGram,
  GOLD_PURITY_FACTOR,
} from "../../utils/finance";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Money } from "../ui/Money";

interface SftTaxRadarProps {
  state: any;
  metrics: any;
  showToast?: (msg: string, type?: string) => void;
}

export interface SftItem {
  id: string;
  code: string;
  title: string;
  section: string;
  ruleThreshold: number;
  detectedAmount: number;
  thresholdDisplay: string;
  status: "CLEAN" | "SFT_TRIGGERED" | "ATTENTION";
  description: string;
  reportingEntity: string;
  documentationRequired: string[];
}

export const SftTaxRadar: React.FC<SftTaxRadarProps> = ({ state, showToast }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SFT_TRIGGERED" | "ATTENTION" | "CLEAN">("ALL");

  const sftChecks = useMemo((): SftItem[] => {
    // 1. SFT-001: Cash Deposits / Withdrawals in Bank Accounts (Threshold: >= ₹10 Lakhs in a FY)
    const totalBankCashTxns = (state.transactions || [])
      .filter((t: any) => {
        const desc = (t.description || t.note || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const mode = (t.mode || "").toLowerCase();
        return (
          desc.includes("cash deposit") ||
          desc.includes("cash withdraw") ||
          cat.includes("cash") ||
          mode === "cash" ||
          desc.includes("atm withdrawal")
        );
      })
      .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0);

    // 2. SFT-002: Credit Card Bill Payments (Threshold: >= ₹1 Lakh Cash or >= ₹10 Lakhs any mode)
    const totalCCPayments = (state.transactions || [])
      .filter((t: any) => {
        const desc = (t.description || t.note || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        return desc.includes("credit card") || desc.includes("cc payment") || cat.includes("credit card");
      })
      .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0);

    // 3. SFT-003: Mutual Funds & Equities Purchase (Threshold: >= ₹10 Lakhs in a FY)
    const totalMFInvestments = (state.mutualFunds || []).reduce(
      (sum: number, m: any) => sum + Number(m.invested || 0),
      0
    );
    const totalStockInvestments = (state.stocks || []).reduce(
      (sum: number, s: any) => sum + Number(s.avgPrice || 0) * Number(s.qty || 0),
      0
    );
    const totalSecuritiesInvestment = totalMFInvestments + totalStockInvestments;

    // 4. SFT-004: Purchase or Sale of Immovable Property (Threshold: >= ₹30 Lakhs)
    const totalPropertyValue = (state.realEstateProperties || []).reduce(
      (sum: number, r: any) =>
        sum +
        Math.max(
          Number(r.marketValue || 0),
          Number(r.agreementValue || 0),
          Number(r.propertyValue || 0),
          Number(r.purchasePrice || 0)
        ),
      0
    );

    // 5. SFT-005: Fixed Deposits / Time Deposits Creation (Threshold: >= ₹10 Lakhs in a FY)
    const totalFDInvestments = (state.fixedDeposits || []).reduce(
      (sum: number, f: any) => sum + Number(f.principal || 0),
      0
    );

    // 6. SFT-006: High Value Informal Borrowing / Lending & Cash Transactions u/s 269ST / 269SS (Threshold: >= ₹2 Lakhs)
    const computeLargeInformal = (list: any[]) =>
      (list || []).reduce((sum: number, item: any) => {
        const largeTranches = (item.tranches || [])
          .filter((tr: any) => Number(tr.amount || 0) >= 200000)
          .reduce((s: number, tr: any) => s + Number(tr.amount || 0), 0);
        if (largeTranches > 0) return sum + largeTranches;
        const out = Math.max(informalPersonOutstanding(item), Number(item.amount || 0));
        return out >= 200000 ? sum + out : sum;
      }, 0);

    const totalInformalLarge =
      computeLargeInformal(state.informalBorrowed || []) +
      computeLargeInformal(state.informalLent || []);

    // 7. SFT-007: Bonds & Debentures Subscription (Threshold: >= ₹10 Lakhs u/s 285BA Rule 114E Item 3)
    const totalBondsInvestment = (state.bonds || []).reduce(
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

    // 8. SFT-008: High-Value Bullion / Gold Holdings (Rule 114B PAN Mandatory >= ₹2 Lakhs per bill)
    const goldPrice = getGoldPricePerGram(state);
    const totalGoldValue = (state.goldHoldings || []).reduce((sum: number, g: any) => {
      const grams = Number(g.grams || g.weightGrams || 0);
      const purityMul = g.type === "physical" ? GOLD_PURITY_FACTOR[g.purity] || 1 : 1;
      const val = Number(g.currentValue || 0) > 0 ? Number(g.currentValue) : grams * goldPrice * purityMul;
      return sum + val;
    }, 0);

    return [
      {
        id: "sft-001",
        code: "SFT-001",
        title: "Cash Deposits / Withdrawals in Savings Bank",
        section: "Section 285BA · Rule 114E(2) Item 1",
        ruleThreshold: 1000000,
        detectedAmount: totalBankCashTxns,
        thresholdDisplay: "₹10,00,000 / Financial Year",
        status: totalBankCashTxns >= 1000000 ? "SFT_TRIGGERED" : totalBankCashTxns >= 500000 ? "ATTENTION" : "CLEAN",
        description: "Aggregate cash deposits or withdrawals in one or more accounts (other than current accounts) of a person.",
        reportingEntity: "Banking Company / Co-operative Bank",
        documentationRequired: ["Cash deposit slips", "Source of cash ledger", "Bank statement reconciliations"],
      },
      {
        id: "sft-002",
        code: "SFT-002",
        title: "Credit Card Bill Payments",
        section: "Section 285BA · Rule 114E(2) Item 2",
        ruleThreshold: 1000000,
        detectedAmount: totalCCPayments,
        thresholdDisplay: "₹1,00,000 (Cash) / ₹10,00,000 (Any Mode)",
        status: totalCCPayments >= 1000000 ? "SFT_TRIGGERED" : totalCCPayments >= 500000 ? "ATTENTION" : "CLEAN",
        description: "Payment made by any person aggregating to ₹1L+ in cash or ₹10L+ by any other mode against credit card bills.",
        reportingEntity: "Credit Card Issuing Banks (HDFC, SBI, ICICI, Axis, etc.)",
        documentationRequired: ["Credit card statements", "Bank debit entries", "Expense business vs personal vouchers"],
      },
      {
        id: "sft-003",
        code: "SFT-003",
        title: "Purchase of Mutual Fund Units / Shares",
        section: "Section 285BA · Rule 114E(2) Item 3 & 4",
        ruleThreshold: 1000000,
        detectedAmount: totalSecuritiesInvestment,
        thresholdDisplay: "₹10,00,000 / Financial Year",
        status: totalSecuritiesInvestment >= 1000000 ? "SFT_TRIGGERED" : totalSecuritiesInvestment >= 600000 ? "ATTENTION" : "CLEAN",
        description: "Receipt from any person for acquiring units of one or more schemes of a Mutual Fund or shares/bonds of a company.",
        reportingEntity: "Asset Management Companies (AMCs) & Stock Brokers",
        documentationRequired: ["CAS Statement", "Contract notes", "Bank fund outflow trail", "AIS entry match"],
      },
      {
        id: "sft-004",
        code: "SFT-004",
        title: "Immovable Property Acquisition / Sale",
        section: "Section 285BA · Rule 114E(2) Item 7 & Sec 194-IA",
        ruleThreshold: 3000000,
        detectedAmount: totalPropertyValue,
        thresholdDisplay: "₹30,00,000 (Stamp Duty / Registered Value)",
        status: totalPropertyValue >= 3000000 ? "SFT_TRIGGERED" : "CLEAN",
        description: "Purchase or sale by any person of immovable property of an amount or value exceeding ₹30 Lakhs. Triggers 1% TDS u/s 194-IA if >= ₹50L.",
        reportingEntity: "Inspector-General of Registration / Sub-Registrar",
        documentationRequired: ["Registered Sale Deed", "Form 26QB (1% TDS)", "Bank loan disbursement letter", "Capital gains computation"],
      },
      {
        id: "sft-005",
        code: "SFT-005",
        title: "Time Deposits / Fixed Deposits Placement",
        section: "Section 285BA · Rule 114E(2) Item 5",
        ruleThreshold: 1000000,
        detectedAmount: totalFDInvestments,
        thresholdDisplay: "₹10,00,000 / Financial Year",
        status: totalFDInvestments >= 1000000 ? "SFT_TRIGGERED" : totalFDInvestments >= 500000 ? "ATTENTION" : "CLEAN",
        description: "Receipt from any person for acquiring time deposits (other than renewals) aggregating to ₹10 Lakhs or more.",
        reportingEntity: "Banking Company / Post Office",
        documentationRequired: ["FD advice certificates", "Form 26AS TDS credits u/s 194A", "Bank debit confirmations"],
      },
      {
        id: "sft-006",
        code: "SFT-006",
        title: "Cash Receipts & Loans Limit (Sec 269SS / 269ST)",
        section: "Section 269SS & 269ST · Income-tax Act",
        ruleThreshold: 200000,
        detectedAmount: totalInformalLarge,
        thresholdDisplay: "₹2,00,000 per Event / ₹20,000 Cash Loan",
        status: totalInformalLarge > 0 ? "ATTENTION" : "CLEAN",
        description: "Prohibits receipt of ₹2 Lakhs or more in cash (Sec 269ST) and cash loans/deposits >= ₹20,000 (Sec 269SS/269T).",
        reportingEntity: "Income Tax Department Scrutiny Flag / Tax Audit Form 3CD",
        documentationRequired: ["Account payee cheque/NEFT/RTGS UTR trail", "Confirmation of accounts", "Promissory note / Agreement"],
      },
      {
        id: "sft-007",
        code: "SFT-007",
        title: "Bonds, Debentures & RBI Floating Rate Bonds",
        section: "Section 285BA · Rule 114E(2) Item 3",
        ruleThreshold: 1000000,
        detectedAmount: totalBondsInvestment,
        thresholdDisplay: "₹10,00,000 / Financial Year",
        status: totalBondsInvestment >= 1000000 ? "SFT_TRIGGERED" : totalBondsInvestment >= 500000 ? "ATTENTION" : "CLEAN",
        description: "Receipt from any person for acquiring bonds or debentures issued by a company or institution (including RBI bonds).",
        reportingEntity: "Bond Issuing Company / RBI / Depository",
        documentationRequired: ["Bond allotment advice", "Demat holding statement", "Form 16A for interest TDS u/s 193"],
      },
      {
        id: "sft-008",
        code: "SFT-008",
        title: "Bullion, Jewellery & Sovereign Gold Holdings",
        section: "Rule 114B & Section 285BA Item 11",
        ruleThreshold: 1000000,
        detectedAmount: totalGoldValue,
        thresholdDisplay: "₹2,00,000 (PAN Rule 114B) / ₹10,00,000 (SFT)",
        status: totalGoldValue >= 1000000 ? "SFT_TRIGGERED" : totalGoldValue >= 200000 ? "ATTENTION" : "CLEAN",
        description: "Sale or purchase of goods/services (including bullion & jewellery) exceeding ₹2 Lakhs per transaction requires mandatory PAN quoting.",
        reportingEntity: "Bullion Dealer / Authorised Bank / RBI (SGB)",
        documentationRequired: ["GST tax invoices with PAN", "SGB holding certificate", "Purity hallmarking receipts"],
      },
    ];
  }, [state]);

  const filteredChecks = useMemo(() => {
    return sftChecks.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [sftChecks, searchTerm, statusFilter]);

  const triggeredCount = sftChecks.filter((c) => c.status === "SFT_TRIGGERED").length;
  const attentionCount = sftChecks.filter((c) => c.status === "ATTENTION").length;

  const handleExportCSV = () => {
    const rows = sftChecks.map((c) => ({
      "SFT Code": c.code,
      Title: c.title,
      Section: c.section,
      "Threshold Limit": c.thresholdDisplay,
      "Detected Portfolio Value (INR)": c.detectedAmount,
      "Audit Compliance Status": c.status,
      "Reporting Authority": c.reportingEntity,
      "Required Documentation": c.documentationRequired.join(" | "),
    }));
    exportArrayToCSV(rows, `SFT-Compliance-Audit-Report-${new Date().toISOString().split("T")[0]}`);
    showToast?.("SFT Compliance Audit exported to CSV", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Banner Card ── */}
      <Card
        style={{
          padding: 20,
          background: `linear-gradient(135deg, color-mix(in srgb, ${THEME.gold} 8%, transparent), color-mix(in srgb, ${THEME.accent} 5%, transparent))`,
          border: `1px solid color-mix(in srgb, ${THEME.gold} 25%, transparent)`,
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
                width: 38,
                height: 38,
                borderRadius: 10,
                background: THEME.gold,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.ink, margin: 0 }}>
                Statement of Financial Transactions (SFT) & Scrutiny Radar
              </h2>
              <p style={{ fontSize: 12, color: THEME.muted, margin: "2px 0 0" }}>
                Section 285BA · Rule 114E Automated Compliance Scanner & Annual Information Statement (AIS) Readiness
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
              Export SFT Audit Report
            </Button>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "var(--t-paper)",
            border: `1px solid ${THEME.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Info size={18} color={THEME.accent} />
            <span style={{ fontSize: 12.5, color: THEME.ink }}>
              Under Indian Income Tax law, banks, AMCs, registrars, and card issuers automatically report these high-value transactions to the Income Tax Department for populating your AIS and Form 26AS.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {attentionCount > 0 && (
              <Badge variant="danger">{attentionCount} ATTENTION</Badge>
            )}
            <Badge variant={triggeredCount > 0 ? "warning" : "success"}>
              {triggeredCount > 0 ? `${triggeredCount} SFT REPORTABLE ITEMS` : "ALL TRANSACTIONS NORMAL"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* ── SFT Items Table ── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: 14,
            borderBottom: `1px solid ${THEME.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 360 }}>
            <Search
              size={15}
              color={THEME.muted}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search SFT code, rule, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: `1px solid ${THEME.line}`,
                background: "var(--t-paper)",
                fontSize: 13,
                color: THEME.ink,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["ALL", "SFT_TRIGGERED", "ATTENTION", "CLEAN"] as const).map((st) => {
              const active = statusFilter === st;
              const label =
                st === "ALL"
                  ? `All (${sftChecks.length})`
                  : st === "SFT_TRIGGERED"
                    ? `Reportable (${triggeredCount})`
                    : st === "ATTENTION"
                      ? `Attention (${attentionCount})`
                      : "Clean";
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: active ? `1.5px solid ${THEME.accent}` : `1px solid ${THEME.line}`,
                    background: active ? `color-mix(in srgb, ${THEME.accent} 12%, transparent)` : "var(--t-paper)",
                    color: active ? THEME.accent : THEME.ink,
                    fontSize: 12,
                    fontWeight: active ? 700 : 600,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "color-mix(in srgb, var(--t-gold) 5%, transparent)", borderBottom: `1.5px solid ${THEME.line}` }}>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>SFT Code & Title</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Statutory Rule & Section</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Statutory Threshold</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Detected Value</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase", textAlign: "center" }}>AIS / SFT Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: THEME.muted, fontSize: 11, textTransform: "uppercase" }}>Audit Dossier Required</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecks.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: `1px solid ${THEME.line}`,
                    background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--t-paper) 40%, transparent)",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: THEME.accent }}>
                        {c.code}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: THEME.ink, fontSize: 13, marginTop: 2 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2, maxWidth: 320 }}>
                      {c.description}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: THEME.ink }}>
                    <div style={{ fontWeight: 600 }}>{c.section}</div>
                    <div style={{ fontSize: 11, color: THEME.muted, marginTop: 2 }}>
                      Reported By: {c.reportingEntity}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12.5, fontWeight: 600, color: THEME.muted }}>
                    {c.thresholdDisplay}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, fontSize: 14 }}>
                    <Money value={c.detectedAmount} variant="full" />
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <Badge
                      variant={
                        c.status === "SFT_TRIGGERED"
                          ? "warning"
                          : c.status === "ATTENTION"
                            ? "danger"
                            : "success"
                      }
                    >
                      {c.status === "SFT_TRIGGERED"
                        ? "SFT REPORTABLE"
                        : c.status === "ATTENTION"
                          ? "ATTENTION"
                          : "CLEAN"}
                    </Badge>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: THEME.muted }}>
                      {c.documentationRequired.map((doc, dIdx) => (
                        <li key={dIdx} style={{ marginBottom: 2 }}>{doc}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
