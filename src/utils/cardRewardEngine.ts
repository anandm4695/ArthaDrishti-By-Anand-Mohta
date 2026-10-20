/**
 * Smart Credit Card Reward & Cashback Engine
 *
 * Real-time matching, ranking, and savings calculator for credit cards
 * against merchants (Swiggy, Zomato, Amazon, Blinkit, etc.) and spend categories.
 */

export interface MerchantInfo {
  id: string;
  name: string;
  category: string;
  brandName?: string;
  keywords: string[];
  typicalSpend: number;
  description: string;
  badge?: string;
}

export interface CardRewardPerk {
  returnPct: number;
  perkType: "cashback" | "reward_points" | "discount" | "miles" | "air_miles" | "waiver";
  description: string;
  maxCap?: string;
  badge?: string;
}

export interface CardPerkRule {
  matchKeys: string[];
  cardDisplayName: string;
  merchantPerks?: Record<string, CardRewardPerk>;
  categoryPerks?: Record<string, CardRewardPerk>;
  defaultOnlineReturnPct: number;
  defaultOfflineReturnPct: number;
  specialPerks?: string[];
  forexMarkupPct?: number; // 0 for Scapia, OneCard (1%), etc.
}

export interface EvaluatedCardPayment {
  cardId: string;
  cardName: string;
  bankName: string;
  network?: string;
  last4?: string;
  owner?: string;
  availableLimit: number;
  limit: number;
  outstanding: number;
  interestFreeDays: number;
  nextDueDateStr: string;
  returnPct: number;
  savingsInINR: number;
  perkType: "cashback" | "reward_points" | "discount" | "miles" | "air_miles" | "waiver";
  perkHeadline: string;
  perkReason: string;
  maxCap?: string;
  badge?: string;
  isCoBrandedMatch: boolean;
  score: number;
}

export interface BestMarketAlternative {
  cardName: string;
  bankName: string;
  returnPct: number;
  savingsInINR: number;
  reason: string;
  extraSavingsVsTopOwned: number;
}

export interface PaymentRecommendationResult {
  merchantName: string;
  category: string;
  amount: number;
  topCard: EvaluatedCardPayment | null;
  rankedCards: EvaluatedCardPayment[];
  bestMarketAlternative: BestMarketAlternative | null;
  totalCardsEvaluated: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POPULAR MERCHANTS REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
export const POPULAR_MERCHANTS: MerchantInfo[] = [
  // ── Food & Dining
  {
    id: "swiggy",
    name: "Swiggy",
    category: "Food & Dining",
    brandName: "Swiggy",
    keywords: ["swiggy", "swigy", "instamart", "dineout", "swiggy instamart", "swiggy gourmet"],
    typicalSpend: 800,
    description: "Food delivery, Instamart groceries, and Dineout restaurant bills",
    badge: "Food & Groceries",
  },
  {
    id: "zomato",
    name: "Zomato",
    category: "Food & Dining",
    brandName: "Zomato",
    keywords: ["zomato", "zomatto", "district", "zomato gold", "zomato dining"],
    typicalSpend: 750,
    description: "Food delivery, Zomato Gold, and dining out restaurant payments",
    badge: "Food & Dining",
  },
  {
    id: "eazydiner",
    name: "EazyDiner",
    category: "Food & Dining",
    brandName: "EazyDiner",
    keywords: ["eazydiner", "eazy diner", "prime dining"],
    typicalSpend: 2000,
    description: "Table booking and table bill payments with dining discounts",
    badge: "Dining Discounts",
  },
  {
    id: "starbucks",
    name: "Starbucks",
    category: "Food & Dining",
    brandName: "Starbucks",
    keywords: ["starbucks", "tata starbucks", "coffee"],
    typicalSpend: 550,
    description: "Coffee shops and cafes nationwide",
  },
  {
    id: "mcdonalds",
    name: "McDonald's / Domino's",
    category: "Food & Dining",
    brandName: "McDonald's",
    keywords: ["mcdonalds", "mcd", "dominos", "pizza", "burger king", "kfc"],
    typicalSpend: 650,
    description: "Fast food chains and quick service restaurants",
  },

  // ── Online Shopping & E-Commerce
  {
    id: "amazon",
    name: "Amazon India",
    category: "Online Shopping",
    brandName: "Amazon",
    keywords: ["amazon", "amazon.in", "amazon pay", "amazon prime", "kindle"],
    typicalSpend: 2500,
    description: "Amazon e-commerce marketplace, electronics, fashion, and Amazon Pay",
    badge: "Top Marketplace",
  },
  {
    id: "flipkart",
    name: "Flipkart",
    category: "Online Shopping",
    brandName: "Flipkart",
    keywords: ["flipkart", "flipkart.com", "supercoin", "minutes"],
    typicalSpend: 2500,
    description: "Electronics, appliances, fashion, and Flipkart Minutes",
    badge: "Top Marketplace",
  },
  {
    id: "myntra",
    name: "Myntra",
    category: "Online Shopping",
    brandName: "Myntra",
    keywords: ["myntra", "myntra.com", "fashion"],
    typicalSpend: 2000,
    description: "Fashion apparel, footwear, and lifestyle shopping",
  },
  {
    id: "tata_neu",
    name: "Tata Neu / Croma",
    category: "Online Shopping",
    brandName: "Tata Neu",
    keywords: ["tata neu", "tataneu", "croma", "tata cliq", "westside", "titan", "tanishq"],
    typicalSpend: 3000,
    description: "Tata digital ecosystem, electronics at Croma, and NeuPass brands",
    badge: "NeuCoins Ecosystem",
  },
  {
    id: "nykaa",
    name: "Nykaa",
    category: "Online Shopping",
    brandName: "Nykaa",
    keywords: ["nykaa", "nykaa man", "cosmetics", "beauty"],
    typicalSpend: 1800,
    description: "Beauty, skincare, grooming, and luxury fashion",
  },
  {
    id: "apple",
    name: "Apple Store India",
    category: "Electronics",
    brandName: "Apple",
    keywords: ["apple", "apple store", "iphone", "macbook", "ipad", "itunes"],
    typicalSpend: 40000,
    description: "Official Apple store, MacBooks, iPhones, and app subscriptions",
  },

  // ── Quick Commerce & Groceries
  {
    id: "blinkit",
    name: "Blinkit",
    category: "Quick Commerce",
    brandName: "Blinkit",
    keywords: ["blinkit", "grofers", "quick commerce"],
    typicalSpend: 600,
    description: "10-minute grocery delivery and instant essentials",
    badge: "10-Min Delivery",
  },
  {
    id: "zepto",
    name: "Zepto",
    category: "Quick Commerce",
    brandName: "Zepto",
    keywords: ["zepto", "zepto cafe", "zepto pass"],
    typicalSpend: 650,
    description: "Instant groceries, fresh fruits, vegetables, and snacks",
    badge: "10-Min Delivery",
  },
  {
    id: "bigbasket",
    name: "BigBasket / BB Daily",
    category: "Quick Commerce",
    brandName: "BigBasket",
    keywords: ["bigbasket", "bbnow", "bb daily", "groceries"],
    typicalSpend: 1500,
    description: "Weekly groceries, staples, dairy, and household essentials",
  },

  // ── Travel, Flights & Hotels
  {
    id: "makemytrip",
    name: "MakeMyTrip",
    category: "Travel & Flights",
    brandName: "MakeMyTrip",
    keywords: ["makemytrip", "mmt", "flights", "hotels", "homestays"],
    typicalSpend: 8000,
    description: "Flight tickets, hotel bookings, holiday packages, and cabs",
    badge: "Travel Hub",
  },
  {
    id: "easemytrip",
    name: "EaseMyTrip",
    category: "Travel & Flights",
    brandName: "EaseMyTrip",
    keywords: ["easemytrip", "emt", "flights zero convenience fee"],
    typicalSpend: 7500,
    description: "Flight bookings with zero convenience fee and hotel stays",
  },
  {
    id: "cleartrip",
    name: "Cleartrip",
    category: "Travel & Flights",
    brandName: "Cleartrip",
    keywords: ["cleartrip", "clear trip", "flipkart travel"],
    typicalSpend: 7000,
    description: "Domestic and international flight tickets & hotel stays",
  },
  {
    id: "irctc",
    name: "IRCTC Train Booking",
    category: "Travel & Flights",
    brandName: "IRCTC",
    keywords: ["irctc", "train tickets", "railway booking", "indian railways"],
    typicalSpend: 1200,
    description: "Indian Railways train tickets and Vande Bharat bookings",
  },
  {
    id: "vistara",
    name: "Club Vistara / Air India",
    category: "Travel & Flights",
    brandName: "Vistara",
    keywords: ["vistara", "club vistara", "air india", "airindia", "flight booking", "airline"],
    typicalSpend: 9000,
    description: "Domestic and international airline flight tickets and Club Vistara frequent flyer flights",
    badge: "Premier Airline",
  },
  {
    id: "uber",
    name: "Uber / Ola Cabs",
    category: "Travel & Flights",
    brandName: "Uber",
    keywords: ["uber", "ola", "rapido", "cab", "rides", "auto"],
    typicalSpend: 400,
    description: "Daily city taxi rides, airport drops, and auto commute",
  },

  // ── Utilities, Bills & Telecom
  {
    id: "airtel",
    name: "Airtel (Bills & Broadband)",
    category: "Utilities & Bills",
    brandName: "Airtel",
    keywords: ["airtel", "airtel thanks", "airtel broadband", "airtel dth", "airtel postpaid"],
    typicalSpend: 1200,
    description: "Airtel postpaid bills, fiber broadband, DTH, and mobile recharges",
    badge: "Telecom & Fiber",
  },
  {
    id: "electricity_bills",
    name: "Electricity & Gas Bills",
    category: "Utilities & Bills",
    brandName: "Electricity",
    keywords: [
      "electricity",
      "power bill",
      "gas bill",
      "tata power",
      "bescom",
      "adani power",
      "mahadiscom",
      "cesc",
    ],
    typicalSpend: 2500,
    description: "Monthly municipal power supply and piped gas utility payments",
  },
  {
    id: "jio",
    name: "Jio Fiber & Mobile",
    category: "Utilities & Bills",
    brandName: "Jio",
    keywords: ["jio", "myjio", "jiofiber", "airfiber", "jio recharge"],
    typicalSpend: 1000,
    description: "Jio prepaid/postpaid recharges and JioFiber high-speed broadband",
  },

  // ── Entertainment & Movies
  {
    id: "bookmyshow",
    name: "BookMyShow",
    category: "Entertainment",
    brandName: "BookMyShow",
    keywords: ["bookmyshow", "bms", "movies", "cinema", "concerts", "pvr", "inox"],
    typicalSpend: 800,
    description: "Movie tickets, live concerts, theatre shows, and events",
    badge: "Movies & Events",
  },
  {
    id: "streaming",
    name: "Netflix / Prime / Hotstar",
    category: "Entertainment",
    brandName: "Netflix",
    keywords: [
      "netflix",
      "spotify",
      "hotstar",
      "disney",
      "youtube premium",
      "prime video",
      "apple tv",
    ],
    typicalSpend: 499,
    description: "Monthly video and music streaming subscriptions",
  },

  // ── Fuel & Petrol
  {
    id: "fuel_pumps",
    name: "Fuel (Petrol & Diesel)",
    category: "Fuel",
    brandName: "HPCL",
    keywords: [
      "fuel",
      "petrol",
      "diesel",
      "hpcl",
      "iocl",
      "bpcl",
      "indian oil",
      "bharat petroleum",
      "shell",
    ],
    typicalSpend: 2000,
    description: "Petrol pumps (HPCL, BPCL, IndianOil, Shell) with fuel surcharge waiver",
  },

  // ── International & Forex
  {
    id: "forex_international",
    name: "International & Forex Spends",
    category: "International Spends",
    brandName: "Forex",
    keywords: [
      "forex",
      "international",
      "foreign currency",
      "usd",
      "eur",
      "gbp",
      "overseas",
      "international travel",
    ],
    typicalSpend: 15000,
    description: "Zero forex markup cards for overseas travel and foreign website payments",
    badge: "Zero Forex Markup",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPEND CATEGORIES LIST
// ─────────────────────────────────────────────────────────────────────────────
export const SPEND_CATEGORIES = [
  "Food & Dining",
  "Online Shopping",
  "Quick Commerce",
  "Travel & Flights",
  "Utilities & Bills",
  "Entertainment",
  "Fuel",
  "Electronics",
  "International Spends",
  "General Spends",
];

// ─────────────────────────────────────────────────────────────────────────────
// CARD PERK KNOWLEDGE BASE (INDIAN CREDIT CARDS)
// ─────────────────────────────────────────────────────────────────────────────
export const CARD_PERK_RULES: CardPerkRule[] = [
  // ── HDFC Bank Cards
  {
    matchKeys: ["swiggy", "hdfc swiggy"],
    cardDisplayName: "HDFC Swiggy Credit Card",
    merchantPerks: {
      swiggy: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% direct cashback on Swiggy (Food, Instamart, Dineout, Genie)",
        maxCap: "₹1,500/mo",
        badge: "10% Cashback",
      },
      zomato: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on top online platforms",
        maxCap: "₹1,500/mo",
      },
      amazon: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on online e-commerce shopping",
        maxCap: "₹1,500/mo",
      },
      flipkart: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Flipkart",
        maxCap: "₹1,500/mo",
      },
      blinkit: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on quick commerce apps",
        maxCap: "₹1,500/mo",
      },
      zepto: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Zepto",
        maxCap: "₹1,500/mo",
      },
      myntra: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on fashion platforms",
        maxCap: "₹1,500/mo",
      },
      uber: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on cab rides",
        maxCap: "₹1,500/mo",
      },
      bookmyshow: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on BookMyShow",
        maxCap: "₹1,500/mo",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% on Swiggy & 5% on top dining platforms",
      },
      "Quick Commerce": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% on Instamart & 5% on Blinkit/Zepto",
      },
      "Online Shopping": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on 1000+ top online shopping platforms",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: ["10% on Swiggy ecosystem", "5% on top digital apps", "1% other retail"],
  },
  {
    matchKeys: ["tata neu infinity", "neu infinity"],
    cardDisplayName: "HDFC Tata Neu Infinity",
    merchantPerks: {
      tata_neu: {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10% NeuCoins on Tata Neu, Croma, 1mg, BigBasket",
        badge: "10% NeuCoins",
      },
      bigbasket: {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10% NeuCoins on BigBasket groceries",
        badge: "10% NeuCoins",
      },
      airtel: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% NeuCoins on utility bill payments via Tata Neu",
      },
      electricity_bills: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% NeuCoins on electricity bill payments via Tata Neu",
      },
    },
    categoryPerks: {
      "Quick Commerce": {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10% on BigBasket / BBnow",
      },
      "Online Shopping": {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10% on Tata Neu & Croma; 1.5% other UPI/non-Tata spends",
      },
      "Utilities & Bills": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% on bill payments via Tata Neu App",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "1.5% NeuCoins on RuPay UPI spends",
      "Complimentary domestic & international lounge access",
    ],
  },
  {
    matchKeys: ["millennia", "hdfc millennia"],
    cardDisplayName: "HDFC Millennia Credit Card",
    merchantPerks: {
      swiggy: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Swiggy, Amazon, Flipkart, Myntra, Zomato",
        maxCap: "₹1,000/mo",
        badge: "5% Cashback",
      },
      zomato: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Zomato food delivery",
        maxCap: "₹1,000/mo",
      },
      amazon: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Amazon shopping",
        maxCap: "₹1,000/mo",
      },
      flipkart: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Flipkart e-commerce",
        maxCap: "₹1,000/mo",
      },
      myntra: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Myntra fashion",
        maxCap: "₹1,000/mo",
      },
      uber: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Uber rides",
        maxCap: "₹1,000/mo",
      },
      bookmyshow: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on BookMyShow movie tickets",
        maxCap: "₹1,000/mo",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Swiggy, Zomato, Dineout",
      },
      "Online Shopping": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Amazon, Flipkart, Myntra, Tata CLiQ",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "5% cashback on 10 partner merchants",
      "1% on all other spends",
      "₹1,000 quarterly spend milestone vouchers",
    ],
  },
  {
    matchKeys: ["regalia", "regalia gold", "hdfc regalia"],
    cardDisplayName: "HDFC Regalia Gold",
    merchantPerks: {
      nykaa: {
        returnPct: 6.6,
        perkType: "reward_points",
        description:
          "5X Reward Points (6.6% value) on Nykaa, Myntra, Marks & Spencer, Reliance Digital",
      },
      myntra: {
        returnPct: 6.6,
        perkType: "reward_points",
        description: "5X Reward Points (6.6% value) on Myntra fashion",
      },
      makemytrip: {
        returnPct: 6.6,
        perkType: "reward_points",
        description: "Accelerated SmartBuy points on flight & hotel bookings",
      },
      easemytrip: {
        returnPct: 6.6,
        perkType: "reward_points",
        description: "SmartBuy voucher redemption value",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 6.6,
        perkType: "reward_points",
        description: "5X points on SmartBuy flights and hotels",
      },
      "Online Shopping": {
        returnPct: 6.6,
        perkType: "reward_points",
        description: "5X points on partner retail brands",
      },
    },
    defaultOnlineReturnPct: 1.33,
    defaultOfflineReturnPct: 1.33,
    specialPerks: [
      "12 complimentary domestic airport lounges/yr",
      "6 international lounges via Priority Pass",
      "Flight vouchers on spend milestones",
    ],
  },
  {
    matchKeys: ["infinia", "hdfc infinia"],
    cardDisplayName: "HDFC Infinia Metal",
    merchantPerks: {
      makemytrip: {
        returnPct: 33.3,
        perkType: "reward_points",
        description: "10X SmartBuy Points (33.3% value) on hotel bookings; 5X (16.6%) on flights",
        badge: "Up to 33.3% Value",
      },
      swiggy: {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "5X SmartBuy Gyftr voucher points (16.6% return on Swiggy)",
        badge: "16.6% via Gyftr",
      },
      amazon: {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "5X SmartBuy Gyftr voucher points (16.6% return on Amazon Shopping)",
        badge: "16.6% via Gyftr",
      },
      zomato: {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "5X SmartBuy Gyftr voucher points (16.6% return on Zomato)",
        badge: "16.6% via Gyftr",
      },
      flipkart: {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "5X SmartBuy Gyftr voucher points (16.6% return on Flipkart)",
        badge: "16.6% via Gyftr",
      },
      apple: {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "5X SmartBuy Gyftr vouchers or 10X hotel partner transfer",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 33.3,
        perkType: "reward_points",
        description: "Up to 33.3% value on SmartBuy hotels and 16.6% on flights (1 Point = ₹1)",
      },
      "Food & Dining": {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "16.6% return via SmartBuy Gyftr instant food vouchers, 3.33% base",
      },
      "Online Shopping": {
        returnPct: 16.6,
        perkType: "reward_points",
        description: "16.6% return via SmartBuy e-vouchers, 3.33% base retail",
      },
      "International Spends": {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "3.33% base points with lowest 2.0% forex markup",
      },
    },
    defaultOnlineReturnPct: 3.33,
    defaultOfflineReturnPct: 3.33,
    specialPerks: [
      "1:1 Point conversion on flights and hotels",
      "Unlimited domestic & global lounge access with add-ons",
      "ITC 1+1 buffet dining",
    ],
  },

  // ── Axis Bank Cards
  {
    matchKeys: ["airtel axis", "axis airtel"],
    cardDisplayName: "Airtel Axis Bank Credit Card",
    merchantPerks: {
      airtel: {
        returnPct: 25.0,
        perkType: "cashback",
        description: "25% direct cashback on Airtel Mobile, Broadband & DTH via Airtel Thanks App",
        maxCap: "₹250/mo",
        badge: "25% Cashback",
      },
      electricity_bills: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Electricity, Gas & Water bill payments via Airtel Thanks",
        maxCap: "₹250/mo",
        badge: "10% Cashback",
      },
      swiggy: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Swiggy food orders",
        maxCap: "₹500/mo",
        badge: "10% Cashback",
      },
      zomato: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Zomato delivery",
        maxCap: "₹500/mo",
        badge: "10% Cashback",
      },
      bigbasket: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on BigBasket groceries",
        maxCap: "₹500/mo",
        badge: "10% Cashback",
      },
    },
    categoryPerks: {
      "Utilities & Bills": {
        returnPct: 25.0,
        perkType: "cashback",
        description: "25% on Airtel bills & 10% on electricity/gas via Airtel Thanks",
      },
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Swiggy and Zomato",
      },
      "Quick Commerce": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on BigBasket grocery orders",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "25% on Airtel ecosystem",
      "10% on utilities & Swiggy/Zomato/BigBasket",
      "4 complimentary domestic lounge visits/yr",
    ],
  },
  {
    matchKeys: ["axis ace", "ace"],
    cardDisplayName: "Axis Bank ACE Credit Card",
    merchantPerks: {
      electricity_bills: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on utility bills via Google Pay (Electricity, Gas, Internet)",
        maxCap: "₹500/mo",
        badge: "5% Cashback",
      },
      swiggy: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% cashback on Swiggy food delivery",
        maxCap: "₹500/mo",
      },
      zomato: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% cashback on Zomato food delivery",
        maxCap: "₹500/mo",
      },
      uber: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% cashback on Uber rides",
        maxCap: "₹500/mo",
      },
      ola: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% cashback on Ola cabs",
        maxCap: "₹500/mo",
      },
    },
    categoryPerks: {
      "Utilities & Bills": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% on Bill Payments via Google Pay",
      },
      "Food & Dining": {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% on Swiggy and Zomato",
      },
      "Travel & Flights": {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% on Uber & Ola commute",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "5% on utility bills via GPay",
      "4% on Swiggy/Zomato/Uber",
      "1.5% flat unlimited cashback on all other spends",
    ],
  },
  {
    matchKeys: ["flipkart axis", "axis flipkart"],
    cardDisplayName: "Flipkart Axis Bank Credit Card",
    merchantPerks: {
      flipkart: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% unlimited direct cashback on Flipkart shopping",
        badge: "5% Unlimited",
      },
      cleartrip: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% unlimited direct cashback on Cleartrip flights & hotels",
        badge: "5% Unlimited",
      },
      swiggy: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% cashback on Swiggy food orders",
      },
      uber: { returnPct: 4.0, perkType: "cashback", description: "4% cashback on Uber taxi rides" },
      pvr: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% cashback on PVR INOX cinema tickets",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% unlimited cashback on Flipkart",
      },
      "Travel & Flights": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% on Cleartrip and 4% on Uber",
      },
      "Food & Dining": {
        returnPct: 4.0,
        perkType: "cashback",
        description: "4% on Swiggy food orders",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "5% unlimited cashback on Flipkart & Cleartrip",
      "4% on Swiggy, Uber, PVR",
      "1% on all other transactions",
    ],
  },
  {
    matchKeys: ["axis atlas", "atlas"],
    cardDisplayName: "Axis Bank Atlas",
    merchantPerks: {
      makemytrip: {
        returnPct: 10.0,
        perkType: "miles",
        description:
          "5 EDGE Miles/₹100 (10% partner transfer value) on direct airline & hotel spends",
        badge: "10% Miles Value",
      },
      easemytrip: {
        returnPct: 10.0,
        perkType: "miles",
        description: "5 EDGE Miles/₹100 (10% partner transfer value) on flights & hotels",
      },
      cleartrip: {
        returnPct: 10.0,
        perkType: "miles",
        description: "5 EDGE Miles/₹100 on travel booking platforms",
      },
      apple: {
        returnPct: 4.0,
        perkType: "miles",
        description: "2 EDGE Miles/₹100 (4% transfer value) on general retail",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 10.0,
        perkType: "miles",
        description:
          "5 EDGE Miles per ₹100 on Airlines & Hotels (1:2 transfer ratio to airline partners)",
      },
      "International Spends": {
        returnPct: 4.0,
        perkType: "miles",
        description: "2 EDGE Miles per ₹100 on all foreign retail transactions",
      },
    },
    defaultOnlineReturnPct: 4.0,
    defaultOfflineReturnPct: 4.0,
    specialPerks: [
      "1 EDGE Mile = 2 Partner Points (Accor, Singapore Airlines, Qatar, Turkish)",
      "Up to 18 complimentary international & domestic lounges",
    ],
  },

  // ── ICICI Bank Cards
  {
    matchKeys: ["amazon pay", "icici amazon", "amazon icici"],
    cardDisplayName: "ICICI Amazon Pay Credit Card",
    merchantPerks: {
      amazon: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% unlimited cashback for Amazon Prime members (3% for non-Prime)",
        badge: "5% Unlimited",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "cashback",
        description:
          "2% cashback on 100+ Amazon Pay partner merchants (Swiggy, Zomato, Uber, BookMyShow)",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on Zomato via Amazon Pay",
      },
      uber: { returnPct: 2.0, perkType: "cashback", description: "2% cashback on Uber cabs" },
      airtel: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on mobile & broadband recharges via Amazon Pay",
      },
      electricity_bills: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on electricity & utility bills via Amazon Pay",
      },
      bookmyshow: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on BookMyShow movie tickets",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% unlimited cashback on Amazon India",
      },
      "Utilities & Bills": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on all recharges and bills via Amazon Pay",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on food delivery partner platforms",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Lifetime Free Card (LTF)",
      "No upper cap on cashback",
      "Auto-credited to Amazon Pay Balance on statement date",
    ],
  },
  {
    matchKeys: ["sapphiro", "icici sapphiro"],
    cardDisplayName: "ICICI Sapphiro",
    merchantPerks: {
      bookmyshow: {
        returnPct: 25.0,
        perkType: "discount",
        description: "Buy 1 Get 1 Free on BookMyShow (up to ₹500 off twice a month)",
        badge: "BOGO Movie Tickets",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "ICICI Culinary Treats dining discount + 4 ICICI Rewards per ₹100",
      },
      makemytrip: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "4 ICICI Rewards per ₹100 (₹1/100 value) + lounge access",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 25.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹500 discount twice every month on BMS",
      },
      "Food & Dining": {
        returnPct: 3.0,
        perkType: "discount",
        description: "Culinary Treats dining program discounts at premium restaurants",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "DreamFolios DragonPass international lounge access",
      "Golf rounds quarterly",
      "Dual Mastercard + Amex companion cards",
    ],
  },
  {
    matchKeys: ["emeralde", "icici emeralde"],
    cardDisplayName: "ICICI Emeralde Metal Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 30.0,
        perkType: "discount",
        description: "Buy 1 Get 1 Free on BookMyShow (up to ₹750 discount twice a month)",
        badge: "BOGO ₹750 Movies",
      },
      taj: {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "4 ICICI Reward Points per ₹100 (₹1/point value) on luxury stays",
      },
      makemytrip: {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "4 ICICI Reward Points per ₹100 on flight & luxury travel bookings",
      },
      swiggy: {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "Culinary Treats dining discount + accelerated points",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 30.0,
        perkType: "discount",
        description:
          "Buy 1 Get 1 free movie ticket up to ₹750 discount twice every month on BookMyShow",
      },
      Travel: {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "4 Reward Points per ₹100 (1:1 redemption ratio for air miles)",
      },
      "Food & Dining": {
        returnPct: 3.0,
        perkType: "discount",
        description: "ICICI Culinary Treats fine dining discounts",
      },
    },
    defaultOnlineReturnPct: 4.0,
    defaultOfflineReturnPct: 4.0,
    specialPerks: [
      "Unlimited domestic and international airport lounge access via DreamFolios DragonPass",
      "Unlimited complimentary golf rounds and lessons globally",
      "Dedicated 24/7 Emeralde metal card concierge and Taj Epicure membership",
    ],
  },
  {
    matchKeys: ["rubyx", "icici rubyx"],
    cardDisplayName: "ICICI Rubyx Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 Free on BookMyShow (up to ₹250 discount twice a month)",
        badge: "BOGO ₹250 Movies",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "ICICI Culinary Treats dining discount + 4 ICICI Rewards per ₹100",
      },
      makemytrip: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "2 ICICI Reward Points per ₹100 + complimentary lounge visits",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹250 discount twice every month on BMS",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "discount",
        description: "Culinary Treats dining privileges",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "2 complimentary domestic airport lounge visits per quarter on spend criteria",
      "Complimentary golf rounds and dual-card variant privileges",
    ],
  },
  {
    matchKeys: ["coral", "icici coral"],
    cardDisplayName: "ICICI Coral Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 25.0,
        perkType: "discount",
        description: "25% discount up to ₹100 on BookMyShow twice a month",
        badge: "25% BMS Discount",
      },
      swiggy: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "2 ICICI Reward Points per ₹100 on dining",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 25.0,
        perkType: "discount",
        description: "25% off up to ₹100 on movie tickets on BookMyShow and Inox",
      },
      "Utilities & Bills": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "2 Reward Points per ₹100 spent via RuPay UPI scan & pay",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "1 complimentary domestic airport lounge visit per quarter on qualifying spends",
      "1 complimentary domestic railway lounge visit per quarter",
      "Seamless RuPay UPI merchant QR payments",
    ],
  },
  {
    matchKeys: ["icici makemytrip", "makemytrip icici", "mmt signature"],
    cardDisplayName: "ICICI MakeMyTrip Signature Card",
    merchantPerks: {
      makemytrip: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "₹4 My Cash per ₹200 on MakeMyTrip hotel & holiday bookings",
        badge: "4% My Cash",
      },
      airindia: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "₹2 My Cash per ₹200 on flight bookings",
      },
      indigo: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "₹2 My Cash per ₹200 on domestic flights",
      },
    },
    categoryPerks: {
      Travel: {
        returnPct: 4.0,
        perkType: "cashback",
        description: "Accelerated My Cash on hotel bookings and vacation packages",
      },
    },
    defaultOnlineReturnPct: 1.25,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Welcome voucher of ₹1,500 My Cash + MakeMyTrip Black Tier membership",
      "1 complimentary international lounge access + 2 domestic airport lounge visits/quarter",
    ],
  },

  // ── SBI Cards
  {
    matchKeys: ["sbi cashback", "cashback sbi", "cashback", "sbi cash back", "cash back sbi"],
    cardDisplayName: "SBI Cashback Credit Card",
    merchantPerks: {
      // 5% Online Cashback (Capped at ₹5,000/month = ₹1 Lakh online spend)
      amazon: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback across Amazon India (Shopping, Pantry)",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      flipkart: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Flipkart",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      myntra: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Myntra fashion",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      nykaa: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Nykaa beauty & cosmetics",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      tata_neu: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Tata Neu online purchases",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      apple: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Apple India online purchases",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      swiggy: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Swiggy (Food & Instamart)",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      zomato: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Zomato food delivery",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      blinkit: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Blinkit quick delivery",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      zepto: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Zepto grocery orders",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      bigbasket: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on BigBasket essentials",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      bookmyshow: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on BookMyShow cinema & events",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      makemytrip: {
        returnPct: 5.0,
        perkType: "cashback",
        description:
          "5% flat online cashback on flights, hotels, and bus bookings (Note: Railways excluded)",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      cleartrip: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Cleartrip flights & hotel stays",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      easemytrip: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on EaseMyTrip travel bookings",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      uber: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on Uber & Ola cab bookings",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      streaming: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on digital subscriptions (Netflix, Spotify, Prime)",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      eazydiner: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on EazyDiner PayEazy payments",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },
      mcdonalds: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% flat online cashback on online app orders (Domino's, McDonald's)",
        maxCap: "₹5,000/mo",
        badge: "5% Flat Cashback",
      },

      // Strict Exclusions (0% Cashback per SBI Card Terms)
      irctc: {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Railways & IRCTC ticket bookings are strictly excluded from cashback",
        badge: "0% Excluded (Railways)",
      },
      electricity_bills: {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Utility bill payments (Electricity, Water, Gas) are excluded from cashback",
        badge: "0% Excluded (Utilities)",
      },
      airtel: {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Telecom & broadband bill payments are excluded from cashback",
        badge: "0% Excluded (Telecom)",
      },
      jio: {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Telecom recharges and mobile bills are excluded from cashback",
        badge: "0% Excluded (Telecom)",
      },
      fuel_pumps: {
        returnPct: 0.0,
        perkType: "cashback",
        description:
          "Fuel transactions are excluded from cashback (1% surcharge waiver on ₹500–₹3,000)",
        badge: "0% Excluded (Fuel)",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 5.0,
        perkType: "cashback",
        description:
          "5% flat cashback on ANY online merchant across India (capped at ₹5,000/month)",
        maxCap: "₹5,000/mo",
      },
      "Quick Commerce": {
        returnPct: 5.0,
        perkType: "cashback",
        description:
          "5% flat cashback on all quick commerce grocery platforms (capped at ₹5,000/month)",
        maxCap: "₹5,000/mo",
      },
      "Food & Dining": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% on online food delivery apps; 1% on offline restaurant POS dining",
        maxCap: "₹5,000/mo",
      },
      Entertainment: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% on online cinema and event booking websites (capped at ₹5,000/month)",
        maxCap: "₹5,000/mo",
      },
      Electronics: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% on electronic gadgets & appliances bought online",
        maxCap: "₹5,000/mo",
      },
      "Travel & Flights": {
        returnPct: 5.0,
        perkType: "cashback",
        description:
          "5% on online airline tickets, hotel stays & cabs (Note: Railways/IRCTC is 0% excluded)",
        maxCap: "₹5,000/mo",
      },
      "International Spends": {
        returnPct: 1.0,
        perkType: "cashback",
        description: "5% online cashback minus 3.5% foreign currency markup (net ~1.0% return)",
      },

      // MCC Exclusions per official terms & conditions:
      "Utilities & Bills": {
        returnPct: 0.0,
        perkType: "cashback",
        description:
          "Utility bill payments (Electricity, Water, Gas, Telecom) are completely excluded from cashback",
      },
      "Government & Taxes": {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Government payments, property taxes, and municipal charges earn 0% cashback",
      },
      Education: {
        returnPct: 0.0,
        perkType: "cashback",
        description:
          "School, college, and university tuition fees are completely excluded from cashback",
      },
      "Rent Payments": {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Rental transactions earn 0% cashback and incur SBI processing fee",
      },
      "Wallet Reloads": {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Prepaid wallet top-ups (Paytm, Mobikwik) earn 0% cashback",
      },
      Jewelry: {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Jewelry, bullion, and precious metal purchases earn 0% cashback",
      },
      Fuel: {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Fuel transactions are excluded from cashback (1% surcharge waiver applies)",
      },
      "Fuel & Automotive": {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Fuel transactions are excluded from cashback",
      },
      "Fuel & Gas": {
        returnPct: 0.0,
        perkType: "cashback",
        description: "Fuel transactions are excluded from cashback",
      },
    },
    defaultOnlineReturnPct: 5.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "5% flat online cashback on nearly ALL eCommerce platforms up to ₹5,000 per statement cycle (₹1,00,000 spend)",
      "1% flat cashback on offline retail POS spends (unlimited)",
      "Cashback auto-credited directly to card statement within 2 working days of statement generation",
      "Strictly excluded: Utilities, Insurance, Education/School fees, Rent, Wallet top-ups, Railways (IRCTC), Jewelry, and Fuel",
      "Annual fee (₹999 + GST) reversed on crossing ₹2 Lakhs annual spends",
    ],
  },
  {
    matchKeys: ["simplyclick", "sbi simplyclick"],
    cardDisplayName: "SBI SimplyClick Credit Card",
    merchantPerks: {
      amazon: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Amazon India",
        badge: "10X Points (2.5%)",
      },
      bookmyshow: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on BookMyShow",
      },
      cleartrip: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Cleartrip flight bookings",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Swiggy orders",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Zomato delivery",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 2.5,
        perkType: "reward_points",
        description:
          "10X points (2.5%) on partner digital brands; 5X points (1.25%) on all other online spends",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X reward points on partner food delivery platforms",
      },
    },
    defaultOnlineReturnPct: 1.25,
    defaultOfflineReturnPct: 0.25,
    specialPerks: [
      "10X points on Amazon, BookMyShow, Cleartrip, Lenskart, Netmeds, Swiggy",
      "₹2,000 Cleartrip e-voucher on 1L/2L spend milestone",
    ],
  },
  {
    matchKeys: ["simplysave", "sbi simplysave", "simply save"],
    cardDisplayName: "SBI SimplySAVE Credit Card",
    merchantPerks: {
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Dining",
        badge: "10X Points (2.5%)",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Dining",
      },
      blinkit: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Grocery",
      },
      zepto: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Grocery",
      },
      bigbasket: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Grocery",
      },
      bookmyshow: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Movies",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (10 pts per ₹150 = 2.5%) on Dining",
      },
      "Quick Commerce": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on Grocery & Departmental store spends",
      },
      Entertainment: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on Movie ticket bookings",
      },
    },
    defaultOnlineReturnPct: 0.25,
    defaultOfflineReturnPct: 0.25,
    specialPerks: [
      "10X Reward Points (2.5%) on Dining, Grocery, Departmental Store & Movies",
      "RuPay UPI integration enabled for contactless QR merchant payments",
    ],
  },
  {
    matchKeys: ["sbi prime", "prime sbi", "sbi card prime"],
    cardDisplayName: "SBI Card PRIME",
    merchantPerks: {
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Dining",
        badge: "10X Points (2.5%)",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Dining",
      },
      bigbasket: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Groceries",
      },
      bookmyshow: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5% return) on Movies",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Dining & Groceries",
      },
      Entertainment: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Movies",
      },
      "Travel & Flights": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "Complimentary Club Vistara & Trident privilege memberships",
      },
    },
    defaultOnlineReturnPct: 0.5,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "10X Reward Points on Dining, Groceries, Departmental stores and Movies",
      "Complimentary Club Vistara Silver tier & Trident Privilege Red Tier",
      "4 complimentary International Priority Pass lounge visits per year",
      "8 complimentary Domestic Airport lounge visits per year",
    ],
  },
  {
    matchKeys: ["sbi elite", "sbi card elite", "elite sbi"],
    cardDisplayName: "SBI Card ELITE",
    merchantPerks: {
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description:
          "Free movie tickets worth ₹6,000/year (up to ₹250/ticket, max 2 tickets/month)",
        badge: "₹500/mo Free Movies",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "5X Reward Points (2.5%) on Dining",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "5X Reward Points (2.5%) on Dining",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 10.0,
        perkType: "discount",
        description: "Complimentary movie tickets worth ₹500 every month on BookMyShow",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "5X Reward Points on Dining & Departmental stores",
      },
      "International Spends": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "Low foreign currency markup fee of 1.99%",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Free Movie tickets worth up to ₹6,000 every year on BookMyShow",
      "6 complimentary International lounge visits/year via Priority Pass",
      "Low forex markup fee of 1.99%",
      "Complimentary Club Vistara & Trident Privilege Red Tier memberships",
    ],
  },
  {
    matchKeys: ["aurum", "sbi aurum", "sbi card aurum"],
    cardDisplayName: "SBI Aurum Metal Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 15.0,
        perkType: "discount",
        description: "4 complimentary movie tickets every month (up to ₹250/ticket = ₹1,000/mo)",
        badge: "4 Free Tickets/mo",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 15.0,
        perkType: "discount",
        description: "4 free movie tickets every month on BookMyShow (worth ₹12,000/year)",
      },
      "Travel & Flights": {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "Unlimited International & Domestic airport lounge access with DreamFolks",
      },
      "International Spends": {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "Zero forex markup on all international transactions",
      },
      "Food & Dining": {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "4 reward points per ₹100 on luxury dining (1 RP = ₹1)",
      },
    },
    defaultOnlineReturnPct: 4.0,
    defaultOfflineReturnPct: 4.0,
    specialPerks: [
      "4 complimentary movie tickets every month on BookMyShow (up to ₹1,000/month)",
      "Unlimited International & Domestic lounge access via DreamFolks",
      "Complimentary memberships: Club Marriott, Taj Epicure, EazyDiner Prime",
      "Dedicated 24x7 Aurum concierge service",
    ],
  },
  {
    matchKeys: ["sbi octane", "bpcl sbi octane", "octane", "bpcl octane"],
    cardDisplayName: "BPCL SBI Card Octane",
    merchantPerks: {
      fuel_pumps: {
        returnPct: 7.25,
        perkType: "cashback",
        description:
          "7.25% valueback (25X points = 6.25% + 1% fuel surcharge waiver) at BPCL petrol pumps",
        badge: "7.25% Fuel Valueback",
      },
      bpcl: {
        returnPct: 7.25,
        perkType: "cashback",
        description:
          "7.25% valueback (25X points = 6.25% + 1% fuel surcharge waiver) at BPCL petrol pumps",
        badge: "7.25% Fuel Valueback",
      },
      bpcl_fuel: {
        returnPct: 7.25,
        perkType: "cashback",
        description:
          "7.25% valueback (25X points = 6.25% + 1% fuel surcharge waiver) at BPCL petrol pumps",
        badge: "7.25% Fuel Valueback",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Dining",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Dining",
      },
      blinkit: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Groceries",
      },
      bigbasket: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Groceries",
      },
      bookmyshow: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Movies",
      },
    },
    categoryPerks: {
      Fuel: {
        returnPct: 7.25,
        perkType: "cashback",
        description: "7.25% valueback on fuel & lubricants at BPCL pumps (up to ₹4,000/bill)",
      },
      "Fuel & Automotive": {
        returnPct: 7.25,
        perkType: "cashback",
        description: "7.25% valueback on fuel & lubricants at BPCL pumps (up to ₹4,000/bill)",
      },
      "Fuel & Gas": {
        returnPct: 7.25,
        perkType: "cashback",
        description: "7.25% valueback on fuel & lubricants at BPCL pumps (up to ₹4,000/bill)",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on dining",
      },
      "Quick Commerce": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on groceries",
      },
      Entertainment: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on movies",
      },
    },
    defaultOnlineReturnPct: 0.25,
    defaultOfflineReturnPct: 0.25,
    specialPerks: [
      "7.25% valueback (25X reward points + 1% surcharge waiver) at BPCL pumps",
      "10X reward points on Dining, Groceries, and Movies",
      "4 complimentary domestic airport lounge visits per calendar year",
    ],
  },
  {
    matchKeys: ["sbi pulse", "pulse sbi", "sbi card pulse"],
    cardDisplayName: "SBI Card PULSE",
    merchantPerks: {
      netmeds: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on pharmacy spends",
        badge: "10X Health Points",
      },
      pharmeasy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on pharmacy orders",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Dining",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Dining",
      },
      bookmyshow: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points (2.5%) on Movies",
      },
    },
    categoryPerks: {
      "Health & Wellness": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X reward points on Chemist, Pharmacy & Wellness spends",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X reward points on Dining",
      },
      Entertainment: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X reward points on Movies",
      },
    },
    defaultOnlineReturnPct: 0.5,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "Complimentary Noise ColorFit Pulse smartwatch upon fee payment",
      "1-year complimentary FITPASS PRO membership & Netmeds First",
      "10X Reward Points on Chemist, Pharmacy, Dining & Movies",
      "8 complimentary Domestic Airport lounge visits per year",
    ],
  },
  {
    matchKeys: ["sbi irctc", "irctc sbi", "irctc rupay", "irctc sbi card"],
    cardDisplayName: "IRCTC SBI Card (RuPay)",
    merchantPerks: {
      irctc: {
        returnPct: 10.0,
        perkType: "reward_points",
        description:
          "Up to 10% valueback as reward points on AC train tickets booked via irctc.co.in",
        badge: "10% IRCTC Valueback",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 10.0,
        perkType: "reward_points",
        description:
          "Up to 10% reward points valueback on AC train ticket bookings on IRCTC portal",
      },
      "Fuel & Automotive": {
        returnPct: 1.0,
        perkType: "cashback",
        description: "1% fuel surcharge waiver across all petrol pumps",
      },
    },
    defaultOnlineReturnPct: 0.33,
    defaultOfflineReturnPct: 0.33,
    specialPerks: [
      "Up to 10% valueback on AC ticket bookings at irctc.co.in / IRCTC Rail Connect app",
      "1% transaction charge waiver on IRCTC bookings",
      "4 complimentary Railway Lounge accesses per calendar year",
    ],
  },
  {
    matchKeys: ["ola sbi", "ola money sbi", "ola credit card"],
    cardDisplayName: "OLA Money SBI Credit Card",
    merchantPerks: {
      ola: {
        returnPct: 7.0,
        perkType: "cashback",
        description: "7% cashback as Ola Money on all Ola cab and auto rides",
        badge: "7% on Ola Rides",
      },
      cleartrip: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on domestic flight bookings, 12% on hotels",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 7.0,
        perkType: "cashback",
        description: "7% on Ola cabs and auto bookings",
      },
      "Food & Dining": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% on partner dining portals via Dineout",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "7% accelerated cashback on Ola cab and auto rides",
      "Zero joining fee in first year",
      "1% fuel surcharge waiver across all pumps in India",
    ],
  },

  // ── HSBC Cards
  {
    matchKeys: ["hsbc live+", "live+", "live plus", "hsbc live"],
    cardDisplayName: "HSBC Live+ Credit Card",
    merchantPerks: {
      swiggy: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% accelerated cashback on Food Delivery & Dining",
        maxCap: "₹1,000/mo",
        badge: "10% Cashback",
      },
      zomato: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% accelerated cashback on Zomato food delivery",
        maxCap: "₹1,000/mo",
        badge: "10% Cashback",
      },
      blinkit: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% accelerated cashback on grocery delivery",
        maxCap: "₹1,000/mo",
        badge: "10% Cashback",
      },
      zepto: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% accelerated cashback on Zepto grocery orders",
        maxCap: "₹1,000/mo",
        badge: "10% Cashback",
      },
      bigbasket: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% accelerated cashback on BigBasket essentials",
        maxCap: "₹1,000/mo",
        badge: "10% Cashback",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on all dining, restaurants, and food delivery apps",
      },
      "Quick Commerce": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on all grocery stores and instant delivery apps",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "10% cashback on Dining, Food Delivery & Groceries (capped at ₹1,000/billing cycle)",
      "1.5% unlimited cashback on all other spends",
    ],
  },
  {
    matchKeys: ["hsbc premier", "premier mastercard", "hsbc world elite"],
    cardDisplayName: "HSBC Premier Credit Card",
    merchantPerks: {
      makemytrip: {
        returnPct: 3.0,
        perkType: "air_miles",
        description: "3 reward points per ₹100 (3% air miles transfer rate) on flights and hotels",
        badge: "3% Air Miles",
      },
      taj: {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "Accelerated points on luxury dining and Taj hotel bookings",
        badge: "4% Luxury",
      },
      apple: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% rewards on electronics and Apple devices",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% rewards on gourmet dining & delivery",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% rewards on dining out & culinary experiences",
      },
    },
    categoryPerks: {
      Travel: {
        returnPct: 3.0,
        perkType: "air_miles",
        description:
          "3% points transfer to Singapore Airlines, British Airways, and partner airlines",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% points on fine dining and restaurants",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "3 reward points per ₹100 on international spends & travel",
      "Unlimited complimentary international airport lounge access via Priority Pass",
      "Complimentary golf rounds and lessons globally",
      "Dedicated Premier concierge and zero foreign currency conversion markup promos",
    ],
  },
  {
    matchKeys: ["hsbc travelone", "hsbc travel one", "travelone"],
    cardDisplayName: "HSBC TravelOne Credit Card",
    merchantPerks: {
      makemytrip: {
        returnPct: 4.0,
        perkType: "air_miles",
        description: "4% rewards with instant transfer to 16+ airline/hotel partner programs",
        badge: "4% Travel",
      },
      airindia: {
        returnPct: 4.0,
        perkType: "air_miles",
        description: "Instant 1:1 air miles redemption for flight bookings",
      },
      indigo: {
        returnPct: 4.0,
        perkType: "air_miles",
        description: "4% miles on domestic and international travel",
      },
      agoda: {
        returnPct: 4.0,
        perkType: "air_miles",
        description: "Accelerated points on worldwide hotel reservations",
      },
    },
    categoryPerks: {
      Travel: {
        returnPct: 4.0,
        perkType: "air_miles",
        description: "Instant transfer to 16+ airline/hotel loyalty programs in the HSBC app",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% points on dining and culinary treats",
      },
    },
    defaultOnlineReturnPct: 1.2,
    defaultOfflineReturnPct: 1.2,
    specialPerks: [
      "Instant reward points transfer to 16+ airline & hotel partners via HSBC app",
      "4 reward points per ₹100 on travel & dining",
      "Complimentary international and domestic airport lounge visits",
    ],
  },
  {
    matchKeys: ["hsbc platinum", "hsbc visa platinum"],
    cardDisplayName: "HSBC Platinum Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "Buy 1 Get 1 free movie ticket discount on BookMyShow",
        badge: "BOGO Movies",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% reward rate on dining & food orders",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% reward rate on dining out",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5X rewards on dining, hotels, and telecom during first 12 months",
      },
      Entertainment: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "BookMyShow movie ticket discounts and weekend privileges",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "2 reward points per ₹150 spent on all retail transactions",
      "5X reward points on dining, hotels, and telecom in the first 12 months",
      "Fuel surcharge waiver and no joining fee promotion",
    ],
  },

  // ── IDFC FIRST Bank Cards (Phase 15) ─────────────────────────────────────────
  {
    matchKeys: [
      "idfc-private",
      "idfc first private",
      "idfc private",
      "first private",
      "idfc private metal",
    ],
    cardDisplayName: "IDFC FIRST Private",
    merchantPerks: {
      forex_international: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "Zero (0%) foreign exchange markup fee + 10X reward points on all international spends (~5.85% total value savings)",
        badge: "0% Forex + 10X",
      },
      bookmyshow: {
        returnPct: 25.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹750 off on BookMyShow (twice a month)",
        badge: "BOGO BMS ₹750",
      },
      taj: {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "10X Reward Points on luxury stays and Taj Epicure dining",
      },
      makemytrip: {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "10X Reward Points on travel reservations",
      },
    },
    categoryPerks: {
      International: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "Zero (0%) foreign currency markup fee across all overseas spends + 10X points",
      },
      "Movies & Cinema": {
        returnPct: 25.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹750 twice a month on BookMyShow",
      },
      "Travel & Flights": {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "Unlimited domestic and international airport lounge access + meet & greet privileges",
      },
      "Food & Dining": {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "10X Reward Points on luxury dining",
      },
    },
    defaultOnlineReturnPct: 2.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "Zero (0%) foreign currency markup fee on international transactions",
      "Unlimited complimentary domestic and international airport lounge access",
      "Buy 1 Get 1 free movie ticket up to ₹750 twice every month on BookMyShow",
      "Complimentary airport meet & greet and limousine transfers",
      "10X Reward Points on all incremental spends (points never expire)",
    ],
  },
  {
    matchKeys: [
      "idfc-mayura",
      "idfc first mayura",
      "idfc mayura",
      "mayura",
      "first mayura",
      "mayura credit card",
    ],
    cardDisplayName: "IDFC FIRST Mayura",
    merchantPerks: {
      forex_international: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "0% foreign currency markup fee across all international transactions + 10X reward points",
        badge: "0% Forex Markup",
      },
      bookmyshow: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹500 off on BookMyShow (twice a month, ₹1,000/mo)",
        badge: "BOGO BMS ₹500",
      },
      makemytrip: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on travel bookings (points never expire)",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on dining",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on food delivery",
      },
    },
    categoryPerks: {
      International: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "Zero (0%) forex markup fee on overseas transactions + 10X reward points",
      },
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "4 complimentary domestic and 4 international airport lounge & spa visits per quarter",
      },
      "Movies & Cinema": {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹500 twice monthly on BookMyShow",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on dining spends",
      },
    },
    defaultOnlineReturnPct: 2.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "Zero (0%) foreign currency markup fee on all international purchases",
      "4 complimentary domestic airport lounge visits + 4 international lounge/spa visits per quarter",
      "Buy 1 Get 1 free movie ticket up to ₹500 twice a month on BookMyShow",
      "10X Reward Points on monthly spends above ₹20,000 and on birthdays",
      "Metal card crafted with peacock heritage artistry",
    ],
  },
  {
    matchKeys: [
      "idfc-ashva",
      "idfc first ashva",
      "idfc ashva",
      "ashva",
      "first ashva",
      "ashva credit card",
    ],
    cardDisplayName: "IDFC FIRST Ashva",
    merchantPerks: {
      forex_international: {
        returnPct: 4.85,
        perkType: "cashback",
        description: "Low 1% foreign currency markup fee (saves 2.5% + GST) + 10X reward points",
        badge: "1% Low Forex",
      },
      bookmyshow: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹400 off on BookMyShow (twice a month, ₹800/mo)",
        badge: "BOGO BMS ₹400",
      },
      makemytrip: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on travel bookings",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on dining",
      },
    },
    categoryPerks: {
      International: {
        returnPct: 4.85,
        perkType: "cashback",
        description: "Low 1% foreign currency markup fee + 10X reward points",
      },
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "2 complimentary domestic and 2 international airport lounge visits per quarter",
      },
      "Movies & Cinema": {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹400 twice monthly on BookMyShow",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on dining",
      },
    },
    defaultOnlineReturnPct: 2.5,
    defaultOfflineReturnPct: 1.25,
    specialPerks: [
      "Low 1% foreign exchange markup fee",
      "2 complimentary domestic and 2 international airport lounge visits per quarter",
      "Buy 1 Get 1 free movie ticket up to ₹400 twice a month on BookMyShow",
      "10X Reward Points on monthly spends above ₹20,000 and on birthdays",
      "Metal card crafted with royal stallion aesthetic",
    ],
  },
  {
    matchKeys: [
      "idfc-wealth",
      "idfc first wealth",
      "idfc wealth",
      "first wealth",
      "idfc wealth credit card",
    ],
    cardDisplayName: "IDFC FIRST Wealth",
    merchantPerks: {
      bookmyshow: {
        returnPct: 25.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹500 off on BookMyShow (twice a month)",
        badge: "BOGO BMS ₹500",
      },
      forex_international: {
        returnPct: 4.35,
        perkType: "cashback",
        description: "Low 1.5% forex markup fee + reward points (~4.35% net savings)",
        badge: "1.5% Low Forex",
      },
      makemytrip: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10X Reward Points on travel spends > ₹20k",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online dining",
      },
      zomato: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on food delivery",
      },
    },
    categoryPerks: {
      "Movies & Cinema": {
        returnPct: 25.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹500 twice a month on BookMyShow",
      },
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "2 complimentary domestic and 2 international airport lounge & spa visits per quarter",
      },
      International: {
        returnPct: 4.35,
        perkType: "cashback",
        description: "Low 1.5% foreign currency markup fee",
      },
      "Food & Dining": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on dining (10X on spends > ₹20,000/mo)",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 0.75,
    specialPerks: [
      "10X Reward Points on incremental monthly spends above ₹20,000 and on birthdays",
      "2 complimentary domestic & 2 international airport lounge visits + spa visits per quarter",
      "Buy 1 Get 1 free movie ticket up to ₹500 twice a month on BookMyShow",
      "Low foreign currency markup of 1.5%",
      "Complimentary golf rounds and roadside assistance across India",
    ],
  },
  {
    matchKeys: [
      "idfc-select",
      "idfc first select",
      "idfc select",
      "first select",
      "select credit card",
    ],
    cardDisplayName: "IDFC FIRST Select",
    merchantPerks: {
      bookmyshow: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹250 off on BookMyShow (twice a month)",
        badge: "BOGO BMS ₹250",
      },
      forex_international: {
        returnPct: 3.85,
        perkType: "cashback",
        description: "Low 1.99% forex markup fee + reward points",
        badge: "1.99% Forex",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on dining",
      },
      amazon: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online retail",
      },
    },
    categoryPerks: {
      "Movies & Cinema": {
        returnPct: 20.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹250 twice a month on BookMyShow",
      },
      "Travel & Flights": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 complimentary domestic airport lounge visits per calendar quarter",
      },
      "Online Shopping": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on all online shopping purchases",
      },
      "Food & Dining": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on dining",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 0.75,
    specialPerks: [
      "10X Reward Points on incremental monthly spends above ₹20,000 and on birthdays",
      "2 complimentary domestic airport lounge visits per calendar quarter",
      "Buy 1 Get 1 free movie ticket up to ₹250 twice a month on BookMyShow",
      "Complimentary roadside assistance worth ₹1,399",
      "Reward points never expire and have zero redemption fee",
    ],
  },
  {
    matchKeys: [
      "idfc-millennia",
      "idfc first millennia",
      "idfc millennia",
      "first millennia",
      "millennia credit card",
    ],
    cardDisplayName: "IDFC FIRST Millennia",
    merchantPerks: {
      paytm: {
        returnPct: 15.0,
        perkType: "discount",
        description: "25% discount on movie tickets up to ₹100 twice a month on Paytm Movies",
        badge: "25% Movies",
      },
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "Discount on movie tickets",
      },
      amazon: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online shopping",
      },
      flipkart: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online shopping",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on food delivery",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points (1.5% value) on all online shopping transactions",
      },
      "Movies & Cinema": {
        returnPct: 15.0,
        perkType: "discount",
        description: "25% discount on movie tickets up to ₹100 twice a month",
      },
      "Food & Dining": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on food delivery & dining",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 0.75,
    specialPerks: [
      "Lifetime Free (LTF) credit card with zero joining and annual fees",
      "10X Reward Points on incremental spends above ₹20,000/mo and on birthdays",
      "6X Reward Points on online purchases and 3X on offline retail",
      "25% discount on movie tickets up to ₹100 twice every month",
      "Points never expire and no redemption charges",
    ],
  },
  {
    matchKeys: [
      "idfc-classic",
      "idfc first classic",
      "idfc classic",
      "first classic",
      "classic credit card",
    ],
    cardDisplayName: "IDFC FIRST Classic",
    merchantPerks: {
      paytm: {
        returnPct: 15.0,
        perkType: "discount",
        description: "25% discount on movie tickets up to ₹100 twice a month",
        badge: "25% Movies",
      },
      amazon: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online purchases",
      },
      flipkart: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online shopping",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "6X Reward Points on online purchases",
      },
      "Movies & Cinema": {
        returnPct: 15.0,
        perkType: "discount",
        description: "25% off on movie tickets up to ₹100 twice a month",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 0.75,
    specialPerks: [
      "Zero annual fee, zero joining fee — 100% Lifetime Free",
      "10X Reward Points on spends above ₹20,000/mo and on birthdays",
      "6X Reward Points on online shopping transactions",
      "25% discount on movie tickets up to ₹100 twice a month",
      "Complimentary roadside assistance coverage",
    ],
  },
  {
    matchKeys: [
      "idfc-wow",
      "idfc first wow",
      "idfc wow",
      "first wow",
      "wow card",
      "wow credit card",
    ],
    cardDisplayName: "IDFC FIRST WOW!",
    merchantPerks: {
      forex_international: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "Zero (0%) foreign exchange markup fee worldwide (~5.85% net value savings)",
        badge: "0% Forex Markup",
      },
      makemytrip: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "Travel bookings with 0% foreign currency fee",
      },
      amazon: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Reward points on all online spends",
      },
    },
    categoryPerks: {
      International: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "0% zero forex markup fee across all foreign currencies worldwide",
      },
      "Travel & Flights": {
        returnPct: 3.5,
        perkType: "cashback",
        description: "Zero forex markup on all overseas travel and flight reservations",
      },
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Reward points that never expire on all retail spends",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Zero (0%) foreign exchange markup fee on all international purchases",
      "100% guaranteed approval against Fixed Deposit without income proof",
      "Earn attractive FD interest while enjoying a credit card runway",
      "Lifetime Free (LTF) with zero joining and annual fees",
      "Reward points that never expire and have zero redemption charges",
    ],
  },
  {
    matchKeys: [
      "idfc-swyp",
      "idfc first swyp",
      "idfc swyp",
      "first swyp",
      "swyp",
      "swyp credit card",
    ],
    cardDisplayName: "IDFC FIRST SWYP",
    merchantPerks: {
      zomato: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% instant discount on Zomato food delivery",
        badge: "10% Zomato",
      },
      swiggy: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% instant discount on Swiggy orders",
        badge: "10% Swiggy",
      },
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on BookMyShow movie tickets",
      },
      spotify: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on digital subscriptions",
      },
      netflix: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on streaming entertainment",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on food delivery apps (Zomato, Swiggy)",
      },
      Entertainment: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on BookMyShow, Spotify, and Netflix",
      },
      "Online Shopping": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "Accelerated reward points on online merchant checkouts",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Curated 10% discounts across top youth brands: Zomato, Swiggy, BMS, Spotify",
      "Convenient instant EMI conversions at low flat processing fees",
      "Milestone benefits: 1,000 bonus points on ₹5,000 monthly spend",
      "Lifetime free option with minimal spend criteria",
    ],
  },
  {
    matchKeys: [
      "idfc-hpcl-power",
      "idfc hpcl power",
      "idfc hpcl",
      "idfc power+",
      "idfc hpcl power+",
      "idfc power",
    ],
    cardDisplayName: "IDFC FIRST HPCL Power+",
    merchantPerks: {
      hpcl: {
        returnPct: 6.5,
        perkType: "reward_points",
        description: "Up to 6.5% savings on fuel at HPCL pumps (5% reward points + 1.5% HP Pay app savings) + 1% surcharge waiver",
        badge: "6.5% Fuel Savings",
      },
      indianoil: {
        returnPct: 1.0,
        perkType: "waiver",
        description: "1% fuel surcharge waiver",
      },
      bpcl: {
        returnPct: 1.0,
        perkType: "waiver",
        description: "1% fuel surcharge waiver",
      },
      airtel: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% back in reward points on utility bills",
        badge: "5% Utilities",
      },
      electricity_bills: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% back in reward points on utility bill payments",
      },
      blinkit: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% back in reward points on grocery purchases",
      },
      upi: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Seamless RuPay UPI payments at merchant QR codes with reward points",
      },
    },
    categoryPerks: {
      Fuel: {
        returnPct: 6.5,
        perkType: "reward_points",
        description: "Up to 6.5% savings at HPCL pumps + 1% fuel surcharge waiver",
      },
      "Utilities & Bills": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% back in reward points on utility bill payments",
      },
      "Groceries & Essentials": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5% back in reward points on grocery purchases",
      },
      "UPI Payments": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "RuPay credit card on UPI for merchant payments",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.75,
    specialPerks: [
      "Up to 6.5% total fuel savings at HPCL petrol pumps",
      "5% back in reward points on Groceries and Utility bill payments",
      "RuPay Credit Card on UPI: Scan and pay at any merchant QR code effortlessly",
      "1% fuel surcharge waiver across all petrol pumps in India",
      "Welcome benefit: ₹500 cashback on first fuel transaction of ₹500+",
    ],
  },
  {
    matchKeys: [
      "idfc-vistara",
      "idfc first club vistara",
      "idfc first vistara",
      "idfc vistara",
      "first vistara",
      "club vistara idfc",
    ],
    cardDisplayName: "IDFC FIRST Club Vistara",
    merchantPerks: {
      vistara: {
        returnPct: 6.0,
        perkType: "miles",
        description: "6 Club Vistara (CV) Points per ₹200 spent on Vistara flights",
        badge: "6 CV Points/₹200",
      },
      makemytrip: {
        returnPct: 3.0,
        perkType: "miles",
        description: "3 CV Points per ₹200 spent on travel",
      },
      easemytrip: {
        returnPct: 3.0,
        perkType: "miles",
        description: "3 CV Points per ₹200 spent on flight tickets",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 6.0,
        perkType: "miles",
        description: "Up to 6 CV Points per ₹200 spent on flights + complimentary ticket vouchers",
      },
      International: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "1.99% low foreign currency markup fee",
      },
      "Online Shopping": {
        returnPct: 1.5,
        perkType: "miles",
        description: "3 CV Points per ₹200 spent on online shopping",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Complimentary Premium Economy class flight ticket voucher on joining",
      "Earn up to 5 complimentary flight ticket vouchers on annual spend milestones",
      "6 Club Vistara Points per ₹200 spent on Vistara flights",
      "2 complimentary domestic airport lounge and spa visits per quarter",
      "Complimentary golf rounds and golf lessons",
    ],
  },

  // ── IndusInd Bank Cards
  {
    matchKeys: ["indusind legend", "legend credit card", "indusind legend visa", "legend"],
    cardDisplayName: "IndusInd Bank Legend Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 50.0,
        perkType: "discount",
        description:
          "Buy 1 Get 1 Free on BookMyShow (up to 3 free tickets per quarter, max ₹200 off per ticket)",
        badge: "BOGO BMS Movies",
      },
      eazydiner: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Complimentary dining discount privileges via EazyDiner",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 50.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹200 on BookMyShow up to 3 times/quarter",
      },
      "Weekend Spends": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 Reward Points per ₹100 on weekend spends (double rewards)",
      },
      "Weekday Spends": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 on weekday spends",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Buy 1 Get 1 Free movie tickets on BookMyShow (up to 3 free tickets per quarter, ₹200 max discount per ticket)",
      "2 Reward Points per ₹100 spent on weekends (1 RP per ₹100 on weekdays)",
      "Complimentary domestic airport lounge access via Visa Signature lounge program",
      "Zero fuel surcharge across all petrol pumps in India (1% surcharge waiver)",
    ],
  },
  {
    matchKeys: [
      "indusind avios",
      "indusind avios visa infinite",
      "avios visa infinite",
      "induslnd avios",
      "british airways avios",
      "qatar airways avios",
      "avios",
    ],
    cardDisplayName: "IndusInd Bank Avios Visa Infinite Credit Card",
    merchantPerks: {
      makemytrip: {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "Accelerated Avios points on flight bookings and overseas hotels",
      },
      bookmyshow: {
        returnPct: 50.0,
        perkType: "discount",
        description: "Buy 1 Get 1 Free movie ticket discounts on BookMyShow",
        badge: "BOGO Movies",
      },
    },
    categoryPerks: {
      "Airlines & Flights": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5 Avios per ₹200 spent on Qatar Airways & British Airways official channels",
      },
      "International Spends": {
        returnPct: 6.0,
        perkType: "reward_points",
        description:
          "Up to 6 Avios per ₹200 at preferred international destinations with low 1.5% forex",
      },
      Travel: {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "3 Avios per ₹200 on standard international and domestic travel spends",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.5,
    specialPerks: [
      "Earn 5 Avios for every ₹200 spent on British Airways and Qatar Airways direct bookings",
      "Up to 6 Avios per ₹200 on POS spends at preferred international destination with low 1.5% forex markup",
      "20,000 bonus Avios welcome gift + 5,000 bonus Avios upon annual card renewal",
      "Complimentary Priority Pass international airport lounge access + airport meet-and-greet services",
    ],
  },
  {
    matchKeys: ["indusind pinnacle", "pinnacle credit card", "pinnacle", "indusind bank pinnacle"],
    cardDisplayName: "IndusInd Bank Pinnacle Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 50.0,
        perkType: "discount",
        description:
          "Buy 1 Get 1 Free on BookMyShow (up to 3 free tickets per month, max ₹200 off per ticket)",
        badge: "BOGO BMS Movies",
      },
      makemytrip: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "2.5 Reward Points per ₹100 on e-commerce travel bookings",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "2.5 Reward Points per ₹100 on online travel bookings",
      },
      "Online Shopping": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "2.5 Reward Points per ₹100 spent on e-commerce platforms",
      },
      Entertainment: {
        returnPct: 50.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie tickets on BookMyShow up to 3 times per month",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "2.5 Reward Points for every ₹100 spent on e-commerce transactions",
      "Buy 1 Get 1 Free movie tickets on BookMyShow (up to 3 tickets per month, ₹200 max discount each)",
      "Complimentary Priority Pass lounge access & international airport meet-and-assist",
      "Low 1.5% foreign currency markup fee on international transactions",
      "Complimentary golf games and golf lessons privileges",
    ],
  },
  {
    matchKeys: ["indusind eazydiner", "eazydiner credit card", "eazydiner indusind", "eazydiner"],
    cardDisplayName: "IndusInd Bank EazyDiner Credit Card",
    merchantPerks: {
      eazydiner: {
        returnPct: 25.0,
        perkType: "discount",
        description: "Guaranteed extra 25% off up to ₹1,000 via PayEazy on EazyDiner",
        badge: "25% PayEazy Off",
      },
      bookmyshow: {
        returnPct: 50.0,
        perkType: "discount",
        description:
          "Buy 1 Get 1 Free on BookMyShow (up to 2 tickets per month, max ₹200 off each)",
        badge: "BOGO BMS",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 on dining, shopping, and entertainment spends",
      },
      Entertainment: {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 on entertainment spends",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Extra 25% up to ₹1,000 off on every dining bill paid via PayEazy on the EazyDiner app",
      "Complimentary 1-year EazyDiner Prime membership with up to 50% discount at partner restaurants",
      "10 Reward Points per ₹100 on Dining, Shopping & Entertainment spends",
      "Buy 1 Get 1 Free movie tickets on BookMyShow (up to 2 free tickets per month, max ₹200 each)",
      "2 complimentary domestic airport lounge visits per calendar quarter",
    ],
  },
  {
    matchKeys: ["indusind platinum rupay", "platinum rupay", "indusind rupay", "indusind platinum"],
    cardDisplayName: "IndusInd Bank Platinum RuPay Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 20.0,
        perkType: "discount",
        description: "Special BookMyShow movie discounts",
      },
    },
    categoryPerks: {
      "UPI Payments": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 Reward Points per ₹100 on UPI merchant QR transactions",
      },
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 on online merchant spends",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.7,
    specialPerks: [
      "Seamlessly link with UPI apps (Google Pay, PhonePe, Paytm, CRED) for scan & pay credit transactions",
      "2 Reward Points for every ₹100 spent on UPI merchant transactions",
      "1% fuel surcharge waiver across all fuel stations in India",
      "Comprehensive complimentary travel and personal accident insurance cover",
    ],
  },
  {
    matchKeys: ["indusind tiger", "tiger credit card", "tiger card"],
    cardDisplayName: "IndusInd Bank Tiger Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 50.0,
        perkType: "discount",
        description: "Buy 1 Get 1 Free movie tickets on BookMyShow (twice per quarter)",
        badge: "BOGO BMS",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "6 Accelerated Reward Points per ₹100 on dining spends",
      },
      "Travel & Flights": {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "6 Accelerated Reward Points per ₹100 on travel bookings",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Exclusive partnership with WWF India supporting wildlife and tiger conservation",
      "6 Accelerated Reward Points per ₹100 spent on Dining and Travel",
      "2 complimentary domestic airport lounge visits per calendar quarter",
      "Buy 1 Get 1 Free movie tickets on BookMyShow twice per quarter up to ₹200 each",
    ],
  },
  {
    matchKeys: ["indusind nexxt", "nexxt credit card", "nexxt"],
    cardDisplayName: "IndusInd Bank Nexxt Credit Card",
    merchantPerks: {
      bookmyshow: {
        returnPct: 50.0,
        perkType: "discount",
        description: "Buy 1 Get 1 Free movie tickets on BookMyShow up to 2 tickets per month",
        badge: "BOGO BMS",
      },
    },
    categoryPerks: {
      Entertainment: {
        returnPct: 50.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie tickets on BookMyShow",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Interactive push-button card with LED lights to switch between Credit, Rewards, and EMI at POS",
      "1 Reward Point per ₹100 spent on all retail transactions",
      "Buy 1 Get 1 Free movie tickets on BookMyShow (up to 2 tickets per month, max ₹200 discount)",
      "1% fuel surcharge waiver across all petrol pumps in India",
    ],
  },
  {
    matchKeys: ["indusind samman", "samman rupay", "samman credit card", "samman"],
    cardDisplayName: "IndusInd Bank Samman RuPay Credit Card",
    merchantPerks: {},
    categoryPerks: {
      "UPI Payments": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "Reward points on UPI QR merchant transactions",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.7,
    specialPerks: [
      "Dedicated card crafted for government and defense personnel on the RuPay network",
      "UPI linkable for fast and secure QR payments anywhere",
      "Zero joining and annual fees with lifetime free privileges",
      "1% fuel surcharge waiver across India",
    ],
  },

  // ── Standard Chartered Cards
  {
    matchKeys: ["sc-ultimate", "ultimate", "standard chartered ultimate", "sc ultimate"],
    cardDisplayName: "Standard Chartered Ultimate",
    merchantPerks: {
      swiggy: {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 (3.33% real cash value) on all retail & dining",
        badge: "3.33% Universal",
      },
      zomato: {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 (3.33% reward rate) on dining out & delivery",
      },
      amazon: {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 (3.33% reward rate) on all e-commerce purchases",
      },
      apple: {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on electronics and Apple devices",
      },
      makemytrip: {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on flight & travel bookings",
      },
      forex_international: {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 Points per ₹150 with industry-lowest 2.0% forex fee",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 points per ₹150 (1 Point = ₹1 on catalog vouchers)",
      },
      "Online Shopping": {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 points per ₹150 across ALL retail shopping without merchant restrictions",
      },
      "International Spends": {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 points per ₹150 with lowest 2.0% foreign exchange fee",
      },
      "Travel & Flights": {
        returnPct: 3.33,
        perkType: "reward_points",
        description: "5 points per ₹150 + comprehensive travel & golf privileges",
      },
    },
    defaultOnlineReturnPct: 3.33,
    defaultOfflineReturnPct: 3.33,
    specialPerks: [
      "1 Reward Point = ₹1 cash voucher value",
      "Flat 3.33% return on almost all offline and online spends",
      "4 complimentary golf games/quarter",
    ],
  },
  {
    matchKeys: ["sc-smart", "smart", "sc smart", "standard chartered smart", "smart credit card"],
    cardDisplayName: "Standard Chartered Smart",
    merchantPerks: {
      amazon: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% flat cashback on all online spends (capped at ₹1,000/mo)",
        badge: "2% Online Cashback",
      },
      flipkart: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% flat cashback on all online shopping",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% flat cashback on food delivery online",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% flat cashback on food orders online",
      },
      blinkit: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% flat cashback on online grocery orders",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on online spends (capped at ₹1,000/mo)",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on online food delivery",
      },
      "Groceries": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2% cashback on quick commerce grocery apps",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "2% flat cashback on all online spends (up to ₹1,000/mo)",
      "1% cashback on all offline spends",
      "Special 0.84% per month interest on 3-month EMI",
    ],
  },
  {
    matchKeys: [
      "sc-manhattan",
      "manhattan",
      "sc manhattan",
      "standard chartered manhattan",
      "manhattan platinum",
    ],
    cardDisplayName: "Standard Chartered Manhattan Platinum",
    merchantPerks: {
      dmart: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on supermarket & grocery spends (up to ₹500/mo, min ₹1,000/txn)",
        badge: "5% Supermarket",
      },
      reliance_retail: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Reliance Fresh / Supermarket purchases",
      },
      blinkit: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on grocery and supermarket spends",
      },
      zepto: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on grocery shopping",
      },
    },
    categoryPerks: {
      "Groceries": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback at all supermarkets and grocery stores (up to ₹500/mo)",
      },
      "Food & Dining": {
        returnPct: 0.99,
        perkType: "reward_points",
        description: "3X reward points on dining and retail spends",
      },
      "Online Shopping": {
        returnPct: 0.99,
        perkType: "reward_points",
        description: "3X reward points on other retail transactions",
      },
    },
    defaultOnlineReturnPct: 0.99,
    defaultOfflineReturnPct: 0.99,
    specialPerks: [
      "5% flat cashback on groceries and supermarkets (DMart, Reliance Fresh, More, Spencers)",
      "3X reward points on all other spends",
      "20% dining discount via Good Times",
    ],
  },
  {
    matchKeys: [
      "sc-rewards",
      "sc rewards",
      "standard chartered rewards",
      "standard chartered rewards credit card",
      "rewards credit card",
    ],
    cardDisplayName: "Standard Chartered Rewards",
    merchantPerks: {
      amazon: {
        returnPct: 2.67,
        perkType: "reward_points",
        description: "4X Reward Points per ₹150 on retail spends (approx 2.67% return, up to ₹20,000/mo)",
        badge: "4X Rewards (2.67%)",
      },
      flipkart: {
        returnPct: 2.67,
        perkType: "reward_points",
        description: "4X Reward Points per ₹150 on retail shopping",
      },
      myntra: {
        returnPct: 2.67,
        perkType: "reward_points",
        description: "4X Reward Points per ₹150 on apparel and lifestyle",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 2.67,
        perkType: "reward_points",
        description: "4X points per ₹150 spent (up to ₹20,000 monthly retail spend cap)",
      },
      "Food & Dining": {
        returnPct: 2.67,
        perkType: "reward_points",
        description: "4X points per ₹150 spent on dining out",
      },
    },
    defaultOnlineReturnPct: 2.67,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "4X Reward Points per ₹150 on all retail spends (up to ₹20,000/mo)",
      "1X base reward point per ₹150 elsewhere",
      "4 complimentary domestic airport lounge visits per calendar year",
    ],
  },
  {
    matchKeys: [
      "sc-easemytrip",
      "standard chartered easemytrip",
      "sc easemytrip",
      "easemytrip standard chartered",
      "easemytrip credit card",
      "easemytrip",
    ],
    cardDisplayName: "Standard Chartered EaseMyTrip",
    merchantPerks: {
      easemytrip: {
        returnPct: 20.0,
        perkType: "discount",
        description:
          "20% instant discount on domestic & international hotels, 10% on flights via EaseMyTrip",
        badge: "20% Hotel Discount",
      },
      makemytrip: {
        returnPct: 2.67,
        perkType: "reward_points",
        description: "10X reward points on standalone hotel & airline booking portals",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 20.0,
        perkType: "discount",
        description: "20% discount on hotel bookings and 10% on flight tickets via EaseMyTrip",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "20% off on hotels via EaseMyTrip",
      "10% off on flight bookings",
      "10X rewards on standalone airline & hotel bookings",
    ],
  },
  {
    matchKeys: [
      "sc-digismart",
      "digismart",
      "sc digismart",
      "standard chartered digismart",
    ],
    cardDisplayName: "Standard Chartered DigiSmart",
    merchantPerks: {
      myntra: {
        returnPct: 20.0,
        perkType: "discount",
        description: "20% instant discount on Myntra up to ₹700 off monthly",
        badge: "20% Myntra Discount",
      },
      zomato: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% instant discount on Zomato food orders up to ₹150 off 5 times a month",
        badge: "10% Zomato Off",
      },
      blinkit: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% instant discount on Blinkit groceries up to ₹1,000 monthly",
        badge: "10% Blinkit Off",
      },
      bookmyshow: {
        returnPct: 25.0,
        perkType: "discount",
        description: "25% discount on INOX cinema tickets (up to ₹200 off)",
      },
      ola: {
        returnPct: 15.0,
        perkType: "discount",
        description: "15% instant discount on Ola cabs (up to ₹600 monthly)",
        badge: "15% Ola Off",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 20.0,
        perkType: "discount",
        description: "20% off on Myntra (up to ₹700/mo)",
      },
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on Zomato food delivery",
      },
      "Groceries": {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% discount on Blinkit grocery delivery",
      },
      "Travel & Flights": {
        returnPct: 15.0,
        perkType: "discount",
        description: "15% discount on Ola ride hailing",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "20% discount on Myntra up to ₹700/mo",
      "10% discount on Zomato food orders (5x/mo)",
      "10% on Blinkit up to ₹1,000/mo",
      "25% discount on INOX tickets",
    ],
  },
  {
    matchKeys: [
      "sc-super-value",
      "super value",
      "sc super value",
      "standard chartered super value",
      "super value titanium",
    ],
    cardDisplayName: "Standard Chartered Super Value Titanium",
    merchantPerks: {
      hpcl: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on fuel purchases across all fuel stations in India",
        badge: "5% Fuel Cashback",
      },
      bpcl: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on fuel at any BPCL pump",
      },
      ioc: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on fuel at any Indian Oil pump",
      },
      airtel: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on phone bills and telecom recharges",
        badge: "5% Phone Bills",
      },
      jio: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on phone bills and postpaid recharge",
      },
    },
    categoryPerks: {
      "Fuel": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on fuel spends at all petrol pumps in India (min ₹750/txn, max ₹200/mo)",
      },
      "Bills & Utilities": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on phone, electricity, gas and water bills (max ₹100/mo each)",
      },
    },
    defaultOnlineReturnPct: 0.67,
    defaultOfflineReturnPct: 0.67,
    specialPerks: [
      "5% cashback on fuel purchases across India",
      "5% cashback on phone & telecom bills",
      "5% cashback on utility payments",
    ],
  },
  {
    matchKeys: [
      "sc-emirates",
      "emirates",
      "sc emirates",
      "standard chartered emirates",
      "emirates world",
    ],
    cardDisplayName: "Standard Chartered Emirates World",
    merchantPerks: {
      emirates: {
        returnPct: 4.0,
        perkType: "miles",
        description: "6 Skywards Miles per ₹150 on Emirates airline bookings (approx 4% return)",
        badge: "6 Skywards Miles",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 4.0,
        perkType: "miles",
        description: "6 Skywards Miles per ₹150 on Emirates flight bookings",
      },
      "International Spends": {
        returnPct: 2.0,
        perkType: "miles",
        description: "3 Skywards Miles per ₹150 on international retail spends",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "6 Skywards Miles per ₹150 on Emirates bookings",
      "3 Skywards Miles per ₹150 on all other retail",
      "2 complimentary Priority Pass lounge visits per month",
    ],
  },
  {
    matchKeys: [
      "sc-platinum-rewards",
      "platinum rewards",
      "sc platinum rewards",
      "standard chartered platinum rewards",
    ],
    cardDisplayName: "Standard Chartered Platinum Rewards",
    merchantPerks: {
      swiggy: {
        returnPct: 1.25,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on dining & delivery (approx 1.25% return)",
        badge: "5X Dining & Fuel",
      },
      zomato: {
        returnPct: 1.25,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on dining out",
      },
      hpcl: {
        returnPct: 1.25,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on fuel + 1% surcharge waiver",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 1.25,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on dining without minimum spend restriction",
      },
      "Fuel": {
        returnPct: 1.25,
        perkType: "reward_points",
        description: "5 Reward Points per ₹150 on fuel purchases + surcharge waiver",
      },
    },
    defaultOnlineReturnPct: 0.67,
    defaultOfflineReturnPct: 0.67,
    specialPerks: [
      "5 Reward Points per ₹150 on Dining and Fuel",
      "1 Reward Point per ₹150 on other categories",
      "1% fuel surcharge waiver across India",
    ],
  },
  {
    matchKeys: ["sc-beyond", "beyond", "sc beyond", "standard chartered beyond"],
    cardDisplayName: "Standard Chartered Beyond",
    merchantPerks: {
      forex_international: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "3X points on international spends with industry-lowest 1.5% forex fee",
        badge: "1.5% Forex VIP",
      },
    },
    categoryPerks: {
      "International Spends": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "Accelerated international rewards with ultra-low 1.5% forex fee",
      },
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "Unlimited domestic & international lounge access + airport VIP meet & assist",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "Invitation-only super-premium metal card",
      "Ultra-low 1.5% forex markup",
      "Unlimited lounge access worldwide + airport VIP meet & assist",
    ],
  },
  {
    matchKeys: ["sc-priority", "priority", "sc priority", "standard chartered priority"],
    cardDisplayName: "Standard Chartered Priority Visa Infinite",
    merchantPerks: {
      forex_international: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "Comprehensive international wealth privileges & concierge",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "Complimentary airport lounge access worldwide & golf privileges",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "Priority Banking wealth privileges",
      "Complimentary LoungeKey airport access",
      "4 complimentary golf games annually",
    ],
  },

  // ── Federal Bank / Scapia
  {
    matchKeys: ["scapia", "federal scapia"],
    cardDisplayName: "Federal Bank Scapia",
    merchantPerks: {
      makemytrip: {
        returnPct: 4.0,
        perkType: "reward_points",
        description:
          "20% Scapia Coins (4% real value) on in-app travel bookings, 10% Scapia Coins (2% value) elsewhere",
      },
      easemytrip: {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "20% Scapia Coins on travel reservations",
      },
      forex_international: {
        returnPct: 5.5,
        perkType: "reward_points",
        description:
          "Zero Forex markup (saves 3.5% FX fee) + 10% Scapia Coins (2% value) on international spends",
        badge: "0% Forex + 2% Coins",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "10% Scapia Coins (2% value, 5 Coins = ₹1) on domestic shopping",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "10% Scapia Coins on dining spends",
      },
    },
    categoryPerks: {
      "International Spends": {
        returnPct: 5.5,
        perkType: "reward_points",
        description: "Zero Forex markup saves 3.5% FX fee + 2% Scapia Coins value back",
      },
      "Travel & Flights": {
        returnPct: 4.0,
        perkType: "reward_points",
        description: "20% Scapia Coins on travel bookings (5 Coins = ₹1 on flights & hotels)",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    forexMarkupPct: 0.0,
    specialPerks: [
      "0% Forex Markup fee on all international payments",
      "Unlimited domestic lounge access on ₹5k spend/mo",
      "Instant coin redemption 5 Coins = ₹1",
    ],
  },

  // ── OneCard
  {
    matchKeys: ["onecard", "one card"],
    cardDisplayName: "OneCard Metal",
    merchantPerks: {
      swiggy: {
        returnPct: 2.0,
        perkType: "reward_points",
        description:
          "5X Rewards (1% - 2% value) on top 2 spend categories of the month + Around You merchant offers",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5X points in top monthly dining category",
      },
      forex_international: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "Low 1% Forex markup fee with instant reward points",
        badge: "1% Low Forex",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5X points in your top category for the month",
      },
      "International Spends": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "Lowest 1.0% forex fee vs 3.5% standard bank fee",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    forexMarkupPct: 1.0,
    specialPerks: [
      "5X points on top 2 spend categories",
      "1% low forex markup",
      "Around You instant local discounts",
    ],
  },

  // ── Amex Cards
  {
    matchKeys: ["mrcc", "membership rewards", "amex mrcc"],
    cardDisplayName: "American Express MRCC",
    merchantPerks: {
      amazon: {
        returnPct: 6.0,
        perkType: "reward_points",
        description: "4 monthly transactions of ₹1,500 yield 1,000 bonus points (up to 6% return)",
        badge: "Milestone Multiplier",
      },
      swiggy: {
        returnPct: 6.0,
        perkType: "reward_points",
        description: "Use towards 4 × ₹1,500 monthly transactions for 1,000 bonus MR points",
      },
      zomato: {
        returnPct: 6.0,
        perkType: "reward_points",
        description: "Monthly ₹1,500 milestone bonus qualification",
      },
      electricity_bills: {
        returnPct: 6.0,
        perkType: "reward_points",
        description: "Utility payments qualify for monthly milestone bonus",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 6.0,
        perkType: "reward_points",
        description:
          "Up to 6% return via 1,000 bonus points on 4 × ₹1,500 monthly transactions and 20k spend milestone",
      },
      "Utilities & Bills": {
        returnPct: 6.0,
        perkType: "reward_points",
        description: "Earn milestone bonus points on utility bill transactions",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "1,000 bonus points on 4 × ₹1,500 txns/month",
      "1,000 bonus points on ₹20k monthly spend",
      "Redeem for 18k / 24k Gold Collection vouchers",
    ],
  },
  {
    matchKeys: ["amex platinum", "platinum travel"],
    cardDisplayName: "American Express Platinum Travel",
    merchantPerks: {
      makemytrip: {
        returnPct: 8.0,
        perkType: "reward_points",
        description:
          "Accelerated milestone yield: ₹4L annual spend gives 48,000 points + ₹10,000 Taj voucher (~8% net return)",
        badge: "8% Milestone Yield",
      },
      easemytrip: {
        returnPct: 8.0,
        perkType: "reward_points",
        description: "Milestone points convertible 1:1 to Marriott Bonvoy or Taj vouchers",
      },
      apple: {
        returnPct: 8.0,
        perkType: "reward_points",
        description: "Qualifies toward ₹1.9L and ₹4L annual spend milestone rewards",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 8.0,
        perkType: "reward_points",
        description:
          "₹4L milestone gives ~₹32,000 worth of travel and Taj hotel vouchers (8% return)",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "₹10,000 Taj voucher on ₹4L spend",
      "48,000 MR points convertible to Marriott Bonvoy",
      "8 complimentary domestic lounge visits",
    ],
  },

  // ── Kotak Mahindra Bank Cards ──────────────────────────────────────────────
  {
    matchKeys: ["kotak white", "white reserve", "kotak white reserve"],
    cardDisplayName: "Kotak White Reserve",
    merchantPerks: {
      apple: {
        returnPct: 3.5,
        perkType: "reward_points",
        description:
          "White Pass value unlocked upon luxury milestone spends (₹1.5L - ₹12L yields up to ₹27,000 White Pass)",
        badge: "White Pass Luxury",
      },
      taj: {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "Direct redemption of White Pass currency at luxury brands and Taj hotels",
      },
      forex_international: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "Reduced 2.0% forex markup + White Pass milestone accrual",
      },
    },
    categoryPerks: {
      "Luxury & Shopping": {
        returnPct: 3.5,
        perkType: "reward_points",
        description:
          "White Pass milestone program providing up to 3.5% effective value on curated luxury brands",
      },
      "Travel & Flights": {
        returnPct: 3.0,
        perkType: "reward_points",
        description:
          "Unlimited domestic and international airport lounge access + White Pass flight redemptions",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.5,
    forexMarkupPct: 2.0,
    specialPerks: [
      "White Pass currency with up to ₹27,000 vouchers per year",
      "Unlimited domestic & international lounge access",
      "Low 2.0% forex markup",
    ],
  },
  {
    matchKeys: ["kotak zen", "zen signature", "zen credit card"],
    cardDisplayName: "Kotak Zen Signature",
    merchantPerks: {
      myntra: {
        returnPct: 2.5,
        perkType: "reward_points",
        description:
          "10 Zen Points per ₹150 on apparel & lifestyle purchases with milestone accelerator (up to 2.5% effective return)",
        badge: "10X Zen Points",
      },
      zara: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Zen Points per ₹150 on fashion retail",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "10 Zen Points per ₹150 on dining and food delivery",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "10 Zen Points per ₹150 on food and dining orders",
      },
    },
    categoryPerks: {
      "Shopping & Fashion": {
        returnPct: 2.5,
        perkType: "reward_points",
        description:
          "10 Zen Points per ₹150 on Apparel, Lifestyle & Departmental stores (up to 2.5% return)",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "10 Zen Points per ₹150 on dining & restaurants",
      },
    },
    defaultOnlineReturnPct: 0.83,
    defaultOfflineReturnPct: 0.83,
    specialPerks: [
      "10 Zen Points per ₹150 on Apparel, Lifestyle & Dining",
      "8 complimentary airport lounge visits/yr",
      "₹7,500 milestone shopping voucher on ₹6L annual spend",
    ],
  },
  {
    matchKeys: ["kotak mojo", "mojo platinum", "mojo credit card"],
    cardDisplayName: "Kotak Mojo Platinum",
    merchantPerks: {
      amazon: {
        returnPct: 2.0,
        perkType: "reward_points",
        description:
          "5 Mojo Points per ₹100 on all online purchases (1 Mojo Point = ₹0.40, 2.0% net return)",
        badge: "5 Mojo Pts (2%)",
      },
      flipkart: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5 Mojo Points per ₹100 on e-commerce spends",
      },
      swiggy: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5 Mojo Points per ₹100 on online food ordering",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5 Mojo Points per ₹100 on online orders",
      },
      bookmyshow: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5 Mojo Points per ₹100 on ticket bookings",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5 Mojo Points per ₹100 on all online transactions (2.0% return rate)",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "5 Mojo Points per ₹100 on food delivery apps",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "5 Mojo Points per ₹100 on all online spends (2% value)",
      "2.5 Mojo Points per ₹100 on offline spends",
      "8 complimentary domestic airport lounge visits",
    ],
  },
  {
    matchKeys: ["kotak league", "league platinum", "kotak league platinum"],
    cardDisplayName: "Kotak League Platinum",
    merchantPerks: {
      myntra: {
        returnPct: 1.33,
        perkType: "reward_points",
        description: "8X Reward Points per ₹150 on apparel and lifestyle spends (1.33% return)",
      },
      bookmyshow: {
        returnPct: 3.0,
        perkType: "discount",
        description:
          "4 free PVR movie tickets or 10,000 reward points on ₹1.25L spend every 6 months",
        badge: "Free Movie Tickets",
      },
    },
    categoryPerks: {
      "Shopping & Fashion": {
        returnPct: 1.33,
        perkType: "reward_points",
        description: "8X Reward Points per ₹150 on Apparel, Luxury, Travel & Airlines",
      },
      "Entertainment & Movies": {
        returnPct: 3.0,
        perkType: "discount",
        description: "PVR movie tickets milestone benefit on ₹1.25L semi-annual spend",
      },
    },
    defaultOnlineReturnPct: 0.67,
    defaultOfflineReturnPct: 0.67,
    specialPerks: [
      "8X Reward Points on apparel, luxury goods and departmental stores",
      "4 free PVR movie tickets every 6 months on ₹1.25L spend",
      "Fuel surcharge waiver",
    ],
  },
  {
    matchKeys: ["kotak-iocl", "kotak indianoil", "kotak iocl", "kotak indianoil rupay"],
    cardDisplayName: "Kotak IndianOil RuPay",
    merchantPerks: {
      fuel_pumps: {
        returnPct: 5.0,
        perkType: "reward_points",
        description:
          "4% back in reward points (24 points per ₹150) at IndianOil fuel outlets + 1% fuel surcharge waiver",
        badge: "5% Fuel Savings",
      },
      indianoil_fuel: {
        returnPct: 5.0,
        perkType: "reward_points",
        description:
          "4% back in reward points (24 points per ₹150) at IndianOil fuel outlets + 1% fuel surcharge waiver",
        badge: "5% Fuel Savings",
      },
      hpcl_fuel: {
        returnPct: 1.0,
        perkType: "cashback",
        description: "1% fuel surcharge waiver on transactions between ₹500 and ₹3,000",
      },
      bpcl_fuel: { returnPct: 1.0, perkType: "cashback", description: "1% fuel surcharge waiver" },
    },
    categoryPerks: {
      Fuel: {
        returnPct: 5.0,
        perkType: "reward_points",
        description:
          "5% total savings (4% rewards + 1% surcharge waiver) at IndianOil fuel stations",
      },
      "Fuel & Gas": {
        returnPct: 5.0,
        perkType: "reward_points",
        description:
          "5% total savings (4% rewards + 1% surcharge waiver) at IndianOil fuel stations",
      },
      "Groceries & Supermarket": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% back (12 reward points per ₹150) on grocery purchases",
      },
      "Dining & Food Delivery": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2% back in reward points on dining spends",
      },
    },
    defaultOnlineReturnPct: 0.5,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "5% total savings on IndianOil fuel purchases",
      "UPI on Credit Card linked with BHIM, PhonePe, Google Pay",
      "2% back on groceries and dining",
    ],
  },
  {
    matchKeys: ["kotak 811", "dream different", "kotak dream different"],
    cardDisplayName: "Kotak 811 #DreamDifferent",
    merchantPerks: {
      amazon: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "2X Reward Points on online shopping (2 pts per ₹100, 1.0% return)",
        badge: "2X Online Pts",
      },
      flipkart: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "2X Reward Points on online purchases",
      },
      swiggy: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "2X Reward Points on online ordering",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "2X Reward Points on all online shopping portals",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "Zero joining fee and lifetime free credit card against FD",
      "2X rewards on all online spends",
      "90% cash withdrawal of FD amount with 48 days interest-free",
    ],
  },

  // ── YES Bank Cards ─────────────────────────────────────────────────────────
  {
    matchKeys: ["yes bank marquee", "yes marquee", "marquee metal", "marquee credit card"],
    cardDisplayName: "YES Bank Marquee",
    merchantPerks: {
      bookmyshow: {
        returnPct: 4.5,
        perkType: "discount",
        description:
          "Buy 1 Get 1 free movie ticket up to ₹800 discount on BookMyShow (up to 3 times per month)",
        badge: "BOGO ₹800 BMS",
      },
      amazon: {
        returnPct: 4.5,
        perkType: "reward_points",
        description:
          "36 Reward Points per ₹200 on all online retail shopping (4.5% return value, 1 RP = ₹0.25)",
        badge: "4.5% Online (36 RP)",
      },
      flipkart: {
        returnPct: 4.5,
        perkType: "reward_points",
        description: "36 Reward Points per ₹200 on online purchases (4.5% value)",
      },
      swiggy: {
        returnPct: 4.5,
        perkType: "reward_points",
        description: "36 Reward Points per ₹200 on food delivery (4.5% value)",
      },
      zomato: {
        returnPct: 4.5,
        perkType: "reward_points",
        description: "36 Reward Points per ₹200 on dining and food delivery (4.5% value)",
      },
      myntra: {
        returnPct: 4.5,
        perkType: "reward_points",
        description: "36 Reward Points per ₹200 on fashion retail (4.5% value)",
      },
      eazydiner: {
        returnPct: 4.5,
        perkType: "reward_points",
        description:
          "36 Reward Points per ₹200 on online table reservations and dining (4.5% value)",
      },
      forex_international: {
        returnPct: 4.5,
        perkType: "reward_points",
        description:
          "Low 1% foreign currency markup + 36 Reward Points per ₹200 on online international spends",
        badge: "1% Low Forex",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 4.5,
        perkType: "reward_points",
        description: "36 Reward Points per ₹200 on all online spends (4.5% return)",
      },
      "Food & Dining": {
        returnPct: 4.5,
        perkType: "reward_points",
        description: "36 Reward Points per ₹200 on online dining & food apps",
      },
      "Entertainment & Movies": {
        returnPct: 4.5,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹800 on BookMyShow",
      },
      "Travel & Flights": {
        returnPct: 4.5,
        perkType: "reward_points",
        description:
          "Unlimited international airport lounge access via Priority Pass (guest included) + 6 domestic lounge visits/quarter",
      },
    },
    defaultOnlineReturnPct: 4.5,
    defaultOfflineReturnPct: 2.25,
    forexMarkupPct: 1.0,
    specialPerks: [
      "36 Reward Points per ₹200 on online spends (4.5% return)",
      "18 Reward Points per ₹200 on offline retail (2.25% return)",
      "Unlimited international lounge access via Priority Pass with guest access",
      "6 complimentary domestic airport lounge visits per quarter",
      "Low 1% foreign currency markup",
      "Buy 1 Get 1 movie tickets up to ₹800 on BookMyShow (3x/month)",
    ],
  },
  {
    matchKeys: ["yes bank reserv", "yes reserv", "reserv credit card"],
    cardDisplayName: "YES Bank Reserv",
    merchantPerks: {
      bookmyshow: {
        returnPct: 3.0,
        perkType: "discount",
        description:
          "Buy 1 Get 1 free movie ticket up to ₹400 discount on BookMyShow (up to 2 times per month)",
        badge: "BOGO ₹400 BMS",
      },
      amazon: {
        returnPct: 3.0,
        perkType: "reward_points",
        description:
          "24 Reward Points per ₹200 on online shopping (3.0% return rate, 1 RP = ₹0.25)",
        badge: "3% Online (24 RP)",
      },
      flipkart: {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "24 Reward Points per ₹200 on online shopping (3.0% value)",
      },
      swiggy: {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "24 Reward Points per ₹200 on online food delivery (3.0% value)",
      },
      zomato: {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "24 Reward Points per ₹200 on dining (3.0% value)",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "24 Reward Points per ₹200 on online spends (3.0% value)",
      },
      "Food & Dining": {
        returnPct: 3.0,
        perkType: "reward_points",
        description: "24 Reward Points per ₹200 on dining & food apps",
      },
      "Entertainment & Movies": {
        returnPct: 3.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹400 on BookMyShow",
      },
      "Travel & Flights": {
        returnPct: 3.0,
        perkType: "reward_points",
        description:
          "3 complimentary domestic lounge visits per quarter + Priority Pass membership",
      },
    },
    defaultOnlineReturnPct: 3.0,
    defaultOfflineReturnPct: 1.5,
    forexMarkupPct: 1.75,
    specialPerks: [
      "24 Reward Points per ₹200 on online spends (3.0% value)",
      "12 Reward Points per ₹200 on offline retail (1.5% value)",
      "3 complimentary domestic lounge visits per quarter",
      "Low 1.75% foreign currency markup",
      "Buy 1 Get 1 movie tickets up to ₹400 on BookMyShow (2x/month)",
    ],
  },
  {
    matchKeys: [
      "yes bank elite",
      "yes elite",
      "elite+",
      "yes premia elite",
      "yes bank elite credit card",
    ],
    cardDisplayName: "YES Bank Elite+",
    merchantPerks: {
      bookmyshow: {
        returnPct: 1.5,
        perkType: "discount",
        description: "25% discount up to ₹250 on movie tickets via BookMyShow",
        badge: "25% Off BMS",
      },
      amazon: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "12 Reward Points per ₹200 on online shopping (1.5% return value)",
      },
      flipkart: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "12 Reward Points per ₹200 on online orders",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "12 Reward Points per ₹200 on food delivery",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "12 Reward Points per ₹200 on online retail (1.5% value)",
      },
      "Entertainment & Movies": {
        returnPct: 1.5,
        perkType: "discount",
        description: "25% discount on BookMyShow movie tickets",
      },
      "Travel & Flights": {
        returnPct: 1.5,
        perkType: "reward_points",
        description: "2 complimentary domestic airport lounge visits per calendar quarter",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 0.75,
    specialPerks: [
      "12 Reward Points per ₹200 on online spends (1.5% return)",
      "6 Reward Points per ₹200 on offline retail (0.75% return)",
      "2 complimentary domestic airport lounge visits per quarter",
      "25% discount on BookMyShow movie tickets",
    ],
  },
  {
    matchKeys: [
      "yes bank select",
      "yes select",
      "prosperity edge select",
      "yes bank select credit card",
    ],
    cardDisplayName: "YES Bank Select",
    merchantPerks: {
      bookmyshow: {
        returnPct: 1.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹200 on BookMyShow",
      },
      amazon: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "8 Reward Points per ₹200 on online purchases (1.0% return)",
      },
      flipkart: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "8 Reward Points per ₹200 on online shopping",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "8 Reward Points per ₹200 on online transactions (1.0% return)",
      },
      "Travel & Flights": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 complimentary domestic airport lounge access per quarter",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "8 Reward Points per ₹200 on online shopping (1.0% value)",
      "4 Reward Points per ₹200 on offline spends (0.5% value)",
      "1 complimentary domestic airport lounge visit per quarter",
      "Buy 1 Get 1 free movie ticket on BookMyShow",
    ],
  },
  {
    matchKeys: ["yes bank ace", "yes ace", "rewards plus ace", "yes bank ace credit card"],
    cardDisplayName: "YES Bank ACE",
    merchantPerks: {
      blinkit: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Accelerated 4X Reward Points on grocery & supermarket orders (1.0% return)",
      },
      instamart: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Accelerated 4X Reward Points on grocery orders (1.0% return)",
      },
      zepto: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Accelerated 4X Reward Points on quick grocery delivery",
      },
      bigbasket: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Accelerated 4X Reward Points on grocery orders",
      },
    },
    categoryPerks: {
      "Groceries & Supermarket": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Accelerated 4X Reward Points per ₹100 on grocery and departmental stores",
      },
      "Online Shopping": {
        returnPct: 0.5,
        perkType: "reward_points",
        description: "2 Reward Points per ₹100 on retail purchases",
      },
    },
    defaultOnlineReturnPct: 0.5,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "Accelerated rewards on grocery and departmental store spends",
      "Fuel surcharge waiver across all fuel stations",
      "Lifetime free card option with annual spend waiver",
    ],
  },
  {
    matchKeys: ["yes first preferred", "yes first", "first preferred", "yes bank first preferred"],
    cardDisplayName: "YES FIRST Preferred",
    merchantPerks: {
      makemytrip: {
        returnPct: 2.0,
        perkType: "reward_points",
        description:
          "16 Reward Points per ₹200 on domestic & international flight/hotel bookings (2.0% value)",
      },
      easemytrip: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "16 Reward Points per ₹200 on travel bookings",
      },
      taj: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "16 Reward Points per ₹200 on luxury hotel stays & dining",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 2.0,
        perkType: "reward_points",
        description:
          "16 Reward Points per ₹200 on airlines, travel & luxury hotels + 2 domestic & 4 international lounge visits",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "16 Reward Points per ₹200 on standalone dining restaurants",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    forexMarkupPct: 1.75,
    specialPerks: [
      "16 Reward Points per ₹200 on travel and dining (2.0% value)",
      "8 Reward Points per ₹200 on all other retail transactions (1.0% value)",
      "2 complimentary domestic lounge visits per quarter",
      "4 complimentary international lounge visits per year via Priority Pass",
      "Reduced 1.75% foreign currency markup",
    ],
  },
  {
    matchKeys: ["yes bank byoc", "byoc", "build your own card", "yes byoc"],
    cardDisplayName: "YES Bank BYOC",
    merchantPerks: {
      swiggy: {
        returnPct: 10.0,
        perkType: "cashback",
        description:
          "Up to 10% customizable cashback on selected merchant tier package (Food & Dining plan)",
        badge: "Up to 10% BYOC",
      },
      zomato: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "Up to 10% cashback on chosen dining merchant plan",
      },
      amazon: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "Up to 10% cashback on selected e-commerce shopping plan",
      },
      blinkit: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "Up to 10% cashback on chosen grocery package",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on chosen subscription merchants (up to ₹1,000/mo cap)",
      },
      "Online Shopping": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on chosen shopping category",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "Fully customizable card with 10% cashback on chosen merchant bundles",
      "Flexible monthly subscription packages tailored to your lifestyle",
      "1% fuel surcharge waiver",
    ],
  },
  {
    matchKeys: ["yes bank kiwi", "kiwi rupay", "kiwi credit card", "gokiwi"],
    cardDisplayName: "YES Bank Kiwi RuPay",
    merchantPerks: {
      swiggy: {
        returnPct: 2.0,
        perkType: "cashback",
        description:
          "Flat 2.0% cashback on UPI Scan & Pay merchant transactions via Kiwi app (2 Kiwis per ₹50)",
        badge: "2% UPI Cashback",
      },
      zomato: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "Flat 2.0% cashback via Kiwi UPI on credit card",
      },
      blinkit: {
        returnPct: 2.0,
        perkType: "cashback",
        description: "Flat 2.0% cashback on merchant QR payment",
      },
    },
    categoryPerks: {
      "UPI & Scan to Pay": {
        returnPct: 2.0,
        perkType: "cashback",
        description:
          "Flat 2.0% cashback on all merchant UPI QR code payments via Kiwi (1 Kiwi = ₹0.50)",
      },
      "Food & Dining": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2.0% cashback on UPI food delivery and dining out payments",
      },
      "Groceries & Supermarket": {
        returnPct: 2.0,
        perkType: "cashback",
        description: "2.0% cashback on UPI grocery payments",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "Virtual RuPay Credit Card on UPI with zero joining or annual fees",
      "Flat 2.0% cashback on all UPI merchant QR scan & pay transactions",
      "Direct redemption of Kiwis as cashback into bank account",
    ],
  },
  {
    matchKeys: ["yes bank popclub", "popclub", "pop club", "yes popclub"],
    cardDisplayName: "YES Bank Popclub RuPay",
    merchantPerks: {
      myntra: {
        returnPct: 10.0,
        perkType: "reward_points",
        description:
          "Up to 10% value back in Popcoins on curated D2C and lifestyle brands on the Pop network",
        badge: "10% Popcoins",
      },
      nykaa: {
        returnPct: 10.0,
        perkType: "reward_points",
        description: "10% value back in Popcoins on beauty and wellness partner network",
      },
    },
    categoryPerks: {
      "Shopping & Fashion": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "Accelerated Popcoins on e-commerce network transactions",
      },
      "Online Shopping": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "Up to 10% Popcoins on Popclub network + 2% on other online spends",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "10% Popcoins on 500+ D2C and partner lifestyle brands",
      "RuPay credit card on UPI for seamless merchant QR payments",
      "2% rewards on other non-partner retail spends",
    ],
  },
  {
    matchKeys: ["yes bank uni", "uni credit card", "uni card", "yes uni", "uni nx wave"],
    cardDisplayName: "YES Bank Uni Credit Card",
    merchantPerks: {
      amazon: {
        returnPct: 1.0,
        perkType: "cashback",
        description:
          "Flat 1.0% cashback on full bill payment or split 1/3rd over 3 months at zero extra cost",
        badge: "1% / Pay 1/3rd",
      },
      flipkart: {
        returnPct: 1.0,
        perkType: "cashback",
        description: "Flat 1.0% cashback on e-commerce transactions",
      },
      swiggy: {
        returnPct: 1.0,
        perkType: "cashback",
        description: "Flat 1.0% cashback on food delivery",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "cashback",
        description: "Flat 1.0% upfront cashback on 30-day bill payment",
      },
      "Food & Dining": {
        returnPct: 1.0,
        perkType: "cashback",
        description: "1.0% cashback on dining and food delivery",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Unique 1/3rd split: Pay in 3 parts over 3 months at zero extra interest",
      "Flat 1.0% cashback on all transactions when paid in full within 30 days",
      "Zero joining fee and lifetime free privileges",
    ],
  },

  // ── RBL Bank Cards (Phase 14) ────────────────────────────────────────────────
  {
    matchKeys: [
      "rbl-world-safari",
      "world safari",
      "rbl world safari",
      "safari",
      "rbl safari",
      "world safari credit card",
    ],
    cardDisplayName: "RBL World Safari",
    merchantPerks: {
      makemytrip: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5 Travel Points per ₹100 spent on travel reservations (1 TP = ₹1 on travel redemptions)",
        badge: "5% Travel Points",
      },
      easemytrip: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5 Travel Points per ₹100 spent on travel tickets",
      },
      cleartrip: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5 Travel Points per ₹100 on flight & hotel bookings",
      },
      yatra: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5 Travel Points per ₹100 on travel reservations",
      },
      forex_international: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "0% foreign currency markup fee across all global spends + 2 Travel Points/₹100 (total ~5.85% value savings)",
        badge: "0% Forex Markup",
      },
      irctc: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 Travel Points per ₹100 on train tickets",
      },
    },
    categoryPerks: {
      "Travel & Flights": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "5 Travel Points per ₹100 spent on travel bookings (1 TP = ₹1 on travel redemptions)",
      },
      International: {
        returnPct: 5.85,
        perkType: "cashback",
        description: "Zero (0%) forex markup fee on all foreign currency transactions + 2 Travel Points/₹100",
      },
      Entertainment: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 Travel Points per ₹100 spent",
      },
      "Online Shopping": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 Travel Points per ₹100 spent on all regular retail transactions",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 2.0,
    specialPerks: [
      "Zero (0%) foreign currency markup fee on international transactions",
      "5 Travel Points per ₹100 spent on Travel (1 Travel Point = ₹1.00 on travel redemptions)",
      "2 complimentary domestic airport lounge visits per calendar quarter",
      "Complimentary Priority Pass membership with 2 free international lounge visits",
      "Milestone bonus: 10,000 Travel Points on ₹2.5L spend, 15,000 TP on ₹5L annual spend",
    ],
  },
  {
    matchKeys: [
      "rbl-insignia",
      "insignia",
      "rbl insignia",
      "insignia preferred",
      "rbl insignia preferred banking",
      "insignia world",
    ],
    cardDisplayName: "RBL Insignia Preferred Banking",
    merchantPerks: {
      bookmyshow: {
        returnPct: 15.0,
        perkType: "discount",
        description: "Buy one get one free movie ticket up to ₹500 off, up to 4 free tickets monthly (₹2,000/mo savings)",
        badge: "4 Free Tickets/mo",
      },
      forex_international: {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 on foreign spends with low 1.5% forex markup fee",
        badge: "1.5% Low Forex",
      },
      taj: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "5 Reward Points per ₹100 on luxury dining and Taj Epicure privileges",
      },
      eazydiner: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "Dining concierge reservations with accelerated reward points",
      },
    },
    categoryPerks: {
      "Movies & Cinema": {
        returnPct: 15.0,
        perkType: "discount",
        description: "4 complimentary movie tickets every month on BookMyShow (BOGO up to ₹500 per ticket)",
      },
      International: {
        returnPct: 3.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 on foreign spends with low 1.5% forex markup fee",
      },
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "5 Reward Points per ₹100 spent on dining across premium restaurants",
      },
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "Unlimited domestic and international airport lounge access via Priority Pass",
      },
    },
    defaultOnlineReturnPct: 1.25,
    defaultOfflineReturnPct: 1.25,
    specialPerks: [
      "Unlimited complimentary domestic and international airport lounge visits",
      "4 complimentary BookMyShow movie tickets every month (BOGO up to ₹500 per ticket)",
      "2 complimentary golf rounds and 2 golf lessons per month at premier golf courses",
      "Low foreign exchange markup fee of 1.5%",
      "24/7 dedicated Insignia lifestyle concierge & master butler service",
    ],
  },
  {
    matchKeys: [
      "rbl-icon",
      "icon",
      "rbl icon",
      "rbl icon world",
      "icon credit card",
    ],
    cardDisplayName: "RBL Icon",
    merchantPerks: {
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "Buy one get one free movie ticket up to ₹200 off, up to 2 free tickets per month",
        badge: "BOGO BMS ₹200",
      },
      zomato: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 on dining and food orders (5% value back)",
        badge: "20 RP / ₹100",
      },
      swiggy: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 on dining & food delivery",
      },
      makemytrip: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 on international travel & hotel reservations",
      },
      forex_international: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 spent on all international transactions",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 spent on dining (1 RP = ₹0.25)",
      },
      International: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 spent on all international transactions",
      },
      "Movies & Cinema": {
        returnPct: 10.0,
        perkType: "discount",
        description: "BOGO BookMyShow movie tickets up to ₹200/ticket, 2 free tickets per month",
      },
      "Travel & Flights": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "2 complimentary domestic lounge visits per calendar quarter",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "20 Reward Points per ₹100 spent on Dining, International, and Hotels (5% value back)",
      "Buy 1 Get 1 free movie ticket up to ₹200 every month on BookMyShow (2 tickets/month)",
      "2 complimentary domestic airport lounge visits per calendar quarter",
      "Complimentary golf privileges: access to leading courses across India",
      "Annual milestone bonus: 10,000 RP on ₹3L spend, additional 15,000 RP on ₹5L spend",
    ],
  },
  {
    matchKeys: [
      "rbl-shoprite",
      "shoprite",
      "rbl shoprite",
      "rbl shop rite",
      "shop rite",
    ],
    cardDisplayName: "RBL ShopRite",
    merchantPerks: {
      blinkit: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 (5% value back) on groceries & superstores",
        badge: "5% Groceries",
      },
      zepto: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 on quick commerce groceries",
      },
      instamart: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 on Swiggy Instamart groceries",
      },
      bigbasket: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 on grocery shopping",
      },
      dmart: {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 at grocery supermarkets",
      },
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% instant discount on BookMyShow movie tickets (up to ₹100/order, 15 times/year)",
      },
      fuel_surcharge: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (2.5%) on fuel + 1% fuel surcharge waiver",
      },
    },
    categoryPerks: {
      "Groceries & Essentials": {
        returnPct: 5.0,
        perkType: "reward_points",
        description: "20 Reward Points per ₹100 spent on groceries (up to 1,000 points/month)",
      },
      Fuel: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 spent on fuel purchases + 1% surcharge waiver",
      },
      "Movies & Cinema": {
        returnPct: 10.0,
        perkType: "discount",
        description: "10% instant discount on BookMyShow tickets (up to ₹100 per transaction)",
      },
    },
    defaultOnlineReturnPct: 0.25,
    defaultOfflineReturnPct: 0.25,
    specialPerks: [
      "20 Reward Points per ₹100 on Grocery shopping (5% value back, capped at 1,000 RP/mo)",
      "10 Reward Points per ₹100 on Fuel purchases (2.5% value back, capped at 1,000 RP/mo)",
      "10% discount on BookMyShow movie tickets (up to ₹100 discount, 15 times/yr)",
      "Fuel surcharge waiver up to ₹100 per month across all fuel stations",
    ],
  },
  {
    matchKeys: [
      "rbl-play",
      "rbl play",
      "rbl play bookmyshow",
      "rbl bms",
      "play bookmyshow",
      "play credit card",
    ],
    cardDisplayName: "RBL Play BookMyShow",
    merchantPerks: {
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "2 complimentary movie tickets up to ₹250 each per month on ₹5,000 spend + ₹100 F&B discount",
        badge: "2 Free BMS Tickets",
      },
      zomato: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 on dining",
      },
      swiggy: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 on food delivery",
      },
    },
    categoryPerks: {
      "Movies & Cinema": {
        returnPct: 10.0,
        perkType: "discount",
        description: "2 free movie tickets up to ₹250 each every month on monthly spend of ₹5,000 (₹500/month benefit)",
      },
      "Food & Dining": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 spent",
      },
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 spent",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "2 free movie tickets up to ₹250 per ticket on BookMyShow every month on spending ₹5,000",
      "₹100 off on food & beverage purchases on BookMyShow tickets",
      "Welcome benefit: ₹500 BookMyShow voucher on card setup",
      "Fuel surcharge waiver at all petrol pumps for transactions between ₹500 and ₹4,000",
    ],
  },
  {
    matchKeys: [
      "rbl-cookies",
      "cookies",
      "rbl cookie",
      "rbl cookies",
      "cookies credit card",
    ],
    cardDisplayName: "RBL Cookies",
    merchantPerks: {
      zomato: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Zomato food delivery (up to ₹300 per month)",
        badge: "10% Cashback",
      },
      swiggy: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Swiggy dining & food orders (up to ₹300 per month)",
        badge: "10% Cashback",
      },
      blinkit: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Blinkit grocery delivery (up to ₹300 per month)",
        badge: "10% Cashback",
      },
      uber: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on Uber cab rides (up to ₹300 per month)",
        badge: "10% Cashback",
      },
      bookmyshow: {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% cashback on BookMyShow movie bookings (up to ₹300 per month)",
        badge: "10% Cashback",
      },
      myntra: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "5 Reward Points per ₹100 on online apparel shopping",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% instant cashback on Zomato & Swiggy orders (up to ₹300/month each)",
      },
      "Groceries & Essentials": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% instant cashback on Blinkit quick commerce (up to ₹300/month)",
      },
      "Cabs & Commute": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% instant cashback on Uber rides (up to ₹300/month)",
      },
      "Movies & Cinema": {
        returnPct: 10.0,
        perkType: "cashback",
        description: "10% instant cashback on BookMyShow movie tickets (up to ₹300/month)",
      },
      "Online Shopping": {
        returnPct: 1.25,
        perkType: "reward_points",
        description: "5 Reward Points per ₹100 on all online spends (₹0.25/point)",
      },
    },
    defaultOnlineReturnPct: 1.25,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "10% cashback on Zomato, Swiggy, Blinkit, Uber, and BookMyShow (up to ₹300/merchant/month)",
      "5 Reward Points per ₹100 on all online shopping transactions",
      "2 Reward Points per ₹100 on all offline retail spends",
      "Welcome gift voucher worth ₹1,000 on spending ₹10,000 within first 30 days",
      "Annual fee waiver on spending ₹1.5 Lakhs in preceding year",
    ],
  },
  {
    matchKeys: [
      "rbl-popcorn",
      "popcorn",
      "rbl popcorn",
      "rbl popcorn movie",
    ],
    cardDisplayName: "RBL Popcorn",
    merchantPerks: {
      bookmyshow: {
        returnPct: 12.0,
        perkType: "discount",
        description: "Up to 4 free movie tickets every month (up to 24 free tickets/yr, ₹250/ticket on BMS)",
        badge: "24 Movies/Yr",
      },
      pvr: {
        returnPct: 12.0,
        perkType: "discount",
        description: "BookMyShow movie ticket redemption across PVR / INOX screens",
      },
    },
    categoryPerks: {
      "Movies & Cinema": {
        returnPct: 12.0,
        perkType: "discount",
        description: "Up to 4 free movie tickets/month worth up to ₹250 each on ₹5,000 monthly spend (up to 24 tickets/year)",
      },
      "Food & Dining": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 spent",
      },
      "Online Shopping": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 spent",
      },
    },
    defaultOnlineReturnPct: 1.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "Up to 24 free BookMyShow movie tickets per year (4 tickets/month up to ₹250 each on ₹5k spend)",
      "Complimentary ₹100 F&B discount on movie ticket bookings",
      "Fuel surcharge waiver for fuel transactions between ₹500 and ₹4,000 (up to ₹100/mo)",
      "1 Reward Point per ₹100 spent on all regular retail purchases",
    ],
  },
  {
    matchKeys: [
      "rbl-platinum-maxima",
      "platinum maxima",
      "rbl platinum maxima",
      "rbl maxima",
      "maxima",
    ],
    cardDisplayName: "RBL Platinum Maxima",
    merchantPerks: {
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "1 free BookMyShow movie ticket per month up to ₹200 on buying 2 or more tickets",
        badge: "Free BMS Ticket",
      },
      zomato: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards = 2.5% value) on dining",
        badge: "5X Rewards",
      },
      swiggy: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards) on dining & food delivery",
      },
      forex_international: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards) on international spends",
      },
      fuel_surcharge: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards) on fuel purchases",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards, 2.5% value) on Dining",
      },
      Entertainment: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards) on Entertainment & Movies",
      },
      Fuel: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards) on Fuel purchases",
      },
      International: {
        returnPct: 2.5,
        perkType: "reward_points",
        description: "10 Reward Points per ₹100 (5X rewards) on International spends",
      },
      "Travel & Flights": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2 complimentary domestic airport lounge visits per calendar quarter",
      },
    },
    defaultOnlineReturnPct: 0.5,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "5X Rewards (10 Reward Points per ₹100) on Dining, Entertainment, Fuel, and International spends",
      "2 Reward Points per ₹100 on all other regular retail purchases",
      "1 complimentary BookMyShow movie ticket every month up to ₹200 on buying 2+ tickets",
      "2 complimentary domestic airport lounge visits per calendar quarter",
      "Milestone bonus: 10,000 RP on ₹2L spend + 10,000 RP on ₹3.5L annual spend",
    ],
  },
  {
    matchKeys: [
      "rbl-bfl-supercard",
      "supercard",
      "rbl bfl supercard",
      "bajaj supercard",
      "bajaj finserv supercard",
      "bfl supercard",
    ],
    cardDisplayName: "RBL Bajaj Finserv SuperCard",
    merchantPerks: {
      bookmyshow: {
        returnPct: 10.0,
        perkType: "discount",
        description: "Buy 1 Get 1 free movie ticket up to ₹200 on BookMyShow (1 ticket per month)",
        badge: "1+1 BMS Ticket",
      },
      amazon: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2X Reward Points on all online shopping purchases (2% return)",
        badge: "2X Online RP",
      },
      flipkart: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2X Reward Points on online marketplace orders",
      },
      myntra: {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2X Reward Points on online fashion",
      },
    },
    categoryPerks: {
      "Online Shopping": {
        returnPct: 2.0,
        perkType: "reward_points",
        description: "2X Reward Points (2 RP per ₹100) on online spends",
      },
      "Movies & Cinema": {
        returnPct: 10.0,
        perkType: "discount",
        description: "1+1 free BookMyShow movie ticket per month (up to ₹200 off)",
      },
      "Emergency & Cash": {
        returnPct: 3.0,
        perkType: "cashback",
        description: "50-day interest-free emergency ATM cash withdrawal facility",
      },
    },
    defaultOnlineReturnPct: 2.0,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "4-in-1 card: Credit Card, Cash Card, Loan Card, and EMI Network Card in one",
      "50 days interest-free emergency ATM cash withdrawal without processing charges",
      "Convert transactions of ₹2,500+ into easy EMIs at 0% or low interest rates",
      "Buy 1 Get 1 free BookMyShow movie ticket every month up to ₹200 off",
      "Fuel surcharge waiver up to ₹100 per month across all fuel outlets",
    ],
  },
  {
    matchKeys: [
      "rbl-indianoil",
      "rbl indianoil",
      "rbl indian oil",
      "iocl rbl",
      "rbl iocl",
      "rbl indianoil rupay",
    ],
    cardDisplayName: "RBL IndianOil RuPay",
    merchantPerks: {
      indianoil: {
        returnPct: 8.5,
        perkType: "reward_points",
        description: "Up to 8.5% savings on fuel at IndianOil pumps (30 RP / ₹100 = 7.5% + 1% surcharge waiver)",
        badge: "8.5% Fuel Savings",
      },
      hpcl: {
        returnPct: 1.0,
        perkType: "waiver",
        description: "1% fuel surcharge waiver",
      },
      bpcl: {
        returnPct: 1.0,
        perkType: "waiver",
        description: "1% fuel surcharge waiver",
      },
      upi: {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "1 Reward Point per ₹100 on UPI merchant QR payments via RuPay",
      },
    },
    categoryPerks: {
      Fuel: {
        returnPct: 8.5,
        perkType: "reward_points",
        description: "30 Reward Points per ₹100 (7.5% value) on IndianOil fuel purchases + 1% fuel surcharge waiver",
      },
      "UPI Payments": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "Seamless RuPay UPI payments at merchant QR codes with reward points",
      },
      "Groceries & Essentials": {
        returnPct: 1.0,
        perkType: "reward_points",
        description: "4 Reward Points per ₹100 spent",
      },
    },
    defaultOnlineReturnPct: 0.75,
    defaultOfflineReturnPct: 0.5,
    specialPerks: [
      "Up to 8.5% total fuel savings at IndianOil pumps (30 RP / ₹100 + 1% surcharge waiver)",
      "RuPay credit card on UPI: Scan and pay at merchant QR codes seamlessly via any UPI app",
      "4 Reward Points per ₹100 spent on Groceries & Supermarkets",
      "Welcome benefit: Up to 1,000 Reward Points on making first fuel transaction within 30 days",
      "Annual fee waiver on spending ₹50,000 in previous calendar year",
    ],
  },
  {
    matchKeys: [
      "rbl-zomato",
      "zomato edition",
      "rbl zomato",
      "zomato credit card",
      "zomato edition classic",
    ],
    cardDisplayName: "RBL Zomato Edition",
    merchantPerks: {
      zomato: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback as Edition Classic Cash on all Zomato restaurant dining and food delivery",
        badge: "5% Zomato Cash",
      },
      blinkit: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback as Edition Cash on all Blinkit grocery delivery orders",
        badge: "5% Blinkit",
      },
      swiggy: {
        returnPct: 1.5,
        perkType: "cashback",
        description: "1.5% cashback on online food delivery orders",
      },
      eazydiner: {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on dining reservations and bills",
      },
    },
    categoryPerks: {
      "Food & Dining": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on all Zomato orders & restaurant dining (1 Edition Cash = ₹1)",
      },
      "Groceries & Essentials": {
        returnPct: 5.0,
        perkType: "cashback",
        description: "5% cashback on Blinkit quick commerce orders",
      },
      "Online Shopping": {
        returnPct: 1.5,
        perkType: "cashback",
        description: "1.5% cashback on all other online purchases",
      },
    },
    defaultOnlineReturnPct: 1.5,
    defaultOfflineReturnPct: 1.0,
    specialPerks: [
      "5% cashback on Zomato food delivery and restaurant dining bills (1 Edition Cash = ₹1)",
      "5% cashback on Blinkit grocery and essentials delivery",
      "1.5% cashback on all other online spends across merchants",
      "1.0% cashback on all offline retail transactions",
      "Complimentary Zomato Pro / Gold membership privileges",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS FOR CARD REWARD MATCHING
// ─────────────────────────────────────────────────────────────────────────────

function cleanKey(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Matches a card entity to the best matching card perk rule */
export function findCardPerkRule(card: any): CardPerkRule | null {
  const cardId = cleanKey(card.id || "");
  const cardIdWords = cardId.split(/\s+/);
  const cardName = cleanKey(card.issuer || card.cardName || card.name || card.bank || "");
  const cardWords = cardName.split(/\s+/);
  const network = cleanKey(card.network || "");

  // Pass 1: Exact ID matching
  if (cardId) {
    for (const rule of CARD_PERK_RULES) {
      for (const key of rule.matchKeys) {
        if (cleanKey(key) === cardId) {
          return rule;
        }
      }
    }
  }

  // Pass 2: Keyword and name matching
  for (const rule of CARD_PERK_RULES) {
    for (const key of rule.matchKeys) {
      const cleanK = cleanKey(key);
      const idMatch =
        cardId &&
        (cardId === cleanK ||
          (cleanK.includes(" ") ? cardId.includes(cleanK) : cardIdWords.includes(cleanK)));
      const nameMatch = cleanK.includes(" ")
        ? cardName.includes(cleanK)
        : cardWords.includes(cleanK);
      const isMatch =
        idMatch || nameMatch || (cleanK === "rupay" && network.includes("rupay"));

      if (isMatch) {
        return rule;
      }
    }
  }
  return null;
}

/** Matches a merchant search input to a known popular merchant */
export function resolveMerchant(query: string, categoryFallback?: string): MerchantInfo | null {
  if (!query) return null;
  const q = cleanKey(query);

  // Exact / keyword match
  for (const m of POPULAR_MERCHANTS) {
    if (cleanKey(m.name) === q || m.id === q) return m;
    for (const kw of m.keywords) {
      if (q.includes(cleanKey(kw)) || cleanKey(kw).includes(q)) {
        return m;
      }
    }
  }

  // Fallback by category if provided
  if (categoryFallback) {
    const catMatch = POPULAR_MERCHANTS.find(
      (m) => m.category.toLowerCase() === categoryFallback.toLowerCase()
    );
    if (catMatch) return catMatch;
  }

  return null;
}

/**
 * Evaluates a single card in the user's portfolio for a payment at a specific merchant/category & amount.
 */
export function evaluateCardForPayment(
  card: any,
  merchantQuery: string,
  category: string,
  amount: number,
  rankedSwipeInfo?: any
): EvaluatedCardPayment {
  const cleanCardName = card.issuer || card.cardName || card.name || "Credit Card";
  const bankName = card.bank || card.bankName || card.issuer || "Bank";
  const rule = findCardPerkRule(card);
  const resolvedMerchant = resolveMerchant(merchantQuery, category);

  let returnPct: number;
  let perkType: CardRewardPerk["perkType"] = "cashback";
  let perkReason: string;
  let maxCap: string | undefined = undefined;
  let badge: string | undefined;
  let isCoBrandedMatch = false;

  const targetCategory = resolvedMerchant
    ? resolvedMerchant.category
    : category || "General Spends";

  if (rule) {
    // 1. Direct Merchant Specific Match (e.g. Swiggy card on Swiggy -> 10%)
    if (resolvedMerchant && rule.merchantPerks && rule.merchantPerks[resolvedMerchant.id]) {
      const p = rule.merchantPerks[resolvedMerchant.id];
      returnPct = p.returnPct;
      perkType = p.perkType;
      perkReason = p.description;
      maxCap = p.maxCap;
      badge = p.badge || `${p.returnPct}% ${p.perkType === "cashback" ? "Cashback" : "Return"}`;
      isCoBrandedMatch = resolvedMerchant
        ? rule.matchKeys.some((k) => k.includes(resolvedMerchant.id)) ||
          cleanCardName.toLowerCase().includes(resolvedMerchant.id)
        : false;
    }
    // 2. Category Level Match (e.g. HSBC Live+ on Food & Dining -> 10%)
    else if (rule.categoryPerks && rule.categoryPerks[targetCategory]) {
      const p = rule.categoryPerks[targetCategory];
      returnPct = p.returnPct;
      perkType = p.perkType;
      perkReason = p.description;
      maxCap = p.maxCap;
      badge = p.badge || `${p.returnPct}% Category Reward`;
    }
    // 3. General Online / Retail Default for that card
    else {
      returnPct = rule.defaultOnlineReturnPct;
      perkReason = `Base online reward rate for ${rule.cardDisplayName}`;
      badge = `${rule.defaultOnlineReturnPct}% Base Rate`;
    }
  } else {
    // Card not in specialized knowledge base — check custom rewardPointValue if configured by user
    const pointVal = Number(card.rewardPointValue || 0);
    if (pointVal > 0) {
      // If user configured e.g. 1 point = ₹0.50 and card earns ~2-4 points/₹100
      returnPct = Math.max(1.0, Math.min(5.0, pointVal * 2.0));
      perkType = "reward_points";
      perkReason = `Custom Reward Structure: ₹${pointVal}/point configured on card`;
      badge = `${returnPct.toFixed(1)}% Configured`;
    } else {
      returnPct = 1.0;
      perkReason = "Standard 1% base reward value";
      badge = "1.0% Base Rate";
    }
  }

  // Calculate savings in INR
  let savingsInINR = Math.round(((amount * returnPct) / 100) * 100) / 100;
  if (maxCap && maxCap.includes("₹")) {
    const numericCap = parseFloat(maxCap.replace(/[^0-9.]/g, ""));
    if (!isNaN(numericCap) && numericCap > 0 && savingsInINR > numericCap) {
      savingsInINR = numericCap;
    }
  }
  const perkHeadline = `${returnPct}% ${perkType === "cashback" ? "Cashback" : perkType === "miles" ? "Travel Miles" : "Reward Value"} (₹${savingsInINR.toLocaleString("en-IN")})`;

  const limit = Number(card.limit || 0);
  const outstanding = Number(card.outstanding || 0);
  const availableLimit = Math.max(0, limit - outstanding);
  const interestFreeDays = rankedSwipeInfo?.interestFreeDays ?? 30;
  const nextDueDateStr = rankedSwipeInfo?.nextDueDateStr ?? "Next billing cycle";

  // Score computation for ranking:
  // Primary weight: savings amount (profit in INR)
  // Secondary weight: co-branded match boost (+100)
  // Tertiary weight: interest-free days runway (+0.1 per day)
  const score = savingsInINR * 10 + (isCoBrandedMatch ? 100 : 0) + interestFreeDays * 0.1;

  return {
    cardId: card.id,
    cardName: cleanCardName,
    bankName,
    network: card.network,
    last4: card.last4,
    owner: card.owner,
    availableLimit,
    limit,
    outstanding,
    interestFreeDays,
    nextDueDateStr,
    returnPct,
    savingsInINR,
    perkType,
    perkHeadline,
    perkReason,
    maxCap,
    badge,
    isCoBrandedMatch,
    score,
  };
}

/**
 * Finds the single best market alternative credit card that would maximize profit
 * on this merchant if the user doesn't already own it.
 */
export function findBestMarketAlternative(
  merchantQuery: string,
  category: string,
  amount: number,
  ownedCards: any[]
): BestMarketAlternative | null {
  const resolvedMerchant = resolveMerchant(merchantQuery, category);
  const targetCategory = resolvedMerchant
    ? resolvedMerchant.category
    : category || "General Spends";

  let bestRule: CardPerkRule | null = null;
  let bestPerk: CardRewardPerk | null = null;
  let highestReturn = 0;

  for (const rule of CARD_PERK_RULES) {
    // Check if user already owns this card
    const isOwned = ownedCards.some((c) => {
      const r = findCardPerkRule(c);
      return r && r.cardDisplayName === rule.cardDisplayName;
    });
    if (isOwned) continue;

    let perk: CardRewardPerk | null = null;
    if (resolvedMerchant && rule.merchantPerks && rule.merchantPerks[resolvedMerchant.id]) {
      perk = rule.merchantPerks[resolvedMerchant.id];
    } else if (rule.categoryPerks && rule.categoryPerks[targetCategory]) {
      perk = rule.categoryPerks[targetCategory];
    }

    if (perk && perk.returnPct > highestReturn) {
      highestReturn = perk.returnPct;
      bestRule = rule;
      bestPerk = perk;
    }
  }

  if (!bestRule || !bestPerk || highestReturn <= 2.0) return null;

  const savingsInINR = Math.round(((amount * highestReturn) / 100) * 100) / 100;

  return {
    cardName: bestRule.cardDisplayName,
    bankName: bestRule.cardDisplayName.split(" ")[0] || "Bank",
    returnPct: bestPerk.returnPct,
    savingsInINR,
    reason: bestPerk.description,
    extraSavingsVsTopOwned: 0, // calculated in rankCardsForPayment
  };
}

/**
 * Main engine entrypoint:
 * Evaluates all cards in user's portfolio and ranks the best card for this payment.
 */
export function rankCardsForPayment(
  portfolioCards: any[],
  merchantQuery: string,
  category: string,
  amount: number,
  rankedCardsForSwipeMap?: Record<string, any>
): PaymentRecommendationResult {
  const validAmount = Math.max(1, Number(amount) || 1000);
  const resolvedMerchant = resolveMerchant(merchantQuery, category);
  const targetMerchantName = resolvedMerchant ? resolvedMerchant.name : merchantQuery || "Merchant";
  const targetCategory = resolvedMerchant
    ? resolvedMerchant.category
    : category || "Online Shopping";

  const activeCards = portfolioCards.filter(
    (c) => (c.status || "active").toLowerCase() === "active"
  );

  const evaluated = activeCards.map((c) => {
    const swipeInfo = rankedCardsForSwipeMap ? rankedCardsForSwipeMap[c.id] : undefined;
    return evaluateCardForPayment(c, merchantQuery, targetCategory, validAmount, swipeInfo);
  });

  // Sort descending by highest return % / savings in INR, co-branded priority, then available limit
  evaluated.sort((a, b) => {
    if (b.returnPct !== a.returnPct) {
      return b.returnPct - a.returnPct;
    }
    if (b.isCoBrandedMatch !== a.isCoBrandedMatch) {
      return b.isCoBrandedMatch ? 1 : -1;
    }
    if (b.savingsInINR !== a.savingsInINR) {
      return b.savingsInINR - a.savingsInINR;
    }
    return b.availableLimit - a.availableLimit;
  });

  const topCard = evaluated[0] || null;
  const marketAlternative = findBestMarketAlternative(
    merchantQuery,
    targetCategory,
    validAmount,
    activeCards
  );

  if (marketAlternative && topCard) {
    marketAlternative.extraSavingsVsTopOwned = Math.max(
      0,
      Math.round((marketAlternative.savingsInINR - topCard.savingsInINR) * 100) / 100
    );
  }

  return {
    merchantName: targetMerchantName,
    category: targetCategory,
    amount: validAmount,
    topCard,
    rankedCards: evaluated,
    bestMarketAlternative:
      marketAlternative && marketAlternative.extraSavingsVsTopOwned > 0 ? marketAlternative : null,
    totalCardsEvaluated: evaluated.length,
  };
}

/**
 * Generates an at-a-glance Category Cheat Sheet Matrix for the user's entire portfolio.
 * Shows which card in their wallet they should use for each major everyday category.
 */
export function generateCategoryCardMatrix(
  portfolioCards: any[],
  rankedCardsForSwipeMap?: Record<string, any>
): Array<{
  category: string;
  bestCard: EvaluatedCardPayment | null;
  runnerUpCard: EvaluatedCardPayment | null;
  topPerkHeadline: string;
  topPerkReason: string;
  popularExamples: string;
}> {
  const categories = [
    { name: "Food & Dining", examples: "Swiggy, Zomato, EazyDiner, Dineout, Restaurants" },
    { name: "Online Shopping", examples: "Amazon, Flipkart, Myntra, Tata Neu, Ajio, Nykaa" },
    { name: "Quick Commerce", examples: "Blinkit, Zepto, Swiggy Instamart, BigBasket" },
    { name: "Travel & Flights", examples: "MakeMyTrip, EaseMyTrip, Cleartrip, IRCTC, Airlines" },
    { name: "Utilities & Bills", examples: "Airtel, Electricity, Broadband, Piped Gas, DTH" },
    { name: "Entertainment", examples: "BookMyShow, PVR INOX, Netflix, Spotify, Prime" },
    { name: "Fuel", examples: "HPCL, BPCL, IndianOil, Shell (1% surcharge waiver)" },
    { name: "International Spends", examples: "Overseas travel, Foreign Currency, Zero Forex" },
  ];

  return categories.map((cat) => {
    const result = rankCardsForPayment(portfolioCards, "", cat.name, 2000, rankedCardsForSwipeMap);

    const bestCard = result.rankedCards[0] || null;
    const runnerUpCard = result.rankedCards[1] || null;

    return {
      category: cat.name,
      bestCard,
      runnerUpCard,
      topPerkHeadline: bestCard ? `${bestCard.returnPct}% Return` : "No Card",
      topPerkReason: bestCard ? bestCard.perkReason : "Add cards to portfolio",
      popularExamples: cat.examples,
    };
  });
}
