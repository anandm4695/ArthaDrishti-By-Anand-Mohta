import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  calculateSection54BExemption,
  CapitalGainsExemptionStudio,
} from "../components/tax/CapitalGainsExemptionStudio";
import {
  computeScheduleCFLSetOff,
  ScheduleCFLStudio,
  SAMPLE_BF_LOSSES,
  INITIAL_AY_SCHEDULE,
  BroughtForwardLossRow,
} from "../components/tax/ScheduleCFLStudio";
import { SftTaxRadar } from "../components/audit/SftTaxRadar";
import { DoubleEntryTrialBalance } from "../components/audit/DoubleEntryTrialBalance";
import { CapitalGainsTab } from "../components/tabs/CapitalGainsTab";
import { PrivacyProvider } from "../context/PrivacyContext";

describe("Senior Accountant Audit: Section 54B Agricultural Land Capital Gains Exemption", () => {
  it("exempts capital gains reinvested in new agricultural land when land was used for agriculture for 2 years prior", () => {
    // 100% shelter
    const full = calculateSection54BExemption({
      ltcg: 4000000, // 40 Lakhs
      newAgriculturalLandInvestment: 3500000,
      cgasDeposit: 500000,
      usedForAgriTwoYears: true,
    });
    expect(full.exemption).toBe(4000000);
    expect(full.notes[0]).toContain("100% Capital Gains sheltered under Section 54B");

    // Partial exemption
    const partial = calculateSection54BExemption({
      ltcg: 6000000,
      newAgriculturalLandInvestment: 4500000,
      cgasDeposit: 0,
      usedForAgriTwoYears: true,
    });
    expect(partial.exemption).toBe(4500000);
    expect(partial.notes[0]).toContain("Partial exemption claimed: ₹45,00,000 of ₹60,00,000");
  });

  it("disqualifies Section 54B claim if land was NOT used for agricultural purposes for 2 years prior to transfer", () => {
    const disqualified = calculateSection54BExemption({
      ltcg: 5000000,
      newAgriculturalLandInvestment: 5000000,
      usedForAgriTwoYears: false,
    });
    expect(disqualified.exemption).toBe(0);
    expect(disqualified.notes[0]).toContain(
      "Ineligible: Land must have been used by the assessee or their parent"
    );
  });

  it("handles zero or negative capital gains gracefully", () => {
    const zero = calculateSection54BExemption({
      ltcg: 0,
      newAgriculturalLandInvestment: 2000000,
      usedForAgriTwoYears: true,
    });
    expect(zero.exemption).toBe(0);
  });
});

describe("Senior Accountant Audit: ITR Schedule CFL & Section 74 Brought-Forward Losses Set-Off Engine", () => {
  it("absorbs brought-forward STCL against current STCG first, then against current LTCG (FIFO priority)", () => {
    const testSchedule: BroughtForwardLossRow[] = [
      {
        assessmentYear: "AY 2022-23",
        financialYear: "FY 2021-22",
        returnFiledOnTime: true,
        filingDate: "2022-07-28",
        bfSTCL: 100000, // 1 Lakh STCL
        bfLTCL: 0,
      },
    ];

    // Case 1: STCG of 60k, LTCG of 80k
    // STCL should absorb 60k of STCG, and remaining 40k against LTCG
    const res = computeScheduleCFLSetOff({
      currentSTCG: 60000,
      currentLTCG: 80000,
      schedule: testSchedule,
    });

    expect(res.rows[0].stclAbsorbedAgainstSTCG).toBe(60000);
    expect(res.rows[0].stclAbsorbedAgainstLTCG).toBe(40000);
    expect(res.rows[0].totalAbsorbed).toBe(100000);
    expect(res.rows[0].totalCarriedForward).toBe(0);
    expect(res.netTaxableSTCG).toBe(0);
    expect(res.netTaxableLTCG).toBe(40000);
  });

  it("restricts brought-forward LTCL to offset LTCG ONLY under Section 74(1)(b) (cannot set off STCG)", () => {
    const testSchedule: BroughtForwardLossRow[] = [
      {
        assessmentYear: "AY 2023-24",
        financialYear: "FY 2022-23",
        returnFiledOnTime: true,
        filingDate: "2023-07-28",
        bfSTCL: 0,
        bfLTCL: 150000, // 1.5 Lakhs LTCL
      },
    ];

    // Current gains: STCG 100k, LTCG 50k
    // LTCL can absorb only 50k of LTCG; remaining 100k STCG cannot be touched!
    const res = computeScheduleCFLSetOff({
      currentSTCG: 100000,
      currentLTCG: 50000,
      schedule: testSchedule,
    });

    expect(res.rows[0].ltclAbsorbedAgainstLTCG).toBe(50000);
    expect(res.rows[0].totalAbsorbed).toBe(50000);
    expect(res.rows[0].unabsorbedLTCL).toBe(100000);
    expect(res.rows[0].totalCarriedForward).toBe(100000);
    expect(res.netTaxableSTCG).toBe(100000); // STCG remains untouched
    expect(res.netTaxableLTCG).toBe(0);
  });

  it("enforces Section 80: losses from belated returns (not filed on or before Sec 139(1) due date) are barred from set-off and carry-forward", () => {
    const testSchedule: BroughtForwardLossRow[] = [
      {
        assessmentYear: "AY 2024-25",
        financialYear: "FY 2023-24",
        returnFiledOnTime: false, // Belated return
        filingDate: "2024-12-31",
        bfSTCL: 80000,
        bfLTCL: 50000,
      },
    ];

    const res = computeScheduleCFLSetOff({
      currentSTCG: 100000,
      currentLTCG: 100000,
      schedule: testSchedule,
    });

    expect(res.rows[0].eligible).toBe(false);
    expect(res.rows[0].ineligibilityReason).toContain(
      "Section 80: Belated return bars loss carry-forward"
    );
    expect(res.rows[0].totalAbsorbed).toBe(0);
    expect(res.totalAbsorbed).toBe(0);
    expect(res.netTaxableSTCG).toBe(100000);
    expect(res.netTaxableLTCG).toBe(100000);
  });

  it("flags losses in their final 8th year and lapses unabsorbed losses under Section 74(2)", () => {
    const testSchedule: BroughtForwardLossRow[] = [
      {
        assessmentYear: "AY 2018-19", // 8 years old in AY 2026-27
        financialYear: "FY 2017-18",
        returnFiledOnTime: true,
        filingDate: "2018-07-25",
        bfSTCL: 50000,
        bfLTCL: 30000,
      },
    ];

    // Current gains: STCG 20k, LTCG 0
    // STCL absorbs 20k, remaining 30k STCL and 30k LTCL lapse because it's the 8th and final year!
    const res = computeScheduleCFLSetOff({
      currentSTCG: 20000,
      currentLTCG: 0,
      schedule: testSchedule,
      activeAY: 2026,
    });

    expect(res.rows[0].isExpiringThisAY).toBe(true);
    expect(res.rows[0].yearsRemaining).toBe(0);
    expect(res.rows[0].stclAbsorbedAgainstSTCG).toBe(20000);
    expect(res.rows[0].lapsedSTCL).toBe(30000);
    expect(res.rows[0].lapsedLTCL).toBe(30000);
    expect(res.totalLapsedLosses).toBe(60000);
    expect(res.totalCarriedForward).toBe(0); // Cannot be carried forward further
  });

  it("calculates statutory direct tax savings accurately (20% on STCG, 13.0% on LTCG)", () => {
    const testSchedule: BroughtForwardLossRow[] = [
      {
        assessmentYear: "AY 2024-25",
        financialYear: "FY 2023-24",
        returnFiledOnTime: true,
        filingDate: "2024-07-25",
        bfSTCL: 50000,
        bfLTCL: 100000,
      },
    ];

    const res = computeScheduleCFLSetOff({
      currentSTCG: 50000,
      currentLTCG: 100000,
      schedule: testSchedule,
    });

    // Tax saved: 50,000 * 0.20 (₹10,000) + 100,000 * 0.13 (₹13,000) = ₹23,000
    expect(res.totalTaxSaved).toBe(23000);
  });
});

describe("Senior UI/UX & Integration Suite: Schedule CFL & Exemption Studio", () => {
  it("renders ScheduleCFLStudio with key radar cards, controls, and table rows", () => {
    const showToast = vi.fn();
    render(
      <PrivacyProvider>
        <ScheduleCFLStudio currentFYSTCG={75000} currentFYLTCG={120000} showToast={showToast} />
      </PrivacyProvider>
    );

    expect(
      screen.getByText(/ITR Schedule CFL: Capital Loss Set-Off & Carry-Forward Studio/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Total BF Losses Available/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Tax Saved via Set-Off/i)).toBeInTheDocument();
    expect(screen.getByText(/Carried Forward to Future AYs/i)).toBeInTheDocument();

    // Prefill sample losses
    const prefillBtn = screen.getByText(/Prefill Sample Losses/i);
    fireEvent.click(prefillBtn);
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining("Loaded sample brought-forward losses"),
      "info"
    );

    // Copy report
    const copyBtn = screen.getByText(/Copy Report/i);
    fireEvent.click(copyBtn);
  });

  it("renders Agricultural Land (Sec 54B) option and presets in CapitalGainsExemptionStudio", () => {
    const showToast = vi.fn();
    render(
      <CapitalGainsExemptionStudio
        state={{ bonds: [] }}
        currentFYLTCG={500000}
        showToast={showToast}
      />
    );

    // Verify preset button exists
    const agriPresetBtn = screen.getByText(/Agri Land → New Agri Land \(Sec 54B\)/i);
    expect(agriPresetBtn).toBeInTheDocument();

    // Click preset
    fireEvent.click(agriPresetBtn);
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining("Applied Agricultural Land Sale → Sec 54B Reinvestment Preset"),
      "info"
    );

    // Verify Section 54B badge / input appears
    expect(screen.getByText(/Investment in New Agricultural Land/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Land used for agriculture for at least 2 years prior/i)
    ).toBeInTheDocument();
  });

  it("navigates to Schedule CFL view in CapitalGainsTab seamlessly", () => {
    const mockState = {
      stocks: [
        {
          id: "stk-1",
          name: "Infosys Ltd",
          symbol: "INFY",
          buyDate: "2024-01-01",
          qty: 10,
          buyPrice: 1500,
          currentPrice: 1600,
        },
      ],
      mutualFunds: [],
      stockSells: [],
      mfSells: [],
      bonds: [],
    };

    render(
      <PrivacyProvider>
        <CapitalGainsTab state={mockState} />
      </PrivacyProvider>
    );

    const cflNavBtn = screen.getByText(/Schedule CFL \(Loss Carry-Forward\)/i);
    expect(cflNavBtn).toBeInTheDocument();

    fireEvent.click(cflNavBtn);
    expect(
      screen.getByText(/ITR Schedule CFL: Capital Loss Set-Off & Carry-Forward Studio/i)
    ).toBeInTheDocument();
  });
});

describe("Senior Accountant Audit: SFT-010 Foreign Outward Remittance Tracking in SftTaxRadar", () => {
  it("detects foreign remittances under RBI LRS exceeding ₹7 Lakhs and flags SFT-010", () => {
    const mockState = {
      profile: { fy: "2026-27" },
      transactions: [
        {
          id: "t-forex-1",
          date: "2026-06-15",
          description: "Outward remittance foreign education tuition fees via SWIFT",
          amount: -850000,
          category: "Education",
        },
      ],
      realEstateProperties: [],
      fixedDeposits: [],
      bonds: [],
      goldHoldings: [],
      rentedProperties: [],
    };

    render(
      <PrivacyProvider>
        <SftTaxRadar state={mockState} metrics={{}} />
      </PrivacyProvider>
    );

    expect(screen.getByText(/SFT-010/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Foreign Remittance under RBI LRS & Section 206C\(1G\) TCS/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/SFT REPORTABLE/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe("Senior UI/UX Developer: Accessible Keyboard Navigation in DoubleEntryTrialBalance", () => {
  it("enables keyboard Enter and Space activation on clickable ledger rows", () => {
    const mockSetTab = vi.fn();
    const mockState = {
      bankAccounts: [
        {
          id: "b1",
          bankName: "HDFC Bank",
          accountNumber: "1234567890",
          balance: 500000,
          owner: "self",
        },
      ],
    };

    render(
      <PrivacyProvider>
        <DoubleEntryTrialBalance
          state={mockState}
          metrics={{ netWorth: 500000 }}
          setTab={mockSetTab}
        />
      </PrivacyProvider>
    );

    const row = screen.getByRole("button", { name: /Navigate to banking for HDFC Bank/i });
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute("tabindex", "0");

    // Press Enter to trigger navigation
    fireEvent.keyDown(row, { key: "Enter" });
    expect(mockSetTab).toHaveBeenCalledWith("banking");

    // Press Space to trigger navigation
    fireEvent.keyDown(row, { key: " " });
    expect(mockSetTab).toHaveBeenCalledWith("banking");
  });
});
