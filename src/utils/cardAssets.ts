/* eslint-disable */
/**
 * Card Visual & Artwork Engine for Credit Cards & Card Variants
 * Provides an authentic, high-fidelity gallery of Indian & Global credit card designs,
 * preset matching, dynamic SVG pattern backdrops, and image compression for custom uploads.
 */

export interface CardArtPreset {
  id: string;
  name: string;
  bankName: string;
  network: "Visa" | "Mastercard" | "RuPay" | "Amex" | "Diners";
  category: "metal" | "travel" | "cashback" | "rewards" | "shopping" | "lifestyle" | "co-brand" | "virtual" | "standard";
  tags: string[];
  bgGradient: string;
  accentColor: string;
  textColor: string;
  badgeText?: string;
  patternType: "mesh" | "lines" | "filigree" | "wave" | "swoosh" | "dots" | "minimal";
  imageUrl?: string;
  officialImageUrl?: string;
  suggestedVariants?: Array<{
    name: string;
    network: "Visa" | "Mastercard" | "RuPay" | "Amex" | "Diners";
    cardType: "physical" | "virtual" | "addon";
    cardImageUrl?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE INDIAN & GLOBAL CREDIT CARD ARTWORK CATALOG
// ─────────────────────────────────────────────────────────────────────────────
export const CARD_ART_PRESETS: CardArtPreset[] = [
  // ── HDFC Bank ───────────────────────────────────────────────────────────────
  {
    id: "hdfc-infinia",
    name: "HDFC Infinia Metal",
    bankName: "HDFC Bank",
    network: "Visa",
    category: "metal",
    tags: ["infinia", "hdfc infinia", "infinia metal", "metal"],
    bgGradient: "linear-gradient(135deg, #1e2530 0%, #2b3345 50%, #161c26 100%)",
    accentColor: "#d4af37",
    textColor: "#fef08a",
    badgeText: "INFINIA METAL",
    patternType: "mesh",
    imageUrl: "/cards/hdfc-infinia.png",
    officialImageUrl: "https://s7ap1.scene7.com/is/image/hdfcbankPWS/infinia1?fmt=webp-alpha",
  },
  {
    id: "hdfc-regalia-gold",
    name: "HDFC Regalia Gold",
    bankName: "HDFC Bank",
    network: "Visa",
    category: "lifestyle",
    tags: ["regalia", "regalia gold", "hdfc regalia"],
    bgGradient: "linear-gradient(135deg, #4c0519 0%, #881337 50%, #2e020d 100%)",
    accentColor: "#f3c262",
    textColor: "#fef3c7",
    badgeText: "REGALIA GOLD",
    patternType: "filigree",
    imageUrl: "/cards/hdfc-regalia-gold.png",
    officialImageUrl: "https://s7ap1.scene7.com/is/image/hdfcbankPWS/Regalia-Gold1?fmt=webp-alpha",
  },
  {
    id: "hdfc-millennia",
    name: "HDFC Millennia",
    bankName: "HDFC Bank",
    network: "Mastercard",
    category: "cashback",
    tags: ["millennia", "hdfc millennia"],
    bgGradient: "linear-gradient(135deg, #0c2340 0%, #1e3a8a 55%, #051428 100%)",
    accentColor: "#38bdf8",
    textColor: "#f0f9ff",
    badgeText: "MILLENNIA 5%",
    patternType: "lines",
    imageUrl: "/cards/hdfc-millennia.png",
    officialImageUrl: "https://s7ap1.scene7.com/is/image/hdfcbankPWS/Millennia1?fmt=webp-alpha",
  },
  {
    id: "hdfc-swiggy",
    name: "HDFC Swiggy Card",
    bankName: "HDFC Bank",
    network: "Mastercard",
    category: "co-brand",
    tags: ["hdfc swiggy credit card", "swiggy credit card", "swiggy", "hdfc swiggy"],
    bgGradient: "linear-gradient(135deg, #ea580c 0%, #7c2d12 40%, #581c87 100%)",
    accentColor: "#fb923c",
    textColor: "#ffffff",
    badgeText: "SWIGGY 10%",
    patternType: "wave",
    imageUrl: "/cards/hdfc-swiggy.png",
    officialImageUrl: "https://s7ap1.scene7.com/is/image/hdfcbankPWS/pws-extra-4326-swiggy-black-1920-x-500?fmt=webp",
  },
  {
    id: "hdfc-tata-neu-infinity",
    name: "HDFC Tata Neu Infinity (RuPay)",
    bankName: "HDFC Bank",
    network: "RuPay",
    category: "co-brand",
    tags: ["tata neu infinity", "neu infinity", "tata neu", "neu"],
    bgGradient: "linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #1e0538 100%)",
    accentColor: "#facc15",
    textColor: "#fef08a",
    badgeText: "NEU INFINITY · RUPAY",
    patternType: "lines",
    imageUrl: "/cards/hdfc-tata-neu.png",
    officialImageUrl: "https://s7ap1.scene7.com/is/image/hdfcbankPWS/Tata-Neu-Infinity1?fmt=webp",
    suggestedVariants: [
      { name: "Tata Neu RuPay UPI (Virtual)", network: "RuPay", cardType: "virtual", cardImageUrl: "/cards/hdfc-tata-neu.png" },
      { name: "Tata Neu Companion (Visa)", network: "Visa", cardType: "physical" },
    ],
  },
  {
    id: "hdfc-diners-black",
    name: "HDFC Diners Club Black",
    bankName: "HDFC Bank",
    network: "Diners",
    category: "lifestyle",
    tags: [
      "hdfc diners club credit card",
      "diners club credit card",
      "hdfc diners club",
      "diners club black",
      "diners black",
      "diners club",
      "diners privilege",
      "diners",
    ],
    bgGradient: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #030712 100%)",
    accentColor: "#93c5fd",
    textColor: "#ffffff",
    badgeText: "DINERS CLUB BLACK",
    patternType: "mesh",
    imageUrl: "/cards/hdfc-diners-black.png",
  },
  {
    id: "hdfc-times",
    name: "HDFC Times Platinum Card",
    bankName: "HDFC Bank",
    network: "Visa",
    category: "lifestyle",
    tags: [
      "hdfc times credit card",
      "times credit card",
      "hdfc times",
      "times card",
      "times platinum",
      "hdfc times platinum",
    ],
    bgGradient: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #1e1b4b 100%)",
    accentColor: "#a5b4fc",
    textColor: "#ffffff",
    badgeText: "TIMES PLATINUM",
    patternType: "filigree",
    imageUrl: "/cards/hdfc-times.png",
  },
  {
    id: "hdfc-moneyback",
    name: "HDFC MoneyBack+",
    bankName: "HDFC Bank",
    network: "Visa",
    category: "cashback",
    tags: ["moneyback", "moneyback+", "hdfc moneyback"],
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #172554 100%)",
    accentColor: "#93c5fd",
    textColor: "#ffffff",
    badgeText: "MONEYBACK+",
    patternType: "dots",
    imageUrl: "/cards/hdfc-moneyback.png",
  },

  // ── ICICI Bank ──────────────────────────────────────────────────────────────
  {
    id: "icici-amazon-pay",
    name: "ICICI Amazon Pay",
    bankName: "ICICI Bank",
    network: "Visa",
    category: "co-brand",
    tags: [
      "icici amazon pay credit card",
      "amazon pay credit card",
      "icici amazon pay",
      "amazon pay icici",
      "amazon pay",
      "amazon",
    ],
    bgGradient: "linear-gradient(135deg, #131921 0%, #232f3e 55%, #0f1111 100%)",
    accentColor: "#ff9900",
    textColor: "#ffffff",
    badgeText: "AMAZON PAY · PRIME",
    patternType: "swoosh",
    imageUrl: "/cards/icici-amazon-pay.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank/india/managed-assets/revamp-page-images/cards/amazon/amazon-card-banner.webp",
  },
  {
    id: "icici-sapphiro",
    name: "ICICI Sapphiro (Mastercard)",
    bankName: "ICICI Bank",
    network: "Mastercard",
    category: "lifestyle",
    tags: [
      "icici sapphiro master credit card",
      "sapphiro master credit card",
      "icici sapphiro master",
      "sapphiro master",
      "icici sapphiro",
      "sapphiro world",
      "sapphiro",
    ],
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)",
    accentColor: "#60a5fa",
    textColor: "#ffffff",
    badgeText: "SAPPHIRO WORLD",
    patternType: "mesh",
    imageUrl: "/cards/icici-sapphiro.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank-revamp/credit-card/pdp/sapphiro.webp",
    suggestedVariants: [
      { name: "Sapphiro Amex (Companion)", network: "Amex", cardType: "physical", cardImageUrl: "/cards/icici-sapphiro-amex.png" },
      { name: "Sapphiro RuPay UPI", network: "RuPay", cardType: "virtual", cardImageUrl: "/cards/icici-coral.png" },
    ],
  },
  {
    id: "icici-sapphiro-amex",
    name: "ICICI Sapphiro Amex",
    bankName: "ICICI Bank",
    network: "Amex",
    category: "lifestyle",
    tags: [
      "icici sapphiro amex credit card",
      "sapphiro amex credit card",
      "icici sapphiro amex",
      "sapphiro amex",
      "sapphiro companion amex",
      "sapphiro companion",
    ],
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #0369a1 50%, #082f49 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: "SAPPHIRO · AMEX",
    patternType: "lines",
    imageUrl: "/cards/icici-sapphiro-amex.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank-revamp/credit-card/pdp/sapphiro.webp",
  },
  {
    id: "icici-platinum",
    name: "ICICI Platinum Chip Card",
    bankName: "ICICI Bank",
    network: "Visa",
    category: "shopping",
    tags: [
      "icici platinum credit card",
      "platinum credit card",
      "icici platinum",
      "platinum chip credit card",
      "platinum chip",
      "platinum chip card",
    ],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 45%, #27272a 75%, #0f172a 100%)",
    accentColor: "#94a3b8",
    textColor: "#ffffff",
    badgeText: "PLATINUM CHIP",
    patternType: "lines",
    imageUrl: "/cards/icici-platinum.png",
  },
  {
    id: "icici-coral-rupay",
    name: "ICICI Coral RuPay Credit Card",
    bankName: "ICICI Bank",
    network: "RuPay",
    category: "cashback",
    tags: [
      "icici coral credit card",
      "coral credit card",
      "coral rupay",
      "icici coral rupay",
      "coral",
      "icici coral",
    ],
    bgGradient: "linear-gradient(135deg, #9a3412 0%, #ea580c 50%, #431407 100%)",
    accentColor: "#fed7aa",
    textColor: "#ffffff",
    badgeText: "CORAL · RUPAY UPI",
    patternType: "wave",
    imageUrl: "/cards/icici-coral.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank-revamp/credit-card/pdp/coral.webp",
  },
  {
    id: "icici-emeralde",
    name: "ICICI Emeralde Metal Credit Card",
    bankName: "ICICI Bank",
    network: "Visa",
    category: "metal",
    tags: [
      "icici emeralde credit card",
      "emeralde credit card",
      "icici emeralde metal",
      "emeralde metal",
      "emeralde private",
      "emeralde",
      "icici emeralde",
    ],
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)",
    accentColor: "#facc15",
    textColor: "#fef08a",
    badgeText: "EMERALDE METAL",
    patternType: "filigree",
    imageUrl: "/cards/icici-emeralde.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank-revamp/credit-card/pdp/emeralde.webp",
  },
  {
    id: "icici-rubyx",
    name: "ICICI Rubyx Credit Card",
    bankName: "ICICI Bank",
    network: "Mastercard",
    category: "lifestyle",
    tags: [
      "icici rubyx credit card",
      "rubyx credit card",
      "icici rubyx mastercard",
      "rubyx mastercard",
      "rubyx",
      "icici rubyx",
    ],
    bgGradient: "linear-gradient(135deg, #581c87 0%, #831843 50%, #3b0764 100%)",
    accentColor: "#f472b6",
    textColor: "#ffffff",
    badgeText: "RUBYX LUXURY",
    patternType: "mesh",
    imageUrl: "/cards/icici-rubyx.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank-revamp/credit-card/pdp/rubyx.webp",
  },
  {
    id: "icici-makemytrip",
    name: "ICICI MakeMyTrip Signature Card",
    bankName: "ICICI Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "icici makemytrip credit card",
      "makemytrip credit card",
      "icici makemytrip",
      "makemytrip icici",
      "mmt signature",
      "icici mmt",
    ],
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)",
    accentColor: "#ef4444",
    textColor: "#ffffff",
    badgeText: "MMT SIGNATURE",
    patternType: "lines",
    imageUrl: "/cards/icici-makemytrip.png",
    officialImageUrl: "https://www.icicibank.com/content/dam/icicibank-revamp/credit-card/pdp/makemytrip-signature.webp",
  },

  // ── State Bank of India (SBI) ──────────────────────────────────────────────
  {
    id: "sbi-cashback",
    name: "SBI Cashback Card",
    bankName: "State Bank of India",
    network: "Visa",
    category: "cashback",
    tags: [
      "sbi cash back credit card",
      "sbi cashback credit card",
      "sbi cash back",
      "sbi cashback",
      "cashback sbi",
      "cash back credit card",
      "cashback",
    ],
    bgGradient: "linear-gradient(135deg, #003366 0%, #0284c7 50%, #082f49 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: "CASHBACK 5%",
    patternType: "lines",
    imageUrl: "/cards/sbi-cashback.png",
    officialImageUrl: "https://www.sbicard.com/static-resources/img/card/card-face-assets/for-website/front/vertical/cashback-card-face-min.png",
  },
  {
    id: "sbi-simplyclick",
    name: "SBI SimplyClick",
    bankName: "State Bank of India",
    network: "Visa",
    category: "shopping",
    tags: ["simplyclick", "simply click", "sbi simplyclick"],
    bgGradient: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 40%, #c2410c 100%)",
    accentColor: "#fdba74",
    textColor: "#ffffff",
    badgeText: "SIMPLY CLICK 10X",
    patternType: "swoosh",
    imageUrl: "/cards/sbi-simplyclick.png",
    officialImageUrl: "https://www.sbicard.com/static-resources/img/card/product-detail-assets/core-cards/simply-click/left-banner/simply-click-card-face.png",
  },
  {
    id: "sbi-prime",
    name: "SBI Card PRIME",
    bankName: "State Bank of India",
    network: "Visa",
    category: "lifestyle",
    tags: ["sbi prime", "prime", "card prime"],
    bgGradient: "linear-gradient(135deg, #172554 0%, #1e40af 50%, #0f172a 100%)",
    accentColor: "#93c5fd",
    textColor: "#ffffff",
    badgeText: "SBI PRIME",
    patternType: "mesh",
    imageUrl: "/cards/sbi-prime.png",
    officialImageUrl: "https://www.sbicard.com/static-resources/img/card/card-face-assets/for-website/front/horizontal/prime-sbi-card.png",
  },
  {
    id: "sbi-aurum",
    name: "SBI Aurum Metal",
    bankName: "State Bank of India",
    network: "Visa",
    category: "metal",
    tags: ["aurum", "sbi aurum"],
    bgGradient: "linear-gradient(135deg, #1c1917 0%, #292524 50%, #141210 100%)",
    accentColor: "#eab308",
    textColor: "#fef08a",
    badgeText: "AURUM BESPOKE",
    patternType: "filigree",
    imageUrl: "/cards/sbi-aurum.png",
    officialImageUrl: "https://www.sbicard.com/static-resources/img/card/card-face-assets/aurum-card/for-website/horizontal/aurum-card.png",
  },
  {
    id: "sbi-simplysave",
    name: "SBI SimplySAVE (RuPay)",
    bankName: "State Bank of India",
    network: "RuPay",
    category: "shopping",
    tags: ["simplysave", "simply save", "sbi simplysave"],
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #15803d 50%, #0f172a 100%)",
    accentColor: "#4ade80",
    textColor: "#ffffff",
    badgeText: "SIMPLYSAVE RUPAY",
    patternType: "lines",
    imageUrl: "/cards/sbi-simplysave.png",
  },
  {
    id: "sbi-elite",
    name: "SBI Card ELITE",
    bankName: "State Bank of India",
    network: "Visa",
    category: "metal",
    tags: ["sbi elite", "elite", "card elite"],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
    accentColor: "#facc15",
    textColor: "#fef08a",
    badgeText: "SBI ELITE LUXURY",
    patternType: "filigree",
    imageUrl: "/cards/sbi-elite.png",
  },
  {
    id: "sbi-octane",
    name: "BPCL SBI Card Octane",
    bankName: "State Bank of India",
    network: "Visa",
    category: "rewards",
    tags: [
      "sbi octane credit card",
      "sbi octane",
      "bpcl sbi octane",
      "bpcl sbi card octane",
      "bpcl octane",
      "octane credit card",
      "octane",
    ],
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0369a1 100%)",
    accentColor: "#fbbf24",
    textColor: "#ffffff",
    badgeText: "BPCL OCTANE 7.25%",
    patternType: "mesh",
    imageUrl: "/cards/sbi-octane.png",
  },
  {
    id: "ola-sbi",
    name: "OLA Money SBI Credit Card",
    bankName: "State Bank of India",
    network: "Visa",
    category: "co-brand",
    tags: [
      "ola money sbi credit card",
      "ola money sbi",
      "ola sbi",
      "ola money credit card",
      "ola money",
    ],
    bgGradient: "linear-gradient(135deg, #15803d 0%, #22c55e 50%, #052e16 100%)",
    accentColor: "#86efac",
    textColor: "#ffffff",
    badgeText: "OLA MONEY 7%",
    patternType: "swoosh",
    imageUrl: "/cards/ola-sbi.png",
  },

  // ── Axis Bank ───────────────────────────────────────────────────────────────
  {
    id: "axis-magnus",
    name: "Axis Magnus Burgundy",
    bankName: "Axis Bank",
    network: "Mastercard",
    category: "metal",
    tags: [
      "axis bank magnus credit card",
      "axis magnus credit card",
      "axis bank magnus",
      "magnus burgundy",
      "burgundy magnus",
      "axis magnus",
      "magnus",
    ],
    bgGradient: "linear-gradient(135deg, #3b0724 0%, #701a45 50%, #1f0413 100%)",
    accentColor: "#fde047",
    textColor: "#fef3c7",
    badgeText: "MAGNUS BURGUNDY",
    patternType: "filigree",
    imageUrl: "/cards/axis-magnus.png",
    officialImageUrl: "https://www.axis.bank.in/images/default-source/magnus/webp/magnus-credit-card-banner-1920x665.webp",
  },
  {
    id: "axis-atlas",
    name: "Axis Atlas Travel",
    bankName: "Axis Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "axis bank atlas credit card",
      "axis atlas credit card",
      "axis bank atlas",
      "atlas travel",
      "axis atlas",
      "atlas",
    ],
    bgGradient: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e293b 100%)",
    accentColor: "#f59e0b",
    textColor: "#fef3c7",
    badgeText: "ATLAS MILES",
    patternType: "lines",
    imageUrl: "/cards/axis-atlas.png",
    officialImageUrl: "https://www.axis.bank.in/images/default-source/atlas/png/org-img-1.png",
  },
  {
    id: "axis-airtel",
    name: "Airtel Axis Bank",
    bankName: "Axis Bank",
    network: "Mastercard",
    category: "co-brand",
    tags: [
      "axis bank airtel credit card",
      "axis airtel credit card",
      "axis bank airtel",
      "airtel axis bank",
      "airtel axis",
      "axis airtel",
      "airtel",
    ],
    bgGradient: "linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #180505 100%)",
    accentColor: "#f87171",
    textColor: "#ffffff",
    badgeText: "AIRTEL 25%",
    patternType: "wave",
    imageUrl: "/cards/axis-airtel.png",
    officialImageUrl: "https://assets.airtel.in/static-assets/cms/finance/images/Mobile_CC.png",
  },
  {
    id: "axis-ace",
    name: "Axis ACE (Google Pay)",
    bankName: "Axis Bank",
    network: "Visa",
    category: "cashback",
    tags: [
      "axis bank ace credit card",
      "axis ace credit card",
      "axis bank ace",
      "axis ace",
      "ace credit card",
      "ace",
    ],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #052e16 100%)",
    accentColor: "#4ade80",
    textColor: "#ffffff",
    badgeText: "AXIS ACE 5%",
    patternType: "lines",
    imageUrl: "/cards/axis-ace.png",
    officialImageUrl: "https://www.axis.bank.in/images/default-source/l4-banner/credit-card/ace-credit-card-mob-banner-1366x400.jpg",
  },
  {
    id: "axis-flipkart",
    name: "Flipkart Axis Bank",
    bankName: "Axis Bank",
    network: "Visa",
    category: "co-brand",
    tags: [
      "axis bank flipkart credit card",
      "axis flipkart credit card",
      "axis bank flipkart",
      "flipkart axis bank",
      "flipkart axis",
      "axis flipkart",
      "flipkart",
    ],
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0369a1 100%)",
    accentColor: "#facc15",
    textColor: "#ffffff",
    badgeText: "FLIPKART 5%",
    patternType: "swoosh",
    imageUrl: "/cards/axis-flipkart.png",
    officialImageUrl: "https://www.axis.bank.in/images/default-source/l4-banner/credit-card/flipkart-credit-card-n-1366x400.jpg",
  },

  // ── Federal Bank ────────────────────────────────────────────────────────────
  {
    id: "federal-scapia",
    name: "Federal Scapia (Visa)",
    bankName: "Federal Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "federal scapia credit card",
      "scapia credit card",
      "federal scapia",
      "scapia travel",
      "scapia",
    ],
    bgGradient: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #042f2e 100%)",
    accentColor: "#2dd4bf",
    textColor: "#ffffff",
    badgeText: "SCAPIA ZERO FOREX",
    patternType: "lines",
    imageUrl: "/cards/federal-scapia.png",
    officialImageUrl: "https://www.scapia.cards/home/images/mYlN5AWxS0UVTPRRE4dtSlVSGCw.webp",
    suggestedVariants: [
      { name: "Scapia RuPay UPI (Virtual)", network: "RuPay", cardType: "virtual", cardImageUrl: "/cards/federal-scapia.png" },
      { name: "Scapia Add-on Card", network: "Visa", cardType: "addon" },
    ],
  },
  {
    id: "federal-scapia-rupay",
    name: "Federal Scapia RuPay UPI",
    bankName: "Federal Bank",
    network: "RuPay",
    category: "virtual",
    tags: ["scapia rupay", "scapia upi"],
    bgGradient: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #021f1e 100%)",
    accentColor: "#5eead4",
    textColor: "#ffffff",
    badgeText: "SCAPIA RUPAY UPI",
    patternType: "lines",
    imageUrl: "/cards/federal-scapia.png",
    officialImageUrl: "https://www.scapia.cards/home/images/mYlN5AWxS0UVTPRRE4dtSlVSGCw.webp",
  },
  {
    id: "federal-celesta",
    name: "Federal Bank Celesta",
    bankName: "Federal Bank",
    network: "Visa",
    category: "metal",
    tags: [
      "federal celesta",
      "celesta",
      "federal bank celesta",
      "celesta credit card",
      "federal celesta credit card",
      "federal bank celesta visa infinite",
    ],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #1c1917 50%, #050505 100%)",
    accentColor: "#fbbf24",
    textColor: "#fef3c7",
    badgeText: "CELESTA LUXURY",
    patternType: "filigree",
    imageUrl: "/cards/federal-celesta.png",
    officialImageUrl: "https://www.federalbank.co.in/documents/10180/77651086/Celesta+Visa.webp",
    suggestedVariants: [
      { name: "Federal Celesta Mastercard World", network: "Mastercard", cardImageUrl: "/cards/federal-celesta.png" },
    ],
  },
  {
    id: "federal-imperio",
    name: "Federal Bank Imperio",
    bankName: "Federal Bank",
    network: "Visa",
    category: "rewards",
    tags: [
      "federal imperio",
      "imperio",
      "federal bank imperio",
      "imperio credit card",
      "federal imperio credit card",
      "federal bank imperio visa signature",
    ],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #000000 100%)",
    accentColor: "#e4e4e7",
    textColor: "#ffffff",
    badgeText: "IMPERIO LIFESTYLE",
    patternType: "minimal",
    imageUrl: "/cards/federal-imperio.png",
    officialImageUrl: "https://www.federalbank.co.in/documents/10180/77651086/Imperio+Visa.webp",
    suggestedVariants: [
      { name: "Federal Imperio Mastercard", network: "Mastercard", cardImageUrl: "/cards/federal-imperio.png" },
    ],
  },
  {
    id: "federal-signet",
    name: "Federal Bank Signet",
    bankName: "Federal Bank",
    network: "RuPay",
    category: "rewards",
    tags: [
      "federal signet",
      "signet",
      "federal bank signet",
      "signet credit card",
      "federal signet credit card",
      "federal bank signet platinum",
    ],
    bgGradient: "linear-gradient(135deg, #0a0a0c 0%, #1c1917 50%, #000000 100%)",
    accentColor: "#cbd5e1",
    textColor: "#ffffff",
    badgeText: "SIGNET PLATINUM",
    patternType: "minimal",
    imageUrl: "/cards/federal-signet.png",
    officialImageUrl: "https://www.federalbank.co.in/documents/10180/77651086/Signet+Rupay.webp",
    suggestedVariants: [
      { name: "Federal Signet Visa", network: "Visa", cardImageUrl: "/cards/federal-signet.png" },
    ],
  },
  {
    id: "federal-wave",
    name: "Federal Bank Wave RuPay",
    bankName: "Federal Bank",
    network: "RuPay",
    category: "virtual",
    tags: [
      "federal wave",
      "wave",
      "federal bank wave",
      "wave credit card",
      "federal wave credit card",
      "federal wave rupay",
      "wave rupay upi",
      "federal rupay upi",
    ],
    bgGradient: "linear-gradient(135deg, #18619b 0%, #153e6b 50%, #0e111e 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: "WAVE RUPAY UPI",
    patternType: "wave",
    imageUrl: "/cards/federal-wave.png",
    officialImageUrl: "https://www.federalbank.co.in/documents/10180/77651086/Wave.webp",
  },

  // ── American Express ────────────────────────────────────────────────────────
  {
    id: "amex-platinum",
    name: "Amex Platinum Metal",
    bankName: "American Express",
    network: "Amex",
    category: "metal",
    tags: ["amex platinum", "american express platinum", "platinum metal"],
    bgGradient: "linear-gradient(135deg, #475569 0%, #94a3b8 45%, #334155 100%)",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    badgeText: "AMEX PLATINUM",
    patternType: "filigree",
    imageUrl: "/cards/amex-platinum.png",
    officialImageUrl: "https://icm.aexp-static.com/Internet/internationalcardshop/en_in/images/cards/platinumCarddec.png",
  },
  {
    id: "amex-mrcc",
    name: "Amex Membership Rewards (MRCC)",
    bankName: "American Express",
    network: "Amex",
    category: "rewards",
    tags: [
      "amex rewards credit card",
      "membership rewards credit card",
      "amex rewards",
      "mrcc",
      "amex mrcc",
      "membership rewards",
    ],
    bgGradient: "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #075985 100%)",
    accentColor: "#bae6fd",
    textColor: "#ffffff",
    badgeText: "MEMBERSHIP REWARDS",
    patternType: "mesh",
    imageUrl: "/cards/amex-mrcc.png",
    officialImageUrl: "https://icm.aexp-static.com/Internet/internationalcardshop/en_in/images/cards/Membership_Rewards_Card.png",
  },
  {
    id: "amex-reserve",
    name: "Amex Platinum Reserve",
    bankName: "American Express",
    network: "Amex",
    category: "metal",
    tags: [
      "amex reserve credt card",
      "amex reserve credit card",
      "amex reserve",
      "platinum reserve credit card",
      "platinum reserve",
      "american express platinum reserve",
    ],
    bgGradient: "linear-gradient(135deg, #334155 0%, #64748b 50%, #1e293b 100%)",
    accentColor: "#e2e8f0",
    textColor: "#ffffff",
    badgeText: "PLATINUM RESERVE",
    patternType: "filigree",
    imageUrl: "/cards/amex-reserve.png",
    officialImageUrl: "https://icm.aexp-static.com/Internet/internationalcardshop/en_in/images/cards/bold_reserve_in_960x608.png",
  },
  {
    id: "amex-gold",
    name: "Amex Gold Card",
    bankName: "American Express",
    network: "Amex",
    category: "metal",
    tags: ["amex gold", "gold card", "american express gold"],
    bgGradient: "linear-gradient(135deg, #78350f 0%, #d97706 50%, #451a03 100%)",
    accentColor: "#fde047",
    textColor: "#fef9c3",
    badgeText: "AMEX GOLD",
    patternType: "filigree",
    imageUrl: "/cards/amex-gold.png",
    officialImageUrl: "https://icm.aexp-static.com/Internet/internationalcardshop/en_in/images/cards/Gold_Card.png",
  },

  // ── OneCard ─────────────────────────────────────────────────────────────────
  {
    id: "onecard-metal",
    name: "OneCard Metal",
    bankName: "OneCard",
    network: "Visa",
    category: "metal",
    tags: ["onecard", "one card", "onecard metal"],
    bgGradient: "linear-gradient(135deg, #27272a 0%, #38383e 50%, #1e1e22 100%)",
    accentColor: "#e4e4e7",
    textColor: "#ffffff",
    badgeText: "ONECARD METAL",
    patternType: "minimal",
    imageUrl: "/cards/onecard-metal.png",
    officialImageUrl: "https://assets.getonecard.app/assets/apply/classy_metalcard_4x_min.webp",
  },
  {
    id: "federal-one-metal",
    name: "Federal Bank One Metal Card",
    bankName: "Federal Bank",
    network: "Visa",
    category: "metal",
    tags: [
      "federal bank one metal credit card",
      "federal bank one metal",
      "federal one metal credit card",
      "federal one metal",
      "federal onecard",
      "one metal credit card",
      "one metal",
    ],
    bgGradient: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #0f172a 100%)",
    accentColor: "#e4e4e7",
    textColor: "#ffffff",
    badgeText: "ONE METAL · FEDERAL",
    patternType: "minimal",
    imageUrl: "/cards/federal-one-metal.png",
  },

  // ── Kotak Mahindra Bank ─────────────────────────────────────────────────────
  {
    id: "kotak-air-plus",
    name: "Kotak Air+ Credit Card",
    bankName: "Kotak Mahindra Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "kotak air + credit card",
      "kotak air+ credit card",
      "kotak air plus credit card",
      "kotak air credit card",
      "kotak air +",
      "kotak air+",
      "kotak air plus",
      "kotak air",
      "air+ credit card",
      "air+",
    ],
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #0284c7 50%, #0f172a 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: "KOTAK AIR+ TRAVEL",
    patternType: "lines",
    imageUrl: "/cards/kotak-air-plus.png",
  },
  {
    id: "kotak-zen",
    name: "Kotak Zen Signature",
    bankName: "Kotak Mahindra Bank",
    network: "Visa",
    category: "lifestyle",
    tags: [
      "kotak zen credit card",
      "kotak zen",
      "zen signature",
      "zen credit card",
      "zen",
    ],
    bgGradient: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)",
    accentColor: "#fbbf24",
    textColor: "#fef3c7",
    badgeText: "ZEN SIGNATURE",
    patternType: "filigree",
    imageUrl: "/cards/kotak-zen.png",
  },
  {
    id: "kotak-white",
    name: "Kotak White Reserve",
    bankName: "Kotak Mahindra Bank",
    network: "Visa",
    category: "metal",
    tags: ["kotak white", "white reserve", "white"],
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)",
    accentColor: "#dc2626",
    textColor: "#0f172a",
    badgeText: "KOTAK WHITE",
    patternType: "minimal",
    imageUrl: "/cards/kotak-white.png",
    officialImageUrl: "https://www.kotak.com/content/dam/Kotak/herosliderbanner/White-Reserve-Card_360x216.jpg",
  },
  {
    id: "kotak-league",
    name: "Kotak League (RuPay)",
    bankName: "Kotak Mahindra Bank",
    network: "RuPay",
    category: "lifestyle",
    tags: ["kotak league", "league", "league rupay"],
    bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #0f0d26 100%)",
    accentColor: "#a5b4fc",
    textColor: "#ffffff",
    badgeText: "LEAGUE PLATINUM",
    patternType: "mesh",
    imageUrl: "/cards/kotak-league.png",
    officialImageUrl: "https://www.kotak.com/content/dam/Kotak/product_card_images/Thumbnail-Banners-for-league-t.jpg",
  },

  // ── IndusInd Bank ───────────────────────────────────────────────────────────
  {
    id: "indusind-avios",
    name: "IndusInd Avios Visa Infinite",
    bankName: "IndusInd Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "induslnd avios credit card",
      "indusind avios credit card",
      "induslnd avios",
      "indusind avios",
      "avios credit card",
      "avios",
      "british airways avios",
      "qatar airways avios",
      "indusind avios visa infinite",
      "avios visa infinite",
    ],
    bgGradient: "linear-gradient(135deg, #091a33 0%, #1e3a8a 50%, #030712 100%)",
    accentColor: "#60a5fa",
    textColor: "#ffffff",
    badgeText: "AVIOS INFINITE",
    patternType: "lines",
    imageUrl: "/cards/indusind-avios.png",
  },
  {
    id: "indusind-legend",
    name: "IndusInd Legend",
    bankName: "IndusInd Bank",
    network: "Visa",
    category: "lifestyle",
    tags: [
      "indusind legend",
      "indusind legend credit card",
      "induslnd legend",
      "legend signature",
      "legend",
    ],
    bgGradient: "linear-gradient(135deg, #2b303a 0%, #1a1e24 50%, #0d0f12 100%)",
    accentColor: "#e2e8f0",
    textColor: "#f8fafc",
    badgeText: "LEGEND SIGNATURE",
    patternType: "lines",
    imageUrl: "/cards/indusind-legend.png",
    officialImageUrl: "https://www.indusind.bank.in/content/dam/indusind-platform-images/carousal-banner-images/credit-card/new-webp-cc-/cards-th-image/Legend_card-image_396x257px.webp",
  },

  // ── IDFC FIRST Bank ─────────────────────────────────────────────────────────
  {
    id: "idfc-wealth",
    name: "IDFC FIRST Wealth Credit Card",
    bankName: "IDFC FIRST Bank",
    network: "Visa",
    category: "lifestyle",
    tags: [
      "idfc first wealth card",
      "idfc first wealth credit card",
      "idfc first wealth",
      "first wealth card",
      "idfc wealth credit card",
      "idfc wealth card",
      "idfc wealth",
      "first wealth",
      "idfc credit card",
      "wealth",
    ],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 45%, #27272a 75%, #0f172a 100%)",
    accentColor: "#9e1b32",
    textColor: "#ffffff",
    badgeText: "FIRST WEALTH",
    patternType: "lines",
    imageUrl: "/cards/idfc-wealth.png",
    officialImageUrl: "https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/images/first-cc-rewamp/first-wealth/3-m-01.webp",
  },
  {
    id: "idfc-wow",
    name: "IDFC FIRST WOW! Credit Card",
    bankName: "IDFC FIRST Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "idfc first wow credit card",
      "idfc first wow",
      "idfc wow credit card",
      "idfc wow card",
      "idfc wow",
      "wow credit card",
      "wow card",
      "first wow",
      "wow",
    ],
    bgGradient: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)",
    accentColor: "#9e1b32",
    textColor: "#ffffff",
    badgeText: "FIRST WOW · 0% FOREX",
    patternType: "lines",
    imageUrl: "/cards/idfc-wow.png",
    officialImageUrl: "https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/images/wow-rewamp/Banner-Desktop-002-new-updated.webp",
  },

  // ── AU Small Finance Bank ───────────────────────────────────────────────────
  {
    id: "au-zenith-plus",
    name: "AU Zenith+ Metal",
    bankName: "AU Small Finance Bank",
    network: "Visa",
    category: "metal",
    tags: ["zenith", "zenith+", "au zenith", "zenith plus"],
    bgGradient: "linear-gradient(135deg, #2e0854 0%, #4a0d82 50%, #17042a 100%)",
    accentColor: "#fcd34d",
    textColor: "#ffffff",
    badgeText: "ZENITH+ METAL",
    patternType: "mesh",
    imageUrl: "/cards/au-zenith.png",
    officialImageUrl: "https://aemassets.au.bank.in/is/image/aubank/pb-cc-zpcc-masthead-11Feb26?fmt=webp",
  },

  // ── Standard Chartered ──────────────────────────────────────────────────────
  {
    id: "sc-ultimate",
    name: "SC Ultimate",
    bankName: "Standard Chartered",
    network: "Visa",
    category: "rewards",
    tags: [
      "standered charted ultimate credit card",
      "standard chartered ultimate credit card",
      "standered charted ultimate",
      "standard chartered ultimate",
      "ultimate credit card",
      "sc ultimate",
      "ultimate",
    ],
    bgGradient: "linear-gradient(135deg, #063d23 0%, #0a5c35 50%, #022012 100%)",
    accentColor: "#facc15",
    textColor: "#fef08a",
    badgeText: "SC ULTIMATE",
    patternType: "filigree",
    imageUrl: "/cards/sc-ultimate.png",
    officialImageUrl: "https://www.sc.com/content/dam/sc/in/header/in-ultimate-card-nav-img.png",
  },
  {
    id: "sc-manhattan",
    name: "Standard Chartered Manhattan",
    bankName: "Standard Chartered",
    network: "Visa",
    category: "rewards",
    tags: [
      "standered charted manhattan credit card",
      "standard chartered manhattan credit card",
      "standered charted manhattan",
      "standard chartered manhattan",
      "manhattan credit card",
      "sc manhattan",
      "manhattan",
    ],
    bgGradient: "linear-gradient(135deg, #022c22 0%, #065f46 50%, #0f172a 100%)",
    accentColor: "#34d399",
    textColor: "#ffffff",
    badgeText: "MANHATTAN 5%",
    patternType: "filigree",
    imageUrl: "/cards/sc-manhattan.png",
  },
  {
    id: "sc-smart",
    name: "SC Smart Credit Card",
    bankName: "Standard Chartered",
    network: "Visa",
    category: "cashback",
    tags: ["sc smart", "standard chartered smart", "smart"],
    bgGradient: "linear-gradient(135deg, #065f46 0%, #059669 50%, #022c22 100%)",
    accentColor: "#6ee7b7",
    textColor: "#ffffff",
    badgeText: "SC SMART 2%",
    patternType: "lines",
    imageUrl: "/cards/sc-smart.png",
    officialImageUrl: "https://www.sc.com/content/dam/sc/in/header/Cards-440x280-Smart.png",
  },

  // ── HSBC ────────────────────────────────────────────────────────────────────
  {
    id: "hsbc-live-plus",
    name: "HSBC Live+ Credit Card",
    bankName: "HSBC",
    network: "Visa",
    category: "cashback",
    tags: [
      "hsbc live+ credit card",
      "hsbc live credit card",
      "hsbc credit card",
      "hsbc live+",
      "hsbc live plus",
      "hsbc live",
      "live+",
      "hsbc",
    ],
    bgGradient: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 35%, #b91c1c 70%, #991b1b 100%)",
    accentColor: "#ef4444",
    textColor: "#ffffff",
    badgeText: "HSBC LIVE+ 10%",
    patternType: "lines",
    imageUrl: "/cards/hsbc-live-plus.png",
    officialImageUrl: "https://www.hsbc.co.in/content/dam/hsbc/in/images/credit-cards/live-plus-card.png",
  },
  {
    id: "hsbc-premier",
    name: "HSBC Premier Credit Card",
    bankName: "HSBC",
    network: "Mastercard",
    category: "premium",
    tags: [
      "hsbc premier credit card",
      "hsbc premier mastercard",
      "hsbc premier world elite",
      "hsbc premier",
      "premier credit card",
      "premier mastercard",
    ],
    bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 45%, #27272a 75%, #0f172a 100%)",
    accentColor: "#e4e4e7",
    textColor: "#ffffff",
    badgeText: "HSBC PREMIER",
    patternType: "lines",
    imageUrl: "/cards/hsbc-premier.png",
    officialImageUrl: "https://www.hsbc.co.in/content/dam/hsbc/in/images/credit-cards/hsbc-premier-credit-card.png",
  },
  {
    id: "hsbc-platinum",
    name: "HSBC Platinum Credit Card",
    bankName: "HSBC",
    network: "Visa",
    category: "rewards",
    tags: [
      "hsbc platinum credit card",
      "hsbc platinum visa",
      "hsbc platinum",
      "hsbc visa platinum",
    ],
    bgGradient: "linear-gradient(135deg, #475569 0%, #94a3b8 40%, #cbd5e1 75%, #64748b 100%)",
    accentColor: "#1e3a8a",
    textColor: "#0f172a",
    badgeText: "HSBC PLATINUM",
    patternType: "lines",
    imageUrl: "/cards/hsbc-platinum.png",
    officialImageUrl: "https://www.hsbc.co.in/content/dam/hsbc/in/images/credit-cards/hsbc-visa-platinum-credit-card.png",
  },
  {
    id: "hsbc-travel-one",
    name: "HSBC TravelOne Credit Card",
    bankName: "HSBC",
    network: "Mastercard",
    category: "travel",
    tags: [
      "hsbc travelone credit card",
      "hsbc travel one credit card",
      "hsbc travelone",
      "hsbc travel one",
      "travelone credit card",
      "travel one credit card",
      "hsbc travel",
    ],
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: "HSBC TRAVELONE",
    patternType: "lines",
    imageUrl: "/cards/hsbc-travel-one.png",
    officialImageUrl: "https://www.hsbc.co.in/content/dam/hsbc/in/images/credit-cards/hsbc-travelone-credit-card.png",
  },

  // ── RBL Bank ────────────────────────────────────────────────────────────────
  {
    id: "rbl-world-safari",
    name: "RBL World Safari",
    bankName: "RBL Bank",
    network: "Visa",
    category: "travel",
    tags: [
      "rbl world safari credit card",
      "world safari credit card",
      "rbl world safari",
      "world safari",
      "safari",
      "rbl safari",
      "rbl",
    ],
    bgGradient: "linear-gradient(135deg, #0a192f 0%, #1e3a8a 50%, #020c1b 100%)",
    accentColor: "#38bdf8",
    textColor: "#f0f9ff",
    badgeText: "ZERO FOREX · TRAVEL",
    patternType: "lines",
    imageUrl: "/cards/rbl-world-safari.png",
  },
  {
    id: "rbl-zomato",
    name: "RBL Zomato Edition",
    bankName: "RBL Bank",
    network: "Visa",
    category: "co-brand",
    tags: [
      "rbl zomato credit card",
      "rbl zomato",
      "zomato credit card",
      "zomato edition classic",
      "zomato edition",
      "edition classic",
      "zomato",
    ],
    bgGradient: "linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #450a0a 100%)",
    accentColor: "#fca5a5",
    textColor: "#ffffff",
    badgeText: "ZOMATO EDITION 5%",
    patternType: "wave",
    imageUrl: "/cards/rbl-zomato.png",
  },

  // ── YES Bank ────────────────────────────────────────────────────────────────
  {
    id: "yes-uni",
    name: "YES Bank Uni Credit Card",
    bankName: "YES Bank",
    network: "Visa",
    category: "co-brand",
    tags: [
      "yes bank uni credit card",
      "yes bank uni",
      "uni credit card",
      "uni card",
      "uni carbon",
      "yes uni",
      "uni",
    ],
    bgGradient: "linear-gradient(135deg, #18181b 0%, #2e1065 50%, #09090b 100%)",
    accentColor: "#a855f7",
    textColor: "#ffffff",
    badgeText: "UNI 1/3RD CARD",
    patternType: "wave",
    imageUrl: "/cards/yes-uni.png",
  },
  {
    id: "yes-marquee",
    name: "YES Bank Marquee",
    bankName: "YES Bank",
    network: "Visa",
    category: "metal",
    tags: ["yes bank", "marquee", "yes marquee"],
    bgGradient: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)",
    accentColor: "#fbbf24",
    textColor: "#fef3c7",
    badgeText: "MARQUEE METAL",
    patternType: "filigree",
    imageUrl: "/cards/yes-marquee.png",
  },

  // ── Citibank ────────────────────────────────────────────────────────────────
  {
    id: "citi-rewards",
    name: "Citi Rewards Credit Card",
    bankName: "Citibank",
    network: "Mastercard",
    category: "rewards",
    tags: [
      "citi rewards credit card",
      "citibank rewards credit card",
      "citi rewards",
      "citibank rewards",
      "citi credit card",
      "citibank credit card",
      "citi",
      "citibank",
    ],
    bgGradient: "linear-gradient(135deg, #00587a 0%, #003852 50%, #002235 100%)",
    accentColor: "#00a3e0",
    textColor: "#ffffff",
    badgeText: "CITI REWARDS",
    patternType: "lines",
    imageUrl: "/cards/citi-rewards.png",
  },
  {
    id: "citi-premiermiles",
    name: "Citi PremierMiles Credit Card",
    bankName: "Citibank",
    network: "Mastercard",
    category: "travel",
    tags: [
      "citi premiermiles",
      "citi premier miles",
      "citibank premiermiles",
      "citibank premier miles",
      "citi miles",
      "citibank miles",
      "premiermiles",
    ],
    bgGradient: "linear-gradient(135deg, #52525b 0%, #3f3f46 50%, #27272a 100%)",
    accentColor: "#00a3e0",
    textColor: "#ffffff",
    badgeText: "PREMIERMILES",
    patternType: "lines",
    imageUrl: "/cards/citi-premiermiles.png",
  },
  {
    id: "citi-prestige",
    name: "Citi Prestige Credit Card",
    bankName: "Citibank",
    network: "Mastercard",
    category: "luxury",
    tags: [
      "citi prestige",
      "citibank prestige",
      "citi prestige credit card",
      "citibank prestige credit card",
      "prestige",
    ],
    bgGradient: "linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)",
    accentColor: "#00a3e0",
    textColor: "#ffffff",
    badgeText: "CITI PRESTIGE",
    patternType: "geometric",
    imageUrl: "/cards/citi-prestige.png",
  },
  {
    id: "citi-cashback",
    name: "Citi Cash Back Credit Card",
    bankName: "Citibank",
    network: "Mastercard",
    category: "cashback",
    tags: [
      "citi cash back credit card",
      "citibank cash back credit card",
      "citi cashback credit card",
      "citibank cashback credit card",
      "citi cash back",
      "citibank cash back",
      "citi cashback",
      "citibank cashback",
    ],
    bgGradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: "CASH BACK",
    patternType: "radial",
    imageUrl: "/cards/citi-cashback.png",
  },

  // ── Bank of Baroda (BOBCARD) ────────────────────────────────────────────────
  {
    id: "bob-eterna",
    name: "BOBCARD Eterna",
    bankName: "Bank of Baroda",
    network: "Visa",
    category: "lifestyle",
    tags: ["bob", "eterna", "bobcard eterna", "bank of baroda"],
    bgGradient: "linear-gradient(135deg, #2a0845 0%, #6441a5 50%, #1b0230 100%)",
    accentColor: "#f472b6",
    textColor: "#ffffff",
    badgeText: "ETERNA REWARDS",
    patternType: "mesh",
    imageUrl: "/cards/bob-eterna.png",
  },

  // ── Niyo Global ─────────────────────────────────────────────────────────────
  {
    id: "niyo-global",
    name: "Niyo Global Forex Card",
    bankName: "Niyo Global",
    network: "Visa",
    category: "travel",
    tags: ["niyo", "niyo global", "sbm niyo", "equitas niyo"],
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)",
    accentColor: "#34d399",
    textColor: "#ffffff",
    badgeText: "NIYO ZERO FOREX",
    patternType: "lines",
    imageUrl: "/cards/niyo-global.png",
  },

  // ── Generic / Universal RuPay UPI Virtual Preset ───────────────────────────
  {
    id: "generic-rupay-upi",
    name: "RuPay UPI Virtual Card",
    bankName: "RuPay NPCI",
    network: "RuPay",
    category: "virtual",
    tags: ["rupay upi", "virtual card", "rupay virtual"],
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #022c22 100%)",
    accentColor: "#34d399",
    textColor: "#ffffff",
    badgeText: "RUPAY UPI · DIGITAL",
    patternType: "lines",
  },
  {
    id: "generic-companion-card",
    name: "Companion / Add-on Card",
    bankName: "Secondary Account",
    network: "Visa",
    category: "standard",
    tags: ["companion", "addon", "add-on"],
    bgGradient: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)",
    accentColor: "#94a3b8",
    textColor: "#ffffff",
    badgeText: "LINKED COMPANION",
    patternType: "mesh",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRESET MATCHER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export function getMatchingCardPreset(
  issuerOrName: string,
  network?: string
): CardArtPreset | null {
  const query = (issuerOrName || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!query) return null;
  const netLower = (network || "").toLowerCase().trim();

  // Collect all matching candidates with scoring
  const candidates: Array<{ preset: CardArtPreset; score: number }> = [];

  for (const preset of CARD_ART_PRESETS) {
    const netMatch = Boolean(netLower && preset.network.toLowerCase() === netLower);
    let bestTagLength = 0;

    for (const tag of preset.tags) {
      const cleanTag = tag.toLowerCase().replace(/\s+/g, " ").trim();
      if (query.includes(cleanTag)) {
        if (cleanTag.length > bestTagLength) {
          bestTagLength = cleanTag.length;
        }
      }
    }

    if (bestTagLength > 0) {
      // Score based on matched tag length (higher = more specific) + network match boost
      const score = bestTagLength * 10 + (netMatch ? 50 : 0);
      candidates.push({ preset, score });
    } else if (netMatch && query.includes(preset.bankName.toLowerCase())) {
      candidates.push({ preset, score: 20 });
    } else if (query.includes(preset.bankName.toLowerCase())) {
      candidates.push({ preset, score: 10 });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].preset;
  }

  return null;
}

export function searchCardPresets(
  query: string,
  category = "all"
): CardArtPreset[] {
  const q = (query || "").toLowerCase().trim();
  return CARD_ART_PRESETS.filter((p) => {
    const matchesCat = category === "all" || p.category === category;
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.bankName.toLowerCase().includes(q) ||
      p.network.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTWORK RESOLVER FOR CARDS & VARIANTS
// ─────────────────────────────────────────────────────────────────────────────
export interface ResolvedCardArt {
  hasCustomImage: boolean;
  imageUrl: string;
  bgGradient: string;
  accentColor: string;
  textColor: string;
  badgeText: string;
  patternType: "mesh" | "lines" | "filigree" | "wave" | "swoosh" | "dots" | "minimal";
  presetName: string;
  network: string;
}

export function resolveCardArtwork(item: {
  issuer?: string;
  cardName?: string;
  name?: string;
  network?: string;
  cardImageUrl?: string;
  bankName?: string;
  status?: string;
}): ResolvedCardArt {
  const isClosed = (item.status || "active").toLowerCase() === "closed";
  const nameQuery = item.issuer || item.cardName || item.name || item.bankName || "";
  const net = item.network || "Visa";

  // If closed, return muted grayscale theme
  if (isClosed) {
    return {
      hasCustomImage: !!item.cardImageUrl,
      imageUrl: item.cardImageUrl || "",
      bgGradient: "linear-gradient(135deg, #27272a 0%, #18181b 100%)",
      accentColor: "#71717a",
      textColor: "#a1a1aa",
      badgeText: "ACCOUNT CLOSED",
      patternType: "minimal",
      presetName: "Closed Card",
      network: net,
    };
  }

  // Check custom image first
  const hasCustom = Boolean(item.cardImageUrl && item.cardImageUrl.trim().length > 0);
  const matched = getMatchingCardPreset(nameQuery, net);

  if (matched) {
    return {
      hasCustomImage: hasCustom,
      imageUrl: hasCustom ? (item.cardImageUrl || "") : (matched.imageUrl || matched.officialImageUrl || ""),
      bgGradient: matched.bgGradient,
      accentColor: matched.accentColor,
      textColor: matched.textColor,
      badgeText: matched.badgeText || matched.name,
      patternType: matched.patternType,
      presetName: matched.name,
      network: matched.network || net,
    };
  }

  // Default fallback
  return {
    hasCustomImage: hasCustom,
    imageUrl: hasCustom ? (item.cardImageUrl || "") : "",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #020617 100%)",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badgeText: net.toUpperCase(),
    patternType: "lines",
    presetName: nameQuery || "Credit Card",
    network: net,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE IMAGE COMPRESSION UTILITY (For fast DB & local storage sync)
// ─────────────────────────────────────────────────────────────────────────────
export async function compressCardImageFile(
  file: File,
  maxWidth = 860,
  maxHeight = 540,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file must be an image (PNG, JPG, or WebP)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image data."));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to raw data url if canvas unavailable
          resolve(String(reader.result));
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal byte-size, fallback to JPEG
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp")) {
            resolve(webpData);
            return;
          }
        } catch {
          // Ignore and fallback to jpeg
        }

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}
