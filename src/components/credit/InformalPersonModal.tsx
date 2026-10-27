/* eslint-disable */
import React, { useState, useMemo } from "react";
import {
  User,
  Phone,
  Tag,
  FileText,
  Sparkles,
  IndianRupee,
  Calendar,
  Landmark,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Hash,
  Shield,
  Layers,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { today, fmtINR } from "../../utils/finance";
import { useMasterData, formatProfileOption } from "../../utils/masterData";
import { Modal, ModalActions } from "../ui/Modal";
import { Field } from "../ui/Form";
import { Money } from "../ui/Money";

const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Family",
  "Relative",
  "Colleague",
  "Business Partner",
  "Neighbor",
  "Other",
];

const AMOUNT_PRESETS = [10000, 25000, 50000, 100000, 200000];

const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    ["#3b82f6", "#60a5fa"], // Blue
    ["#7c3aed", "#a78bfa"], // Violet
    ["#059669", "#34d399"], // Emerald
    ["#d97706", "#fbbf24"], // Amber
    ["#2563eb", "#60a5fa"], // Indigo
    ["#0d9488", "#5eead4"], // Teal
    ["#dc2626", "#f87171"], // Red
  ];
  const idx = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]} 0%, ${colors[idx][1]} 100%)`;
};

interface InformalPersonModalProps {
  direction: "borrowed" | "lent";
  initial?: any | null;
  bankAccounts?: any[];
  onSave: (personData: any, bankTxn?: any) => Promise<void> | void;
  onClose: () => void;
  saving?: boolean;
}

export function InformalPersonModal({
  direction,
  initial = null,
  bankAccounts = [],
  onSave,
  onClose,
  saving = false,
}: InformalPersonModalProps) {
  const { familyProfiles } = useMasterData();
  const isBorrowed = direction === "borrowed";
  const shortLabel = isBorrowed ? "Lender" : "Borrower";
  const accentColor = isBorrowed ? "var(--t-rust)" : "var(--t-accent)";

  const [person, setPerson] = useState(initial?.person || initial?.name || "");
  const [owner, setOwner] = useState(initial?.owner || "self");
  const [relationship, setRelationship] = useState(initial?.relationship || "Friend");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [note, setNote] = useState(initial?.note || "");
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [date, setDate] = useState<string>(today());
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [mode, setMode] = useState<string>("Bank Transfer");
  const [narration, setNarration] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const initialNum = Number(initialAmount) || 0;
  const avatarGradient = getAvatarGradient(person || shortLabel);
  const initialLetter = (person.trim().charAt(0) || shortLabel.charAt(0)).toUpperCase();

  // Due Date Preset calculation helper
  const setDuePreset = (monthsToAdd: number) => {
    const base = date ? new Date(date + "T00:00:00") : new Date();
    const target = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, base.getDate());
    setDueDate(target.toISOString().split("T")[0]);
  };

  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return bankAccounts.find((b: any) => b.id === selectedBankId) || null;
  }, [selectedBankId, bankAccounts]);

  const handleSubmit = async () => {
    const trimmedName = person.trim();
    if (!trimmedName) {
      setError(`Please enter the ${shortLabel.toLowerCase()}'s name`);
      return;
    }
    setError(null);

    const payload: any = {
      person: trimmedName,
      name: trimmedName, // For backwards compatibility
      owner,
      relationship,
      phone: phone.trim(),
      note: note.trim(),
    };

    let bankTxn: any = null;

    // If new person, initialize tranches and payments arrays
    if (!initial) {
      payload.payments = [];
      if (initialNum > 0) {
        payload.tranches = [
          {
            id: `tr-${Date.now()}`,
            amount: initialNum,
            date: date || today(),
            ...(dueDate ? { dueDate } : {}),
            note: note.trim() || (isBorrowed ? "Initial loan received" : "Initial loan given"),
            mode,
            method: mode,
            ...(narration.trim() ? { narration: narration.trim() } : {}),
            ...(referenceNumber.trim()
              ? { referenceNumber: referenceNumber.trim(), reference: referenceNumber.trim() }
              : {}),
            ...(selectedBankId ? { bankAccountId: selectedBankId } : {}),
          },
        ];

        if (selectedBankId) {
          if (isBorrowed) {
            // Borrowed money received -> Credit user's bank account
            bankTxn = {
              id: `txn-${Date.now()}`,
              date: date || today(),
              amount: initialNum,
              type: "credit",
              category: "Loan Received",
              note: note.trim() || `Loan received from ${trimmedName}`,
              description: note.trim() || `Loan received from ${trimmedName} via ${mode}`,
              narration:
                narration.trim() ||
                `Loan received from ${trimmedName} - Ref: ${referenceNumber.trim() || mode}`,
              referenceNumber: referenceNumber.trim() || undefined,
              accountId: selectedBankId,
              bankAccountId: selectedBankId,
              bankName: selectedBank?.bankName || "Bank",
              mode,
              owner: owner || "self",
              linkedType: "informalBorrowed",
            };
          } else {
            // Lent money disbursed -> Debit user's bank account
            bankTxn = {
              id: `txn-${Date.now()}`,
              date: date || today(),
              amount: initialNum,
              type: "debit",
              category: "Loan Given",
              note: note.trim() || `Personal loan given to ${trimmedName}`,
              description: note.trim() || `Personal loan given to ${trimmedName} via ${mode}`,
              narration:
                narration.trim() ||
                `Loan given to ${trimmedName} - Ref: ${referenceNumber.trim() || mode}`,
              referenceNumber: referenceNumber.trim() || undefined,
              accountId: selectedBankId,
              bankAccountId: selectedBankId,
              bankName: selectedBank?.bankName || "Bank",
              mode,
              owner: owner || "self",
              linkedType: "informalLent",
            };
          }
        }
      } else {
        payload.tranches = [];
      }
    }

    if (bankTxn) {
      await onSave(payload, bankTxn);
    } else {
      await onSave(payload);
    }
  };

  const cardSectionStyle: React.CSSProperties = {
    background: "var(--t-card-bg)",
    border: "1px solid var(--t-line)",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  return (
    <Modal
      title={initial ? `Edit ${shortLabel}` : `Add New ${shortLabel}`}
      onClose={onClose}
      maxWidth={780}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Directional Hero Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
            background: isBorrowed
              ? "color-mix(in srgb, var(--t-rust) 10%, var(--surface-0))"
              : "color-mix(in srgb, var(--t-accent) 10%, var(--surface-0))",
            borderRadius: 10,
            border: `1px solid ${
              isBorrowed
                ? "color-mix(in srgb, var(--t-rust) 28%, transparent)"
                : "color-mix(in srgb, var(--t-accent) 28%, transparent)"
            }`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: isBorrowed ? "var(--t-rust)" : "var(--t-accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isBorrowed ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isBorrowed ? "var(--t-rust)" : "var(--t-accent)" }}>
                {isBorrowed ? "From People · Informal Borrowing" : "To People · Personal Money Lent"}
              </div>
              <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
                {isBorrowed
                  ? "Track money received from a person. Shows as a liability balance until repaid."
                  : "Track personal money given to a person. Shows as an asset balance until recovered."}
              </div>
            </div>
          </div>

          {/* Live Avatar Preview */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: avatarGradient,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              flexShrink: 0,
            }}
            title={`Preview avatar for ${person || shortLabel}`}
          >
            {initialLetter}
          </div>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 8,
              color: "var(--t-rust)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Responsive 2-Column Layout on Desktops/Laptops */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Column 1: Person Dossier & Household Details */}
          <div style={cardSectionStyle}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              <User size={13} color={accentColor} />
              <span>Party Profile & Household</span>
            </div>

            {/* Profile / Owner */}
            <Field label="Household Owner / Profile">
              <select
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--t-line)",
                  background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                  color: "var(--t-ink)",
                  fontSize: 13,
                  outline: "none",
                }}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              >
                {familyProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatProfileOption(p)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Person Name */}
            <Field label={`${shortLabel} Name *`}>
              <div style={{ position: "relative" }}>
                <input
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--t-line)",
                    background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                    color: "var(--t-ink)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder={`e.g. ${isBorrowed ? "Uncle Ramesh, Rohit" : "Rajesh Sharma, Priya"}`}
                  value={person}
                  onChange={(e) => {
                    setPerson(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                />
                <User
                  size={14}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--t-muted)",
                  }}
                />
              </div>
            </Field>

            {/* Relationship Quick Pills & Select */}
            <Field label="Relationship">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {RELATIONSHIP_OPTIONS.map((rel) => {
                  const isSel = relationship === rel;
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setRelationship(rel)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 14,
                        fontSize: 11,
                        fontWeight: isSel ? 800 : 500,
                        border: `1px solid ${isSel ? accentColor : "var(--t-line)"}`,
                        background: isSel
                          ? `color-mix(in srgb, ${accentColor} 16%, transparent)`
                          : "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                        color: isSel ? accentColor : "var(--t-muted)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Phone / WhatsApp */}
            <Field label="Phone / WhatsApp (for statements & reminders)">
              <div style={{ position: "relative" }}>
                <input
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--t-line)",
                    background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                    color: "var(--t-ink)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Phone
                  size={14}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--t-muted)",
                  }}
                />
              </div>
            </Field>

            {/* Notes / Purpose */}
            <Field label="Notes / Purpose (optional)">
              <div style={{ position: "relative" }}>
                <input
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--t-line)",
                    background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                    color: "var(--t-ink)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder="e.g. Medical emergency help, Home renovation"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <FileText
                  size={14}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--t-muted)",
                  }}
                />
              </div>
            </Field>
          </div>

          {/* Column 2: Initial Loan Arrangement (Only on New Person Creation) */}
          {!initial ? (
            <div style={cardSectionStyle}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                <IndianRupee size={13} color={accentColor} />
                <span>Initial Loan Details (Optional)</span>
              </div>

              {/* Initial Amount with INR presets */}
              <Field label={isBorrowed ? "Initial Amount Borrowed (₹)" : "Initial Amount Lent (₹)"}>
                <div style={{ position: "relative" }}>
                  <input
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 34px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--t-line)",
                      background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                      color: "var(--t-ink)",
                      fontSize: 14,
                      fontWeight: 800,
                      outline: "none",
                      boxSizing: "border-box",
                      fontVariantNumeric: "tabular-nums",
                    }}
                    type="number"
                    min="0"
                    placeholder="e.g. 50000 (or leave 0 to add later)"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                  />
                  <IndianRupee
                    size={14}
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--t-muted)",
                    }}
                  />
                </div>

                {/* Quick Amount Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {AMOUNT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialAmount(String(amt))}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--t-line)",
                        background: initialNum === amt ? accentColor : "color-mix(in srgb, var(--surface-1) 60%, transparent)",
                        color: initialNum === amt ? "#fff" : "var(--t-ink)",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      +₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                  {initialAmount && (
                    <button
                      type="button"
                      onClick={() => setInitialAmount("")}
                      style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        border: "1px solid var(--t-line)",
                        background: "transparent",
                        color: "var(--t-muted)",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </Field>

              {initialNum > 0 && (
                <>
                  {/* Dates: Transaction Date & Target Due Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Transaction Date">
                      <div style={{ position: "relative" }}>
                        <input
                          style={{
                            width: "100%",
                            padding: "8px 10px 8px 32px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--t-line)",
                            background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                            color: "var(--t-ink)",
                            fontSize: 12,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                        <Calendar
                          size={13}
                          style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--t-muted)",
                          }}
                        />
                      </div>
                    </Field>

                    <Field label="Due Date (optional)">
                      <div style={{ position: "relative" }}>
                        <input
                          style={{
                            width: "100%",
                            padding: "8px 10px 8px 32px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--t-line)",
                            background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                            color: "var(--t-ink)",
                            fontSize: 12,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                        <Clock
                          size={13}
                          style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--t-muted)",
                          }}
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Due Date Offset Presets */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: -4 }}>
                    <span style={{ fontSize: 10, color: "var(--t-muted)", fontWeight: 600 }}>Due in:</span>
                    {[
                      { l: "1M", m: 1 },
                      { l: "3M", m: 3 },
                      { l: "6M", m: 6 },
                      { l: "1Y", m: 12 },
                    ].map((p) => (
                      <button
                        key={p.l}
                        type="button"
                        onClick={() => setDuePreset(p.m)}
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          border: "1px solid var(--t-line)",
                          background: "color-mix(in srgb, var(--surface-1) 60%, transparent)",
                          color: "var(--t-ink)",
                          cursor: "pointer",
                        }}
                      >
                        +{p.l}
                      </button>
                    ))}
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate("")}
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          border: "none",
                          background: "transparent",
                          color: "var(--t-muted)",
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Bank Account Auto-Sync */}
                  {bankAccounts.length > 0 && (
                    <div
                      style={{
                        padding: "12px",
                        background: "color-mix(in srgb, var(--surface-1) 50%, transparent)",
                        borderRadius: 8,
                        border: "1px solid var(--t-line)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <Field label={isBorrowed ? "Auto-Credit Bank Account" : "Auto-Debit Bank Account"}>
                        <div style={{ position: "relative" }}>
                          <select
                            aria-label={isBorrowed ? "Auto-Credit Bank Account" : "Auto-Debit Bank Account"}
                            style={{
                              width: "100%",
                              padding: "8px 10px 8px 32px",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--t-line)",
                              background: "var(--t-card-bg)",
                              color: "var(--t-ink)",
                              fontSize: 12,
                              outline: "none",
                              boxSizing: "border-box",
                            }}
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
                          <Landmark
                            size={14}
                            style={{
                              position: "absolute",
                              left: 10,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--t-muted)",
                            }}
                          />
                        </div>
                      </Field>

                      {selectedBank && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--t-sage)",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>
                            Will auto-{isBorrowed ? "credit" : "debit"} ₹{fmtINR(initialNum)} into {selectedBank.bankName}
                          </span>
                        </div>
                      )}

                      {selectedBankId && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <Field label="Payment Mode">
                            <select
                              style={{
                                width: "100%",
                                padding: "7px 10px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--t-line)",
                                background: "var(--t-card-bg)",
                                color: "var(--t-ink)",
                                fontSize: 12,
                                outline: "none",
                              }}
                              value={mode}
                              onChange={(e) => setMode(e.target.value)}
                            >
                              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                              <option value="UPI">UPI</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Cash">Cash</option>
                              <option value="Card">Card</option>
                              <option value="Other">Other</option>
                            </select>
                          </Field>

                          <Field label="Ref / Cheque / UTR #">
                            <input
                              style={{
                                width: "100%",
                                padding: "7px 10px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--t-line)",
                                background: "var(--t-card-bg)",
                                color: "var(--t-ink)",
                                fontSize: 12,
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                              placeholder="e.g. UTR / Ref No."
                              value={referenceNumber}
                              onChange={(e) => setReferenceNumber(e.target.value)}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* If Editing Person, show summary dossier info on the right */
            <div style={cardSectionStyle}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} color={accentColor} />
                <span>Account Status</span>
              </div>
              <div style={{ padding: "12px", background: "color-mix(in srgb, var(--surface-1) 50%, transparent)", borderRadius: 8, fontSize: 12, color: "var(--t-muted)", lineHeight: 1.6 }}>
                Editing details for <strong>{initial.person || initial.name}</strong>. Loan installments and payment histories can be managed directly from the interactive ledger on the main screen.
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <ModalActions
          onSave={handleSubmit}
          onClose={onClose}
          saveLabel={
            initial
              ? "Save Changes"
              : initialNum > 0
              ? `Add ${shortLabel} (₹${fmtINR(initialNum)})`
              : `Add ${shortLabel}`
          }
          disabled={saving || !person.trim()}
          loading={saving}
        />
      </div>
    </Modal>
  );
}
