import { describe, it, expect } from "vitest";
import { rankCardsForPayment, generateCategoryCardMatrix } from "../utils/cardRewardEngine";

describe("Smart Card Reward Engine - Which Card to Use?", () => {
  const samplePortfolio = [
    {
      id: "card-hdfc-swiggy",
      issuer: "HDFC Swiggy Credit Card",
      network: "Mastercard",
      limit: 300000,
      outstanding: 25000,
      status: "active",
      last4: "1234",
    },
    {
      id: "card-icici-amazon",
      issuer: "ICICI Amazon Pay",
      network: "Visa",
      limit: 250000,
      outstanding: 10000,
      status: "active",
      last4: "5678",
    },
    {
      id: "card-sbi-cb",
      issuer: "SBI Cashback Credit Card",
      network: "Visa",
      limit: 200000,
      outstanding: 15000,
      status: "active",
      last4: "9012",
    },
    {
      id: "card-sc-ultimate",
      issuer: "Standard Chartered Ultimate",
      network: "Visa",
      limit: 500000,
      outstanding: 50000,
      status: "active",
      last4: "3456",
    },
    {
      id: "card-scapia",
      issuer: "Federal Scapia",
      network: "Visa",
      limit: 400000,
      outstanding: 5000,
      status: "active",
      last4: "7890",
    },
  ];

  it("identifies Swiggy and ranks HDFC Swiggy card as #1 with 10% cashback", () => {
    const result = rankCardsForPayment(samplePortfolio, "Swiggy", "Food & Dining", 1500);

    expect(result.merchantName).toBe("Swiggy");
    expect(result.topCard).not.toBeNull();
    expect(result.topCard?.cardName).toContain("HDFC Swiggy");
    expect(result.topCard?.returnPct).toBe(10.0);
    expect(result.topCard?.savingsInINR).toBe(150); // 10% of 1500
    expect(result.topCard?.perkType).toBe("cashback");

    // Runner ups should include SBI Cashback (5%) and SC Ultimate (3.33%)
    const sbiCb = result.rankedCards.find((c) => c.cardName.includes("SBI Cashback"));
    expect(sbiCb?.returnPct).toBe(5.0);
    expect(sbiCb?.savingsInINR).toBe(75);

    const scUlt = result.rankedCards.find((c) =>
      c.cardName.includes("Standard Chartered Ultimate")
    );
    expect(scUlt?.returnPct).toBe(3.33);
  });

  it("ranks ICICI Amazon Pay as #1 for Amazon purchases with 5% unlimited cashback", () => {
    const result = rankCardsForPayment(samplePortfolio, "Amazon", "Online Shopping", 5000);

    expect(result.topCard).not.toBeNull();
    expect(result.topCard?.returnPct).toBe(5.0);
    expect(result.topCard?.savingsInINR).toBe(250); // 5% of 5000
    expect(["ICICI Amazon Pay", "SBI Cashback Credit Card"]).toContain(result.topCard?.cardName);
  });

  it("ranks Federal Scapia as #1 for international forex spends", () => {
    const result = rankCardsForPayment(
      samplePortfolio,
      "International Travel",
      "International Spends",
      50000
    );

    expect(result.topCard).not.toBeNull();
    expect(result.topCard?.cardName).toContain("Federal Scapia");
    expect(result.topCard?.returnPct).toBeGreaterThanOrEqual(4.0);
  });

  it("generates an at-a-glance Category Matrix across all key everyday categories", () => {
    const matrix = generateCategoryCardMatrix(samplePortfolio);

    expect(matrix.length).toBe(8);
    const foodCat = matrix.find((m) => m.category === "Food & Dining");
    expect(foodCat).toBeDefined();
    expect(foodCat?.bestCard?.cardName).toContain("HDFC Swiggy");
    expect(foodCat?.bestCard?.returnPct).toBe(10.0);

    const travelCat = matrix.find((m) => m.category === "Travel & Flights");
    expect(travelCat?.bestCard).not.toBeNull();
  });

  it("suggests a smart market upgrade if user doesn't own the best card for a merchant", () => {
    // User only has a generic card
    const limitedPortfolio = [
      {
        id: "generic-1",
        issuer: "Basic Bank Silver Card",
        limit: 100000,
        outstanding: 0,
        status: "active",
      },
    ];

    const result = rankCardsForPayment(limitedPortfolio, "Swiggy", "Food & Dining", 2000);
    expect(result.topCard?.returnPct).toBe(1.0); // 1% fallback
    expect(result.bestMarketAlternative).not.toBeNull();
    expect(result.bestMarketAlternative?.returnPct).toBeGreaterThanOrEqual(10.0);
    expect(result.bestMarketAlternative?.savingsInINR).toBeGreaterThanOrEqual(200);
  });

  it("identifies IndusInd Legend BookMyShow BOGO and IndusInd Avios travel benefits", () => {
    const indusindPortfolio = [
      { id: "c1", issuer: "IndusInd Legend", limit: 300000, outstanding: 0, status: "active" },
      {
        id: "c2",
        issuer: "IndusInd Avios Visa Infinite",
        limit: 500000,
        outstanding: 0,
        status: "active",
      },
    ];

    const movieResult = rankCardsForPayment(indusindPortfolio, "BookMyShow", "Entertainment", 800);
    expect(movieResult.topCard).not.toBeNull();
    expect(["IndusInd Legend", "IndusInd Avios Visa Infinite"]).toContain(
      movieResult.topCard?.cardName
    );
    expect(movieResult.topCard?.returnPct).toBe(50.0);

    const travelResult = rankCardsForPayment(
      indusindPortfolio,
      "International Travel",
      "International Spends",
      25000
    );
    expect(travelResult.topCard).not.toBeNull();
    expect(travelResult.topCard?.cardName).toBe("IndusInd Avios Visa Infinite");
    expect(travelResult.topCard?.returnPct).toBe(6.0);
  });

  it("identifies IndusInd EazyDiner dining discount, Pinnacle e-commerce perks, and Platinum RuPay UPI", () => {
    const portfolio = [
      {
        id: "c3",
        issuer: "IndusInd Bank EazyDiner Credit Card",
        limit: 200000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "c4",
        issuer: "IndusInd Bank Pinnacle Credit Card",
        limit: 500000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "c5",
        issuer: "IndusInd Platinum RuPay",
        limit: 150000,
        outstanding: 0,
        status: "active",
      },
    ];

    const diningResult = rankCardsForPayment(portfolio, "EazyDiner", "Food & Dining", 2000);
    expect(diningResult.topCard?.cardName).toBe("IndusInd Bank EazyDiner Credit Card");
    expect(diningResult.topCard?.returnPct).toBe(25.0);
    expect(diningResult.topCard?.savingsInINR).toBe(500);

    const upiResult = rankCardsForPayment(portfolio, "Local Kirana QR", "UPI Payments", 500);
    expect(upiResult.topCard?.cardName).toBe("IndusInd Platinum RuPay");
    expect(upiResult.topCard?.returnPct).toBe(2.0);

    const onlineResult = rankCardsForPayment(portfolio, "Flipkart", "Online Shopping", 10000);
    expect(onlineResult.topCard?.cardName).toBe("IndusInd Bank Pinnacle Credit Card");
    expect(onlineResult.topCard?.returnPct).toBe(2.5);
  });

  it("identifies Kotak IndianOil RuPay fuel savings, Mojo Platinum online rewards, and White Reserve luxury perks", () => {
    const kotakPortfolio = [
      {
        id: "k1",
        issuer: "Kotak IndianOil RuPay",
        limit: 200000,
        outstanding: 0,
        status: "active",
      },
      { id: "k2", issuer: "Kotak Mojo Platinum", limit: 300000, outstanding: 0, status: "active" },
      { id: "k3", issuer: "Kotak Zen Signature", limit: 400000, outstanding: 0, status: "active" },
      { id: "k4", issuer: "Kotak White Reserve", limit: 800000, outstanding: 0, status: "active" },
    ];

    const fuelResult = rankCardsForPayment(
      kotakPortfolio,
      "IndianOil Fuel Station",
      "Fuel & Gas",
      3000
    );
    expect(fuelResult.topCard?.cardName).toBe("Kotak IndianOil RuPay");
    expect(fuelResult.topCard?.returnPct).toBe(5.0);

    const onlineResult = rankCardsForPayment(kotakPortfolio, "Amazon", "Online Shopping", 5000);
    expect(onlineResult.topCard?.cardName).toBe("Kotak Mojo Platinum");
    expect(onlineResult.topCard?.returnPct).toBe(2.0);

    const fashionResult = rankCardsForPayment(kotakPortfolio, "Myntra", "Shopping & Fashion", 4000);
    expect(fashionResult.topCard?.cardName).toBe("Kotak Zen Signature");
    expect(fashionResult.topCard?.returnPct).toBe(2.5);

    const luxuryResult = rankCardsForPayment(kotakPortfolio, "Apple", "Luxury & Shopping", 80000);
    expect(luxuryResult.topCard?.cardName).toBe("Kotak White Reserve");
    expect(luxuryResult.topCard?.returnPct).toBe(3.5);
  });

  it("identifies SBI Octane fuel return, IRCTC travel perks, SBI Cashback online savings, and Aurum luxury benefits", () => {
    const sbiPortfolio = [
      { id: "s1", issuer: "BPCL SBI Card Octane", limit: 250000, outstanding: 0, status: "active" },
      { id: "s2", issuer: "IRCTC SBI Card", limit: 200000, outstanding: 0, status: "active" },
      {
        id: "s3",
        issuer: "SBI Cashback Credit Card",
        limit: 300000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "s4",
        issuer: "SBI Aurum Metal Credit Card",
        limit: 1000000,
        outstanding: 0,
        status: "active",
      },
    ];

    const fuelResult = rankCardsForPayment(
      sbiPortfolio,
      "BPCL Petrol Pump",
      "Fuel & Automotive",
      2000
    );
    expect(fuelResult.topCard?.cardName).toBe("BPCL SBI Card Octane");
    expect(fuelResult.topCard?.returnPct).toBe(7.25);

    const trainResult = rankCardsForPayment(sbiPortfolio, "IRCTC", "Travel & Flights", 3500);
    expect(trainResult.topCard?.cardName).toBe("IRCTC SBI Card");
    expect(trainResult.topCard?.returnPct).toBe(10.0);

    const onlineResult = rankCardsForPayment(sbiPortfolio, "Amazon", "Online Shopping", 5000);
    expect(onlineResult.topCard?.cardName).toBe("SBI Cashback Credit Card");
    expect(onlineResult.topCard?.returnPct).toBe(5.0);

    const movieResult = rankCardsForPayment(sbiPortfolio, "BookMyShow", "Entertainment", 1000);
    expect(movieResult.topCard?.cardName).toBe("SBI Aurum Metal Credit Card");
    expect(movieResult.topCard?.returnPct).toBe(15.0);
  });

  it("enforces SBI Cashback 5% online return, ₹5,000/mo spend cap, and strict MCC exclusions", () => {
    const portfolio = [
      {
        id: "sbi-cb",
        issuer: "SBI Cashback Credit Card",
        limit: 300000,
        outstanding: 0,
        status: "active",
      },
    ];

    // 1. Online shopping gets 5% flat cashback
    const amazonRes = rankCardsForPayment(portfolio, "Amazon", "Online Shopping", 10000);
    expect(amazonRes.topCard?.returnPct).toBe(5.0);
    expect(amazonRes.topCard?.savingsInINR).toBe(500);
    expect(amazonRes.topCard?.maxCap).toBe("₹5,000/mo");

    // 2. Spend cap enforcement: ₹1,50,000 spend at 5% = ₹7,500 raw, but capped at ₹5,000/mo
    const largeSpendRes = rankCardsForPayment(
      portfolio,
      "Apple Store Online",
      "Online Shopping",
      150000
    );
    expect(largeSpendRes.topCard?.returnPct).toBe(5.0);
    expect(largeSpendRes.topCard?.savingsInINR).toBe(5000); // Enforces ₹5,000 cap!

    // 3. Strict Exclusions: Railways / IRCTC is 0%
    const irctcRes = rankCardsForPayment(portfolio, "IRCTC", "Travel & Flights", 3000);
    expect(irctcRes.topCard?.returnPct).toBe(0.0);
    expect(irctcRes.topCard?.savingsInINR).toBe(0);

    // 4. Strict Exclusions: Utilities & Electricity bills is 0%
    const utilRes = rankCardsForPayment(portfolio, "Electricity Bill", "Utilities & Bills", 4000);
    expect(utilRes.topCard?.returnPct).toBe(0.0);
    expect(utilRes.topCard?.savingsInINR).toBe(0);

    // 5. Strict Exclusions: Telecom bills (Airtel / Jio) is 0%
    const telecomRes = rankCardsForPayment(
      portfolio,
      "Airtel Broadband",
      "Utilities & Bills",
      1200
    );
    expect(telecomRes.topCard?.returnPct).toBe(0.0);
    expect(telecomRes.topCard?.savingsInINR).toBe(0);

    // 6. Strict Exclusions: Fuel is 0%
    const fuelRes = rankCardsForPayment(portfolio, "IndianOil Petrol Pump", "Fuel", 3000);
    expect(fuelRes.topCard?.returnPct).toBe(0.0);
    expect(fuelRes.topCard?.savingsInINR).toBe(0);

    // 7. Strict Exclusions: Education fees is 0%
    const eduRes = rankCardsForPayment(portfolio, "School Tuition", "Education", 25000);
    expect(eduRes.topCard?.returnPct).toBe(0.0);
    expect(eduRes.topCard?.savingsInINR).toBe(0);

    // 8. Strict Exclusions: Rent payment is 0%
    const rentRes = rankCardsForPayment(portfolio, "House Rent", "Rent Payments", 35000);
    expect(rentRes.topCard?.returnPct).toBe(0.0);
    expect(rentRes.topCard?.savingsInINR).toBe(0);
  });

  it("correctly ranks and evaluates YES Bank credit cards portfolio", () => {
    const yesPortfolio = [
      {
        id: "yes-mq",
        issuer: "YES Bank Marquee",
        limit: 1000000,
        outstanding: 0,
        status: "active",
      },
      { id: "yes-res", issuer: "YES Bank Reserv", limit: 500000, outstanding: 0, status: "active" },
      {
        id: "yes-kiwi",
        issuer: "YES Bank Kiwi RuPay",
        limit: 200000,
        outstanding: 0,
        status: "active",
      },
      { id: "yes-byoc", issuer: "YES Bank BYOC", limit: 300000, outstanding: 0, status: "active" },
      {
        id: "yes-uni",
        issuer: "YES Bank Uni Credit Card",
        limit: 150000,
        outstanding: 0,
        status: "active",
      },
    ];

    // 1. Marquee gets 4.5% on online retail (36 RP per ₹200)
    const onlineRes = rankCardsForPayment(yesPortfolio, "Amazon", "Online Shopping", 10000);
    expect(onlineRes.topCard?.returnPct).toBeGreaterThanOrEqual(4.5);
    const mqCard = onlineRes.rankedCards.find((c) => c.cardName === "YES Bank Marquee");
    expect(mqCard?.returnPct).toBe(4.5);
    expect(mqCard?.savingsInINR).toBe(450);

    // 2. Marquee gets BookMyShow BOGO
    const bmsRes = rankCardsForPayment(yesPortfolio, "BookMyShow", "Entertainment & Movies", 1600);
    const bmsMq = bmsRes.rankedCards.find((c) => c.cardName === "YES Bank Marquee");
    expect(bmsMq?.returnPct).toBe(4.5);
    expect(bmsMq?.badge).toBe("BOGO ₹800 BMS");

    // 3. Reserv gets 3.0% on online retail (24 RP per ₹200)
    const reservCard = onlineRes.rankedCards.find((c) => c.cardName === "YES Bank Reserv");
    expect(reservCard?.returnPct).toBe(3.0);
    expect(reservCard?.savingsInINR).toBe(300);

    // 4. Kiwi gets 2.0% on UPI / scan-and-pay
    const kiwiRes = rankCardsForPayment(yesPortfolio, "Blinkit", "Groceries & Supermarket", 2000);
    const kiwiCard = kiwiRes.rankedCards.find((c) => c.cardName === "YES Bank Kiwi RuPay");
    expect(kiwiCard?.returnPct).toBe(2.0);
    expect(kiwiCard?.savingsInINR).toBe(40);

    // 5. BYOC gets 10% on chosen category
    const byocRes = rankCardsForPayment(yesPortfolio, "Swiggy", "Food & Dining", 1000);
    expect(byocRes.topCard?.cardName).toBe("YES Bank BYOC");
    expect(byocRes.topCard?.returnPct).toBe(10.0);
    expect(byocRes.topCard?.savingsInINR).toBe(100);

    // 6. Uni gets 1.0% cashback
    const uniCard = onlineRes.rankedCards.find((c) => c.cardName === "YES Bank Uni Credit Card");
    expect(uniCard?.returnPct).toBe(1.0);
    expect(uniCard?.savingsInINR).toBe(100);
  });

  it("Standard Chartered Credit Cards Reward Engine (Phase 13)", () => {
    const scPortfolio = [
      {
        id: "sc-ultimate",
        issuer: "Standard Chartered Ultimate",
        limit: 800000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-smart",
        issuer: "Standard Chartered Smart",
        limit: 250000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-manhattan",
        issuer: "Standard Chartered Manhattan Platinum",
        limit: 300000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-rewards",
        issuer: "Standard Chartered Rewards",
        limit: 350000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-easemytrip",
        issuer: "Standard Chartered EaseMyTrip",
        limit: 400000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-digismart",
        issuer: "Standard Chartered DigiSmart",
        limit: 200000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-super-value",
        issuer: "Standard Chartered Super Value Titanium",
        limit: 250000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-emirates",
        issuer: "Standard Chartered Emirates World",
        limit: 600000,
        outstanding: 0,
        status: "active",
      },
      {
        id: "sc-platinum-rewards",
        issuer: "Standard Chartered Platinum Rewards",
        limit: 200000,
        outstanding: 0,
        status: "active",
      },
    ];

    // 1. SC Ultimate gets 3.33% universal return on retail (5 RP per ₹150; 1 RP = ₹1)
    const ultRes = rankCardsForPayment(scPortfolio, "Apple", "Electronics & Gadgets", 150000);
    const ultCard = ultRes.rankedCards.find((c) => c.cardName === "Standard Chartered Ultimate");
    expect(ultCard?.returnPct).toBe(3.33);
    expect(ultCard?.savingsInINR).toBe(4995);

    // 2. SC Smart gets 2.0% flat cashback on online spends
    const smartRes = rankCardsForPayment(scPortfolio, "Amazon", "Online Shopping", 10000);
    const smartCard = smartRes.rankedCards.find((c) => c.cardName === "Standard Chartered Smart");
    expect(smartCard?.returnPct).toBe(2.0);
    expect(smartCard?.savingsInINR).toBe(200);

    // 3. SC Manhattan gets 5.0% cashback on groceries / supermarket
    const dmartRes = rankCardsForPayment(scPortfolio, "DMart", "Groceries", 6000);
    const manhattanCard = dmartRes.rankedCards.find(
      (c) => c.cardName === "Standard Chartered Manhattan Platinum"
    );
    expect(manhattanCard?.returnPct).toBe(5.0);
    expect(manhattanCard?.savingsInINR).toBe(300);

    // 4. SC Rewards gets 4X points (2.67%) on retail shopping
    const rewardsRes = rankCardsForPayment(scPortfolio, "Flipkart", "Online Shopping", 8000);
    const rewardsCard = rewardsRes.rankedCards.find((c) => c.cardName === "Standard Chartered Rewards");
    expect(rewardsCard?.returnPct).toBe(2.67);
    expect(rewardsCard?.savingsInINR).toBe(213.6);

    // 5. SC EaseMyTrip gets 20% on EaseMyTrip hotels
    const emtRes = rankCardsForPayment(scPortfolio, "EaseMyTrip", "Travel & Flights", 10000);
    const emtCard = emtRes.rankedCards.find((c) => c.cardName === "Standard Chartered EaseMyTrip");
    expect(emtCard?.returnPct).toBe(20.0);
    expect(emtCard?.savingsInINR).toBe(2000);

    // 6. SC DigiSmart gets 20% on Myntra and 10% on Zomato
    const myntraRes = rankCardsForPayment(scPortfolio, "Myntra", "Online Shopping", 3000);
    const dsMyntra = myntraRes.rankedCards.find((c) => c.cardName === "Standard Chartered DigiSmart");
    expect(dsMyntra?.returnPct).toBe(20.0);
    expect(dsMyntra?.savingsInINR).toBe(600);

    const zomatoRes = rankCardsForPayment(scPortfolio, "Zomato", "Food & Dining", 1000);
    const dsZomato = zomatoRes.rankedCards.find((c) => c.cardName === "Standard Chartered DigiSmart");
    expect(dsZomato?.returnPct).toBe(10.0);
    expect(dsZomato?.savingsInINR).toBe(100);

    // 7. SC Super Value Titanium gets 5% on fuel and phone bills
    const fuelRes = rankCardsForPayment(scPortfolio, "HPCL", "Fuel", 2000);
    const svFuel = fuelRes.rankedCards.find(
      (c) => c.cardName === "Standard Chartered Super Value Titanium"
    );
    expect(svFuel?.returnPct).toBe(5.0);
    expect(svFuel?.savingsInINR).toBe(100);

    const airtelRes = rankCardsForPayment(scPortfolio, "Airtel", "Bills & Utilities", 1500);
    const svAirtel = airtelRes.rankedCards.find(
      (c) => c.cardName === "Standard Chartered Super Value Titanium"
    );
    expect(svAirtel?.returnPct).toBe(5.0);
    expect(svAirtel?.savingsInINR).toBe(75);

    // 8. SC Emirates World gets 4% (6 Skywards Miles per ₹150) on Emirates
    const emiratesRes = rankCardsForPayment(scPortfolio, "Emirates", "Travel & Flights", 50000);
    const emiratesCard = emiratesRes.rankedCards.find(
      (c) => c.cardName === "Standard Chartered Emirates World"
    );
    expect(emiratesCard?.returnPct).toBe(4.0);
    expect(emiratesCard?.savingsInINR).toBe(2000);

    // 9. SC Platinum Rewards gets 1.25% (5 RP per ₹150) on Dining & Fuel
    const prRes = rankCardsForPayment(scPortfolio, "Swiggy", "Food & Dining", 2000);
    const prCard = prRes.rankedCards.find(
      (c) => c.cardName === "Standard Chartered Platinum Rewards"
    );
    expect(prCard?.returnPct).toBe(1.25);
    expect(prCard?.savingsInINR).toBe(25);
  });

  it("RBL Bank Credit Cards Reward Engine (Phase 14)", () => {
    const rblPortfolio = [
      {
        id: "rbl-world-safari",
        issuer: "RBL World Safari",
        cardName: "RBL World Safari",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-insignia",
        issuer: "RBL Insignia Preferred Banking",
        cardName: "RBL Insignia Preferred Banking",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-icon",
        issuer: "RBL Icon",
        cardName: "RBL Icon",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-shoprite",
        issuer: "RBL ShopRite",
        cardName: "RBL ShopRite",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-play",
        issuer: "RBL Play BookMyShow",
        cardName: "RBL Play BookMyShow",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-cookies",
        issuer: "RBL Cookies",
        cardName: "RBL Cookies",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-popcorn",
        issuer: "RBL Popcorn",
        cardName: "RBL Popcorn",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-platinum-maxima",
        issuer: "RBL Platinum Maxima",
        cardName: "RBL Platinum Maxima",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-bfl-supercard",
        issuer: "RBL Bajaj Finserv SuperCard",
        cardName: "RBL Bajaj Finserv SuperCard",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-indianoil",
        issuer: "RBL IndianOil RuPay",
        cardName: "RBL IndianOil RuPay",
        network: "RuPay",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "rbl-zomato",
        issuer: "RBL Zomato Edition",
        cardName: "RBL Zomato Edition",
        network: "Mastercard",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
    ];

    // 1. RBL World Safari gets 5% on MakeMyTrip / Travel and 5.85% on International
    const mmtRes = rankCardsForPayment(rblPortfolio, "MakeMyTrip", "Travel & Flights", 10000);
    const safariMmt = mmtRes.rankedCards.find((c) => c.cardName === "RBL World Safari");
    expect(safariMmt?.returnPct).toBe(5.0);
    expect(safariMmt?.savingsInINR).toBe(500);

    const intlRes = rankCardsForPayment(rblPortfolio, "Forex_International", "International", 10000);
    const safariIntl = intlRes.rankedCards.find((c) => c.cardName === "RBL World Safari");
    expect(safariIntl?.returnPct).toBe(5.85);
    expect(safariIntl?.savingsInINR).toBe(585);

    // 2. RBL Insignia Preferred gets 15% on BookMyShow (BOGO up to ₹500) and 3.5% on International
    const bmsRes = rankCardsForPayment(rblPortfolio, "BookMyShow", "Movies & Cinema", 2000);
    const insigniaBms = bmsRes.rankedCards.find((c) => c.cardName === "RBL Insignia Preferred Banking");
    expect(insigniaBms?.returnPct).toBe(15.0);
    expect(insigniaBms?.savingsInINR).toBe(300);

    const insIntl = intlRes.rankedCards.find((c) => c.cardName === "RBL Insignia Preferred Banking");
    expect(insIntl?.returnPct).toBe(3.5);
    expect(insIntl?.savingsInINR).toBe(350);

    // 3. RBL Icon gets 5% on Dining (Zomato) and 10% on BookMyShow
    const iconBms = bmsRes.rankedCards.find((c) => c.cardName === "RBL Icon");
    expect(iconBms?.returnPct).toBe(10.0);
    expect(iconBms?.savingsInINR).toBe(200);

    const zomatoRes = rankCardsForPayment(rblPortfolio, "Zomato", "Food & Dining", 2000);
    const iconZomato = zomatoRes.rankedCards.find((c) => c.cardName === "RBL Icon");
    expect(iconZomato?.returnPct).toBe(5.0);
    expect(iconZomato?.savingsInINR).toBe(100);

    // 4. RBL ShopRite gets 5% on Blinkit / Groceries and 2.5% on Fuel
    const blinkitRes = rankCardsForPayment(rblPortfolio, "Blinkit", "Groceries & Essentials", 3000);
    const shopriteBlinkit = blinkitRes.rankedCards.find((c) => c.cardName === "RBL ShopRite");
    expect(shopriteBlinkit?.returnPct).toBe(5.0);
    expect(shopriteBlinkit?.savingsInINR).toBe(150);

    const fuelRes = rankCardsForPayment(rblPortfolio, "HPCL", "Fuel", 2000);
    const shopriteFuel = fuelRes.rankedCards.find((c) => c.cardName === "RBL ShopRite");
    expect(shopriteFuel?.returnPct).toBe(2.5);
    expect(shopriteFuel?.savingsInINR).toBe(50);

    // 5. RBL Play gets 10% on BookMyShow
    const playBms = bmsRes.rankedCards.find((c) => c.cardName === "RBL Play BookMyShow");
    expect(playBms?.returnPct).toBe(10.0);
    expect(playBms?.savingsInINR).toBe(200);

    // 6. RBL Cookies gets 10% on Zomato, Swiggy, Uber
    const cookiesZomato = zomatoRes.rankedCards.find((c) => c.cardName === "RBL Cookies");
    expect(cookiesZomato?.returnPct).toBe(10.0);
    expect(cookiesZomato?.savingsInINR).toBe(200);

    const uberRes = rankCardsForPayment(rblPortfolio, "Uber", "Cabs & Commute", 1000);
    const cookiesUber = uberRes.rankedCards.find((c) => c.cardName === "RBL Cookies");
    expect(cookiesUber?.returnPct).toBe(10.0);
    expect(cookiesUber?.savingsInINR).toBe(100);

    // 7. RBL Popcorn gets 12% on BookMyShow
    const popcornBms = bmsRes.rankedCards.find((c) => c.cardName === "RBL Popcorn");
    expect(popcornBms?.returnPct).toBe(12.0);
    expect(popcornBms?.savingsInINR).toBe(240);

    // 8. RBL Platinum Maxima gets 5X rewards (2.5%) on Dining and Fuel
    const swiggyRes = rankCardsForPayment(rblPortfolio, "Swiggy", "Food & Dining", 2000);
    const maximaSwiggy = swiggyRes.rankedCards.find((c) => c.cardName === "RBL Platinum Maxima");
    expect(maximaSwiggy?.returnPct).toBe(2.5);
    expect(maximaSwiggy?.savingsInINR).toBe(50);

    // 9. RBL Bajaj Finserv SuperCard gets 2% on Amazon
    const amazonRes = rankCardsForPayment(rblPortfolio, "Amazon", "Online Shopping", 5000);
    const bflAmazon = amazonRes.rankedCards.find((c) => c.cardName === "RBL Bajaj Finserv SuperCard");
    expect(bflAmazon?.returnPct).toBe(2.0);
    expect(bflAmazon?.savingsInINR).toBe(100);

    // 10. RBL IndianOil RuPay gets 8.5% at IndianOil pumps
    const ioclRes = rankCardsForPayment(rblPortfolio, "IndianOil", "Fuel", 2000);
    const ioclCard = ioclRes.rankedCards.find((c) => c.cardName === "RBL IndianOil RuPay");
    expect(ioclCard?.returnPct).toBe(8.5);
    expect(ioclCard?.savingsInINR).toBe(170);

    // 11. RBL Zomato Edition gets 5% on Zomato
    const zomatoEdition = zomatoRes.rankedCards.find((c) => c.cardName === "RBL Zomato Edition");
    expect(zomatoEdition?.returnPct).toBe(5.0);
    expect(zomatoEdition?.savingsInINR).toBe(100);
  });

  it("IDFC FIRST Bank Credit Cards Reward Engine (Phase 15)", () => {
    const idfcPortfolio = [
      {
        id: "idfc-private",
        issuer: "IDFC FIRST Private",
        cardName: "IDFC FIRST Private",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-mayura",
        issuer: "IDFC FIRST Mayura",
        cardName: "IDFC FIRST Mayura",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-ashva",
        issuer: "IDFC FIRST Ashva",
        cardName: "IDFC FIRST Ashva",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-wealth",
        issuer: "IDFC FIRST Wealth",
        cardName: "IDFC FIRST Wealth",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-select",
        issuer: "IDFC FIRST Select",
        cardName: "IDFC FIRST Select",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-millennia",
        issuer: "IDFC FIRST Millennia",
        cardName: "IDFC FIRST Millennia",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-classic",
        issuer: "IDFC FIRST Classic",
        cardName: "IDFC FIRST Classic",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-wow",
        issuer: "IDFC FIRST WOW!",
        cardName: "IDFC FIRST WOW!",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-swyp",
        issuer: "IDFC FIRST SWYP",
        cardName: "IDFC FIRST SWYP",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-hpcl-power",
        issuer: "IDFC FIRST HPCL Power+",
        cardName: "IDFC FIRST HPCL Power+",
        network: "RuPay",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
      {
        id: "idfc-vistara",
        issuer: "IDFC FIRST Club Vistara",
        cardName: "IDFC FIRST Club Vistara",
        network: "Visa",
        billingCycleDay: 1,
        paymentDueDays: 20,
      },
    ];

    // 1. IDFC FIRST Private gets 25% on BookMyShow (BOGO up to ₹750) and 5.85% on Forex
    const bmsRes = rankCardsForPayment(idfcPortfolio, "BookMyShow", "Movies & Cinema", 2000);
    const privateBms = bmsRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Private");
    expect(privateBms?.returnPct).toBe(25.0);
    expect(privateBms?.savingsInINR).toBe(500);

    const intlRes = rankCardsForPayment(idfcPortfolio, "Forex_International", "International", 10000);
    const privateIntl = intlRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Private");
    expect(privateIntl?.returnPct).toBe(5.85);
    expect(privateIntl?.savingsInINR).toBe(585);

    // 2. IDFC FIRST Mayura gets 5.85% on Forex and 20% on BMS
    const mayuraIntl = intlRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Mayura");
    expect(mayuraIntl?.returnPct).toBe(5.85);
    expect(mayuraIntl?.savingsInINR).toBe(585);

    const mayuraBms = bmsRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Mayura");
    expect(mayuraBms?.returnPct).toBe(20.0);
    expect(mayuraBms?.savingsInINR).toBe(400);

    // 3. IDFC FIRST Ashva gets 4.85% on Forex and 20% on BMS
    const ashvaIntl = intlRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Ashva");
    expect(ashvaIntl?.returnPct).toBe(4.85);
    expect(ashvaIntl?.savingsInINR).toBe(485);

    const ashvaBms = bmsRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Ashva");
    expect(ashvaBms?.returnPct).toBe(20.0);
    expect(ashvaBms?.savingsInINR).toBe(400);

    // 4. IDFC FIRST Wealth gets 25% on BMS and 4.35% on Forex
    const wealthBms = bmsRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Wealth");
    expect(wealthBms?.returnPct).toBe(25.0);
    expect(wealthBms?.savingsInINR).toBe(500);

    const wealthIntl = intlRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Wealth");
    expect(wealthIntl?.returnPct).toBe(4.35);
    expect(wealthIntl?.savingsInINR).toBe(435);

    // 5. IDFC FIRST Select gets 20% on BMS and 3.85% on Forex
    const selectBms = bmsRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Select");
    expect(selectBms?.returnPct).toBe(20.0);
    expect(selectBms?.savingsInINR).toBe(400);

    const selectIntl = intlRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Select");
    expect(selectIntl?.returnPct).toBe(3.85);
    expect(selectIntl?.savingsInINR).toBe(385);

    // 6. IDFC FIRST Millennia gets 15% on Paytm Movies and 1.5% on Amazon
    const paytmRes = rankCardsForPayment(idfcPortfolio, "Paytm", "Movies & Cinema", 1000);
    const millenniaPaytm = paytmRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Millennia");
    expect(millenniaPaytm?.returnPct).toBe(15.0);
    expect(millenniaPaytm?.savingsInINR).toBe(150);

    const amzRes = rankCardsForPayment(idfcPortfolio, "Amazon", "Online Shopping", 4000);
    const millenniaAmz = amzRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Millennia");
    expect(millenniaAmz?.returnPct).toBe(1.5);
    expect(millenniaAmz?.savingsInINR).toBe(60);

    // 7. IDFC FIRST Classic gets 15% on Paytm Movies
    const classicPaytm = paytmRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Classic");
    expect(classicPaytm?.returnPct).toBe(15.0);
    expect(classicPaytm?.savingsInINR).toBe(150);

    // 8. IDFC FIRST WOW! gets 5.85% on Forex
    const wowIntl = intlRes.rankedCards.find((c) => c.cardName === "IDFC FIRST WOW!");
    expect(wowIntl?.returnPct).toBe(5.85);
    expect(wowIntl?.savingsInINR).toBe(585);

    // 9. IDFC FIRST SWYP gets 10% on Zomato, Swiggy, and Spotify
    const zomatoRes = rankCardsForPayment(idfcPortfolio, "Zomato", "Food & Dining", 1500);
    const swypZomato = zomatoRes.rankedCards.find((c) => c.cardName === "IDFC FIRST SWYP");
    expect(swypZomato?.returnPct).toBe(10.0);
    expect(swypZomato?.savingsInINR).toBe(150);

    const spotifyRes = rankCardsForPayment(idfcPortfolio, "Spotify", "Entertainment", 500);
    const swypSpotify = spotifyRes.rankedCards.find((c) => c.cardName === "IDFC FIRST SWYP");
    expect(swypSpotify?.returnPct).toBe(10.0);
    expect(swypSpotify?.savingsInINR).toBe(50);

    // 10. IDFC FIRST HPCL Power+ gets 6.5% on HPCL fuel and 5% on Airtel utilities
    const hpclRes = rankCardsForPayment(idfcPortfolio, "HPCL", "Fuel", 2000);
    const powerHpcl = hpclRes.rankedCards.find((c) => c.cardName === "IDFC FIRST HPCL Power+");
    expect(powerHpcl?.returnPct).toBe(6.5);
    expect(powerHpcl?.savingsInINR).toBe(130);

    const airtelRes = rankCardsForPayment(idfcPortfolio, "Airtel", "Utilities & Bills", 1000);
    const powerAirtel = airtelRes.rankedCards.find((c) => c.cardName === "IDFC FIRST HPCL Power+");
    expect(powerAirtel?.returnPct).toBe(5.0);
    expect(powerAirtel?.savingsInINR).toBe(50);

    // 11. IDFC FIRST Club Vistara gets 6% on Vistara flights
    const vistaraRes = rankCardsForPayment(idfcPortfolio, "Vistara", "Travel & Flights", 10000);
    const vistaraCard = vistaraRes.rankedCards.find((c) => c.cardName === "IDFC FIRST Club Vistara");
    expect(vistaraCard?.returnPct).toBe(6.0);
    expect(vistaraCard?.savingsInINR).toBe(600);
  });
});

