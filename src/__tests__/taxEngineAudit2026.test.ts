import { describe, it, expect } from "vitest";
import {
  getTaxpayerAge,
  cap80CCD2,
  compute80GG,
  getAutoDetectedDeductions,
  getTaxDueForDashboard,
  computeAdvanceTaxSchedule,
  calcTaxNewByFY,
  calcTaxOldByFY,
  isBondOutstanding,
} from "../utils/finance";
import { computeNetWorthAsOf } from "../utils/netWorthAsOf";

const FY = "2025-26";
const slips = (basic: number, hra: number) =>
  ["2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"].map(
    (slipMonth) => ({ slipMonth, basic, hra, da: 0 })
  );

describe("Taxpayer age (self DOB, reckoned for the whole FY)", () => {
  it("reads DOB from the self family profile — state.profile never stores one", () => {
    const state = { profile: { fy: FY }, masterData: { familyProfiles: [{ id: "self", dob: "1960-01-15" }] } };
    expect(getTaxpayerAge(state, FY)).toBe(66);
  });

  it("treats someone turning 60 late in the FY as a senior for that whole year", () => {
    // Turns 60 on 10 Mar 2026 — still within FY 2025-26.
    const state = { masterData: { familyProfiles: [{ id: "self", dob: "1966-03-10" }] } };
    expect(getTaxpayerAge(state, FY)).toBe(60);
  });

  it("applies the CBDT rule that a 1 April birthday attains the age on 31 March", () => {
    const born1Apr = { masterData: { familyProfiles: [{ id: "self", dob: "1966-04-01" }] } };
    const born2Apr = { masterData: { familyProfiles: [{ id: "self", dob: "1966-04-02" }] } };
    expect(getTaxpayerAge(born1Apr, FY)).toBe(60);
    expect(getTaxpayerAge(born2Apr, FY)).toBe(59);
  });

  it("gives a senior the ₹3L old-regime exemption via the dashboard tax path", () => {
    const base = { profile: { fy: FY, regime: "old" } };
    const young = { ...base, masterData: { familyProfiles: [{ id: "self", dob: "1990-01-01" }] } };
    const senior = { ...base, masterData: { familyProfiles: [{ id: "self", dob: "1958-01-01" }] } };
    expect(getTaxDueForDashboard(senior, 900_000)).toBeLessThan(getTaxDueForDashboard(young, 900_000));
  });
});

describe("Sec 80CCD(2) employer NPS cap", () => {
  it("caps at 14% of Basic+DA in the new regime and 10% in the old regime", () => {
    expect(cap80CCD2(200_000, 1_000_000, "new", FY)).toBe(140_000);
    expect(cap80CCD2(200_000, 1_000_000, "old", FY)).toBe(100_000);
    expect(cap80CCD2(50_000, 1_000_000, "new", FY)).toBe(50_000);
  });

  it("uses 10% in the new regime before FY 2024-25", () => {
    expect(cap80CCD2(200_000, 1_000_000, "new", "2023-24")).toBe(100_000);
  });

  it("passes the claim through when there is no salary base to cap against", () => {
    expect(cap80CCD2(200_000, 0, "new", FY)).toBe(200_000);
  });
});

describe("HRA Rule 2A and Sec 80GG", () => {
  const rented = (city: string) => [
    { id: "r1", city, payments: [{ date: "2025-06-01", amount: 360_000 }] },
  ];

  it("uses 40% of salary for non-metro and 50% for metro cities", () => {
    const base = { salarySlips: slips(50_000, 30_000) }; // Basic ₹6L, HRA ₹3.6L
    const pune = getAutoDetectedDeductions({ ...base, rentedProperties: rented("Pune") }, FY);
    const mumbai = getAutoDetectedDeductions({ ...base, rentedProperties: rented("Mumbai") }, FY);
    // Least of HRA 3.6L, rent − 10% basic = 3.0L, 40%/50% basic = 2.4L / 3.0L
    expect(pune.hra).toBe(240_000);
    expect(mumbai.hra).toBe(300_000);
  });

  it("allows the profile to override metro detection", () => {
    const state = {
      profile: { hraMetro: true },
      salarySlips: slips(50_000, 30_000),
      rentedProperties: rented("Pune"),
    };
    expect(getAutoDetectedDeductions(state, FY).hra).toBe(300_000);
  });

  it("gives nil HRA exemption when salary slips carry no HRA, routing rent to 80GG", () => {
    const state = { salarySlips: slips(50_000, 0), rentedProperties: rented("Pune") };
    const auto = getAutoDetectedDeductions(state, FY);
    expect(auto.hra).toBe(0);
    expect(auto.rentWithoutHra).toBe(360_000);
  });

  it("computes 80GG as the least of ₹60K, 25% of ATI and rent − 10% of ATI", () => {
    expect(compute80GG(360_000, 1_000_000)).toBe(60_000); // ₹60K ceiling binds
    expect(compute80GG(360_000, 200_000)).toBe(50_000); // 25% of ATI binds
    expect(compute80GG(120_000, 1_000_000)).toBe(20_000); // rent − 10% ATI binds
    expect(compute80GG(50_000, 1_000_000)).toBe(0);
  });

  it("applies 80GG in the old-regime dashboard tax when HRA is nil", () => {
    const withRent = {
      profile: { fy: FY, regime: "old" },
      salarySlips: slips(50_000, 0),
      rentedProperties: rented("Pune"),
    };
    const noRent = { profile: { fy: FY, regime: "old" }, salarySlips: slips(50_000, 0) };
    expect(getTaxDueForDashboard(withRent, 1_200_000)).toBeLessThan(getTaxDueForDashboard(noRent, 1_200_000));
  });
});

describe("80TTB deposit interest and 80C sources", () => {
  const senior = { masterData: { familyProfiles: [{ id: "self", dob: "1955-01-01" }] } };

  it("reads FD/RD interest from the `rate` field and skips closed deposits", () => {
    const state = {
      ...senior,
      fixedDeposits: [
        { id: "f1", principal: 300_000, rate: 8 },
        { id: "f2", principal: 900_000, rate: 8, status: "closed" },
      ],
    };
    // 3L × 8% = ₹24,000 (the closed FD and the old 6.5% default must not apply)
    expect(getAutoDetectedDeductions(state, FY).d80TTA).toBe(24_000);
  });

  it("counts a one-time NSC purchase only in the FY it was bought", () => {
    const nsc = { schemeType: "NSC", frequency: "one_time", contributionAmount: 100_000, startDate: "2025-08-01" };
    expect(getAutoDetectedDeductions({ govtSchemes: [nsc] }, FY).d80C).toBe(100_000);
    expect(getAutoDetectedDeductions({ govtSchemes: [nsc] }, "2026-27").d80C).toBe(0);
  });

  it("excludes LIC policies that matured before the FY began", () => {
    const state = {
      lic: [
        { annualPremium: 40_000, maturityDate: "2030-01-01" },
        { annualPremium: 25_000, maturityDate: "2024-12-01" },
      ],
    };
    expect(getAutoDetectedDeductions(state, FY).d80C).toBe(40_000);
  });
});

describe("Sec 234F late fee threshold", () => {
  it("tests the ₹5L threshold against total income, not tax payable", () => {
    const highIncome = computeAdvanceTaxSchedule(2024, 300_000, 0, 0, "2025-09-15", false, undefined, 2_000_000);
    const lowIncome = computeAdvanceTaxSchedule(2024, 12_000, 0, 0, "2025-09-15", false, undefined, 480_000);
    expect(highIncome.penalty234F).toBe(5000);
    expect(lowIncome.penalty234F).toBe(1000);
  });

  it("charges the standard ₹5,000 when income is unknown", () => {
    const r = computeAdvanceTaxSchedule(2024, 300_000, 0, 0, "2025-09-15", false);
    expect(r.penalty234F).toBe(5000);
  });
});

describe("Sec 288B rounding", () => {
  it("rounds final tax to the nearest ₹10 in both regimes", () => {
    for (const income of [1_337_777, 1_854_321, 2_999_999]) {
      expect(calcTaxNewByFY(income, FY).total % 10).toBe(0);
      expect(calcTaxOldByFY(income, 50_000, FY).total % 10).toBe(0);
    }
  });
});

describe("Matured bonds drop out of net worth", () => {
  const bond = {
    id: "b1",
    totalInvestmentAmount: 100_000,
    orderDate: "2021-01-01",
    maturityDate: "2024-06-30",
  };

  it("isBondOutstanding respects maturity date and redeemed status", () => {
    expect(isBondOutstanding(bond, "2024-06-30")).toBe(true);
    expect(isBondOutstanding(bond, "2024-07-01")).toBe(false);
    expect(isBondOutstanding({ ...bond, maturityDate: "" }, "2030-01-01")).toBe(true);
    expect(isBondOutstanding({ ...bond, status: "redeemed", maturityDate: "2035-01-01" }, "2025-01-01")).toBe(false);
  });

  it("the historical engine counts the bond while held and not after maturity", () => {
    const state = { bonds: [bond] };
    expect(computeNetWorthAsOf(state, "2023-12", {}).totalAssets).toBe(100_000);
    expect(computeNetWorthAsOf(state, "2025-01", {}).totalAssets).toBe(0);
  });
});
