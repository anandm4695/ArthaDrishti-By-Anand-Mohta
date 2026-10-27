import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  VehiclesTab,
  IndianNumberPlate,
  VehicleModal,
  ServiceModal,
  InsuranceModal,
  resolveVehicleColor,
  PRESET_VEHICLE_COLORS,
  VehicleImage,
  VehicleImagePicker,
  VehicleStudioIllustration,
  CURATED_VEHICLE_PRESETS,
  detectVehicleBodyStyle,
  findMatchingVehiclePreset,
  normalizeVehicle,
} from "../components/tabs/VehiclesTab";
import { generateVehicleSvgDataUrl } from "../utils/vehicleAssets";
import { MasterDataContext, DEFAULT_MASTER_DATA } from "../utils/masterData";
import { PrivacyProvider } from "../context/PrivacyContext";

// Mock react-dom createPortal for server rendering tests
vi.mock("react-dom", async () => {
  const original = await vi.importActual<any>("react-dom");
  return {
    ...original,
    default: {
      ...(original.default || {}),
      createPortal: (children: any) => children,
    },
    createPortal: (children: any) => children,
  };
});

// Simple mock for recharts ResponsiveContainer
vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

// Mock animated numbers and hooks
vi.mock("../hooks/useAnimatedNumber", () => ({
  useAnimatedNumber: (val: number) => val,
}));

vi.mock("../hooks/useAsyncAction", () => ({
  useAsyncAction: (fn: any) => ({
    run: fn,
    loading: false,
    error: null,
  }),
}));

const mockState = {
  vehicles: [
    {
      id: "v1",
      make: "Tata",
      model: "Nexon EV",
      year: 2023,
      color: "Daytona Grey",
      fuelType: "electric",
      vehicleType: "four-wheeler",
      registrationNumber: "MH02EV1234",
      chassisNumber: "MAT621000N1234567",
      engineNumber: "ENG998877",
      purchaseDate: "2023-05-15",
      purchasePrice: 1650000,
      purchaseBasicCost: 1400000,
      purchaseCgstAmount: 35000,
      purchaseSgstAmount: 35000,
      rtoCharges: 80000,
      accessoriesCharges: 25000,
      currentValue: 1350000,
      currentOdometer: 14200,
      insuranceExpiry: "2026-12-31",
      pucExpiry: "2026-11-15",
      nextServiceDueDate: "2026-10-01",
      nextServiceDueOdometer: 20000,
      owner: "self",
      notes: "Installed 7.2kW AC home charger",
      serviceHistory: [
        {
          id: "s1",
          date: "2024-01-10",
          type: "regular_service",
          description: "1st Periodic Service & Software Update",
          cost: 2400,
          odometer: 7500,
          serviceCenter: "Tata Motors EV Tech Center",
          notes: "Tire rotation and brake inspection",
        },
      ],
      insuranceHistory: [
        {
          id: "i1",
          policyType: "zero_dep",
          insurer: "ACKO General Insurance",
          policyNumber: "ACKO-EV-9921",
          tenure: "1_year",
          fromDate: "2023-05-15",
          toDate: "2026-12-31",
          basicCost: 28000,
          cgstAmount: 2520,
          sgstAmount: 2520,
          totalPremium: 33040,
          notes: "Includes zero depreciation and battery pack protection",
        },
      ],
    },
    {
      id: "v2",
      make: "Royal Enfield",
      model: "Hunter 350",
      year: 2022,
      color: "Dapper Ash",
      fuelType: "petrol",
      vehicleType: "two-wheeler",
      registrationNumber: "MH01AB9876",
      purchasePrice: 195000,
      currentValue: 155000,
      currentOdometer: 8500,
      insuranceExpiry: "2026-09-10",
      pucExpiry: "2026-08-01",
      owner: "self",
      serviceHistory: [],
      insuranceHistory: [],
    },
  ],
  profile: { name: "Anand Mohta", fy: "2024-2025" },
  masterData: DEFAULT_MASTER_DATA,
};

describe("VehiclesTab Component", () => {
  it("renders the redesigned executive garage hub with fleet valuation and Indian HSRP plates", () => {
    const html = renderToString(
      <PrivacyProvider>
        <MasterDataContext.Provider value={mockState.masterData}>
          <VehiclesTab state={mockState} />
        </MasterDataContext.Provider>
      </PrivacyProvider>
    );

    expect(html).toContain("Vehicles &amp; Digital Garage");
    expect(html).toContain("Fleet Market Valuation");
    expect(html).toContain("Nexon EV");
    expect(html).toContain("Hunter 350");
    expect(html).toContain("IND");
    expect(html).toContain("MH02EV1234");
    expect(html).toContain("MH01AB9876");
    expect(html).toContain("Garage Showcase");
    expect(html).toContain("Fleet Matrix");
    expect(html).toContain("Service Center");
    expect(html).toContain("All Fleet");
    expect(html).toContain("Cars");
    expect(html).toContain("Two-Wheelers");
  });

  it("renders empty state when no vehicles are configured", () => {
    const emptyState = { ...mockState, vehicles: [] };
    const html = renderToString(
      <PrivacyProvider>
        <MasterDataContext.Provider value={mockState.masterData}>
          <VehiclesTab state={emptyState} />
        </MasterDataContext.Provider>
      </PrivacyProvider>
    );

    expect(html).toContain("Your Garage is Empty");
    expect(html).toContain("Add First Vehicle");
  });

  it("renders IndianNumberPlate component correctly with EV and standard styling", () => {
    const evPlateHtml = renderToString(
      <IndianNumberPlate registrationNumber="MH02EV1234" isElectric={true} size="md" />
    );
    expect(evPlateHtml).toContain("IND");
    expect(evPlateHtml).toContain("MH02EV1234");

    const normalPlateHtml = renderToString(
      <IndianNumberPlate registrationNumber="DL01AB9999" isElectric={false} size="sm" />
    );
    expect(normalPlateHtml).toContain("IND");
    expect(normalPlateHtml).toContain("DL01AB9999");
  });

  it("resolves various automotive paint color names and hex codes correctly", () => {
    const grey = resolveVehicleColor("Daytona Grey");
    expect(grey.hex).toBe("#475569");

    const white = resolveVehicleColor("Arctic White");
    expect(white.hex).toBe("#f8fafc");

    const red = resolveVehicleColor("Crimson Red");
    expect(red.hex).toBe("#dc2626");

    const customHex = resolveVehicleColor("#10b981");
    expect(customHex.hex).toBe("#10b981");

    expect(PRESET_VEHICLE_COLORS.length).toBeGreaterThanOrEqual(8);
  });

  it("renders VehicleModal with live color preview banner and quick preset chips", () => {
    const html = renderToString(
      <MasterDataContext.Provider value={mockState.masterData}>
        <VehicleModal onClose={() => {}} onSave={() => {}} />
      </MasterDataContext.Provider>
    );

    expect(html).toContain("Add Vehicle to Garage");
    expect(html).toContain("Fuel Type");
    expect(html).toContain("Daytona Grey");
    expect(html).toContain("Arctic White");
    expect(html).toContain("Onyx Black");
    expect(html).toContain("Popular:");
    expect(html).toContain("Tata Motors");
    expect(html).toContain("Mahindra");
  });

  it("renders ServiceModal and InsuranceModal correctly with brand logos", () => {
    const serviceHtml = renderToString(
      <MasterDataContext.Provider value={mockState.masterData}>
        <ServiceModal vehicleName="Tata Nexon EV" onClose={() => {}} onSave={() => {}} />
      </MasterDataContext.Provider>
    );
    expect(serviceHtml).toContain("Service Category");
    expect(serviceHtml).toContain("Regular Service");
    expect(serviceHtml).toContain("Service Center / Workshop");

    const insuranceHtml = renderToString(
      <MasterDataContext.Provider value={mockState.masterData}>
        <InsuranceModal vehicleName="Tata Nexon EV" onClose={() => {}} onSave={() => {}} />
      </MasterDataContext.Provider>
    );
    expect(insuranceHtml).toContain("Policy Cover Type");
    expect(insuranceHtml).toContain("Comprehensive Package");
    expect(insuranceHtml).toContain("Insurance Provider / Company");
  });

  it("resolves automotive brand logos correctly across Indian and global makes", async () => {
    const { resolveBrand, VehicleLogo } = await import("../components/ui/BrandLogos");

    const tata = resolveBrand("Tata Motors");
    expect(tata).toBeTruthy();
    expect(tata?.domain).toBe("tatamotors.com");
    expect(tata?.growwSym).toBe("TATAMOTORS");

    const maruti = resolveBrand("Maruti Suzuki");
    expect(maruti).toBeTruthy();
    expect(maruti?.domain).toBe("marutisuzuki.com");

    const mahindra = resolveBrand("Mahindra");
    expect(mahindra).toBeTruthy();
    expect(mahindra?.domain).toBe("mahindra.com");

    const royalEnfield = resolveBrand("Royal Enfield");
    expect(royalEnfield).toBeTruthy();
    expect(royalEnfield?.domain).toBe("royalenfield.com");

    const bmw = resolveBrand("BMW");
    expect(bmw).toBeTruthy();
    expect(bmw?.domain).toBe("bmw.com");

    const ather = resolveBrand("Ather Energy");
    expect(ather).toBeTruthy();
    expect(ather?.domain).toBe("atherenergy.com");

    const logoHtml = renderToString(<VehicleLogo make="Tata Motors" size={48} />);
    expect(logoHtml).toContain("img");
    expect(logoHtml).toContain("TATAMOTORS");
  });

  it("renders VehicleImage with custom photo, preset matching, and studio fallback", () => {
    // 1. Custom uploaded photo
    const customPhotoHtml = renderToString(
      <VehicleImage
        photoUrl="https://example.com/my-creta.jpg"
        make="Hyundai"
        model="Creta"
        size="md"
        showBrandBadge={true}
      />
    );
    expect(customPhotoHtml).toContain("https://example.com/my-creta.jpg");
    expect(customPhotoHtml).toContain("img");

    // 2. Curated model preset match (e.g. Tata Nexon EV)
    const presetHtml = renderToString(
      <VehicleImage
        make="Tata"
        model="Nexon EV"
        vehicleType="four-wheeler"
        color="Daytona Grey"
        size="md"
        showBrandBadge={true}
      />
    );
    expect(presetHtml).toContain("img");

    // 3. Studio SVG illustration fallback with metallic paint color
    const svgFallbackHtml = renderToString(
      <VehicleImage
        make="UnknownMake"
        model="CustomProto"
        color="Crimson Red"
        vehicleType="four-wheeler"
        size="md"
      />
    );
    expect(svgFallbackHtml).toContain("svg");
    expect(svgFallbackHtml).toContain("#dc2626"); // Crimson Red hex
  });

  it("renders VehicleStudioIllustration for various vehicle body styles and paint colors", () => {
    // SUV
    const suvHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="suv" color="Arctic White" />
    );
    expect(suvHtml).toContain("svg");
    expect(suvHtml).toContain("#f8fafc");

    // Sedan
    const sedanHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="sedan" color="Royal Blue" />
    );
    expect(sedanHtml).toContain("svg");
    expect(sedanHtml).toContain("#1d4ed8");

    // Cruiser motorcycle
    const cruiserHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="cruiser" color="Dapper Ash" />
    );
    expect(cruiserHtml).toContain("svg");
    expect(cruiserHtml).toContain("#64748b");

    // EV Scooter
    const scooterHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="scooter" color="Space Grey" isElectric={true} />
    );
    expect(scooterHtml).toContain("svg");
    expect(scooterHtml).toContain("#06b6d4"); // Electric cyan accent
  });

  it("accurately detects vehicle body styles from name, model, and category", () => {
    expect(detectVehicleBodyStyle("Hyundai", "Creta", "four-wheeler")).toBe("suv");
    expect(detectVehicleBodyStyle("Honda", "City", "four-wheeler")).toBe("sedan");
    expect(detectVehicleBodyStyle("Maruti Suzuki", "Swift", "four-wheeler")).toBe("hatchback");
    expect(detectVehicleBodyStyle("Royal Enfield", "Hunter 350", "two-wheeler")).toBe("cruiser");
    expect(detectVehicleBodyStyle("Ather Energy", "450X Gen 3", "two-wheeler")).toBe("scooter");
    expect(detectVehicleBodyStyle("KTM", "390 Duke", "two-wheeler")).toBe("sportsbike");
    expect(detectVehicleBodyStyle("Tata", "Ace EV", "commercial")).toBe("commercial");
  });

  it("matches curated vehicle presets from make and model query with strict discrimination", () => {
    // Exact or distinctive model matches
    const creta = findMatchingVehiclePreset("Hyundai", "Creta");
    expect(creta).toBeTruthy();
    expect(creta?.id).toBe("hyundai-creta");
    expect(creta?.imageUrl).toBeTruthy();

    const nexon = findMatchingVehiclePreset("Tata", "Nexon EV");
    expect(nexon).toBeTruthy();
    expect(nexon?.id).toBe("tata-nexon-ev");

    const ather = findMatchingVehiclePreset("Ather Energy", "450X");
    expect(ather).toBeTruthy();
    expect(ather?.id).toBe("ather-450x");

    const thar = findMatchingVehiclePreset("Mahindra", "Thar");
    expect(thar).toBeTruthy();
    expect(thar?.id).toBe("mahindra-thar");

    const swift = findMatchingVehiclePreset("Maruti Suzuki", "Swift");
    expect(swift).toBeTruthy();
    expect(swift?.id).toBe("maruti-swift");

    const hunter = findMatchingVehiclePreset("Royal Enfield", "Hunter 350");
    expect(hunter).toBeTruthy();
    expect(hunter?.id).toBe("royal-enfield-hunter-350");

    // Strict discrimination: prevent make-only hijacking!
    expect(findMatchingVehiclePreset("Tata", "Tiago")).toBeNull();
    expect(findMatchingVehiclePreset("Tata", "Punch")).toBeNull();
    expect(findMatchingVehiclePreset("Tata", "")).toBeNull();
    expect(findMatchingVehiclePreset("Hyundai", "")).toBeNull();
    expect(findMatchingVehiclePreset("Maruti Suzuki", "WagonR")).toBeNull();
    expect(findMatchingVehiclePreset("Hyundai", "Venue")).toBeNull();

    expect(CURATED_VEHICLE_PRESETS.length).toBeGreaterThanOrEqual(15);
  });

  it("normalizes legacy vehicle records and multi-word brand names accurately", () => {
    // Multi-word make: Maruti Suzuki
    const v1 = normalizeVehicle({ name: "Maruti Suzuki Swift VXi 2021" });
    expect(v1.make).toBe("Maruti Suzuki");
    expect(v1.model).toBe("Swift VXi 2021");

    // Multi-word make: Royal Enfield
    const v2 = normalizeVehicle({ name: "Royal Enfield Hunter 350 Dapper Ash" });
    expect(v2.make).toBe("Royal Enfield");
    expect(v2.model).toBe("Hunter 350 Dapper Ash");

    // Multi-word make: Ather Energy
    const v3 = normalizeVehicle({ name: "Ather Energy 450X Gen 3" });
    expect(v3.make).toBe("Ather Energy");
    expect(v3.model).toBe("450X Gen 3");

    // Multi-word make: Mercedes-Benz
    const v4 = normalizeVehicle({ name: "Mercedes-Benz C-Class 220d" });
    expect(v4.make).toBe("Mercedes-Benz");
    expect(v4.model).toBe("C-Class 220d");

    // Single-word make: Hyundai
    const v5 = normalizeVehicle({ name: "Hyundai Creta SX (O) 1.5 Turbo" });
    expect(v5.make).toBe("Hyundai");
    expect(v5.model).toBe("Creta SX (O) 1.5 Turbo");

    // Already normalized vehicle
    const v6 = normalizeVehicle({ make: "Tata", model: "Nexon EV", name: "Tata Nexon EV" });
    expect(v6.make).toBe("Tata");
    expect(v6.model).toBe("Nexon EV");
    expect(v6.name).toBe("Tata Nexon EV");
  });

  it("renders model-specific styling cues in VehicleStudioIllustration", () => {
    // 1. Thar tailgate mounted spare wheel
    const tharHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="suv" make="Mahindra" model="Thar" color="Crimson Red" />
    );
    expect(tharHtml).toContain("transform=\"translate(24, 116)\"");
    expect(tharHtml).toContain("r=\"19\"");

    // 2. Ather smart interactive ring and mono-shock accent
    const atherHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="scooter" make="Ather Energy" model="450X" color="Space Grey" isElectric={true} />
    );
    expect(atherHtml).toContain("#06b6d4"); // Cyan smart ring

    // 3. Ola twin spherical projector headlamps
    const olaHtml = renderToString(
      <VehicleStudioIllustration bodyStyle="scooter" make="Ola Electric" model="S1 Pro" color="Porcelain White" isElectric={true} />
    );
    expect(olaHtml).toContain("circle cx=\"230\" cy=\"94\"");
    expect(olaHtml).toContain("circle cx=\"241\" cy=\"94\"");
  });

  it("generates valid vector SVG data URLs without network dependency", () => {
    const dataUrl = generateVehicleSvgDataUrl({
      bodyStyle: "suv",
      make: "Hyundai",
      model: "Creta",
      color: "Arctic White",
    });
    expect(dataUrl.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(dataUrl).toContain("%3Csvg");
    expect(dataUrl).toContain("%3C%2Fsvg%3E");
  });

  it("renders VehicleImagePicker with gallery, upload, and web URL tabs", () => {
    const html = renderToString(
      <VehicleImagePicker
        photoUrl=""
        make="Hyundai"
        model="Creta"
        color="Arctic White"
        onChange={() => {}}
      />
    );

    expect(html).toContain("Vehicle Photo &amp; Avatar");
    expect(html).toContain("Garage Gallery");
    expect(html).toContain("Upload Photo");
    expect(html).toContain("Web Image Link");
    expect(html).toContain("Suggested Photo:");
    expect(html).toContain("Hyundai Creta");
  });
});

