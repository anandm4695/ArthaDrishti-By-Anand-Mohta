import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  calculateSection54Exemption,
  calculateSection54ECExemption,
  calculateSection54FExemption,
  calculateStatutoryDeadlines,
  CapitalGainsExemptionStudio,
  SEC_54_CAP,
  SEC_54EC_ANNUAL_CAP,
  SEC_54F_CONSIDERATION_CAP,
} from "../components/tax/CapitalGainsExemptionStudio";
import { CapitalGainsTab } from "../components/tabs/CapitalGainsTab";

describe("Capital Gains Statutory Exemption Math Engine (Sec 54, 54EC, 54F)", () => {
  it("computes Section 54 residential property exemption correctly and caps at ₹10 Crore", () => {
    // Normal exemption within limits
    const normal = calculateSection54Exemption({
      ltcg: 5000000, // 50 Lakhs
      newHouseInvestment: 4000000,
      cgasDeposit: 1000000,
    });
    expect(normal.exemption).toBe(5000000);
    expect(normal.notes[0]).toContain("100% Capital Gains sheltered");

    // Partial exemption
    const partial = calculateSection54Exemption({
      ltcg: 8000000, // 80 Lakhs
      newHouseInvestment: 5000000,
      cgasDeposit: 0,
    });
    expect(partial.exemption).toBe(5000000);

    // Over ₹10 Crore cap (Finance Act 2023)
    const superLuxury = calculateSection54Exemption({
      ltcg: 150000000, // 15 Crore
      newHouseInvestment: 140000000,
      cgasDeposit: 0,
    });
    expect(superLuxury.exemption).toBe(SEC_54_CAP);
    expect(superLuxury.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Section 54 deduction capped at ₹10 Crore"),
      ])
    );
  });

  it("enforces Section 54EC ₹50,00,000 annual ceiling across specified bonds", () => {
    // Standard bond investment within cap
    const standard = calculateSection54ECExemption({
      ltcg: 4000000,
      bondInvestment: 4000000,
      existing54ECInvestmentsInFY: 0,
    });
    expect(standard.exemption).toBe(4000000);

    // Excess bond investment capped at ₹50 Lakhs
    const excess = calculateSection54ECExemption({
      ltcg: 8000000,
      bondInvestment: 7500000,
      existing54ECInvestmentsInFY: 0,
    });
    expect(excess.exemption).toBe(SEC_54EC_ANNUAL_CAP);
    expect(excess.notes[0]).toContain("Statutory cap enforced");

    // When taxpayer already utilized ₹30L headroom in earlier bonds
    const reducedHeadroom = calculateSection54ECExemption({
      ltcg: 5000000,
      bondInvestment: 3000000,
      existing54ECInvestmentsInFY: 3000000, // Remaining headroom = 20L
    });
    expect(reducedHeadroom.exemption).toBe(2000000);
  });

  it("applies Section 54F proportional formula and disqualification rules", () => {
    // Disqualified if taxpayer owns more than 1 residential house
    const disqualified = calculateSection54FExemption({
      ltcg: 5000000,
      netConsideration: 10000000,
      newHouseInvestment: 10000000,
      residentialHousesOwned: 2,
    });
    expect(disqualified.exemption).toBe(0);
    expect(disqualified.notes[0]).toContain("Ineligible: Assessee owns more than 1 residential house");

    // Proportional formula: LTCG * (Reinvested / Net Consideration)
    // LTCG = 60L, Consideration = 1 Cr, Reinvested = 50L -> Exemption = 60L * (50L / 100L) = 30L
    const proportional = calculateSection54FExemption({
      ltcg: 6000000,
      netConsideration: 10000000,
      newHouseInvestment: 5000000,
      cgasDeposit: 0,
      residentialHousesOwned: 1,
    });
    expect(proportional.exemption).toBe(3000000);

    // Full reinvestment of net consideration shelters 100% of LTCG
    const full = calculateSection54FExemption({
      ltcg: 6000000,
      netConsideration: 10000000,
      newHouseInvestment: 8000000,
      cgasDeposit: 2000000, // Total reinvested = 100L = Consideration
      residentialHousesOwned: 0,
    });
    expect(full.exemption).toBe(6000000);
  });

  it("computes accurate statutory deadlines based on transfer date", () => {
    const deadlines = calculateStatutoryDeadlines("2025-05-10");
    expect(deadlines).toHaveLength(4);

    const bondDl = deadlines.find((d) => d.key === "54ec_bond");
    expect(bondDl).toBeDefined();
    expect(bondDl?.badge).toContain("6 Months");

    const cgasDl = deadlines.find((d) => d.key === "cgas_deposit");
    expect(cgasDl).toBeDefined();
    expect(cgasDl?.badge).toContain("Sec 139(1)");

    const purchaseDl = deadlines.find((d) => d.key === "house_purchase");
    expect(purchaseDl).toBeDefined();
    expect(purchaseDl?.badge).toContain("2 Years");

    const constructDl = deadlines.find((d) => d.key === "house_construction");
    expect(constructDl).toBeDefined();
    expect(constructDl?.badge).toContain("3 Years");
  });
});

describe("CapitalGainsExemptionStudio Component UI & Cross-Check", () => {
  const mockState = {
    bonds: [
      {
        id: "bond-nhai-1",
        name: "NHAI 54EC Capital Gains Bond Series XXIV",
        securityNature: "54EC Capital Gains Bond",
        totalInvestmentAmount: 1500000,
        couponRate: 5.25,
      },
    ],
    stocks: [
      {
        id: "stk-1",
        name: "Tata Consultancy Services",
        symbol: "TCS",
        buyDate: "2024-01-01",
        buyPrice: 3500,
        currentPrice: 4000,
        qty: 50,
      },
    ],
    stockSells: [],
    mfSells: [],
    mutualFunds: [],
  };

  it("renders the studio with key sections and allows switching sub-tabs", () => {
    const showToast = vi.fn();
    render(
      <CapitalGainsExemptionStudio
        state={mockState}
        currentFYLTCG={250000}
        showToast={showToast}
      />
    );

    expect(
      screen.getByText(/Capital Gains Exemption Studio \(Sec 54, 54EC, 54F & CGAS\)/i)
    ).toBeInTheDocument();

    // Verify radar metrics
    expect(screen.getByText(/Gross Capital Gain \(LTCG\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Exemption Claimed/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Tax Saved/i)).toBeInTheDocument();

    // Switch to Deadlines Radar tab
    fireEvent.click(screen.getByText(/Statutory Deadlines Radar/i));
    expect(screen.getByText(/Section 54EC Bond Subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/CGAS 1988 Bank Deposit/i)).toBeInTheDocument();

    // Switch to Portfolio Cross-Reference tab
    fireEvent.click(screen.getByText(/Portfolio Cross-Reference/i));
    expect(screen.getByText(/NHAI 54EC Capital Gains Bond Series XXIV/i)).toBeInTheDocument();
    expect(screen.getByText(/Current FY Realized Long-Term Capital Gains/i)).toBeInTheDocument();

    // Switch to Tax Law Provisions tab
    fireEvent.click(screen.getByText(/Tax Law Provisions & Caps/i));
    expect(screen.getAllByText(/Residential House Transfer/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Capital Gains Bonds/i).length).toBeGreaterThanOrEqual(1);
  });

  it("integrates seamlessly into CapitalGainsTab navigation", () => {
    render(<CapitalGainsTab state={mockState} />);

    // Check that the new sub-navigation button is rendered
    const exemptionTabBtn = screen.getByText(/Sec 54 \/ 54EC \/ 54F Exemption Studio/i);
    expect(exemptionTabBtn).toBeInTheDocument();

    // Clicking it activates the Exemption Studio view
    fireEvent.click(exemptionTabBtn);
    expect(
      screen.getByText(/Capital Gains Exemption Studio \(Sec 54, 54EC, 54F & CGAS\)/i)
    ).toBeInTheDocument();
  });
});
