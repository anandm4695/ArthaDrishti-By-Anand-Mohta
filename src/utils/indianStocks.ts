// Curated Master Directory of Popular Indian Equities (NSE/BSE)
// Enables instant autocomplete, company resolution, sector categorization, and market cap tiering.

export interface IndianStockItem {
  symbol: string;
  name: string;
  sector: string;
  cap: "large" | "mid" | "small";
  exchange: "NSE" | "BSE";
}

export const INDIAN_STOCKS: IndianStockItem[] = [
  // ── Top Large Caps (Nifty 50 Leaders) ──────────────────────────────────
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy & Petrochemicals", cap: "large", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", sector: "Information Technology", cap: "large", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Ltd", sector: "Information Technology", cap: "large", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", sector: "Telecommunications", cap: "large", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG & Consumer", cap: "large", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", sector: "Infrastructure & Engineering", cap: "large", exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", sector: "FMCG & Consumer", cap: "large", exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "TITAN", name: "Titan Company Ltd", sector: "Consumer & Luxury", cap: "large", exchange: "NSE" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd", sector: "Cement & Materials", cap: "large", exchange: "NSE" },
  { symbol: "NTPC", name: "NTPC Ltd", sector: "Power & Utilities", cap: "large", exchange: "NSE" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd", sector: "Power & Utilities", cap: "large", exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", sector: "Consumer & Paints", cap: "large", exchange: "NSE" },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", sector: "Metals & Mining", cap: "large", exchange: "NSE" },
  { symbol: "COALINDIA", name: "Coal India Ltd", sector: "Metals & Mining", cap: "large", exchange: "NSE" },
  { symbol: "M&M", name: "Mahindra & Mahindra Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd", sector: "Conglomerates", cap: "large", exchange: "NSE" },
  { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Ltd", sector: "Infrastructure & Logistics", cap: "large", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro Ltd", sector: "Information Technology", cap: "large", exchange: "NSE" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd", sector: "Information Technology", cap: "large", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "JSWSTEEL", name: "JSW Steel Ltd", sector: "Metals & Mining", cap: "large", exchange: "NSE" },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation Ltd", sector: "Energy & Petrochemicals", cap: "large", exchange: "NSE" },
  { symbol: "GRASIM", name: "Grasim Industries Ltd", sector: "Cement & Materials", cap: "large", exchange: "NSE" },
  { symbol: "TECHM", name: "Tech Mahindra Ltd", sector: "Information Technology", cap: "large", exchange: "NSE" },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "CIPLA", name: "Cipla Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd", sector: "FMCG & Consumer", cap: "large", exchange: "NSE" },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation Ltd", sector: "Energy & Petrochemicals", cap: "large", exchange: "NSE" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "TATACONSUMER", name: "Tata Consumer Products Ltd", sector: "FMCG & Consumer", cap: "large", exchange: "NSE" },
  { symbol: "BRITANNIA", name: "Britannia Industries Ltd", sector: "FMCG & Consumer", cap: "large", exchange: "NSE" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "LTIM", name: "LTIMindtree Ltd", sector: "Information Technology", cap: "large", exchange: "NSE" },
  { symbol: "HINDALCO", name: "Hindalco Industries Ltd", sector: "Metals & Mining", cap: "large", exchange: "NSE" },
  { symbol: "SHREECEM", name: "Shree Cement Ltd", sector: "Cement & Materials", cap: "large", exchange: "NSE" },
  { symbol: "BEL", name: "Bharat Electronics Ltd", sector: "Defence & Aerospace", cap: "large", exchange: "NSE" },
  { symbol: "HAL", name: "Hindustan Aeronautics Ltd", sector: "Defence & Aerospace", cap: "large", exchange: "NSE" },
  { symbol: "TRENT", name: "Trent Ltd", sector: "Consumer & Retail", cap: "large", exchange: "NSE" },
  { symbol: "VBL", name: "Varun Beverages Ltd", sector: "FMCG & Beverages", cap: "large", exchange: "NSE" },
  { symbol: "ZOMATO", name: "Zomato Ltd (Eternal)", sector: "Internet & Consumer Tech", cap: "large", exchange: "NSE" },
  { symbol: "JIOFIN", name: "Jio Financial Services Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },

  // ── Next 50 & High-Growth Mid Caps ────────────────────────────────────────
  { symbol: "TATAPOWER", name: "Tata Power Company Ltd", sector: "Power & Utilities", cap: "mid", exchange: "NSE" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment & Finance", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "VEDL", name: "Vedanta Ltd", sector: "Metals & Mining", cap: "large", exchange: "NSE" },
  { symbol: "DLF", name: "DLF Ltd", sector: "Real Estate", cap: "large", exchange: "NSE" },
  { symbol: "RECL", name: "REC Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "PFC", name: "Power Finance Corporation Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "IRFC", name: "Indian Railway Finance Corporation Ltd", sector: "Railway Infrastructure", cap: "large", exchange: "NSE" },
  { symbol: "RVNL", name: "Rail Vikas Nigam Ltd", sector: "Railway Infrastructure", cap: "mid", exchange: "NSE" },
  { symbol: "IREDA", name: "Indian Renewable Energy Dev Agency Ltd", sector: "Green Energy & Utilities", cap: "mid", exchange: "NSE" },
  { symbol: "SUZLON", name: "Suzlon Energy Ltd", sector: "Green Energy & Utilities", cap: "mid", exchange: "NSE" },
  { symbol: "BHEL", name: "Bharat Heavy Electricals Ltd", sector: "Infrastructure & Engineering", cap: "mid", exchange: "NSE" },
  { symbol: "NHPC", name: "NHPC Ltd", sector: "Power & Utilities", cap: "mid", exchange: "NSE" },
  { symbol: "CDSL", name: "Central Depository Services (India) Ltd", sector: "Capital Markets", cap: "mid", exchange: "NSE" },
  { symbol: "BSE", name: "BSE Ltd", sector: "Capital Markets", cap: "mid", exchange: "NSE" },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance Ltd", sector: "Banking & Financials", cap: "large", exchange: "NSE" },
  { symbol: "KPITTECH", name: "KPIT Technologies Ltd", sector: "Information Technology", cap: "mid", exchange: "NSE" },
  { symbol: "PERSISTENT", name: "Persistent Systems Ltd", sector: "Information Technology", cap: "mid", exchange: "NSE" },
  { symbol: "COFORGE", name: "Coforge Ltd", sector: "Information Technology", cap: "mid", exchange: "NSE" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Ltd", sector: "Information Technology", cap: "mid", exchange: "NSE" },
  { symbol: "DMART", name: "Avenue Supermarts Ltd (DMart)", sector: "Consumer & Retail", cap: "large", exchange: "NSE" },
  { symbol: "PIDILITIND", name: "Pidilite Industries Ltd", sector: "Chemicals & Adhesives", cap: "large", exchange: "NSE" },
  { symbol: "MAXHEALTH", name: "Max Healthcare Institute Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "LODHA", name: "Macrotech Developers Ltd (Lodha)", sector: "Real Estate", cap: "mid", exchange: "NSE" },
  { symbol: "GODREJPROP", name: "Godrej Properties Ltd", sector: "Real Estate", cap: "mid", exchange: "NSE" },
  { symbol: "OBEROIRLTY", name: "Oberoi Realty Ltd", sector: "Real Estate", cap: "mid", exchange: "NSE" },
  { symbol: "POLYCAB", name: "Polycab India Ltd", sector: "Cables & Electricals", cap: "large", exchange: "NSE" },
  { symbol: "DIXON", name: "Dixon Technologies (India) Ltd", sector: "Electronics Manufacturing", cap: "mid", exchange: "NSE" },
  { symbol: "KALYANKJIL", name: "Kalyan Jewellers India Ltd", sector: "Consumer & Luxury", cap: "mid", exchange: "NSE" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements Ltd", sector: "Cement & Materials", cap: "large", exchange: "NSE" },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Ltd", sector: "Pharma & Healthcare", cap: "mid", exchange: "NSE" },
  { symbol: "LUPIN", name: "Lupin Ltd", sector: "Pharma & Healthcare", cap: "mid", exchange: "NSE" },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals Ltd", sector: "Pharma & Healthcare", cap: "large", exchange: "NSE" },
  { symbol: "ZYDUSLIFE", name: "Zydus Lifesciences Ltd", sector: "Pharma & Healthcare", cap: "mid", exchange: "NSE" },
  { symbol: "SRF", name: "SRF Ltd", sector: "Chemicals & Packaging", cap: "large", exchange: "NSE" },
  { symbol: "DEEPAKNTR", name: "Deepak Nitrite Ltd", sector: "Chemicals & Packaging", cap: "mid", exchange: "NSE" },
  { symbol: "PIIND", name: "PI Industries Ltd", sector: "Agrochem & Life Sciences", cap: "large", exchange: "NSE" },
  { symbol: "CUMMINSIND", name: "Cummins India Ltd", sector: "Infrastructure & Engineering", cap: "large", exchange: "NSE" },
  { symbol: "SIEMENS", name: "Siemens Ltd", sector: "Infrastructure & Engineering", cap: "large", exchange: "NSE" },
  { symbol: "ABB", name: "ABB India Ltd", sector: "Infrastructure & Engineering", cap: "large", exchange: "NSE" },
  { symbol: "MOTHERSON", name: "Samvardhana Motherson International Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "TVSMOTOR", name: "TVS Motor Company Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "BHARATFORG", name: "Bharat Forge Ltd", sector: "Infrastructure & Engineering", cap: "mid", exchange: "NSE" },
  { symbol: "BOSCHLTD", name: "Bosch Ltd", sector: "Automotive", cap: "large", exchange: "NSE" },
  { symbol: "SWIGGY", name: "Swiggy Ltd", sector: "Internet & Consumer Tech", cap: "large", exchange: "NSE" },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures (Nykaa)", sector: "Consumer & Retail", cap: "mid", exchange: "NSE" },
  { symbol: "PAYTM", name: "One97 Communications (Paytm)", sector: "Fintech & Payments", cap: "mid", exchange: "NSE" },
  { symbol: "POLICYBZR", name: "PB Fintech Ltd (PolicyBazaar)", sector: "Fintech & Insurance", cap: "mid", exchange: "NSE" },
  { symbol: "YESBANK", name: "Yes Bank Ltd", sector: "Banking & Financials", cap: "mid", exchange: "NSE" },
  { symbol: "IDEA", name: "Vodafone Idea Ltd", sector: "Telecommunications", cap: "mid", exchange: "NSE" },
];

/** Popular scrips displayed as 1-click quick-pick chips */
export const POPULAR_SCRIP_CHIPS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "ITC",
  "BHARTIARTL",
  "TATAMOTORS",
  "SBIN",
  "LT",
  "BAJFINANCE",
  "TITAN",
];

/** Predefined investment strategies / horizons */
export const INVESTMENT_STRATEGIES = [
  { id: "core_compounder", label: "Long-Term Core", desc: "Solid blue-chip compounder (3-10 yr)" },
  { id: "dividend_cashflow", label: "Dividend Yield", desc: "High dividend yield & steady cashflow" },
  { id: "growth_midcap", label: "High Growth", desc: "Emerging leader with strong earnings growth" },
  { id: "value_contrarian", label: "Value / Reversal", desc: "Undervalued asset or cyclical turnaround" },
  { id: "swing_momentum", label: "Swing / Momentum", desc: "Technical momentum or short-term catalyst" },
];

/** Find an Indian stock by symbol or name */
export function findIndianStock(query: string): IndianStockItem | undefined {
  if (!query) return undefined;
  const clean = query.trim().toUpperCase().replace(/\.(NS|BO)$/i, "");
  return INDIAN_STOCKS.find(
    (s) => s.symbol.toUpperCase() === clean || s.symbol.replace(/[-_]/g, "") === clean.replace(/[-_]/g, "")
  );
}

/** Search Indian stocks matching symbol, name or sector */
export function searchIndianStocks(query: string, limit = 8): IndianStockItem[] {
  if (!query || !query.trim()) {
    return INDIAN_STOCKS.slice(0, limit);
  }
  const q = query.trim().toLowerCase().replace(/\.(ns|bo)$/i, "");
  
  const exact = INDIAN_STOCKS.filter((s) => s.symbol.toLowerCase() === q);
  const prefix = INDIAN_STOCKS.filter(
    (s) => s.symbol.toLowerCase().startsWith(q) && s.symbol.toLowerCase() !== q
  );
  const nameMatches = INDIAN_STOCKS.filter(
    (s) =>
      !s.symbol.toLowerCase().startsWith(q) &&
      (s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q))
  );

  return [...exact, ...prefix, ...nameMatches].slice(0, limit);
}
