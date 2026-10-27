import { describe, it, expect } from "vitest";
import { DOMAIN_CATEGORIES, ALL_DATA_SECTIONS } from "../components/tabs/DataExportTab";
import { getDemoState } from "../utils/demoData";
import fs from "fs";
import path from "path";

describe("Objects and Sub-Objects Architecture Audit", () => {
  it("registers all parent domain collections in DataExportTab", () => {
    expect(DOMAIN_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(ALL_DATA_SECTIONS.length).toBeGreaterThanOrEqual(44);
  });

  it("registers vehicle sub-objects (serviceHistory and insuranceHistory) with rich specs", () => {
    const vehicleMeta = ALL_DATA_SECTIONS.find((s) => s.key === "vehicles");
    expect(vehicleMeta).toBeDefined();
    expect(vehicleMeta?.subObjects).toBeDefined();
    expect(vehicleMeta?.subObjects?.length).toBe(2);

    const serviceObj = vehicleMeta?.subObjects?.find((so) => so.key === "serviceHistory");
    expect(serviceObj).toBeDefined();
    expect(serviceObj?.fields).toContain("invoiceNumber");
    expect(serviceObj?.fields).toContain("partsReplaced");

    const insObj = vehicleMeta?.subObjects?.find((so) => so.key === "insuranceHistory");
    expect(insObj).toBeDefined();
    expect(insObj?.fields).toContain("policyNumber");
    expect(insObj?.fields).toContain("idv");

    // Parent spec fields
    expect(vehicleMeta?.fields).toContain("transmission");
    expect(vehicleMeta?.fields).toContain("isFinanced");
    expect(vehicleMeta?.fields).toContain("fastagBalance");
  });

  it("registers goal sub-objects (schedule and disbursements) for cash-flow tracking", () => {
    const goalMeta = ALL_DATA_SECTIONS.find((s) => s.key === "goals");
    expect(goalMeta).toBeDefined();
    expect(goalMeta?.subObjects).toBeDefined();
    expect(goalMeta?.subObjects?.length).toBe(2);

    const scheduleObj = goalMeta?.subObjects?.find((so) => so.key === "schedule");
    expect(scheduleObj).toBeDefined();
    expect(scheduleObj?.fields).toContain("installmentNumber");
    expect(scheduleObj?.fields).toContain("amount");

    const disbObj = goalMeta?.subObjects?.find((so) => so.key === "disbursements");
    expect(disbObj).toBeDefined();
    expect(disbObj?.fields).toContain("date");
    expect(disbObj?.fields).toContain("amount");
  });

  it("registers health insurance sub-objects (insuredMembers and claims)", () => {
    const healthMeta = ALL_DATA_SECTIONS.find((s) => s.key === "healthInsurance");
    expect(healthMeta).toBeDefined();
    expect(healthMeta?.subObjects).toBeDefined();
    expect(healthMeta?.subObjects?.length).toBe(2);

    const membersObj = healthMeta?.subObjects?.find((so) => so.key === "insuredMembers");
    expect(membersObj).toBeDefined();
    expect(membersObj?.fields).toContain("name");
    expect(membersObj?.fields).toContain("entryAge");

    const claimsObj = healthMeta?.subObjects?.find((so) => so.key === "claims");
    expect(claimsObj).toBeDefined();
    expect(claimsObj?.fields).toContain("claimAmount");
    expect(claimsObj?.fields).toContain("settledAmount");
  });

  it("registers rental properties sub-objects (deposit ledger, deductions, escalations)", () => {
    const rentalMeta = ALL_DATA_SECTIONS.find((s) => s.key === "rentalProperties");
    expect(rentalMeta).toBeDefined();
    expect(rentalMeta?.subObjects).toBeDefined();
    expect(rentalMeta?.subObjects?.length).toBe(3);

    const depositObj = rentalMeta?.subObjects?.find((so) => so.key === "depositTransactions");
    expect(depositObj).toBeDefined();

    const dedObj = rentalMeta?.subObjects?.find((so) => so.key === "depositDeductions");
    expect(dedObj).toBeDefined();

    const escObj = rentalMeta?.subObjects?.find((so) => so.key === "escalations");
    expect(escObj).toBeDefined();
  });

  it("ensures demo data includes rich sub-objects for instant demonstration", () => {
    const demoState = getDemoState();
    // 1. Credit card variants
    const ccWithVariants = demoState.creditCards.filter((c: any) => c.variants && c.variants.length > 0);
    expect(ccWithVariants.length).toBeGreaterThanOrEqual(1);

    // 2. Goal schedule and disbursements
    const recurringGoals = demoState.goals.filter(
      (g: any) => g.schedule && g.schedule.length > 0 && g.disbursements && g.disbursements.length > 0
    );
    expect(recurringGoals.length).toBeGreaterThanOrEqual(1);

    // 3. Health insurance members and claims
    const healthWithSub = demoState.healthInsurance.filter(
      (h: any) => h.insuredMembers && h.insuredMembers.length > 0 && h.claims && h.claims.length > 0
    );
    expect(healthWithSub.length).toBeGreaterThanOrEqual(1);

    // 4. Rental deposit ledger
    const rentalWithDeposit = demoState.rentalProperties.filter(
      (r: any) => r.depositTransactions && r.depositTransactions.length > 0
    );
    expect(rentalWithDeposit.length).toBeGreaterThanOrEqual(1);

    // 5. Vehicles service and insurance history
    const vehiclesWithHistory = demoState.vehicles.filter(
      (v: any) => v.serviceHistory && v.serviceHistory.length > 0
    );
    expect(vehiclesWithHistory.length).toBeGreaterThanOrEqual(1);
  });

  it("ensures Migration 105 and master schema.sql are in sync with vehicles columns", () => {
    const migrationPath = path.resolve(__dirname, "../../database/105_enhance_vehicles_specs_and_subobjects.sql");
    const schemaPath = path.resolve(__dirname, "../../database/schema.sql");

    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(schemaPath)).toBe(true);

    const migrationContent = fs.readFileSync(migrationPath, "utf-8");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    const requiredColumns = [
      "transmission",
      "emission_standard",
      "fuel_efficiency",
      "fuel_capacity",
      "puc_number",
      "is_financed",
      "loan_account_number",
      "loan_amount",
      "loan_emi",
      "fastag_provider",
      "fastag_id",
      "fastag_balance",
      "current_valuation",
      "photo_url",
    ];

    for (const col of requiredColumns) {
      expect(migrationContent).toContain(col);
      expect(schemaContent).toContain(col);
    }
  });
});
