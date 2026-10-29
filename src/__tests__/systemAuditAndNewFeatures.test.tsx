import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { DoubleEntryTrialBalance } from "../components/audit/DoubleEntryTrialBalance";
import { SolvencyScorecard } from "../components/audit/SolvencyScorecard";
import { SftTaxRadar } from "../components/audit/SftTaxRadar";
import { useSearch } from "../hooks/useSearch";
import { calculateProfileNWAndCover } from "../hooks/useMetrics";
import { PrivacyProvider } from "../context/PrivacyContext";

const renderWithPrivacy = (ui: React.ReactElement) => {
  return render(<PrivacyProvider>{ui}</PrivacyProvider>);
};

describe("Senior Developer, UI/UX & Senior Accountant System Audit Suite", () => {
  const richState = {
    bankAccounts: [
      { id: "b1", bankName: "HDFC Bank", accountNumber: "1234567890", balance: 500000, owner: "self" },
    ],
    prepaidCards: [
      {
        id: "pc1",
        cardName: "Forex Multi-Currency",
        status: "active",
        owner: "self",
        transactions: [
          { id: "t1", type: "load", amount: 50000 },
          { id: "t2", type: "spend", amount: 15000 },
        ],
      },
    ],
    fixedDeposits: [
      { id: "fd1", bank: "SBI", principal: 300000, rate: 7.1, owner: "self" },
    ],
    recurringDeposits: [
      { id: "rd1", bank: "ICICI", monthly: 10000, rate: 7.0, tenureMonths: 12, status: "active", owner: "self" },
      { id: "rd-closed", bank: "Axis", monthly: 5000, rate: 6.5, tenureMonths: 12, payoutStatus: "credited", owner: "self" },
    ],
    bonds: [
      { id: "bnd1", issuerName: "RBI Floating Rate Bond", totalInvestmentAmount: 1200000, couponRate: 8.05, owner: "self" },
    ],
    stocks: [
      { id: "st1", symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", qty: 100, avgPrice: 3500, currentPrice: 4000, owner: "self" },
    ],
    mutualFunds: [
      { id: "mf1", name: "Parag Parikh Flexi Cap", units: 1000, buyNav: 50, currentNav: 75, invested: 50000, owner: "self" },
    ],
    ppf: [
      { id: "ppf1", institution: "SBI PPF", balance: 450000, owner: "self" },
    ],
    epf: [
      {
        id: "epf1",
        employer: "TechCorp India",
        balance: 600000,
        owner: "self",
        transactions: [
          { id: "et1", type: "monthly_contribution", employeeShare: 15000, employerShare: 15000, pensionShare: 5000 },
        ],
      },
    ],
    nps: [
      {
        id: "nps1",
        bank: "HDFC Pension",
        balance: 0,
        owner: "self",
        transactions: [{ id: "nt1", employeeAmount: 100000, employerAmount: 50000 }],
      },
    ],
    govtSchemes: [
      { id: "gs1", schemeType: "SSY", accountHolder: "Aanya", currentBalance: 250000, owner: "self" },
    ],
    lic: [
      { id: "lic1", name: "Jeevan Anand", premiumPaid: 180000, sumAssured: 1000000, owner: "self" },
    ],
    investmentPlans: [
      { id: "ip1", name: "HDFC ProGrowth ULIP", premiumPaid: 120000, owner: "self" },
    ],
    goldHoldings: [
      { id: "g1", name: "22K Gold Jewellery", type: "physical", grams: 50, purity: "22K", owner: "self" },
    ],
    realEstateProperties: [
      { id: "re1", name: "Prestige Lakeside Habitat", status: "under-construction", marketValue: 8500000, owner: "self" },
    ],
    realEstateDemands: [
      { id: "red1", propertyId: "re1", totalAmount: 2000000 },
    ],
    realEstatePayments: [
      { id: "rep1", propertyId: "re1", amount: 1500000 },
    ],
    rentalProperties: [
      { id: "rp1", propertyName: "Indiranagar Studio", propertyValue: 4500000, monthlyRent: 28000, securityDeposit: 150000, depositReturned: 50000, owner: "self" },
    ],
    rentedProperties: [
      { id: "rnt1", propertyName: "Koramangala Flat", landlordName: "Ramesh", monthlyRent: 35000, securityDeposit: 200000, depositReturned: 0, owner: "self" },
    ],
    vehicles: [
      { id: "v1", make: "Hyundai", model: "Creta", registrationNumber: "KA01AB1234", currentValue: 1100000, owner: "self" },
    ],
    loansGiven: [
      { id: "lg1", borrower: "Vikram", principal: 200000, outstanding: 150000, dueDate: "2020-01-01", owner: "self" },
    ],
    informalLent: [
      {
        id: "il1",
        name: "Suresh",
        person: "Suresh",
        owner: "self",
        tranches: [{ id: "tr1", amount: 80000, date: "2025-01-10" }],
        payments: [{ id: "pm1", amount: 20000, date: "2025-02-10" }],
      },
    ],
    loansTaken: [
      { id: "lt1", lender: "HDFC Home Loan", type: "Home", principal: 4000000, outstanding: 3200000, emi: 32000, rate: 8.5, owner: "self" },
      { id: "lt-closed", lender: "Old Car Loan", type: "Vehicle", principal: 500000, outstanding: 200000, status: "closed", emi: 12000, owner: "self" },
    ],
    informalBorrowed: [
      {
        id: "ib1",
        name: "Mahesh Uncle",
        person: "Mahesh Uncle",
        owner: "self",
        tranches: [{ id: "trb1", amount: 250000, date: "2025-01-15" }],
        payments: [{ id: "pmb1", amount: 50000, date: "2025-02-15" }],
      },
    ],
    creditCards: [
      { id: "cc1", bank: "ICICI", issuer: "ICICI", name: "Sapphiro", last4: "4321", outstanding: 45000, limit: 500000, status: "active", owner: "self" },
    ],
    healthInsurance: [
      { id: "hi1", planName: "HDFC ERGO Optima Secure", insurer: "HDFC ERGO", sumInsured: 2000000, owner: "self" },
    ],
    billPayments: [
      { id: "bp1", name: "BESCOM Electricity", provider: "BESCOM", category: "Electricity", amount: 3400, owner: "self" },
    ],
    transactions: [],
    goals: [],
    subscriptions: [],
    sips: [],
    termPlans: [],
    reminders: [],
  };

  it("reconciles DoubleEntryTrialBalance 1-for-1 with calculateProfileNWAndCover (₹0 delta & ₹0 variance)", () => {
    const canonicalMetrics = calculateProfileNWAndCover(richState, {}, undefined);

    renderWithPrivacy(
      <DoubleEntryTrialBalance
        state={richState}
        metrics={{ netWorth: canonicalMetrics.netWorth }}
      />
    );

    // Must verify parity with 0 variance and 100% reconciliation with Dashboard NW
    expect(screen.getByText(/PARITY VERIFIED \(₹0 VARIANCE\)/i)).toBeTruthy();
    expect(screen.getByText(/100% RECONCILED WITH DASHBOARD NW/i)).toBeTruthy();

    // Verify previously missing ledgers are rendered
    expect(screen.getByText(/Bond: RBI Floating Rate Bond/i)).toBeTruthy();
    expect(screen.getByText(/SSY: Aanya/i)).toBeTruthy();
    expect(screen.getByText(/Builder Demand Payable: Prestige Lakeside Habitat/i)).toBeTruthy();
    expect(screen.getByText(/Tenant Security Deposit Refundable/i)).toBeTruthy();
    expect(screen.getByText(/Security Deposit Receivable: Koramangala Flat/i)).toBeTruthy();

    // Verify Ledger Exception Inspector detects the overdue loan given to Vikram
    expect(screen.getByText(/Overdue Loan Receivable: Vikram/i)).toBeTruthy();
  });

  it("maintains Trial Balance parity (Debits === Credits) even when bank is overdrawn and Net Worth is negative", () => {
    const deficitState = {
      bankAccounts: [{ id: "b-od", bankName: "Overdraft A/c", balance: -150000, owner: "self" }],
      loansTaken: [{ id: "l-big", lender: "SBI Personal", type: "Personal", outstanding: 500000, emi: 15000, owner: "self" }],
    };
    const canonical = calculateProfileNWAndCover(deficitState, {}, undefined);
    expect(canonical.netWorth).toBe(-650000);

    renderWithPrivacy(
      <DoubleEntryTrialBalance state={deficitState} metrics={{ netWorth: canonical.netWorth }} />
    );

    expect(screen.getByText(/PARITY VERIFIED \(₹0 VARIANCE\)/i)).toBeTruthy();
    expect(screen.getByText(/Family Capital Account \(Accumulated Deficit\)/i)).toBeTruthy();
  });

  it("renders SolvencyScorecard and runs Interactive Treasury Stress-Test scenarios", () => {
    const canonicalMetrics = calculateProfileNWAndCover(richState, {}, undefined);
    renderWithPrivacy(
      <SolvencyScorecard
        state={richState}
        metrics={{
          netWorth: canonicalMetrics.netWorth,
          monthIncome: 250000,
          monthExpense: 80000,
        }}
      />
    );

    expect(screen.getByText(/Interactive Treasury Stress-Test Simulator/i)).toBeTruthy();
    expect(screen.getByText(/No Drawdown \(Baseline\)/i)).toBeTruthy();

    // Click Severe Bear Crash (-40%)
    const crashBtn = screen.getByRole("button", { name: /Severe Bear Crash \(-40%\)/i });
    fireEvent.click(crashBtn);

    expect(screen.getByText(/STRESS ACTIVE: SEVERE BEAR CRASH \(-40%\)/i)).toBeTruthy();
    // Equity + MF = (100 * 4000) + (1000 * 75) = 4,00,000 + 75,000 = 4,75,000. 40% haircut = ₹1,90,000 drawdown
    expect(screen.getByText(/Impact: −₹1,90,000/i)).toBeTruthy();
  });

  it("detects SFT-006 tranche-based informal loans, SFT-007 Bonds, and SFT-008 Gold in SftTaxRadar", () => {
    renderWithPrivacy(<SftTaxRadar state={richState} metrics={{}} />);

    expect(screen.getByText("SFT-007")).toBeTruthy();
    expect(screen.getByText("SFT-008")).toBeTruthy();

    // Filter by Reportable
    const reportableBtn = screen.getByRole("button", { name: /Reportable/i });
    fireEvent.click(reportableBtn);

    // SFT-004 (Real estate 85L >= 30L) & SFT-007 (Bonds 12L >= 10L) are reportable
    expect(screen.getByText("SFT-004")).toBeTruthy();
    expect(screen.getByText("SFT-007")).toBeTruthy();
  });

  it("indexes Bonds, Tranche Informal Loans, Gold, Govt Schemes, Health Insurance & Bills in useSearch", () => {
    const { result: bondRes } = renderHook(() => useSearch(richState, "RBI Floating"));
    expect(bondRes.current[0]?.type).toBe("Bond");
    expect(bondRes.current[0]?.detail).toContain("12,00,000");

    const { result: infRes } = renderHook(() => useSearch(richState, "Mahesh Uncle"));
    expect(infRes.current[0]?.type).toBe("Borrowed From");
    // 250000 tranche - 50000 payment = 200000
    expect(infRes.current[0]?.detail).toContain("2,00,000");

    const { result: goldRes } = renderHook(() => useSearch(richState, "Jewellery"));
    expect(goldRes.current[0]?.type).toBe("Gold Holding");

    const { result: healthRes } = renderHook(() => useSearch(richState, "Optima Secure"));
    expect(healthRes.current[0]?.type).toBe("Health Insurance");

    const { result: billRes } = renderHook(() => useSearch(richState, "BESCOM"));
    expect(billRes.current[0]?.type).toBe("Bill Payment");
  });
});
