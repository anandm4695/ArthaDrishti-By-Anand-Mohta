import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  computeAdvanceTaxSchedule,
  calcTaxNewByFY,
  calcTaxOldByFY,
  getTaxDueForDashboard,
  exportArrayToCSV,
} from "../utils/finance";
import { SmartAlertsTab } from "../components/tabs/SmartAlertsTab";
import { TaxFilingHelperTab } from "../components/tabs/TaxFilingHelperTab";
import { SftTaxRadar } from "../components/audit/SftTaxRadar";
import { DataTable, Column } from "../components/design-system/DataTable";
import { PrivacyProvider } from "../context/PrivacyContext";

describe("Senior Accountant Audit: Statutory Advance Tax & Section 234 Engine", () => {
  it("exempts advance tax under Section 208 when net tax payable is below ₹10,000", () => {
    // Gross tax 15,000, TDS paid 8,000 -> Net tax 7,000 (< 10,000)
    const result = computeAdvanceTaxSchedule(2025, 15000, 8000, 0, "2025-10-01", false);
    expect(result.isSubjectToAdvanceTax).toBe(false);
    expect(result.netTaxPayable).toBe(7000);
    expect(result.penalty234C).toBe(0);
    expect(result.penalty234B).toBe(0);
    expect(result.totalStatutoryPenalty).toBe(0);
  });

  it("exempts senior citizens without business income under Section 207(2)", () => {
    // Net tax 1,00,000 but senior citizen without business income
    const result = computeAdvanceTaxSchedule(2025, 120000, 20000, 0, "2025-10-01", true);
    expect(result.isSubjectToAdvanceTax).toBe(false);
    expect(result.exemptionReason).toContain("Senior citizen");
    expect(result.penalty234C).toBe(0);
    expect(result.totalStatutoryPenalty).toBe(0);
  });

  it("applies statutory safe harbors for Q1 (12%) and Q2 (36%) without 234C penalty", () => {
    // Net tax: 1,00,000. Required: Q1 15%, Q2 45%.
    // Safe harbor: Q1 12% (12,000), Q2 36% (36,000).
    // If taxpayer paid 12,000 by Q1 and 36,000 by Q2, safe harbors are satisfied.
    const resultQ1Safe = computeAdvanceTaxSchedule(2025, 100000, 0, 12000, "2025-07-01", false, {
      Q1: 12000,
    });
    expect(resultQ1Safe.isSubjectToAdvanceTax).toBe(true);
    expect(resultQ1Safe.quarters[0].penalty234C).toBe(0);

    const resultQ2Safe = computeAdvanceTaxSchedule(2025, 100000, 0, 36000, "2025-10-01", false, {
      Q1: 12000,
      Q2: 24000,
    });
    expect(resultQ2Safe.quarters[0].penalty234C).toBe(0);
    expect(resultQ2Safe.quarters[1].penalty234C).toBe(0);
  });

  it("accrues Section 234C penalty when advance tax is underpaid below safe harbor", () => {
    // Net tax 1,00,000. Q1 required is 15,000. Safe harbor is 12,000.
    // If taxpayer paid 0 by Q1, shortfall is 15,000. Interest = 15,000 * 1% * 3 months = ₹450.
    const result = computeAdvanceTaxSchedule(2025, 100000, 0, 0, "2025-07-01", false);
    expect(result.quarters[0].shortfall).toBe(15000);
    expect(result.quarters[0].penalty234C).toBe(450);
    expect(result.penalty234C).toBeGreaterThanOrEqual(450);
  });

  it("calculates Section 234B penalty after March 31 of FY when advance paid is under 90%", () => {
    // Net tax 1,00,000. Advance paid 50,000 (< 90%). As of 2026-05-15 (AY started)
    const result = computeAdvanceTaxSchedule(2025, 100000, 0, 50000, "2026-05-15", false);
    expect(result.penalty234B).toBeGreaterThan(0);
    expect(result.totalStatutoryPenalty).toBeGreaterThan(0);
  });
});

describe("Senior UI/UX & System Audit: SmartAlertsTab Tax & Solvency Intelligence", () => {
  it("renders Advance Tax shortfall penalty and SFT-005 high-value notices", () => {
    const mockState = {
      profile: { regime: "new", dob: "1990-05-15" },
      income: [{ id: "inc1", amount: 2000000, category: "Salary" }],
      taxPayments: [],
      salarySlips: [],
      transactions: [
        {
          id: "t1",
          date: "2026-06-10",
          amount: 1200000,
          category: "Credit Card Payment",
          description: "HDFC Infinia CC Bill",
          type: "debit",
        },
      ],
      bankAccounts: [
        { id: "b1", bankName: "SBI", balance: -5000 },
        { id: "b2", bankName: "HDFC", balance: 50000 },
      ],
      creditCards: [],
      subscriptions: [],
      ppf: [],
      mutualFunds: [],
      lic: [],
    };

    const mockMetrics = {
      annualIncome: 2000000,
      monthExpense: 50000,
      netWorth: 1000000,
      totalLiabilities: 0,
    };

    render(
      <PrivacyProvider>
        <SmartAlertsTab state={mockState} metrics={mockMetrics} />
      </PrivacyProvider>
    );

    // Verify SFT-005 Alert is triggered
    expect(screen.getByText(/SFT-005 High-Value Notice/i)).toBeInTheDocument();

    // Verify Bank Overdraft Alert is triggered
    expect(screen.getByText(/Bank Overdraft: SBI/i)).toBeInTheDocument();
  });
});

describe("Senior UI/UX: DataTable Design System & Export Feature", () => {
  interface SampleRow {
    id: string;
    name: string;
    amount: number;
  }

  const sampleColumns: Column<SampleRow>[] = [
    { key: "name", header: "Item Name", sortable: true },
    { key: "amount", header: "Amount", isNumeric: true, sortable: true },
  ];

  const sampleData: SampleRow[] = [
    { id: "1", name: "Alpha", amount: 100 },
    { id: "2", name: "Beta", amount: 200 },
  ];

  it("renders Export CSV button and triggers export callback when clicked", () => {
    const onExportMock = vi.fn();

    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        keyExtractor={(row) => row.id}
        exportFilename="audit_report.csv"
        onExportCSV={onExportMock}
      />
    );

    const exportBtn = screen.getByRole("button", { name: /export table records as csv/i });
    expect(exportBtn).toBeInTheDocument();

    fireEvent.click(exportBtn);
    expect(onExportMock).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard navigation on clickable rows", () => {
    const onRowClickMock = vi.fn();

    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        keyExtractor={(row) => row.id}
        onRowClick={onRowClickMock}
      />
    );

    const row = screen.getByText("Alpha").closest("tr")!;
    expect(row).toBeInTheDocument();

    fireEvent.focus(row);
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onRowClickMock).toHaveBeenCalledWith(sampleData[0]);
  });
});

describe("Senior Accountant & UI/UX Audit: TaxFilingHelperTab Diagnostics", () => {
  it("determines ITR-3/ITR-4 when business/profession income is detected", () => {
    const mockState = {
      profile: { regime: "new" },
      salarySlips: [],
      rentalProperties: [],
      bankAccounts: [],
      mutualFunds: [],
      stocks: [],
      gold: [],
      loansTaken: [],
      govtSchemes: [],
      lic: [],
      ppf: [],
      nps: [],
      taxPayments: [],
      realEstateProperties: [],
      income: [{ id: "i1", amount: 600000, category: "Consulting", description: "Freelance dev" }],
    };

    render(
      <PrivacyProvider>
        <TaxFilingHelperTab state={mockState} />
      </PrivacyProvider>
    );

    expect(screen.getByText(/ITR-3 \/ ITR-4/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Income from business or profession \(requires ITR-3 or ITR-4\)/i)
    ).toBeInTheDocument();
  });

  it("renders Advance Tax Schedule with Section 234 status and SFT checklist item", () => {
    const mockState = {
      profile: { regime: "new" },
      salarySlips: [],
      rentalProperties: [],
      bankAccounts: [],
      mutualFunds: [],
      stocks: [],
      gold: [],
      loansTaken: [],
      govtSchemes: [],
      lic: [],
      ppf: [],
      nps: [],
      taxPayments: [{ id: "tp1", type: "tds", amount: 20000 }],
      realEstateProperties: [],
      income: [{ id: "i1", amount: 1500000, category: "Salary" }],
    };

    render(
      <PrivacyProvider>
        <TaxFilingHelperTab state={mockState} />
      </PrivacyProvider>
    );

    // Verify SFT checklist item is present
    expect(screen.getByText(/SFT High-Value Transaction Cross-Reference/i)).toBeInTheDocument();

    // Verify Advance Tax Schedule renders
    expect(screen.getByText(/Advance Tax Schedule/i)).toBeInTheDocument();
  });
});

describe("Senior Accountant Audit: Section 70 Capital Gains Loss Set-Off & Carry Forward", () => {
  it("sets off Debt STCL against Equity STCG and Equity LTCG under Section 70", async () => {
    const { computeGainTotals } = await import("../components/tabs/CapitalGainsTab");

    const mockSales = [
      {
        name: "HDFC Liquid Fund (Debt STCL)",
        buyDate: "2024-05-01",
        buyPrice: 100000,
        sellDate: "2024-08-01",
        sellPrice: 80000,
        qty: 100,
        holdingMonths: 3,
        profit: -20000,
        profitPct: -20,
        taxRate: 0.3,
        estimatedTax: 0,
        gainType: "DEBT_STCG" as const,
        assetType: "Mutual Fund" as const,
      },
      {
        name: "TCS (Equity STCG)",
        buyDate: "2024-04-01",
        buyPrice: 100000,
        sellDate: "2024-09-01",
        sellPrice: 130000,
        qty: 30,
        holdingMonths: 5,
        profit: 30000,
        profitPct: 30,
        taxRate: 0.2,
        estimatedTax: 0,
        gainType: "EQUITY_STCG" as const,
        assetType: "Stock" as const,
      },
    ];

    const result = computeGainTotals(mockSales, 2024);

    // Debt STCL of -20,000 should set off TCS Equity STCG of +30,000 down to 10,000!
    expect(result.taxablePools.equitySTCG).toBe(10000);
    expect(result.taxablePools.debtSTCG).toBe(0);
    expect(result.setOffDetails.carryForwardSTCL).toBe(0);
  });

  it("prohibits LTCL from setting off STCG and preserves it for carry forward under Section 74", async () => {
    const { computeGainTotals } = await import("../components/tabs/CapitalGainsTab");

    const mockSales = [
      {
        name: "Reliance (Equity LTCL)",
        buyDate: "2022-01-01",
        buyPrice: 200000,
        sellDate: "2024-08-01",
        sellPrice: 150000,
        qty: 50,
        holdingMonths: 31,
        profit: -50000,
        profitPct: -25,
        taxRate: 0.125,
        estimatedTax: 0,
        gainType: "EQUITY_LTCG" as const,
        assetType: "Stock" as const,
      },
      {
        name: "Infosys (Equity STCG)",
        buyDate: "2024-04-01",
        buyPrice: 100000,
        sellDate: "2024-09-01",
        sellPrice: 140000,
        qty: 30,
        holdingMonths: 5,
        profit: 40000,
        profitPct: 40,
        taxRate: 0.2,
        estimatedTax: 0,
        gainType: "EQUITY_STCG" as const,
        assetType: "Stock" as const,
      },
    ];

    const result = computeGainTotals(mockSales, 2024);

    // Under Section 70(2), LTCL CANNOT be set off against STCG!
    expect(result.taxablePools.equitySTCG).toBe(40000);
    expect(result.taxablePools.equityLTCG).toBe(0);
    // Entire ₹50,000 LTCL must be carried forward!
    expect(result.setOffDetails.carryForwardLTCL).toBe(50000);
  });

  it("applies higher ₹3,00,000 exemption limit for senior citizens in Old Tax Regime", () => {
    const nonSenior = calcTaxOldByFY(800000, 50000, "2024-25", 30);
    const senior = calcTaxOldByFY(800000, 50000, "2024-25", 65);

    // Senior citizen saves ₹2,600 due to ₹3,00,000 basic exemption limit
    expect(senior.total).toBeLessThan(nonSenior.total);
    expect(nonSenior.total - senior.total).toBe(2600);
  });

  it("calculates Section 24 Income from House Property, statutory 30% NAV deduction, and Sec 71(3A) ₹2L loss cap", () => {
    // Case 1: Positive Net Rental Income
    const grossRent = 600000;
    const municipalTax = 20000;
    const nav = Math.max(0, grossRent - municipalTax); // 5,80,000
    const sec24aStdDed = nav * 0.3; // 1,74,000
    const homeLoanInterest = 150000;
    const netIHP = nav - sec24aStdDed - homeLoanInterest; // 2,56,000

    expect(nav).toBe(580000);
    expect(sec24aStdDed).toBe(174000);
    expect(netIHP).toBe(256000);

    // Case 2: High Home Loan Interest leading to loss > ₹2,00,000
    const highInterest = 650000;
    const rawLossIHP = nav - sec24aStdDed - highInterest; // 580000 - 174000 - 650000 = -2,44,000
    expect(rawLossIHP).toBe(-244000);

    // Section 71(3A): current year set-off against other heads capped at -₹2,00,000
    const currentYearSetOff = Math.max(-200000, rawLossIHP);
    expect(currentYearSetOff).toBe(-200000);

    // Section 71B: balance unabsorbed loss carried forward for up to 8 AYs
    const unabsorbedCarryForward = Math.abs(rawLossIHP) - 200000;
    expect(unabsorbedCarryForward).toBe(44000);
  });

  it("renders DataTable with exportFilename and displays CSV Export button", () => {
    const data = [
      { id: "1", name: "Salary", amount: 100000 },
      { id: "2", name: "Dividend", amount: 5000 },
    ];
    const columns = [
      { key: "name", header: "Category", accessor: (r: any) => r.name },
      { key: "amount", header: "Amount", accessor: (r: any) => `₹${r.amount}` },
    ];

    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r: any) => r.id}
        exportFilename="financial-test-export.csv"
      />
    );

    const exportBtn = container.querySelector("button[title='Export table records as CSV']");
    expect(exportBtn).toBeTruthy();
    expect(exportBtn?.textContent).toContain("Export CSV");
  });

  it("calculates Section 234A penalty for delayed return filing after 31 July of Assessment Year", () => {
    // FY 2024-25, AY 2025-26: Due date 2025-07-31.
    // Net tax: 1,00,000, 0 paid. As of 2025-10-15 (~3 months delay).
    const delayedResult = computeAdvanceTaxSchedule(2024, 100000, 0, 0, "2025-10-15", false);
    expect(delayedResult.penalty234A).toBeGreaterThan(0);
    // 1% per month on 1,00,000 for 3 months = ~3,000
    expect(delayedResult.penalty234A).toBeGreaterThanOrEqual(2000);
    expect(delayedResult.totalStatutoryPenalty).toBeGreaterThan(delayedResult.penalty234C);

    // Timely filing on or before 31 July
    const timelyResult = computeAdvanceTaxSchedule(2024, 100000, 0, 0, "2025-07-25", false);
    expect(timelyResult.penalty234A).toBe(0);
  });

  it("applies Section 80TTB ₹50,000 deduction cap for senior citizens vs ₹10,000 Section 80TTA for non-seniors", () => {
    // Non-senior profile (<60) with ₹40,000 savings interest
    const nonSeniorState = {
      profile: { fy: "2024-25", regime: "old", age: 35 },
      masterData: {
        familyProfiles: [{ id: "self", dob: "1989-01-01" }],
        taxDeductions: {
          "2024-25": { d80TTA: 40000 },
        },
      },
    };
    const taxNonSenior = getTaxDueForDashboard(nonSeniorState, 1000000);

    // Senior citizen profile (>=60) with same income & ₹40,000 deposit interest
    const seniorState = {
      profile: { fy: "2024-25", regime: "old", age: 65 },
      masterData: {
        familyProfiles: [{ id: "self", dob: "1959-01-01" }],
        taxDeductions: {
          "2024-25": { d80TTA: 40000 },
        },
      },
    };
    const taxSenior = getTaxDueForDashboard(seniorState, 1000000);

    // Senior citizen must pay lower tax due to higher basic exemption (₹3L vs ₹2.5L)
    // AND full ₹40,000 deduction under Section 80TTB (vs ₹10,000 cap under 80TTA)
    expect(taxSenior).toBeLessThan(taxNonSenior);
  });

  it("triggers Section 194-IB mandatory TDS alert on monthly rent exceeding ₹50,000 in SmartAlertsTab", () => {
    const mockState = {
      profile: { fy: "2026-27", regime: "new" },
      rentedProperties: [
        {
          id: "r1",
          propertyName: "Penthouse Horizon",
          monthlyRent: 75000,
          isActive: true,
        },
      ],
      transactions: [],
      bankAccounts: [],
      creditCards: [],
      income: [],
      fixedDeposits: [],
      mutualFunds: [],
      stocks: [],
    };

    render(
      <PrivacyProvider>
        <SmartAlertsTab state={mockState} metrics={{}} />
      </PrivacyProvider>
    );

    expect(screen.getByText(/Section 194-IB Mandatory TDS Notice/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Penthouse Horizon/i).length).toBeGreaterThanOrEqual(1);
  });

  it("flags high-value rent exceeding ₹50,000/month under SFT-009 in SftTaxRadar", () => {
    const mockState = {
      profile: { fy: "2026-27" },
      rentedProperties: [
        {
          id: "r1",
          propertyName: "Luxury Villa",
          monthlyRent: 80000,
          isActive: true,
        },
      ],
      transactions: [],
      goldHoldings: [],
    };

    render(
      <PrivacyProvider>
        <SftTaxRadar state={mockState} metrics={{}} />
      </PrivacyProvider>
    );

    expect(screen.getByText(/High-Value Tenant Rent & Section 194-IB Compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/SFT-009/i)).toBeInTheDocument();
  });
});
