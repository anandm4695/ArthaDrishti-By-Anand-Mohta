/**
 * Automotive Visual Asset Engine & Digital Garage Image Intelligence
 *
 * Provides:
 * 1. Curated photo library for popular Indian & Global automobiles (SUVs, Sedans, Bikes, Scooters, EVs)
 * 2. Dynamic automotive studio SVG silhouette illustrations with metallic paint finishes
 * 3. Client-side photo upload & compression pipeline (optimal WebP / JPEG data URLs)
 * 4. Automatic body style detection & strict model matching
 * 5. Complete automotive paint color mapping and automaker theme resolution
 */

export type VehicleBodyStyle =
  | "suv"
  | "sedan"
  | "hatchback"
  | "cruiser"
  | "sportsbike"
  | "scooter"
  | "commercial";

export interface CuratedVehiclePreset {
  id: string;
  name: string;
  make: string;
  model: string;
  bodyStyle: VehicleBodyStyle;
  fuelType?: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
  defaultColor: string;
  badge: string;
  imageUrl: string;
  tags: string[];
}

export interface VehicleSvgOptions {
  bodyStyle: VehicleBodyStyle;
  color?: string;
  make?: string;
  model?: string;
  isElectric?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Automaker Brand Themes & Colors
// ─────────────────────────────────────────────────────────────────────────────

export const VEHICLE_MAKE_THEMES: Record<string, { gradient: string; color: string }> = {
  honda: { gradient: "linear-gradient(135deg,#cc0000 0%,#ff4444 100%)", color: "#cc0000" },
  yamaha: { gradient: "linear-gradient(135deg,#0049cc 0%,#4488ff 100%)", color: "#0049cc" },
  suzuki: { gradient: "linear-gradient(135deg,#1a1a7c 0%,#4444cc 100%)", color: "#1a1a7c" },
  hero: { gradient: "linear-gradient(135deg,#002868 0%,#2255aa 100%)", color: "#002868" },
  bajaj: { gradient: "linear-gradient(135deg,#1a2b6b 0%,#3355aa 100%)", color: "#1a2b6b" },
  tvs: { gradient: "linear-gradient(135deg,#e31e26 0%,#ff5555 100%)", color: "#e31e26" },
  royalenfield: { gradient: "linear-gradient(135deg,#5a3e28 0%,#8b6347 100%)", color: "#5a3e28" },
  "royal enfield": {
    gradient: "linear-gradient(135deg,#5a3e28 0%,#8b6347 100%)",
    color: "#5a3e28",
  },
  ktm: { gradient: "linear-gradient(135deg,#ff6600 0%,#ff9944 100%)", color: "#ff6600" },
  kawasaki: { gradient: "linear-gradient(135deg,#00a651 0%,#33cc77 100%)", color: "#00a651" },
  maruti: { gradient: "linear-gradient(135deg,#003087 0%,#1155bb 100%)", color: "#003087" },
  "maruti suzuki": {
    gradient: "linear-gradient(135deg,#003087 0%,#1155bb 100%)",
    color: "#003087",
  },
  hyundai: { gradient: "linear-gradient(135deg,#002c5f 0%,#1155aa 100%)", color: "#002c5f" },
  tata: { gradient: "linear-gradient(135deg,#1d2671 0%,#3355bb 100%)", color: "#1d2671" },
  "tata motors": { gradient: "linear-gradient(135deg,#1d2671 0%,#3355bb 100%)", color: "#1d2671" },
  toyota: { gradient: "linear-gradient(135deg,#eb0a1e 0%,#ff4455 100%)", color: "#eb0a1e" },
  ford: { gradient: "linear-gradient(135deg,#003478 0%,#1155cc 100%)", color: "#003478" },
  mahindra: { gradient: "linear-gradient(135deg,#e31837 0%,#ff4466 100%)", color: "#e31837" },
  kia: { gradient: "linear-gradient(135deg,#ea0029 0%,#ff3355 100%)", color: "#ea0029" },
  mg: { gradient: "linear-gradient(135deg,#c41230 0%,#ee3355 100%)", color: "#c41230" },
  "mg motor": { gradient: "linear-gradient(135deg,#c41230 0%,#ee3355 100%)", color: "#c41230" },
  bmw: { gradient: "linear-gradient(135deg,#1c69d4 0%,#4488ff 100%)", color: "#1c69d4" },
  mercedes: { gradient: "linear-gradient(135deg,#444444 0%,#888888 100%)", color: "#555555" },
  "mercedes-benz": {
    gradient: "linear-gradient(135deg,#444444 0%,#888888 100%)",
    color: "#555555",
  },
  audi: { gradient: "linear-gradient(135deg,#bb0a30 0%,#ee3355 100%)", color: "#bb0a30" },
  volkswagen: { gradient: "linear-gradient(135deg,#001e50 0%,#003399 100%)", color: "#001e50" },
  vw: { gradient: "linear-gradient(135deg,#001e50 0%,#003399 100%)", color: "#001e50" },
  skoda: { gradient: "linear-gradient(135deg,#4ba82e 0%,#6dcc44 100%)", color: "#4ba82e" },
  nissan: { gradient: "linear-gradient(135deg,#c3002f 0%,#ee3355 100%)", color: "#c3002f" },
  renault: { gradient: "linear-gradient(135deg,#c8b700 0%,#eecc00 100%)", color: "#c8b700" },
  ather: { gradient: "linear-gradient(135deg,#00b4aa 0%,#00e5d4 100%)", color: "#00b4aa" },
  "ather energy": { gradient: "linear-gradient(135deg,#00b4aa 0%,#00e5d4 100%)", color: "#00b4aa" },
  ola: { gradient: "linear-gradient(135deg,#4c00c8 0%,#7c3aed 100%)", color: "#4c00c8" },
  "ola electric": { gradient: "linear-gradient(135deg,#4c00c8 0%,#7c3aed 100%)", color: "#4c00c8" },
};

export function getMakeTheme(make?: string): { gradient: string; color: string } {
  if (!make) {
    return {
      gradient: "linear-gradient(135deg,#334155 0%,#64748b 100%)",
      color: "#334155",
    };
  }
  const norm = make.toLowerCase();
  for (const [key, val] of Object.entries(VEHICLE_MAKE_THEMES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }
  let hash = 0;
  for (let i = 0; i < make.length; i++) {
    hash = make.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    gradient: `linear-gradient(135deg,hsl(${hue},60%,42%) 0%,hsl(${hue},75%,60%) 100%)`,
    color: `hsl(${hue},60%,42%)`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Automotive Paint Color Engine
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleColorInfo {
  hex: string;
  highlight: string;
  shadow: string;
  rimColor: string;
  isLight: boolean;
  label: string;
}

export const PRESET_VEHICLE_COLORS = [
  { name: "Daytona Grey", hex: "#475569" },
  { name: "Arctic White", hex: "#f8fafc" },
  { name: "Onyx Black", hex: "#18181b" },
  { name: "Royal Blue", hex: "#1d4ed8" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Racing Green", hex: "#15803d" },
  { name: "Sunburst Gold", hex: "#d97706" },
  { name: "Sunset Orange", hex: "#ea580c" },
  { name: "Dapper Ash", hex: "#64748b" },
];

export const VEHICLE_COLOR_MAP: Record<string, string> = {
  // Greys / Silvers
  "daytona grey": "#475569",
  "dapper ash": "#64748b",
  "nardo grey": "#6b7280",
  graphite: "#374151",
  charcoal: "#334155",
  gunmetal: "#4b5563",
  silver: "#94a3b8",
  titanium: "#64748b",
  grey: "#64748b",
  gray: "#64748b",
  slate: "#475569",
  // Whites
  "arctic white": "#f8fafc",
  "pearl white": "#f1f5f9",
  "pristine white": "#fafafa",
  white: "#f8fafc",
  ivory: "#fef3c7",
  "glacier white": "#f8fafc",
  // Blacks
  "onyx black": "#18181b",
  "phantom black": "#111827",
  "matte black": "#1c1917",
  "midnight black": "#09090b",
  black: "#18181b",
  carbon: "#18181b",
  obsidian: "#0f172a",
  // Reds
  "crimson red": "#dc2626",
  "racing red": "#ef4444",
  cherry: "#be123c",
  ruby: "#9f1239",
  garnet: "#881337",
  red: "#dc2626",
  maroon: "#7f1d1d",
  scarlet: "#e11d48",
  // Blues
  "royal blue": "#1d4ed8",
  "deep ocean blue": "#1e40af",
  "navy blue": "#1e3a8a",
  "midnight blue": "#172554",
  "electric blue": "#0284c7",
  "tata blue": "#0369a1",
  blue: "#2563eb",
  teal: "#0d9488",
  cyan: "#0891b2",
  "sky blue": "#38bdf8",
  // Greens
  "racing green": "#15803d",
  "british racing green": "#14532d",
  emerald: "#059669",
  "forest green": "#166534",
  green: "#16a34a",
  olive: "#65a30d",
  sage: "#4d7c0f",
  // Yellows & Golds
  "sunburst gold": "#d97706",
  "champagne gold": "#eab308",
  gold: "#ca8a04",
  yellow: "#eab308",
  "canary yellow": "#facc15",
  bronze: "#92400e",
  copper: "#b45309",
  // Oranges
  "sunset orange": "#ea580c",
};

export function resolveVehicleColor(colorStr?: string, fallbackMake?: string): VehicleColorInfo {
  const norm = (colorStr || "").trim().toLowerCase();
  let hex = VEHICLE_COLOR_MAP[norm];

  if (!hex && norm.startsWith("#") && (norm.length === 4 || norm.length === 7)) {
    hex = norm;
  }

  if (!hex) {
    for (const [key, val] of Object.entries(VEHICLE_COLOR_MAP)) {
      if (norm.includes(key)) {
        hex = val;
        break;
      }
    }
  }

  if (!hex && fallbackMake) {
    hex = getMakeTheme(fallbackMake).color;
  }

  if (!hex) {
    hex = "#475569"; // default elegant slate
  }

  const isLight =
    hex === "#f8fafc" ||
    hex === "#f1f5f9" ||
    hex === "#fafafa" ||
    hex === "#ffffff" ||
    hex === "#fef3c7" ||
    hex === "#eab308" ||
    hex === "#facc15";

  return {
    hex,
    highlight: isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
    shadow: isLight ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.45)",
    rimColor: isLight ? "#94a3b8" : "#cbd5e1",
    isLight,
    label: colorStr || "Standard Finish",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Vector Silhouette SVG Generator (Produces instant, offline Data URLs)
// ─────────────────────────────────────────────────────────────────────────────

export function generateVehicleSvgString(opts: VehicleSvgOptions): string {
  const { bodyStyle, color, make = "", model = "", isElectric = false } = opts;
  const cInfo = resolveVehicleColor(color, make);
  const baseColor = cInfo.hex;
  const isLight = cInfo.isLight;

  const gradId = `veh-g-${baseColor.replace("#", "")}-${bodyStyle}-${Math.random().toString(36).substring(2, 6)}`;
  const glassId = `veh-gl-${Math.random().toString(36).substring(2, 6)}`;
  const shadowId = `veh-sh-${Math.random().toString(36).substring(2, 6)}`;
  const rimColor = isLight ? "#475569" : "#cbd5e1";

  const effMake = make.toLowerCase();
  const effModel = model.toLowerCase();
  const isThar = effModel.includes("thar") || (effMake.includes("mahindra") && effModel.includes("4x4"));
  const isAther = effMake.includes("ather") || effModel.includes("450") || effModel.includes("rizta");
  const isOla = effMake.includes("ola") || effModel.includes("s1");

  let bodyContent: string;

  if (bodyStyle === "suv") {
    bodyContent = `
      <!-- SUV Roof Rails -->
      <path d="M95 44 L245 44" stroke="${isLight ? '#334155' : '#94a3b8'}" stroke-width="3.5" stroke-linecap="round" />
      <line x1="110" y1="44" x2="110" y2="49" stroke="#64748b" stroke-width="3" />
      <line x1="230" y1="44" x2="230" y2="49" stroke="#64748b" stroke-width="3" />

      <!-- SUV Main Car Body Profile -->
      <path
        d="${
          isThar
            ? 'M38 128 L40 98 C42 94 48 90 58 88 L96 82 C104 64 116 50 144 48 L240 48 C256 48 274 58 288 78 L318 96 C326 100 330 106 330 114 L330 134 C330 138 326 142 320 142 L292 142 C290 120 270 104 248 104 C226 104 206 120 204 142 L132 142 C130 120 110 104 88 104 C66 104 46 120 44 142 L32 142 C28 142 26 138 26 134 L28 126 Z'
            : 'M38 128 L40 102 C42 98 48 94 58 92 L96 85 C108 65 125 50 152 48 L240 48 C256 48 274 58 288 78 L318 96 C326 100 330 106 330 114 L330 134 C330 138 326 142 320 142 L292 142 C290 120 270 104 248 104 C226 104 206 120 204 142 L132 142 C130 120 110 104 88 104 C66 104 46 120 44 142 L32 142 C28 142 26 138 26 134 L28 126 Z'
        }"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}"
        stroke-width="1.5"
      />

      <!-- Thar Tailgate Mounted Spare Wheel -->
      ${
        isThar
          ? `
      <g transform="translate(24, 116)">
        <circle cx="0" cy="0" r="19" fill="#18181b" stroke="#3f3f46" stroke-width="2.5" />
        <circle cx="0" cy="0" r="11" fill="#27272a" />
        <circle cx="0" cy="0" r="4" fill="#64748b" />
      </g>`
          : ""
      }

      <!-- Underbody Skid Plate -->
      <path d="M44 140 L44 144 C44 146 48 147 52 147 L64 147 M268 147 L308 147 C314 147 318 145 320 142" stroke="#1e293b" stroke-width="4" stroke-linecap="round" />

      <!-- Tinted Windows -->
      <path d="M104 84 L146 54 L200 54 L200 84 Z" fill="url(#${glassId})" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
      <path d="M206 54 L244 54 C256 54 268 62 278 76 L288 84 L206 84 Z" fill="url(#${glassId})" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

      <!-- Headlight & Taillight -->
      <path d="M312 96 L328 102 C326 108 322 110 316 110 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5" />
      <path d="M30 100 L44 100 L44 112 L28 112 Z" fill="#ef4444" />

      <!-- EV Accent if Electric -->
      ${isElectric ? '<path d="M136 140 L200 140" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" />' : ""}

      <!-- Rear Wheel -->
      <g transform="translate(88, 138)">
        <circle cx="0" cy="0" r="26" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
        <circle cx="0" cy="0" r="17" fill="#27272a" />
        <line x1="-15" y1="0" x2="15" y2="0" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="0" y1="-15" x2="0" y2="15" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="-11" y1="-11" x2="11" y2="11" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="-11" y1="11" x2="11" y2="-11" stroke="${rimColor}" stroke-width="2.5" />
        <circle cx="0" cy="0" r="5" fill="#52525b" />
      </g>

      <!-- Front Wheel -->
      <g transform="translate(248, 138)">
        <circle cx="0" cy="0" r="26" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
        <circle cx="0" cy="0" r="17" fill="#27272a" />
        <line x1="-15" y1="0" x2="15" y2="0" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="0" y1="-15" x2="0" y2="15" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="-11" y1="-11" x2="11" y2="11" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="-11" y1="11" x2="11" y2="-11" stroke="${rimColor}" stroke-width="2.5" />
        <circle cx="0" cy="0" r="5" fill="#52525b" />
      </g>
    `;
  } else if (bodyStyle === "sedan") {
    bodyContent = `
      <!-- Sharkfin Antenna -->
      <path d="M120 62 L126 55 L130 62 Z" fill="#334155" />

      <!-- Sedan Body -->
      <path
        d="M30 134 L32 110 C34 105 40 100 52 98 L84 94 C104 74 135 60 170 58 L232 58 C256 58 276 72 294 92 L324 104 C332 108 336 114 336 122 L334 136 C334 140 330 142 324 142 L290 142 C288 122 268 108 248 108 C228 108 208 122 206 142 L130 142 C128 122 108 108 88 108 C68 108 48 122 46 142 L26 142 C22 142 20 138 20 134 Z"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}"
        stroke-width="1.5"
      />

      <!-- Windows -->
      <path d="M96 92 L146 64 L196 64 L196 92 Z" fill="url(#${glassId})" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
      <path d="M202 64 L244 64 C256 64 270 74 282 92 L202 92 Z" fill="url(#${glassId})" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

      <!-- Headlight & Taillight -->
      <path d="M318 104 L334 112 C332 116 326 118 320 118 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1" />
      <path d="M26 104 L44 104 L42 112 L24 112 Z" fill="#ef4444" />

      <!-- Wheels -->
      <g transform="translate(88, 140)">
        <circle cx="0" cy="0" r="24" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
        <circle cx="0" cy="0" r="16" fill="#27272a" />
        <circle cx="0" cy="0" r="4.5" fill="#52525b" />
        <line x1="-14" y1="0" x2="14" y2="0" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="0" y1="-14" x2="0" y2="14" stroke="${rimColor}" stroke-width="2.5" />
      </g>
      <g transform="translate(248, 140)">
        <circle cx="0" cy="0" r="24" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
        <circle cx="0" cy="0" r="16" fill="#27272a" />
        <circle cx="0" cy="0" r="4.5" fill="#52525b" />
        <line x1="-14" y1="0" x2="14" y2="0" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="0" y1="-14" x2="0" y2="14" stroke="${rimColor}" stroke-width="2.5" />
      </g>
    `;
  } else if (bodyStyle === "hatchback") {
    bodyContent = `
      <!-- Spoiler -->
      <path d="M54 58 L72 56 L72 62 L54 62 Z" fill="#1e293b" />

      <!-- Hatchback Body -->
      <path
        d="M48 132 L56 70 C58 64 64 60 74 60 L188 60 C210 60 230 72 246 90 L288 104 C296 108 300 114 300 122 L298 136 C298 140 294 142 288 142 L260 142 C258 122 238 108 218 108 C198 108 178 122 176 142 L120 142 C118 122 98 108 78 108 C58 108 38 122 36 142 L24 142 C20 142 18 138 18 134 Z"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}"
        stroke-width="1.5"
      />

      <!-- Windows -->
      <path d="M74 94 L76 66 L154 66 L154 94 Z" fill="url(#${glassId})" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
      <path d="M160 66 L194 66 C206 66 218 76 228 94 L160 94 Z" fill="url(#${glassId})" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

      <!-- Headlight & Taillight -->
      <path d="M284 104 L298 112 L288 116 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1" />
      <path d="M44 80 L56 80 L54 94 L42 94 Z" fill="#ef4444" />

      <!-- Wheels -->
      <g transform="translate(78, 140)">
        <circle cx="0" cy="0" r="23" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
        <circle cx="0" cy="0" r="15" fill="#27272a" />
        <circle cx="0" cy="0" r="4.5" fill="#52525b" />
        <line x1="-13" y1="0" x2="13" y2="0" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="0" y1="-13" x2="0" y2="13" stroke="${rimColor}" stroke-width="2.5" />
      </g>
      <g transform="translate(218, 140)">
        <circle cx="0" cy="0" r="23" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
        <circle cx="0" cy="0" r="15" fill="#27272a" />
        <circle cx="0" cy="0" r="4.5" fill="#52525b" />
        <line x1="-13" y1="0" x2="13" y2="0" stroke="${rimColor}" stroke-width="2.5" />
        <line x1="0" y1="-13" x2="0" y2="13" stroke="${rimColor}" stroke-width="2.5" />
      </g>
    `;
  } else if (bodyStyle === "cruiser") {
    bodyContent = `
      <!-- Frame & Engine -->
      <path d="M120 134 L154 96 L224 88 L200 134 Z" fill="#18181b" stroke="#334155" stroke-width="2" />
      <rect x="146" y="104" width="36" height="5" rx="2" fill="#94a3b8" />
      <rect x="144" y="112" width="40" height="5" rx="2" fill="#cbd5e1" />
      <rect x="146" y="120" width="36" height="5" rx="2" fill="#94a3b8" />
      <path d="M174 128 L204 142 L100 142" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />

      <!-- Teardrop Tank -->
      <path
        d="M164 88 C164 74 192 68 226 76 C236 78 242 86 236 94 C222 102 184 100 164 88 Z"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'}"
        stroke-width="1.5"
      />

      <!-- Saddle -->
      <path d="M120 92 C134 90 156 86 170 94 L162 104 C140 102 124 102 120 92 Z" fill="#27272a" stroke="#09090b" stroke-width="1.5" />

      <!-- Fork & Headlamp -->
      <line x1="250" y1="138" x2="236" y2="64" stroke="#64748b" stroke-width="4" stroke-linecap="round" />
      <circle cx="260" cy="74" r="9" fill="#f8fafc" stroke="#38bdf8" stroke-width="2" />
      <path d="M228 60 L242 58 L254 62" stroke="#475569" stroke-width="3.5" stroke-linecap="round" />

      <!-- Fenders -->
      <path d="M74 116 C76 96 98 88 126 94 L120 106 C102 102 88 108 86 122 Z" fill="url(#${gradId})" />
      <path d="M232 114 C236 100 252 96 274 104 L270 114 C256 108 244 110 240 120 Z" fill="url(#${gradId})" />

      <!-- Spoked Wheels -->
      <g transform="translate(94, 136)">
        <circle cx="0" cy="0" r="28" fill="#09090b" stroke="#27272a" stroke-width="3" />
        <circle cx="0" cy="0" r="21" fill="none" stroke="#64748b" stroke-width="2" />
        <line x1="-20" y1="0" x2="20" y2="0" stroke="#cbd5e1" stroke-width="1" />
        <line x1="0" y1="-20" x2="0" y2="20" stroke="#cbd5e1" stroke-width="1" />
        <line x1="-14" y1="-14" x2="14" y2="14" stroke="#cbd5e1" stroke-width="1" />
        <line x1="-14" y1="14" x2="14" y2="-14" stroke="#cbd5e1" stroke-width="1" />
        <circle cx="0" cy="0" r="6" fill="#334155" />
      </g>
      <g transform="translate(254, 136)">
        <circle cx="0" cy="0" r="28" fill="#09090b" stroke="#27272a" stroke-width="3" />
        <circle cx="0" cy="0" r="21" fill="none" stroke="#64748b" stroke-width="2" />
        <line x1="-20" y1="0" x2="20" y2="0" stroke="#cbd5e1" stroke-width="1" />
        <line x1="0" y1="-20" x2="0" y2="20" stroke="#cbd5e1" stroke-width="1" />
        <line x1="-14" y1="-14" x2="14" y2="14" stroke="#cbd5e1" stroke-width="1" />
        <line x1="-14" y1="14" x2="14" y2="-14" stroke="#cbd5e1" stroke-width="1" />
        <circle cx="0" cy="0" r="6" fill="#334155" />
      </g>
    `;
  } else if (bodyStyle === "sportsbike") {
    bodyContent = `
      <!-- Sportsbike Frame -->
      <path d="M86 96 L144 80 L188 72 L224 72 L248 88 L232 118 L170 128 L114 116 Z" fill="url(#${gradId})" stroke="${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'}" stroke-width="1.5" />
      <path d="M86 96 L134 82 L126 102 L92 108 Z" fill="url(#${gradId})" />
      <path d="M226 70 L248 50 L262 70 Z" fill="#0284c7" fill-opacity="0.75" />
      <polygon points="260,76 274,80 264,84" fill="#38bdf8" />
      <path d="M140 128 L190 114 L204 122 L150 134 Z" fill="#18181b" stroke="#475569" stroke-width="1.5" />
      <line x1="148" y1="108" x2="160" y2="124" stroke="#f59e0b" stroke-width="5" />

      <!-- Wheels -->
      <g transform="translate(94, 136)">
        <circle cx="0" cy="0" r="27" fill="#09090b" stroke="#27272a" stroke-width="3" />
        <circle cx="0" cy="0" r="18" fill="#18181b" />
        <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
      </g>
      <g transform="translate(254, 136)">
        <circle cx="0" cy="0" r="27" fill="#09090b" stroke="#27272a" stroke-width="3" />
        <circle cx="0" cy="0" r="18" fill="#18181b" />
        <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
      </g>
    `;
  } else if (bodyStyle === "scooter") {
    bodyContent = `
      <!-- Floorboard -->
      <rect x="144" y="132" width="46" height="10" rx="3" fill="#18181b" />

      <!-- Front Apron Body -->
      <path
        d="M188 136 L196 90 L226 76 L238 96 L226 136 Z"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}"
        stroke-width="1.5"
      />

      <!-- Handlebar Cowl -->
      <path d="M216 70 L236 62 L244 72 L224 78 Z" fill="url(#${gradId})" />
      <line x1="222" y1="64" x2="210" y2="60" stroke="#334155" stroke-width="3" stroke-linecap="round" />

      <!-- Headlight: Ola Twin Projectors vs Modern Strip -->
      ${
        isOla
          ? `
        <circle cx="230" cy="94" r="4.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5" />
        <circle cx="241" cy="94" r="4.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5" />
      `
          : `
        <line x1="230" y1="92" x2="238" y2="108" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" />
      `
      }

      <!-- Rear Body / Underseat -->
      <path
        d="M92 126 C94 104 116 94 148 94 L154 136 L108 136 Z"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}"
        stroke-width="1.5"
      />

      <!-- Contoured Seat -->
      <path d="M106 94 C116 86 142 86 168 92 L164 102 C138 98 116 98 106 102 Z" fill="#27272a" stroke="#09090b" stroke-width="1.5" />

      <!-- Ather Smart Ring & Cyan Accent or EV Glow -->
      ${
        isAther
          ? `
        <circle cx="152" cy="116" r="6" fill="#06b6d4" stroke="#ffffff" stroke-width="1.5" />
        <line x1="120" y1="128" x2="134" y2="138" stroke="#06b6d4" stroke-width="3.5" stroke-linecap="round" />
      `
          : isElectric
          ? '<circle cx="152" cy="116" r="4" fill="#06b6d4" />'
          : ""
      }

      <!-- 12-inch Scooter Wheels -->
      <g transform="translate(104, 140)">
        <circle cx="0" cy="0" r="22" fill="#09090b" stroke="#27272a" stroke-width="2.5" />
        <circle cx="0" cy="0" r="14" fill="#18181b" />
        <circle cx="0" cy="0" r="4" fill="${rimColor}" />
      </g>
      <g transform="translate(230, 140)">
        <circle cx="0" cy="0" r="22" fill="#09090b" stroke="#27272a" stroke-width="2.5" />
        <circle cx="0" cy="0" r="14" fill="#18181b" />
        <circle cx="0" cy="0" r="4" fill="${rimColor}" />
      </g>
    `;
  } else {
    // Commercial / MPV
    bodyContent = `
      <path
        d="M40 134 L42 80 C44 68 56 60 72 58 L244 58 C266 58 284 72 298 90 L322 106 C328 110 332 116 332 124 L330 136 C330 140 326 142 320 142 L290 142 C288 122 268 108 248 108 C228 108 208 122 206 142 L132 142 C130 122 110 108 90 108 C70 108 50 122 48 142 L28 142 C24 142 22 138 22 134 Z"
        fill="url(#${gradId})"
        stroke="${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}"
        stroke-width="1.5"
      />
      <rect x="74" y="66" width="56" height="26" rx="3" fill="url(#${glassId})" />
      <rect x="136" y="66" width="60" height="26" rx="3" fill="url(#${glassId})" />
      <path d="M202 66 L250 66 C262 66 274 76 284 92 L202 92 Z" fill="url(#${glassId})" />
      <g transform="translate(90, 140)">
        <circle cx="0" cy="0" r="25" fill="#18181b" stroke="#3f3f46" stroke-width="2.5" />
        <circle cx="0" cy="0" r="16" fill="#334155" />
        <circle cx="0" cy="0" r="6" fill="#64748b" />
      </g>
      <g transform="translate(248, 140)">
        <circle cx="0" cy="0" r="25" fill="#18181b" stroke="#3f3f46" stroke-width="2.5" />
        <circle cx="0" cy="0" r="16" fill="#334155" />
        <circle cx="0" cy="0" r="6" fill="#64748b" />
      </g>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" width="100%" height="100%">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="80%">
        <stop offset="0%" stop-color="${isLight ? '#ffffff' : 'rgba(255,255,255,0.4)'}" />
        <stop offset="25%" stop-color="${baseColor}" />
        <stop offset="85%" stop-color="${baseColor}" />
        <stop offset="100%" stop-color="${isLight ? '#94a3b8' : 'rgba(0,0,0,0.5)'}" />
      </linearGradient>
      <linearGradient id="${glassId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.85" />
        <stop offset="50%" stop-color="#0f172a" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#334155" stop-opacity="0.7" />
      </linearGradient>
      <radialGradient id="${shadowId}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.4)" />
        <stop offset="80%" stop-color="rgba(0,0,0,0.08)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0)" />
      </radialGradient>
    </defs>
    <ellipse cx="180" cy="162" rx="150" ry="10" fill="url(#${shadowId})" />
    ${bodyContent}
  </svg>`;
}

export function generateVehicleSvgDataUrl(opts: VehicleSvgOptions): string {
  const svg = generateVehicleSvgString(opts);
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated Automotive Model Photo Registry (High-Quality, Fast-Loading Assets)
// ─────────────────────────────────────────────────────────────────────────────

export const CURATED_VEHICLE_PRESETS: CuratedVehiclePreset[] = [
  // ── SUVs & Crossovers ──────────────────────────────────────────────────────
  {
    id: "hyundai-creta",
    name: "Hyundai Creta",
    make: "Hyundai",
    model: "Creta",
    bodyStyle: "suv",
    fuelType: "petrol",
    defaultColor: "Arctic White",
    badge: "India's #1 Mid-SUV",
    imageUrl: "/vehicles/creta.webp",
    tags: ["hyundai", "creta", "suv", "crossover"],
  },
  {
    id: "tata-nexon-ev",
    name: "Tata Nexon EV",
    make: "Tata",
    model: "Nexon EV",
    bodyStyle: "suv",
    fuelType: "electric",
    defaultColor: "Daytona Grey",
    badge: "Bestselling EV SUV",
    imageUrl: "/vehicles/tata-nexon-ev.webp",
    tags: ["tata", "nexon", "nexon ev", "ev", "suv", "tatamotors"],
  },
  {
    id: "mahindra-thar",
    name: "Mahindra Thar",
    make: "Mahindra",
    model: "Thar",
    bodyStyle: "suv",
    fuelType: "diesel",
    defaultColor: "Crimson Red",
    badge: "Iconic 4x4 Off-Roader",
    imageUrl: "/vehicles/thar.webp",
    tags: ["mahindra", "thar", "4x4", "suv", "offroad", "roxx"],
  },
  {
    id: "mahindra-xuv700",
    name: "Mahindra XUV700",
    make: "Mahindra",
    model: "XUV700",
    bodyStyle: "suv",
    fuelType: "diesel",
    defaultColor: "Midnight Black",
    badge: "Luxury Tech SUV",
    imageUrl: "/vehicles/mahindra-xuv700.webp",
    tags: ["mahindra", "xuv700", "xuv", "7seater", "suv"],
  },
  {
    id: "kia-seltos",
    name: "Kia Seltos",
    make: "Kia",
    model: "Seltos",
    bodyStyle: "suv",
    fuelType: "petrol",
    defaultColor: "Royal Blue",
    badge: "Premium Tech Crossover",
    imageUrl: "/vehicles/kia-seltos.webp",
    tags: ["kia", "seltos", "suv", "crossover"],
  },
  {
    id: "toyota-fortuner",
    name: "Toyota Fortuner",
    make: "Toyota",
    model: "Fortuner",
    bodyStyle: "suv",
    fuelType: "diesel",
    defaultColor: "Arctic White",
    badge: "Legendary Full-Size SUV",
    imageUrl: "/vehicles/fortuner.webp",
    tags: ["toyota", "fortuner", "suv", "4x4"],
  },
  {
    id: "toyota-hyryder",
    name: "Toyota Urban Cruiser Hyryder",
    make: "Toyota",
    model: "Urban Cruiser Hyryder",
    bodyStyle: "suv",
    fuelType: "hybrid",
    defaultColor: "Gaming Grey",
    badge: "Strong Hybrid SUV",
    imageUrl: "/vehicles/toyota-hyryder.webp",
    tags: ["toyota", "hyryder", "urban cruiser", "hybrid", "suv"],
  },
  {
    id: "tata-harrier",
    name: "Tata Harrier",
    make: "Tata",
    model: "Harrier",
    bodyStyle: "suv",
    fuelType: "diesel",
    defaultColor: "Onyx Black",
    badge: "Bold Omega-Arc SUV",
    imageUrl: "/vehicles/tata-harrier.webp",
    tags: ["tata", "harrier", "safari", "suv"],
  },
  {
    id: "maruti-brezza",
    name: "Maruti Brezza",
    make: "Maruti Suzuki",
    model: "Brezza",
    bodyStyle: "suv",
    fuelType: "petrol",
    defaultColor: "Sunset Orange",
    badge: "Compact Urban SUV",
    imageUrl: "/vehicles/maruti-brezza.webp",
    tags: ["maruti", "brezza", "maruti suzuki", "suv"],
  },
  {
    id: "mercedes-gls",
    name: "Mercedes-Benz GLS",
    make: "Mercedes-Benz",
    model: "GLS",
    bodyStyle: "suv",
    fuelType: "diesel",
    defaultColor: "Selenite Grey",
    badge: "450d 4MATIC Flagship SUV",
    imageUrl: "/vehicles/mercedes-gls.webp",
    tags: ["mercedes", "mercedes-benz", "gls", "suv", "maybach", "4matic"],
  },
  {
    id: "audi-q7",
    name: "Audi Q7",
    make: "Audi",
    model: "Q7",
    bodyStyle: "suv",
    fuelType: "diesel",
    defaultColor: "Glacier White",
    badge: "Quattro Technology SUV",
    imageUrl: "/vehicles/audi-q7.webp",
    tags: ["audi", "q7", "suv", "quattro", "technology"],
  },

  // ── Hatchbacks ─────────────────────────────────────────────────────────────
  {
    id: "maruti-swift",
    name: "Maruti Suzuki Swift",
    make: "Maruti Suzuki",
    model: "Swift",
    bodyStyle: "hatchback",
    fuelType: "petrol",
    defaultColor: "Crimson Red",
    badge: "India's Favorite Hatchback",
    imageUrl: "/vehicles/maruti-swift.webp",
    tags: ["maruti", "swift", "hatchback", "maruti suzuki"],
  },
  {
    id: "maruti-baleno",
    name: "Maruti Suzuki Baleno",
    make: "Maruti Suzuki",
    model: "Baleno",
    bodyStyle: "hatchback",
    fuelType: "petrol",
    defaultColor: "Royal Blue",
    badge: "Nexa Premium Hatchback",
    imageUrl: "/vehicles/baleno.webp",
    tags: ["maruti", "baleno", "nexa", "hatchback"],
  },
  {
    id: "hyundai-i20",
    name: "Hyundai i20",
    make: "Hyundai",
    model: "i20",
    bodyStyle: "hatchback",
    fuelType: "petrol",
    defaultColor: "Fiery Red",
    badge: "Sporty Premium Hatchback",
    imageUrl: "/vehicles/hyundai-i20.webp",
    tags: ["hyundai", "i20", "n-line", "hatchback"],
  },
  {
    id: "tata-altroz",
    name: "Tata Altroz",
    make: "Tata",
    model: "Altroz",
    bodyStyle: "hatchback",
    fuelType: "petrol",
    defaultColor: "Sunburst Gold",
    badge: "5-Star Safety Hatchback",
    imageUrl: "/vehicles/tata-altroz.webp",
    tags: ["tata", "altroz", "hatchback"],
  },

  // ── Sedans ─────────────────────────────────────────────────────────────────
  {
    id: "honda-city",
    name: "Honda City",
    make: "Honda",
    model: "City",
    bodyStyle: "sedan",
    fuelType: "petrol",
    defaultColor: "Arctic White",
    badge: "The Benchmark Sedan",
    imageUrl: "/vehicles/honda-city.webp",
    tags: ["honda", "city", "sedan", "ivtec"],
  },
  {
    id: "hyundai-verna",
    name: "Hyundai Verna",
    make: "Hyundai",
    model: "Verna",
    bodyStyle: "sedan",
    fuelType: "petrol",
    defaultColor: "Dapper Ash",
    badge: "Futuristic Turbo Sedan",
    imageUrl: "/vehicles/hyundai-verna.webp",
    tags: ["hyundai", "verna", "sedan", "turbo"],
  },
  {
    id: "bmw-3-series",
    name: "BMW 3 Series",
    make: "BMW",
    model: "3 Series",
    bodyStyle: "sedan",
    fuelType: "petrol",
    defaultColor: "Royal Blue",
    badge: "Executive Sport Luxury",
    imageUrl: "/vehicles/bmw-3-series.webp",
    tags: ["bmw", "3 series", "sedan", "luxury", "m340i"],
  },
  {
    id: "mercedes-c-class",
    name: "Mercedes-Benz C-Class",
    make: "Mercedes-Benz",
    model: "C-Class",
    bodyStyle: "sedan",
    fuelType: "petrol",
    defaultColor: "Onyx Black",
    badge: "Pinnacle of Elegance",
    imageUrl: "/vehicles/mercedes-c-class.webp",
    tags: ["mercedes", "mercedes-benz", "c-class", "sedan", "luxury"],
  },

  // ── Two-Wheelers: Cruisers & Motorcycles ───────────────────────────────────
  {
    id: "royal-enfield-hunter-350",
    name: "Royal Enfield Hunter 350",
    make: "Royal Enfield",
    model: "Hunter 350",
    bodyStyle: "cruiser",
    fuelType: "petrol",
    defaultColor: "Dapper Ash",
    badge: "Urban Retro Roadster",
    imageUrl: "/vehicles/hunter-350.webp",
    tags: ["royal enfield", "hunter 350", "hunter", "cruiser", "bike", "royalenfield"],
  },
  {
    id: "royal-enfield-classic-350",
    name: "Royal Enfield Classic 350",
    make: "Royal Enfield",
    model: "Classic 350",
    bodyStyle: "cruiser",
    fuelType: "petrol",
    defaultColor: "Onyx Black",
    badge: "Timeless British Heritage",
    imageUrl: "/vehicles/royal-enfield-classic-350.webp",
    tags: ["royal enfield", "classic 350", "bullet", "cruiser", "bike"],
  },
  {
    id: "ktm-duke-390",
    name: "KTM 390 Duke",
    make: "KTM",
    model: "390 Duke",
    bodyStyle: "sportsbike",
    fuelType: "petrol",
    defaultColor: "Sunset Orange",
    badge: "The Corner Rocket",
    imageUrl: "/vehicles/ktm-duke-390.webp",
    tags: ["ktm", "duke", "390 duke", "sportsbike", "naked"],
  },
  {
    id: "yamaha-r15",
    name: "Yamaha YZF-R15 V4",
    make: "Yamaha",
    model: "YZF-R15 V4",
    bodyStyle: "sportsbike",
    fuelType: "petrol",
    defaultColor: "Royal Blue",
    badge: "Track Racing DNA",
    imageUrl: "/vehicles/yamaha-r15.webp",
    tags: ["yamaha", "r15", "yzf", "sportsbike", "supersport"],
  },

  // ── Two-Wheelers: EV & Urban Scooters ──────────────────────────────────────
  {
    id: "ather-450x",
    name: "Ather 450X Gen 3",
    make: "Ather Energy",
    model: "450X",
    bodyStyle: "scooter",
    fuelType: "electric",
    defaultColor: "Space Grey",
    badge: "Performance Smart EV",
    imageUrl: "/vehicles/ather-450x.webp",
    tags: ["ather", "ather energy", "450x", "scooter", "ev", "electric"],
  },
  {
    id: "ola-s1-pro",
    name: "Ola S1 Pro",
    make: "Ola Electric",
    model: "S1 Pro",
    bodyStyle: "scooter",
    fuelType: "electric",
    defaultColor: "Porcelain White",
    badge: "Hypercharging EV Scooter",
    imageUrl: "/vehicles/ola-s1-pro.webp",
    tags: ["ola", "ola electric", "s1", "s1 pro", "scooter", "ev"],
  },
  {
    id: "honda-activa",
    name: "Honda Activa 125 / 6G",
    make: "Honda",
    model: "Activa",
    bodyStyle: "scooter",
    fuelType: "petrol",
    defaultColor: "Heavy Gray Metallic",
    badge: "India's Household Scooter",
    imageUrl: "/vehicles/honda-activa.webp",
    tags: [
      "honda",
      "activa",
      "activa 125",
      "activa 125 disc",
      "activa 6g",
      "activa 5g",
      "activa 4g",
      "activa 3g",
      "activa 110",
      "activa disc",
      "activa dlx",
      "activa premium",
      "scooter",
    ],
  },

  // ── Multi-Utility & Commercial ─────────────────────────────────────────────
  {
    id: "toyota-innova",
    name: "Toyota Innova HyCross",
    make: "Toyota",
    model: "Innova HyCross",
    bodyStyle: "commercial",
    fuelType: "hybrid",
    defaultColor: "Arctic White",
    badge: "The Undisputed MPV King",
    imageUrl: "/vehicles/innova-hycross.webp",
    tags: ["toyota", "innova", "mpv", "hycross", "crysta"],
  },
  {
    id: "toyota-vellfire",
    name: "Toyota Vellfire",
    make: "Toyota",
    model: "Vellfire",
    bodyStyle: "commercial",
    fuelType: "hybrid",
    defaultColor: "Black",
    badge: "Executive Lounge VIP MPV",
    imageUrl: "/vehicles/toyota-vellfire.webp",
    tags: ["toyota", "vellfire", "mpv", "vip", "luxury"],
  },
  {
    id: "tata-winger",
    name: "Tata Winger",
    make: "Tata",
    model: "Winger",
    bodyStyle: "commercial",
    fuelType: "diesel",
    defaultColor: "White",
    badge: "15S Luxury Coach",
    imageUrl: "/vehicles/tata-winger.webp",
    tags: ["tata", "winger", "van", "coach", "commercial"],
  },
  {
    id: "mahindra-bolero",
    name: "Mahindra Bolero",
    make: "Mahindra",
    model: "Bolero",
    bodyStyle: "commercial",
    fuelType: "diesel",
    defaultColor: "Diamond White",
    badge: "Commercial Workhorse",
    imageUrl: "/vehicles/mahindra-bolero.webp",
    tags: ["mahindra", "bolero", "commercial", "pik-up", "utility"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Intelligent Vehicle Matching & Body Style Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Automatically detects body style based on make, model, and vehicleType strings.
 */
export function detectVehicleBodyStyle(
  make?: string,
  model?: string,
  vehicleType?: string
): VehicleBodyStyle {
  const text = `${make || ""} ${model || ""} ${vehicleType || ""}`.toLowerCase();

  // Commercial Check
  if (
    text.includes("commercial") ||
    text.includes("truck") ||
    text.includes("innova") ||
    text.includes("bolero pik-up") ||
    text.includes("tata ace") ||
    text.includes("traveller") ||
    text.includes("eicher") ||
    text.includes("bharatbenz")
  ) {
    return "commercial";
  }

  // Two-Wheeler checks
  if (
    text.includes("two-wheeler") ||
    text.includes("two wheeler") ||
    text.includes("bike") ||
    text.includes("scooter") ||
    text.includes("motorcycle")
  ) {
    if (
      text.includes("scooter") ||
      text.includes("activa") ||
      text.includes("ather") ||
      text.includes("ola") ||
      text.includes("iqube") ||
      text.includes("jupiter") ||
      text.includes("access") ||
      text.includes("burgman") ||
      text.includes("vespa") ||
      text.includes("aerox") ||
      text.includes("ntorq")
    ) {
      return "scooter";
    }
    if (
      text.includes("ktm") ||
      text.includes("r15") ||
      text.includes("ninja") ||
      text.includes("duke") ||
      text.includes("rc ") ||
      text.includes("kawasaki") ||
      text.includes("ducati") ||
      text.includes("pulsar ns") ||
      text.includes("apache rr") ||
      text.includes("sport")
    ) {
      return "sportsbike";
    }
    return "cruiser"; // Default bike style (Royal Enfield / cruiser vibe)
  }

  // Four-Wheeler body style classification
  if (
    text.includes("suv") ||
    text.includes("creta") ||
    text.includes("nexon") ||
    text.includes("thar") ||
    text.includes("xuv") ||
    text.includes("scorpio") ||
    text.includes("fortuner") ||
    text.includes("seltos") ||
    text.includes("brezza") ||
    text.includes("grand vitara") ||
    text.includes("harrier") ||
    text.includes("safari") ||
    text.includes("punch") ||
    text.includes("venue") ||
    text.includes("sonet") ||
    text.includes("taigun") ||
    text.includes("kushaq") ||
    text.includes("astor") ||
    text.includes("hector") ||
    text.includes("compass") ||
    text.includes("ev6") ||
    text.includes("ioniq")
  ) {
    return "suv";
  }

  if (
    text.includes("sedan") ||
    text.includes("city") ||
    text.includes("verna") ||
    text.includes("slavia") ||
    text.includes("virtus") ||
    text.includes("ciaz") ||
    text.includes("amaze") ||
    text.includes("aura") ||
    text.includes("dzire") ||
    text.includes("3 series") ||
    text.includes("5 series") ||
    text.includes("c-class") ||
    text.includes("e-class") ||
    text.includes("a4") ||
    text.includes("a6") ||
    text.includes("superb") ||
    text.includes("octavia")
  ) {
    return "sedan";
  }

  if (
    text.includes("hatchback") ||
    text.includes("swift") ||
    text.includes("baleno") ||
    text.includes("i20") ||
    text.includes("altroz") ||
    text.includes("tiago") ||
    text.includes("polo") ||
    text.includes("i10") ||
    text.includes("glanza") ||
    text.includes("wagonr") ||
    text.includes("alto") ||
    text.includes("ignis") ||
    text.includes("celerio") ||
    text.includes("kwid")
  ) {
    return "hatchback";
  }

  // Default four wheeler to SUV (as modern preference)
  return "suv";
}

/**
 * Searches the curated preset library for an exact or distinct model match.
 * Prevents false positives where one make (e.g. Tata) matches the wrong model (e.g. Nexon EV for Tiago/Safari).
 */
export function findMatchingVehiclePreset(
  make?: string,
  model?: string
): CuratedVehiclePreset | null {
  const qMake = (make || "").trim().toLowerCase();
  const qModel = (model || "").trim().toLowerCase();

  // If model is missing or too short, do not attempt to guess preset photo
  if (!qModel || qModel.length < 2) {
    return null;
  }

  const makeMatches = (pMake: string): boolean => {
    if (!qMake || qMake === "vehicle" || qMake === "two-wheeler" || qMake === "four-wheeler") return true;
    const p = pMake.toLowerCase();
    return (
      qMake === p ||
      qMake.includes(p) ||
      p.includes(qMake) ||
      (qMake.startsWith("maruti") && p.includes("maruti")) ||
      (qMake.startsWith("tata") && p.includes("tata")) ||
      (qMake.startsWith("royal") && p.includes("royal")) ||
      (qMake.startsWith("ather") && p.includes("ather")) ||
      (qMake.startsWith("ola") && p.includes("ola")) ||
      (qMake.startsWith("mercedes") && p.includes("mercedes")) ||
      (qMake.startsWith("honda") && p.includes("honda"))
    );
  };

  const modelMatches = (preset: CuratedVehiclePreset): boolean => {
    const pModel = preset.model.toLowerCase();
    if (qModel === pModel) return true;

    // Check if preset model is a distinct word in the user's model query
    // e.g. "Activa" in "Activa 125 Disc" or "Creta" in "Creta SX (O) 1.5 Turbo"
    const escaped = pModel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[\\s-_])${escaped}($|[\\s-_])`, "i");
    if (regex.test(qModel)) return true;

    // Check distinct preset tags (e.g. "activa 125", "activa 125 disc", "nexon ev")
    for (const tag of preset.tags) {
      if (tag.length >= 3 && tag !== preset.make.toLowerCase()) {
        const tagEscaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const tagRegex = new RegExp(`(^|[\\s-_])${tagEscaped}($|[\\s-_])`, "i");
        if (tagRegex.test(qModel)) return true;
      }
    }

    return false;
  };

  for (const preset of CURATED_VEHICLE_PRESETS) {
    if (makeMatches(preset.make) && modelMatches(preset)) {
      return preset;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-side Image Processing & File Compression
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resizes and compresses an uploaded image file directly in the browser.
 * Returns an optimized base64 data URL (< 80 KB) so state and storage remain light.
 */
export function compressVehiclePhotoFile(
  file: File,
  maxWidth = 900,
  maxHeight = 600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file must be an image (PNG, JPG, WebP, HEIC)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file from device."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode uploaded image data."));
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while scaling to max bounds
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
          resolve(String(reader.result));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try modern WebP first
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp") && webpData.length < String(reader.result).length) {
            resolve(webpData);
            return;
          }
        } catch {
          // Fall through to JPEG
        }

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
