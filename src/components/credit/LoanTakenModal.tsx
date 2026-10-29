/* eslint-disable */
import React, { useState } from "react";
import {
  Calculator,
  Building,
  Calendar,
  IndianRupee,
  Percent,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { fmtINR, fmtINRFull, today } from "../../utils/finance";
import { useMasterData, formatProfileOption } from "../../utils/masterData";
import { Modal, ModalActions } from "../ui/Modal";
import { Field } from "../ui/Form";
import { Money } from "../ui/Money";
import { BankLogo } from "../ui/BrandLogos";

interface LoanTakenModalProps {
  initial?: any;
  bankAccounts?: any[];
  onClose: () => void;
  onSave: (data: any, bankTxn?: any) => Promise<void> | void;
  saving?: boolean;
}

export function LoanTakenModal({
  initial = null,
  bankAccounts = [],
  onClose,
  onSave,
  saving,
}: LoanTakenModalProps) {
  const { loanTypes, familyProfiles } = useMasterData();

  const [f, setF] = useState(
    initial
      ? {
          ...initial,
          startDate: initial.startDate || initial.emiStartDate || "",
          emiStartDate: initial.emiStartDate || initial.startDate || "",
        }
      : {
          lender: "",
          type: loanTypes[0] || "Personal",
          accountNumber: "",
          principal: "",
          outstanding: "",
          emi: "",
          rate: "",
          monthsRemaining: "",
          dueDay: "",
          startDate: "",
          emiStartDate: "",
          interestType: "Floating",
          status: "active",
          note: "",
          owner: "self",
        }
  );

  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [mode, setMode] = useState<string>("Bank Transfer");
  const [narration, setNarration] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [tenureUnit, setTenureUnit] = useState<"months" | "years">("months");
  const [tenureYears, setTenureYears] = useState<string>(
    f.monthsRemaining ? String(Math.round(Number(f.monthsRemaining) / 12)) : ""
  );

  // Live auto-calculator functions
  const autoCalculateEMI = () => {
    const p = Number(f.outstanding || f.principal) || 0;
    const r = Number(f.rate) || 0;
    const n = Number(f.monthsRemaining) || (Number(tenureYears) * 12) || 0;

    if (p <= 0 || n <= 0) return;
    const monthlyRate = r / 100 / 12;
    if (monthlyRate > 0) {
      const calculatedEmi = Math.round(
        (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
      );
      setF((prev: any) => ({ ...prev, emi: String(calculatedEmi) }));
    } else {
      setF((prev: any) => ({ ...prev, emi: String(Math.round(p / n)) }));
    }
  };

  const autoCalculateTenure = () => {
    const p = Number(f.outstanding || f.principal) || 0;
    const r = Number(f.rate) || 0;
    const emi = Number(f.emi) || 0;

    if (p <= 0 || emi <= 0) return;
    const monthlyRate = r / 100 / 12;
    if (monthlyRate > 0 && emi > monthlyRate * p) {
      const n = Math.ceil(-Math.log(1 - (monthlyRate * p) / emi) / Math.log(1 + monthlyRate));
      setF((prev: any) => ({ ...prev, monthsRemaining: String(n) }));
      setTenureYears(String((n / 12).toFixed(1)));
    } else if (monthlyRate === 0) {
      const n = Math.ceil(p / emi);
      setF((prev: any) => ({ ...prev, monthsRemaining: String(n) }));
      setTenureYears(String((n / 12).toFixed(1)));
    }
  };

  const handleTenureYearsChange = (val: string) => {
    setTenureYears(val);
    const months = val ? String(Math.round(Number(val) * 12)) : "";
    setF((prev: any) => ({ ...prev, monthsRemaining: months }));
  };

  const handleMonthsChange = (val: string) => {
    setF((prev: any) => ({ ...prev, monthsRemaining: val }));
    setTenureYears(val ? String((Number(val) / 12).toFixed(1)) : "");
  };

  const handleSave = () => {
    if (
      !f.lender?.trim() ||
      !(Number(f.principal) > 0) ||
      !(Number(f.emi) > 0) ||
      f.rate === "" ||
      f.rate == null
    ) {
      return;
    }

    const principalAmt = Number(f.principal) || 0;
    const outstanding = f.outstanding !== "" ? f.outstanding : f.principal;
    const loanData = {
      ...f,
      startDate: f.startDate || f.emiStartDate || "",
      emiStartDate: f.emiStartDate || f.startDate || "",
      principal: principalAmt,
      outstanding: Math.max(0, Number(outstanding) || 0),
      emi: Number(f.emi) || 0,
      rate: Number(f.rate) || 0,
      monthsRemaining: Number(f.monthsRemaining) || 0,
    };

    let bankTxn: any = null;
    if (!initial && selectedBankId) {
      const selectedBank = bankAccounts.find((b: any) => b.id === selectedBankId);
      bankTxn = {
        id: `txn-${Date.now()}`,
        date: today(),
        amount: principalAmt,
        type: "credit",
        category: "Loan Received",
        note: f.note?.trim() || `Loan disbursement received from ${f.lender}`,
        description: f.note?.trim() || `Loan disbursement received from ${f.lender} via ${mode}`,
        narration: narration.trim() || `Disbursement from ${f.lender}${f.accountNumber ? ` A/C: ${f.accountNumber}` : ""} - Ref: ${referenceNumber.trim() || mode}`,
        referenceNumber: referenceNumber.trim() || undefined,
        accountId: selectedBankId,
        bankAccountId: selectedBankId,
        bankName: selectedBank?.bankName || "Bank",
        mode,
        owner: f.owner || "self",
        linkedType: "loansTaken",
      };
    }

    onSave(loanData, bankTxn);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--t-line)",
    background: "var(--surface-0)",
    color: "var(--t-ink)",
    fontSize: 13,
    outline: "none",
  };

  const sectionCardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "16px 18px",
    background: "color-mix(in srgb, var(--surface-1) 40%, transparent)",
    borderRadius: "var(--radius-lg, 12px)",
    border: "1px solid var(--t-line)",
  };

  // Real-time financial calculations
  const principalVal = Number(f.principal) || 0;
  const outstandingVal = f.outstanding !== "" ? Number(f.outstanding) : principalVal;
  const balanceToRepay = outstandingVal > 0 ? outstandingVal : principalVal;
  const emiVal = Number(f.emi) || 0;
  const monthsVal = Number(f.monthsRemaining) || (Number(tenureYears) * 12) || 0;
  const rateVal = Number(f.rate) || 0;

  let totalPayable = 0;
  let totalInterest = 0;
  let payoffDateStr = "";

  const startDateObj = f.startDate || f.emiStartDate ? new Date((f.startDate || f.emiStartDate) + "T00:00:00") : null;

  if (emiVal > 0 && monthsVal > 0) {
    totalPayable = emiVal * monthsVal;
    totalInterest = Math.max(0, totalPayable - balanceToRepay);
    const d = startDateObj ? new Date(startDateObj.getTime()) : new Date();
    d.setMonth(d.getMonth() + monthsVal);
    payoffDateStr = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } else if (balanceToRepay > 0 && monthsVal > 0 && rateVal > 0) {
    const monthlyRate = rateVal / 100 / 12;
    const estEmi =
      (balanceToRepay * monthlyRate * Math.pow(1 + monthlyRate, monthsVal)) /
      (Math.pow(1 + monthlyRate, monthsVal) - 1);
    totalPayable = Math.round(estEmi * monthsVal);
    totalInterest = Math.max(0, totalPayable - balanceToRepay);
    const d = startDateObj ? new Date(startDateObj.getTime()) : new Date();
    d.setMonth(d.getMonth() + monthsVal);
    payoffDateStr = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  const interestRatio = totalPayable > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0;
  const principalRatio = totalPayable > 0 ? Math.max(0, 100 - interestRatio) : 100;

  return (
    <Modal
      title={initial ? "Edit Loan Taken" : "Add New Loan Taken"}
      onClose={onClose}
      maxWidth={920}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Responsive 2-Column Grid on Desktop / Laptops */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 390px), 1fr))",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {/* Column 1: Loan Identity & Details */}
          <div style={sectionCardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 8,
                borderBottom: "1px solid var(--t-line)",
              }}
            >
              <Building size={15} style={{ color: "var(--t-accent)" }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--t-ink)",
                }}
              >
                Loan & Institution Details
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <Field label="Owner / Family Profile">
                <select
                  style={inputStyle}
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

              <Field label="Loan Category / Type">
                <select
                  style={inputStyle}
                  value={f.type}
                  onChange={(e) => setF({ ...f, type: e.target.value })}
                >
                  {loanTypes.map((t: string) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Field label="Bank / Lending Institution">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    style={inputStyle}
                    list="popular-lenders-list"
                    placeholder="e.g. LiquiLoans, HDFC Bank, SBI, ICICI, Bajaj Finserv"
                    value={f.lender}
                    onChange={(e) => setF({ ...f, lender: e.target.value })}
                  />
                  {Boolean(f.lender?.trim()) && (
                    <BankLogo bankName={f.lender} size={34} borderRadius={8} />
                  )}
                </div>
                <datalist id="popular-lenders-list">
                  <option value="LiquiLoans" />
                  <option value="HDFC Bank" />
                  <option value="State Bank of India" />
                  <option value="ICICI Bank" />
                  <option value="Axis Bank" />
                  <option value="Kotak Mahindra Bank" />
                  <option value="Bajaj Finserv" />
                  <option value="Tata Capital" />
                </datalist>
              </Field>

              <Field label="Loan Account No. (Optional)">
                <input
                  style={inputStyle}
                  placeholder="e.g. LN-8392019"
                  value={f.accountNumber || ""}
                  onChange={(e) => setF({ ...f, accountNumber: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Status">
              <select
                style={inputStyle}
                value={f.status || "active"}
                onChange={(e) => setF({ ...f, status: e.target.value })}
              >
                <option value="active">Active Loan</option>
                <option value="closed">Paid Off / Closed</option>
              </select>
            </Field>

            <Field label="Note / Purpose (Optional)">
              <input
                style={inputStyle}
                placeholder="e.g. 3BHK flat at Sector 45 / 4-wheeler loan"
                value={f.note || ""}
                onChange={(e) => setF({ ...f, note: e.target.value })}
              />
            </Field>
          </div>

          {/* Column 2: Financial Terms & EMI Engine */}
          <div style={sectionCardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 8,
                borderBottom: "1px solid var(--t-line)",
              }}
            >
              <IndianRupee size={15} style={{ color: "var(--t-accent)" }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--t-ink)",
                }}
              >
                Financial Terms & EMI Engine
              </span>
            </div>

            {/* Financial Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Original Principal (₹)">
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  placeholder="e.g. 2500000"
                  value={f.principal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setF((prev: any) => ({
                      ...prev,
                      principal: val,
                      outstanding:
                        prev.outstanding === "" || prev.outstanding === prev.principal
                          ? val
                          : prev.outstanding,
                    }));
                  }}
                />
              </Field>

              <Field label="Current Outstanding Balance (₹)">
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  placeholder={f.principal || "Current debt"}
                  value={f.outstanding}
                  onChange={(e) => setF({ ...f, outstanding: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Annual Interest Rate (% p.a.)">
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.05"
                  placeholder="e.g. 8.75"
                  value={f.rate}
                  onChange={(e) => setF({ ...f, rate: e.target.value })}
                />
              </Field>

              <Field label="Interest Rate Structure">
                <select
                  style={inputStyle}
                  value={f.interestType || "Floating"}
                  onChange={(e) => setF({ ...f, interestType: e.target.value })}
                >
                  <option>Floating / Variable</option>
                  <option>Fixed Rate</option>
                </select>
              </Field>
            </div>

            {/* EMI and Tenure with Live Calculators */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--t-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Monthly EMI (₹)
                  </label>
                  <button
                    type="button"
                    onClick={autoCalculateEMI}
                    title="Calculate EMI from Principal, Rate & Tenure"
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--t-accent)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Calculator size={11} /> Auto-Calc EMI
                  </button>
                </div>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  placeholder="e.g. 24500"
                  value={f.emi}
                  onChange={(e) => setF({ ...f, emi: e.target.value })}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--t-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Tenure Remaining
                  </label>
                  <button
                    type="button"
                    onClick={autoCalculateTenure}
                    title="Calculate Tenure from Principal, Rate & EMI"
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--t-accent)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Calculator size={11} /> Auto-Calc Tenure
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="number"
                    min="0"
                    placeholder="Months"
                    value={f.monthsRemaining}
                    onChange={(e) => handleMonthsChange(e.target.value)}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--t-muted)",
                      alignSelf: "center",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ({tenureYears || "0"} yrs)
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <Field label="Monthly EMI Start Date">
                <input
                  style={inputStyle}
                  type="date"
                  value={f.startDate || f.emiStartDate || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updates: any = { startDate: val, emiStartDate: val };
                    if (val && !f.dueDay) {
                      const parsedDay = new Date(val + "T00:00:00").getDate();
                      if (parsedDay >= 1 && parsedDay <= 31) {
                        updates.dueDay = String(parsedDay);
                      }
                    }
                    setF((prev: any) => ({ ...prev, ...updates }));
                  }}
                />
              </Field>

              <Field label="Monthly EMI Due Day (1–31)">
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={31}
                  placeholder="e.g. 5 (5th of each month)"
                  value={f.dueDay || ""}
                  onChange={(e) => setF({ ...f, dueDay: e.target.value })}
                />
              </Field>
            </div>

            {/* Live Financial Intelligence Card */}
            <div
              style={{
                marginTop: 2,
                padding: "11px 13px",
                borderRadius: "var(--radius-md, 8px)",
                background: "color-mix(in srgb, var(--surface-0) 80%, var(--surface-1))",
                border: "1px solid var(--t-line)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={12} style={{ color: "var(--t-accent)" }} />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--t-accent)",
                    }}
                  >
                    Live Loan Intelligence
                  </span>
                </div>
                {payoffDateStr && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)" }}>
                    Target Payoff:{" "}
                    <strong style={{ color: "var(--t-ink)" }}>{payoffDateStr}</strong>
                  </span>
                )}
              </div>

              {totalPayable > 0 ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--t-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Est. Total Interest
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--t-rust, #ef4444)",
                          marginTop: 1,
                        }}
                      >
                        {fmtINR(totalInterest)}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--t-muted)",
                            marginLeft: 4,
                          }}
                        >
                          ({interestRatio}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--t-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Total Lifetime Repayment
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--t-ink)",
                          marginTop: 1,
                        }}
                      >
                        {fmtINR(totalPayable)}
                      </div>
                    </div>
                  </div>

                  {/* Ratio visual track */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                    <div
                      style={{
                        height: 5,
                        borderRadius: 3,
                        background: "var(--surface-2)",
                        overflow: "hidden",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: `${principalRatio}%`,
                          background: "var(--t-accent)",
                          transition: "width 0.3s ease",
                        }}
                        title={`Principal: ${principalRatio}%`}
                      />
                      <div
                        style={{
                          width: `${interestRatio}%`,
                          background: "var(--t-rust, #ef4444)",
                          transition: "width 0.3s ease",
                        }}
                        title={`Interest: ${interestRatio}%`}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 9.5,
                        color: "var(--t-muted)",
                        fontWeight: 600,
                      }}
                    >
                      <span>Principal: {principalRatio}%</span>
                      <span>Interest: {interestRatio}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--t-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  Enter Principal, Rate & Tenure/EMI to view real-time lifetime interest, total repayment and debt-free projections.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Disbursement Section (Full-width spanning) */}
        {!initial && bankAccounts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "14px 16px",
              background: "color-mix(in srgb, var(--surface-1) 35%, transparent)",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px dashed var(--t-line)",
            }}
          >
            <Field label="Disbursed To Bank Account (Optional)">
              <select
                style={inputStyle}
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
              >
                <option value="">— Do not record in bank account —</option>
                {bankAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} {acc.accountNumber ? `(••••${acc.accountNumber.slice(-4)})` : ""}
                  </option>
                ))}
              </select>
              {selectedBankId && (
                <div
                  style={{
                    fontSize: 11,
                    color: THEME.sage,
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  ✓ Will automatically credit {Number(f.principal) > 0 ? `₹${Number(f.principal).toLocaleString("en-IN")}` : "principal"} to this bank account in Banks & Transactions
                </div>
              )}
            </Field>

            {selectedBankId && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--surface-0)",
                  borderRadius: "var(--radius-md, 8px)",
                  border: "1px solid var(--t-line)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--t-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Bank Ledger Details
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                    gap: 12,
                  }}
                >
                  <Field label="Payment Mode">
                    <select
                      style={inputStyle}
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Reference / Cheque / UTR No.">
                    <input
                      style={inputStyle}
                      placeholder="e.g. Cheque #4521 / UTR No."
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </Field>

                  <Field label="Narration / Description (for Bank Ledger)">
                    <input
                      style={inputStyle}
                      placeholder="e.g. Disbursed Loan Principal / Ref: Loan Account"
                      value={narration}
                      onChange={(e) => setNarration(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}

        <ModalActions
          onSave={handleSave}
          onClose={onClose}
          saveLabel={initial ? "Save Changes" : "Add Loan Taken"}
          disabled={
            saving ||
            !f.lender?.trim() ||
            !(Number(f.principal) > 0) ||
            !(Number(f.emi) > 0) ||
            f.rate === ""
          }
          loading={saving}
        />
      </div>
    </Modal>
  );
}
