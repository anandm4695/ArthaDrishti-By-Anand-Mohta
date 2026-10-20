import { describe, it, expect } from "vitest";
import {
  CARD_ART_PRESETS,
  getMatchingCardPreset,
  resolveCardArtwork,
  searchCardPresets,
} from "../utils/cardAssets";
import { CreditCardEntity, CardVariant } from "../types/finance";

describe("Credit Card Artwork & Variant Visuals Engine", () => {
  describe("Preset Catalog & Tag Matching", () => {
    it("contains comprehensive curated Indian & Global card designs", () => {
      expect(CARD_ART_PRESETS.length).toBeGreaterThan(25);

      const presetIds = CARD_ART_PRESETS.map((p) => p.id);
      expect(presetIds).toContain("hdfc-infinia");
      expect(presetIds).toContain("hdfc-regalia-gold");
      expect(presetIds).toContain("icici-amazon-pay");
      expect(presetIds).toContain("icici-sapphiro");
      expect(presetIds).toContain("federal-scapia");
      expect(presetIds).toContain("federal-scapia-rupay");
      expect(presetIds).toContain("sbi-cashback");
      expect(presetIds).toContain("amex-platinum");
      expect(presetIds).toContain("onecard-metal");
    });

    it("correctly matches HDFC Infinia card presets", () => {
      const match = getMatchingCardPreset("HDFC Bank Infinia Metal", "Visa");
      expect(match).toBeDefined();
      expect(match?.id).toBe("hdfc-infinia");
      expect(match?.category).toBe("metal");
      expect(match?.bgGradient).toContain("#1e2530");
    });

    it("matches Federal Scapia Visa vs RuPay virtual variant accurately", () => {
      const visaMatch = getMatchingCardPreset("Federal Scapia Card", "Visa");
      expect(visaMatch).toBeDefined();
      expect(visaMatch?.id).toBe("federal-scapia");

      const rupayMatch = getMatchingCardPreset("Scapia RuPay UPI Virtual", "RuPay");
      expect(rupayMatch).toBeDefined();
      expect(rupayMatch?.id).toBe("federal-scapia-rupay");
      expect(rupayMatch?.category).toBe("virtual");
    });

    it("matches ICICI Sapphiro dual-network configurations", () => {
      const mcMatch = getMatchingCardPreset("ICICI Sapphiro Mastercard", "Mastercard");
      expect(mcMatch).toBeDefined();
      expect(mcMatch?.id).toBe("icici-sapphiro");

      const amexMatch = getMatchingCardPreset("ICICI Sapphiro Companion Amex", "Amex");
      expect(amexMatch).toBeDefined();
      expect(amexMatch?.id).toBe("icici-sapphiro-amex");
    });

    it("matches Tata Neu Infinity RuPay card", () => {
      const match = getMatchingCardPreset("HDFC Tata Neu Infinity", "RuPay");
      expect(match).toBeDefined();
      expect(match?.id).toBe("hdfc-tata-neu-infinity");
    });

    it("matches diverse other Indian bank cards (RBL, YES Bank, BOB, Niyo, Kotak, IndusInd, IDFC)", () => {
      const rbl = getMatchingCardPreset("RBL World Safari", "Visa");
      expect(rbl?.id).toBe("rbl-world-safari");
      expect(rbl?.imageUrl).toBe("/cards/rbl-world-safari.png");

      const yes = getMatchingCardPreset("YES Bank Marquee", "Visa");
      expect(yes?.id).toBe("yes-marquee");
      expect(yes?.imageUrl).toBe("/cards/yes-marquee.png");

      const bob = getMatchingCardPreset("Bank of Baroda Eterna", "Visa");
      expect(bob?.id).toBe("bob-eterna");
      expect(bob?.imageUrl).toBe("/cards/bob-eterna.png");

      const niyo = getMatchingCardPreset("Niyo Global Forex Card", "Visa");
      expect(niyo?.id).toBe("niyo-global");
      expect(niyo?.imageUrl).toBe("/cards/niyo-global.png");

      const kotak = getMatchingCardPreset("Kotak White Reserve", "Visa");
      expect(kotak?.id).toBe("kotak-white");
      expect(kotak?.imageUrl).toBe("/cards/kotak-white.png");

      const indusind = getMatchingCardPreset("IndusInd Legend", "Visa");
      expect(indusind?.id).toBe("indusind-legend");
      expect(indusind?.imageUrl).toBe("/cards/indusind-legend.png");

      const indusindAvios = getMatchingCardPreset("IndusInd Avios Visa Infinite", "Visa");
      expect(indusindAvios?.id).toBe("indusind-avios");
      expect(indusindAvios?.imageUrl).toBe("/cards/indusind-avios.png");

      const indusindPinnacle = getMatchingCardPreset("IndusInd Pinnacle", "Visa");
      expect(indusindPinnacle?.id).toBe("indusind-pinnacle");
      expect(indusindPinnacle?.imageUrl).toBe("/cards/indusind-pinnacle.png");

      const indusindRupay = getMatchingCardPreset("IndusInd Platinum RuPay", "RuPay");
      expect(indusindRupay?.id).toBe("indusind-platinum-rupay");
      expect(indusindRupay?.imageUrl).toBe("/cards/indusind-platinum-rupay.png");

      const indusindEazy = getMatchingCardPreset("IndusInd EazyDiner Credit Card", "Visa");
      expect(indusindEazy?.id).toBe("indusind-eazydiner");
      expect(indusindEazy?.imageUrl).toBe("/cards/indusind-eazydiner.png");

      const indusindTiger = getMatchingCardPreset("IndusInd Tiger Credit Card", "Mastercard");
      expect(indusindTiger?.id).toBe("indusind-tiger");
      expect(indusindTiger?.imageUrl).toBe("/cards/indusind-tiger.png");

      const indusindSamman = getMatchingCardPreset("IndusInd Samman RuPay", "RuPay");
      expect(indusindSamman?.id).toBe("indusind-samman");
      expect(indusindSamman?.imageUrl).toBe("/cards/indusind-samman.png");

      const indusindNexxt = getMatchingCardPreset("IndusInd Nexxt Credit Card", "Mastercard");
      expect(indusindNexxt?.id).toBe("indusind-nexxt");
      expect(indusindNexxt?.imageUrl).toBe("/cards/indusind-nexxt.png");

      const idfc = getMatchingCardPreset("IDFC FIRST Wealth", "Visa");
      expect(idfc?.id).toBe("idfc-wealth");
      expect(idfc?.imageUrl).toBe("/cards/idfc-wealth.png");

      const idfcWow = getMatchingCardPreset("IDFC FIRST WOW Credit Card", "Visa");
      expect(idfcWow?.id).toBe("idfc-wow");
      expect(idfcWow?.imageUrl).toBe("/cards/idfc-wow.png");

      const sbiSave = getMatchingCardPreset("SBI SimplySAVE RuPay", "RuPay");
      expect(sbiSave?.id).toBe("sbi-simplysave");
      expect(sbiSave?.imageUrl).toBe("/cards/sbi-simplysave.png");

      const sbiElite = getMatchingCardPreset("SBI Card ELITE", "Visa");
      expect(sbiElite?.id).toBe("sbi-elite");
      expect(sbiElite?.imageUrl).toBe("/cards/sbi-elite.png");

      const hdfcMb = getMatchingCardPreset("HDFC MoneyBack+", "Visa");
      expect(hdfcMb?.id).toBe("hdfc-moneyback");
      expect(hdfcMb?.imageUrl).toBe("/cards/hdfc-moneyback.png");

      const fedCelesta = getMatchingCardPreset("Federal Bank Celesta", "Visa");
      expect(fedCelesta?.id).toBe("federal-celesta");
      expect(fedCelesta?.imageUrl).toBe("/cards/federal-celesta.png");

      const fedImperio = getMatchingCardPreset("Federal Bank Imperio", "Visa");
      expect(fedImperio?.id).toBe("federal-imperio");
      expect(fedImperio?.imageUrl).toBe("/cards/federal-imperio.png");

      const fedSignet = getMatchingCardPreset("Federal Bank Signet", "RuPay");
      expect(fedSignet?.id).toBe("federal-signet");
      expect(fedSignet?.imageUrl).toBe("/cards/federal-signet.png");

      const fedWave = getMatchingCardPreset("Federal Bank Wave RuPay", "RuPay");
      expect(fedWave?.id).toBe("federal-wave");
      expect(fedWave?.imageUrl).toBe("/cards/federal-wave.png");

      const hsbcLive = getMatchingCardPreset("HSBC Live+ Credit Card", "Visa");
      expect(hsbcLive?.id).toBe("hsbc-live-plus");
      expect(hsbcLive?.imageUrl).toBe("/cards/hsbc-live-plus.png");

      const hsbcPrem = getMatchingCardPreset("HSBC Premier Credit Card", "Mastercard");
      expect(hsbcPrem?.id).toBe("hsbc-premier");
      expect(hsbcPrem?.imageUrl).toBe("/cards/hsbc-premier.png");

      const hsbcPlat = getMatchingCardPreset("HSBC Platinum Credit Card", "Visa");
      expect(hsbcPlat?.id).toBe("hsbc-platinum");
      expect(hsbcPlat?.imageUrl).toBe("/cards/hsbc-platinum.png");

      const hsbcTravel = getMatchingCardPreset("HSBC TravelOne Credit Card", "Mastercard");
      expect(hsbcTravel?.id).toBe("hsbc-travel-one");
      expect(hsbcTravel?.imageUrl).toBe("/cards/hsbc-travel-one.png");

      const iciciEmeralde = getMatchingCardPreset("ICICI Emeralde Metal Credit Card", "Visa");
      expect(iciciEmeralde?.id).toBe("icici-emeralde");
      expect(iciciEmeralde?.imageUrl).toBe("/cards/icici-emeralde.png");

      const iciciRubyx = getMatchingCardPreset("ICICI Rubyx Credit Card", "Mastercard");
      expect(iciciRubyx?.id).toBe("icici-rubyx");
      expect(iciciRubyx?.imageUrl).toBe("/cards/icici-rubyx.png");

      const iciciCoral = getMatchingCardPreset("ICICI Coral RuPay Credit Card", "RuPay");
      expect(iciciCoral?.id).toBe("icici-coral-rupay");
      expect(iciciCoral?.imageUrl).toBe("/cards/icici-coral.png");

      const iciciMmt = getMatchingCardPreset("ICICI MakeMyTrip Credit Card", "Visa");
      expect(iciciMmt?.id).toBe("icici-makemytrip");
      expect(iciciMmt?.imageUrl).toBe("/cards/icici-makemytrip.png");
    });
  });

  describe("searchCardPresets", () => {
    it("filters presets by query and category filter", () => {
      const allResults = searchCardPresets("hdfc", "all");
      expect(allResults.length).toBeGreaterThan(2);

      const metalResults = searchCardPresets("hdfc", "metal");
      expect(metalResults.some((p) => p.id === "hdfc-infinia")).toBe(true);
    });

    it("returns all presets when search query is empty", () => {
      const all = searchCardPresets("", "all");
      expect(all.length).toBe(CARD_ART_PRESETS.length);
    });
  });

  describe("resolveCardArtwork", () => {
    it("resolves preset artwork and official bank website image URL when matching name is provided without custom image", () => {
      const art = resolveCardArtwork({
        issuer: "SBI Cashback Card",
        network: "Visa",
      });

      expect(art.presetName).toBe("SBI Cashback Card");
      expect(art.hasCustomImage).toBe(false);
      expect(art.bgGradient).toContain("#522f91");
      expect(art.accentColor).toBe("#fedf00");
      expect(art.imageUrl).toMatch(/sbi-cashback|sbicard\.com/);
    });

    it("has authentic official bank website/CDN image URLs for top Indian credit cards", () => {
      const infinia = getMatchingCardPreset("HDFC Infinia Metal", "Visa");
      expect(infinia?.imageUrl).toMatch(/cards\/hdfc-infinia|hdfcbankPWS/);
      expect(infinia?.officialImageUrl).toContain("hdfcbankPWS");

      const amzPay = getMatchingCardPreset("ICICI Amazon Pay", "Visa");
      expect(amzPay?.imageUrl).toMatch(/cards\/icici-amazon-pay|icicibank\.com/);
      expect(amzPay?.officialImageUrl).toContain("icicibank.com");

      const sbiCb = getMatchingCardPreset("SBI Cashback", "Visa");
      expect(sbiCb?.imageUrl).toMatch(/cards\/sbi-cashback|sbicard\.com/);
      expect(sbiCb?.officialImageUrl).toContain("sbicard.com");

      const axisAtlas = getMatchingCardPreset("Axis Atlas", "Visa");
      expect(axisAtlas?.imageUrl).toMatch(/cards\/axis-atlas|axis\.bank\.in/);
      expect(axisAtlas?.officialImageUrl).toContain("axis.bank.in");

      const scapia = getMatchingCardPreset("Federal Scapia Card", "Visa");
      expect(scapia?.imageUrl).toMatch(/cards\/federal-scapia|federal\.bank\.in|scapia\.cards/);

      const amexPlat = getMatchingCardPreset("American Express Platinum", "Amex");
      expect(amexPlat?.imageUrl).toMatch(/cards\/amex-platinum|aexp-static\.com/);
      expect(amexPlat?.officialImageUrl).toContain("aexp-static.com");

      const amexGold = getMatchingCardPreset("Amex Gold Card", "Amex");
      expect(amexGold?.imageUrl).toBe("/cards/amex-gold.png");
      expect(amexGold?.officialImageUrl).toContain("aexp-static.com");

      const amexReserve = getMatchingCardPreset("Amex Platinum Reserve", "Amex");
      expect(amexReserve?.imageUrl).toBe("/cards/amex-reserve.png");
      expect(amexReserve?.officialImageUrl).toContain("aexp-static.com");

      const onecard = getMatchingCardPreset("OneCard Metal", "Visa");
      expect(onecard?.imageUrl).toMatch(/cards\/onecard-metal|getonecard\.app/);
      expect(onecard?.officialImageUrl).toContain("getonecard.app");

      const scUltimate = getMatchingCardPreset("Standard Chartered Ultimate", "Visa");
      expect(scUltimate?.imageUrl).toMatch(/cards\/sc-ultimate|sc\.com/);
      expect(scUltimate?.officialImageUrl).toContain("sc.com");

      const indusindAviosCard = getMatchingCardPreset("IndusInd Avios", "Visa");
      expect(indusindAviosCard?.imageUrl).toBe("/cards/indusind-avios.png");
      expect(indusindAviosCard?.officialImageUrl).toContain("indusind.bank.in");

      const indusindLegendCard = getMatchingCardPreset("IndusInd Legend", "Visa");
      expect(indusindLegendCard?.imageUrl).toBe("/cards/indusind-legend.png");
      expect(indusindLegendCard?.officialImageUrl).toContain("indusind.bank.in");
    });

    it("prioritizes custom user-uploaded or linked image URL over preset image", () => {
      const customUrl = "https://images.unsplash.com/custom-my-card.png";
      const art = resolveCardArtwork({
        issuer: "HDFC Infinia",
        network: "Visa",
        cardImageUrl: customUrl,
      });

      expect(art.hasCustomImage).toBe(true);
      expect(art.imageUrl).toBe(customUrl);
    });

    it("handles closed cards by providing a muted grayscale visual style", () => {
      const art = resolveCardArtwork({
        issuer: "HDFC Infinia",
        network: "Visa",
        status: "closed",
      });

      expect(art.badgeText).toBe("ACCOUNT CLOSED");
      expect(art.accentColor).toBe("#71717a");
      expect(art.bgGradient).toContain("#27272a");
    });

    it("gracefully falls back to a sleek dark gradient for unknown issuers", () => {
      const art = resolveCardArtwork({
        issuer: "Local Cooperative Bank Custom CC",
        network: "Visa",
      });

      expect(art.hasCustomImage).toBe(false);
      expect(art.imageUrl).toBe("");
      expect(art.bgGradient).toBeDefined();
      expect(art.network).toBe("Visa");
    });
  });

  describe("Dual-Card and Variant Card Data Model Integrity", () => {
    it("supports cardImageUrl property on primary card entity and variants", () => {
      const variant: CardVariant = {
        id: "var-1",
        name: "Scapia RuPay UPI",
        network: "RuPay",
        last4: "8899",
        cardType: "virtual",
        status: "active",
        cardImageUrl: "https://images.unsplash.com/scapia-rupay.png",
      };

      const primaryCard: CreditCardEntity = {
        id: "cc-1",
        issuer: "Federal Scapia",
        network: "Visa",
        last4: "1234",
        limit: "500000",
        outstanding: "12500",
        cardImageUrl: "https://images.unsplash.com/scapia-visa.png",
        variants: [variant],
      };

      expect(primaryCard.cardImageUrl).toBe("https://images.unsplash.com/scapia-visa.png");
      expect(primaryCard.variants?.[0]?.cardImageUrl).toBe(
        "https://images.unsplash.com/scapia-rupay.png"
      );

      // Resolve primary art
      const primaryArt = resolveCardArtwork({
        issuer: primaryCard.issuer,
        network: primaryCard.network,
        cardImageUrl: primaryCard.cardImageUrl,
      });
      expect(primaryArt.imageUrl).toBe(primaryCard.cardImageUrl);

      // Resolve variant art
      const variantArt = resolveCardArtwork({
        name: variant.name,
        issuer: primaryCard.issuer,
        network: variant.network,
        cardImageUrl: variant.cardImageUrl,
      });
      expect(variantArt.imageUrl).toBe(variant.cardImageUrl);
    });
  });

  describe("User Requested 30 Specific Indian & Global Credit Cards", () => {
    const requiredCards: Array<{ query: string; expectedId: string; expectedImage: string }> = [
      {
        query: "HDFC Diners Club Credit Card",
        expectedId: "hdfc-diners-black",
        expectedImage: "/cards/hdfc-diners-black.png",
      },
      {
        query: "HDFC Swiggy Credit Card",
        expectedId: "hdfc-swiggy",
        expectedImage: "/cards/hdfc-swiggy.png",
      },
      {
        query: "ICICI Amazon Pay Credit Card",
        expectedId: "icici-amazon-pay",
        expectedImage: "/cards/icici-amazon-pay.png",
      },
      {
        query: "ICICI Sapphiro Amex Credit Card",
        expectedId: "icici-sapphiro-amex",
        expectedImage: "/cards/icici-sapphiro-amex.png",
      },
      {
        query: "ICICI Sapphiro Master Credit Card",
        expectedId: "icici-sapphiro",
        expectedImage: "/cards/icici-sapphiro.png",
      },
      {
        query: "Kotak Air + Credit Card",
        expectedId: "kotak-air-plus",
        expectedImage: "/cards/kotak-air-plus.png",
      },
      {
        query: "IDFC First Wealth Card",
        expectedId: "idfc-wealth",
        expectedImage: "/cards/idfc-wealth.png",
      },
      {
        query: "IDFC FIRST WOW Credit Card",
        expectedId: "idfc-wow",
        expectedImage: "/cards/idfc-wow.png",
      },
      {
        query: "Federal Scapia Credit Card",
        expectedId: "federal-scapia",
        expectedImage: "/cards/federal-scapia.png",
      },
      {
        query: "Axis Bank Airtel Credit Card",
        expectedId: "axis-airtel",
        expectedImage: "/cards/axis-airtel.png",
      },
      {
        query: "Axis Bank Atlas Credit Card",
        expectedId: "axis-atlas",
        expectedImage: "/cards/axis-atlas.png",
      },
      {
        query: "Induslnd Avios Credit Card",
        expectedId: "indusind-avios",
        expectedImage: "/cards/indusind-avios.png",
      },
      {
        query: "Standered Charted Ultimate Credit Card",
        expectedId: "sc-ultimate",
        expectedImage: "/cards/sc-ultimate.png",
      },
      {
        query: "Amex Rewards Credit Card",
        expectedId: "amex-mrcc",
        expectedImage: "/cards/amex-mrcc.png",
      },
      {
        query: "RBL World Safari Credit Card",
        expectedId: "rbl-world-safari",
        expectedImage: "/cards/rbl-world-safari.png",
      },
      {
        query: "SBI Cash Back Credit Card",
        expectedId: "sbi-cashback",
        expectedImage: "/cards/sbi-cashback.png",
      },
      {
        query: "Amex Reserve Credt Card",
        expectedId: "amex-reserve",
        expectedImage: "/cards/amex-reserve.png",
      },
      {
        query: "Yes Bank Uni Credit Card",
        expectedId: "yes-uni",
        expectedImage: "/cards/yes-uni.png",
      },
      {
        query: "Axis Bank Magnus Credit Card",
        expectedId: "axis-magnus",
        expectedImage: "/cards/axis-magnus.png",
      },
      {
        query: "Federal Bank One Metal Credit Card",
        expectedId: "federal-one-metal",
        expectedImage: "/cards/federal-one-metal.png",
      },
      {
        query: "Axis Bank ACE Credit Card",
        expectedId: "axis-ace",
        expectedImage: "/cards/axis-ace.png",
      },
      {
        query: "SBI Octane Credit Card",
        expectedId: "sbi-octane",
        expectedImage: "/cards/sbi-octane.png",
      },
      {
        query: "HSBC Credit Card",
        expectedId: "hsbc-live-plus",
        expectedImage: "/cards/hsbc-live-plus.png",
      },
      {
        query: "HSBC Live+ Credit Card",
        expectedId: "hsbc-live-plus",
        expectedImage: "/cards/hsbc-live-plus.png",
      },
      {
        query: "HSBC Premier Credit Card",
        expectedId: "hsbc-premier",
        expectedImage: "/cards/hsbc-premier.png",
      },
      {
        query: "HSBC Platinum Credit Card",
        expectedId: "hsbc-platinum",
        expectedImage: "/cards/hsbc-platinum.png",
      },
      {
        query: "HSBC TravelOne Credit Card",
        expectedId: "hsbc-travel-one",
        expectedImage: "/cards/hsbc-travel-one.png",
      },
      {
        query: "OLA Money SBI Credit Card",
        expectedId: "ola-sbi",
        expectedImage: "/cards/ola-sbi.png",
      },
      {
        query: "RBL Zomato Credit Card",
        expectedId: "rbl-zomato",
        expectedImage: "/cards/rbl-zomato.png",
      },
      {
        query: "Kotak Zen Credit Card",
        expectedId: "kotak-zen",
        expectedImage: "/cards/kotak-zen.png",
      },
      {
        query: "CITI Rewards Credit Card",
        expectedId: "citi-rewards",
        expectedImage: "/cards/citi-rewards.png",
      },
      {
        query: "Citi PremierMiles Credit Card",
        expectedId: "citi-premiermiles",
        expectedImage: "/cards/citi-premiermiles.png",
      },
      {
        query: "Citi Prestige Credit Card",
        expectedId: "citi-prestige",
        expectedImage: "/cards/citi-prestige.png",
      },
      {
        query: "Citi Cash Back Credit Card",
        expectedId: "citi-cashback",
        expectedImage: "/cards/citi-cashback.png",
      },
      {
        query: "Standered Charted Manhattan Credit Card",
        expectedId: "sc-manhattan",
        expectedImage: "/cards/sc-manhattan.png",
      },
      {
        query: "Axis Bank Flipkart Credit Card",
        expectedId: "axis-flipkart",
        expectedImage: "/cards/axis-flipkart.png",
      },
      {
        query: "ICICI Platinum  Credit Card",
        expectedId: "icici-platinum",
        expectedImage: "/cards/icici-platinum.png",
      },
      {
        query: "ICICI Emeralde Credit Card",
        expectedId: "icici-emeralde",
        expectedImage: "/cards/icici-emeralde.png",
      },
      {
        query: "ICICI Rubyx Credit Card",
        expectedId: "icici-rubyx",
        expectedImage: "/cards/icici-rubyx.png",
      },
      {
        query: "ICICI Coral Credit Card",
        expectedId: "icici-coral-rupay",
        expectedImage: "/cards/icici-coral.png",
      },
      {
        query: "ICICI MakeMyTrip Credit Card",
        expectedId: "icici-makemytrip",
        expectedImage: "/cards/icici-makemytrip.png",
      },
      {
        query: "HDFC Times Credit Card",
        expectedId: "hdfc-times",
        expectedImage: "/cards/hdfc-times.png",
      },
      {
        query: "IndusInd Bank Legend Credit Card",
        expectedId: "indusind-legend",
        expectedImage: "/cards/indusind-legend.png",
      },
      {
        query: "IndusInd Pinnacle Credit Card",
        expectedId: "indusind-pinnacle",
        expectedImage: "/cards/indusind-pinnacle.png",
      },
      {
        query: "IndusInd EazyDiner Credit Card",
        expectedId: "indusind-eazydiner",
        expectedImage: "/cards/indusind-eazydiner.png",
      },
      {
        query: "IndusInd Platinum RuPay Credit Card",
        expectedId: "indusind-platinum-rupay",
        expectedImage: "/cards/indusind-platinum-rupay.png",
      },
      {
        query: "IndusInd Tiger Credit Card",
        expectedId: "indusind-tiger",
        expectedImage: "/cards/indusind-tiger.png",
      },
      {
        query: "IndusInd Samman RuPay Credit Card",
        expectedId: "indusind-samman",
        expectedImage: "/cards/indusind-samman.png",
      },
      {
        query: "IndusInd Nexxt Credit Card",
        expectedId: "indusind-nexxt",
        expectedImage: "/cards/indusind-nexxt.png",
      },
      {
        query: "Kotak White Credit Card",
        expectedId: "kotak-white",
        expectedImage: "/cards/kotak-white.png",
      },
      {
        query: "Kotak League Platinum Credit Card",
        expectedId: "kotak-league",
        expectedImage: "/cards/kotak-league.png",
      },
      {
        query: "Kotak Mojo Platinum Credit Card",
        expectedId: "kotak-mojo",
        expectedImage: "/cards/kotak-mojo.png",
      },
      {
        query: "Kotak 811 Dream Different Credit Card",
        expectedId: "kotak-811",
        expectedImage: "/cards/kotak-811.png",
      },
      {
        query: "Kotak Royale Signature Credit Card",
        expectedId: "kotak-royale",
        expectedImage: "/cards/kotak-royale.png",
      },
      {
        query: "Kotak Privy League Signature Credit Card",
        expectedId: "kotak-privy-league",
        expectedImage: "/cards/kotak-privy-league.png",
      },
      {
        query: "Kotak IndianOil RuPay Credit Card",
        expectedId: "kotak-iocl",
        expectedImage: "/cards/kotak-iocl.png",
      },
      {
        query: "SBI SimplyClick Credit Card",
        expectedId: "sbi-simplyclick",
        expectedImage: "/cards/sbi-simplyclick.png",
      },
      {
        query: "SBI SimplySAVE RuPay Credit Card",
        expectedId: "sbi-simplysave",
        expectedImage: "/cards/sbi-simplysave.png",
      },
      { query: "SBI Card PRIME", expectedId: "sbi-prime", expectedImage: "/cards/sbi-prime.png" },
      { query: "SBI Card ELITE", expectedId: "sbi-elite", expectedImage: "/cards/sbi-elite.png" },
      {
        query: "SBI Aurum Metal Credit Card",
        expectedId: "sbi-aurum",
        expectedImage: "/cards/sbi-aurum.png",
      },
      { query: "SBI Card PULSE", expectedId: "sbi-pulse", expectedImage: "/cards/sbi-pulse.png" },
      { query: "IRCTC SBI Card", expectedId: "sbi-irctc", expectedImage: "/cards/sbi-irctc.png" },
      {
        query: "YES Bank Marquee Credit Card",
        expectedId: "yes-marquee",
        expectedImage: "/cards/yes-marquee.png",
      },
      {
        query: "YES Bank Reserv Credit Card",
        expectedId: "yes-reserv",
        expectedImage: "/cards/yes-reserv.png",
      },
      {
        query: "YES Bank Elite+ Credit Card",
        expectedId: "yes-elite",
        expectedImage: "/cards/yes-elite.png",
      },
      {
        query: "YES Bank Select Credit Card",
        expectedId: "yes-select",
        expectedImage: "/cards/yes-select.png",
      },
      {
        query: "YES Bank ACE Credit Card",
        expectedId: "yes-ace",
        expectedImage: "/cards/yes-ace.png",
      },
      {
        query: "YES FIRST Preferred Credit Card",
        expectedId: "yes-first-preferred",
        expectedImage: "/cards/yes-first-preferred.png",
      },
      {
        query: "YES Bank BYOC Credit Card",
        expectedId: "yes-byoc",
        expectedImage: "/cards/yes-byoc.png",
      },
      {
        query: "YES Bank Kiwi RuPay Credit Card",
        expectedId: "yes-kiwi",
        expectedImage: "/cards/yes-kiwi.png",
      },
      {
        query: "YES Bank Popclub Credit Card",
        expectedId: "yes-popclub",
        expectedImage: "/cards/yes-popclub.png",
      },
      {
        query: "Standard Chartered Smart Credit Card",
        expectedId: "sc-smart",
        expectedImage: "/cards/sc-smart.png",
      },
      {
        query: "Standard Chartered Rewards Credit Card",
        expectedId: "sc-rewards",
        expectedImage: "/cards/sc-rewards.png",
      },
      {
        query: "Standard Chartered EaseMyTrip Credit Card",
        expectedId: "sc-easemytrip",
        expectedImage: "/cards/sc-easemytrip.png",
      },
      {
        query: "Standard Chartered DigiSmart Credit Card",
        expectedId: "sc-digismart",
        expectedImage: "/cards/sc-digismart.png",
      },
      {
        query: "Standard Chartered Super Value Titanium",
        expectedId: "sc-super-value",
        expectedImage: "/cards/sc-super-value.png",
      },
      {
        query: "Standard Chartered Emirates World Credit Card",
        expectedId: "sc-emirates",
        expectedImage: "/cards/sc-emirates.png",
      },
      {
        query: "Standard Chartered Platinum Rewards",
        expectedId: "sc-platinum-rewards",
        expectedImage: "/cards/sc-platinum-rewards.png",
      },
      {
        query: "Standard Chartered Beyond Credit Card",
        expectedId: "sc-beyond",
        expectedImage: "/cards/sc-beyond.png",
      },
      {
        query: "Standard Chartered Priority Visa Infinite",
        expectedId: "sc-priority",
        expectedImage: "/cards/sc-priority.png",
      },
      {
        query: "RBL World Safari Credit Card",
        expectedId: "rbl-world-safari",
        expectedImage: "/cards/rbl-world-safari.png",
      },
      {
        query: "RBL Insignia Preferred Banking Credit Card",
        expectedId: "rbl-insignia",
        expectedImage: "/cards/rbl-insignia.png",
      },
      {
        query: "RBL Icon Credit Card",
        expectedId: "rbl-icon",
        expectedImage: "/cards/rbl-icon.png",
      },
      {
        query: "RBL ShopRite Credit Card",
        expectedId: "rbl-shoprite",
        expectedImage: "/cards/rbl-shoprite.png",
      },
      {
        query: "RBL Play BookMyShow Credit Card",
        expectedId: "rbl-play",
        expectedImage: "/cards/rbl-play.png",
      },
      {
        query: "RBL Cookies Credit Card",
        expectedId: "rbl-cookies",
        expectedImage: "/cards/rbl-cookies.png",
      },
      {
        query: "RBL Popcorn Credit Card",
        expectedId: "rbl-popcorn",
        expectedImage: "/cards/rbl-popcorn.png",
      },
      {
        query: "RBL Platinum Maxima Credit Card",
        expectedId: "rbl-platinum-maxima",
        expectedImage: "/cards/rbl-platinum-maxima.png",
      },
      {
        query: "RBL Bajaj Finserv SuperCard",
        expectedId: "rbl-bfl-supercard",
        expectedImage: "/cards/rbl-bfl-supercard.png",
      },
      {
        query: "RBL IndianOil RuPay Credit Card",
        expectedId: "rbl-indianoil",
        expectedImage: "/cards/rbl-indianoil.png",
      },
      {
        query: "RBL Zomato Edition Classic",
        expectedId: "rbl-zomato",
        expectedImage: "/cards/rbl-zomato.png",
      },
      {
        query: "IDFC FIRST Private Credit Card",
        expectedId: "idfc-private",
        expectedImage: "/cards/idfc-private.png",
      },
      {
        query: "IDFC FIRST Mayura Credit Card",
        expectedId: "idfc-mayura",
        expectedImage: "/cards/idfc-mayura.png",
      },
      {
        query: "IDFC FIRST Ashva Credit Card",
        expectedId: "idfc-ashva",
        expectedImage: "/cards/idfc-ashva.png",
      },
      {
        query: "IDFC FIRST Wealth Credit Card",
        expectedId: "idfc-wealth",
        expectedImage: "/cards/idfc-wealth.png",
      },
      {
        query: "IDFC FIRST Select Credit Card",
        expectedId: "idfc-select",
        expectedImage: "/cards/idfc-select.png",
      },
      {
        query: "IDFC FIRST Millennia Credit Card",
        expectedId: "idfc-millennia",
        expectedImage: "/cards/idfc-millennia.png",
      },
      {
        query: "IDFC FIRST Classic Credit Card",
        expectedId: "idfc-classic",
        expectedImage: "/cards/idfc-classic.png",
      },
      {
        query: "IDFC FIRST WOW! Credit Card",
        expectedId: "idfc-wow",
        expectedImage: "/cards/idfc-wow.png",
      },
      {
        query: "IDFC FIRST SWYP Credit Card",
        expectedId: "idfc-swyp",
        expectedImage: "/cards/idfc-swyp.png",
      },
      {
        query: "IDFC FIRST HPCL Power+ Credit Card",
        expectedId: "idfc-hpcl-power",
        expectedImage: "/cards/idfc-hpcl-power.png",
      },
      {
        query: "IDFC FIRST Club Vistara Credit Card",
        expectedId: "idfc-vistara",
        expectedImage: "/cards/idfc-vistara.png",
      },
    ];

    it.each(requiredCards)(
      "accurately matches query '$query' to preset $expectedId with image $expectedImage",
      ({ query, expectedId, expectedImage }) => {
        const match = getMatchingCardPreset(query);
        expect(match).toBeDefined();
        expect(match?.id).toBe(expectedId);
        expect(match?.imageUrl).toBe(expectedImage);
      }
    );
  });

  describe("Diners Club Brand & Variant Artwork", () => {
    it("accurately matches HDFC Diners Club Privilege with dedicated preset and badge", () => {
      const match = getMatchingCardPreset("HDFC Diners Club Privilege");
      expect(match).toBeDefined();
      expect(match?.id).toBe("hdfc-diners-privilege");
      expect(match?.badgeText).toBe("DINERS CLUB PRIVILEGE");
      expect(match?.network).toBe("Diners");
    });

    it("accurately matches HDFC Diners Club Black", () => {
      const match = getMatchingCardPreset("HDFC Diners Club Black");
      expect(match).toBeDefined();
      expect(match?.id).toBe("hdfc-diners-black");
      expect(match?.badgeText).toBe("DINERS CLUB BLACK");
      expect(match?.network).toBe("Diners");
    });
  });
});
