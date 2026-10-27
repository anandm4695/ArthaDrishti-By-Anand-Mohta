import React from "react";
import { resolveVehicleColor } from "../tabs/VehiclesTab";
import { VehicleBodyStyle } from "../../utils/vehicleAssets";

export interface VehicleStudioIllustrationProps {
  bodyStyle: VehicleBodyStyle;
  color?: string;
  fallbackMake?: string;
  make?: string;
  model?: string;
  isElectric?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Dynamic Automotive Studio Vector Silhouette Engine
 * Renders an authentic, vector illustration matching the vehicle's
 * body type (SUV, Sedan, Hatchback, Cruiser, Sport Bike, Scooter, Commercial)
 * and dynamically coats it with the vehicle's exact paint color finish!
 */
export function VehicleStudioIllustration({
  bodyStyle,
  color,
  fallbackMake,
  make,
  model,
  isElectric = false,
  className,
  style,
}: VehicleStudioIllustrationProps) {
  const cInfo = resolveVehicleColor(color, make || fallbackMake);
  const baseColor = cInfo.hex;
  const isLight = cInfo.isLight;

  const effMake = (make || fallbackMake || "").toLowerCase();
  const effModel = (model || "").toLowerCase();
  const isThar = effModel.includes("thar") || (effMake.includes("mahindra") && effModel.includes("4x4"));
  const isAther = effMake.includes("ather") || effModel.includes("450") || effModel.includes("rizta");
  const isOla = effMake.includes("ola") || effModel.includes("s1");

  // Derive subtle gradient shades for realistic metallic sheen
  const gradientId = `veh-grad-${baseColor.replace("#", "")}-${bodyStyle}-${Math.random().toString(36).substring(2, 7)}`;
  const glassId = `veh-glass-${Math.random().toString(36).substring(2, 7)}`;
  const rimColor = isLight ? "#475569" : "#cbd5e1";
  const evAccent = isElectric ? "#06b6d4" : "transparent";

  // Common wrapper styling
  const svgWrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
    overflow: "visible",
    filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18))",
    ...style,
  };

  return (
    <svg
      viewBox="0 0 360 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={svgWrapperStyle}
    >
      <defs>
        {/* Metallic Body Paint Gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor={isLight ? "#ffffff" : "rgba(255,255,255,0.4)"} />
          <stop offset="25%" stopColor={baseColor} />
          <stop offset="85%" stopColor={baseColor} />
          <stop offset="100%" stopColor={isLight ? "#94a3b8" : "rgba(0,0,0,0.5)"} />
        </linearGradient>

        {/* Tinted Automotive Glass Gradient */}
        <linearGradient id={glassId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#0f172a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0.7" />
        </linearGradient>

        {/* Studio Ground Shadow */}
        <radialGradient id="ground-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Ground Contact Shadow */}
      <ellipse cx="180" cy="162" rx="150" ry="10" fill="url(#ground-shadow)" />

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 1. SUV / Crossover (High Stance, Roof Rails, Bold Arches)            */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "suv" && (
        <g>
          {/* Roof Rail */}
          <path
            d="M95 44 L245 44"
            stroke={isLight ? "#334155" : "#94a3b8"}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line x1="110" y1="44" x2="110" y2="49" stroke="#64748b" strokeWidth="3" />
          <line x1="230" y1="44" x2="230" y2="49" stroke="#64748b" strokeWidth="3" />

          {/* Main Car Body Profile */}
          <path
            d="M38 128 L40 102 C42 98 48 94 58 92 L96 85 C108 65 125 50 152 48 L240 48 C256 48 274 58 288 78 L318 96 C326 100 330 106 330 114 L330 134 C330 138 326 142 320 142 L292 142 C290 120 270 104 248 104 C226 104 206 120 204 142 L132 142 C130 120 110 104 88 104 C66 104 46 120 44 142 L32 142 C28 142 26 138 26 134 L28 126 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}
            strokeWidth="1.5"
          />

          {/* Thar Tailgate Mounted Spare Wheel */}
          {isThar && (
            <g transform="translate(24, 116)">
              <circle cx="0" cy="0" r="19" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="11" fill="#27272a" />
              <circle cx="0" cy="0" r="4" fill="#64748b" />
            </g>
          )}

          {/* Underbody Skid Plate / Cladding */}
          <path
            d="M44 140 L44 144 C44 146 48 147 52 147 L64 147 M268 147 L308 147 C314 147 318 145 320 142"
            stroke="#1e293b"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Windows / Cabin Glass */}
          <path
            d="M104 84 L146 54 L200 54 L200 84 Z"
            fill={`url(#${glassId})`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
          <path
            d="M206 54 L244 54 C256 54 268 62 278 76 L288 84 L206 84 Z"
            fill={`url(#${glassId})`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />

          {/* Headlight & DRL (Right / Front) */}
          <path
            d="M312 96 L328 102 C326 108 322 110 316 110 Z"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Taillight (Left / Rear) */}
          <path d="M30 100 L44 100 L44 112 L28 112 Z" fill="#ef4444" />

          {/* EV Accent Line if Electric */}
          {isElectric && (
            <path
              d="M136 140 L200 140"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Wheel 1 (Rear - Left) */}
          <g transform="translate(88, 138)">
            <circle cx="0" cy="0" r="26" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="0" cy="0" r="17" fill="#27272a" />
            {/* Multi-spoke alloy */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={15 * Math.cos((deg * Math.PI) / 180)}
                y2={15 * Math.sin((deg * Math.PI) / 180)}
                stroke={rimColor}
                strokeWidth="2.5"
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#52525b" />
          </g>

          {/* Wheel 2 (Front - Right) */}
          <g transform="translate(248, 138)">
            <circle cx="0" cy="0" r="26" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="0" cy="0" r="17" fill="#27272a" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={15 * Math.cos((deg * Math.PI) / 180)}
                y2={15 * Math.sin((deg * Math.PI) / 180)}
                stroke={rimColor}
                strokeWidth="2.5"
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#52525b" />
          </g>
        </g>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 2. Sedan (Sleek, Aerodynamic, Sweeping Roofline)                     */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "sedan" && (
        <g>
          {/* Sharkfin Antenna */}
          <path d="M120 62 L126 55 L130 62 Z" fill="#334155" />

          {/* Main Car Body Profile */}
          <path
            d="M30 134 L32 110 C34 105 40 100 52 98 L84 94 C104 74 135 60 170 58 L232 58 C256 58 276 72 294 92 L324 104 C332 108 336 114 336 122 L334 136 C334 140 330 142 324 142 L290 142 C288 122 268 108 248 108 C228 108 208 122 206 142 L130 142 C128 122 108 108 88 108 C68 108 48 122 46 142 L26 142 C22 142 20 138 20 134 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}
            strokeWidth="1.5"
          />

          {/* Windows / Greenhouse */}
          <path
            d="M96 92 L146 64 L196 64 L196 92 Z"
            fill={`url(#${glassId})`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
          <path
            d="M202 64 L244 64 C256 64 270 74 282 92 L202 92 Z"
            fill={`url(#${glassId})`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Sport Headlight */}
          <path
            d="M318 104 L334 112 C332 116 326 118 320 118 Z"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1"
          />

          {/* Sleek Taillight */}
          <path d="M26 104 L44 104 L42 112 L24 112 Z" fill="#ef4444" />

          {/* Sporty Wheels */}
          <g transform="translate(88, 140)">
            <circle cx="0" cy="0" r="24" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="0" cy="0" r="16" fill="#27272a" />
            {[0, 72, 144, 216, 288].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={14 * Math.cos((deg * Math.PI) / 180)}
                y2={14 * Math.sin((deg * Math.PI) / 180)}
                stroke={rimColor}
                strokeWidth="2.5"
              />
            ))}
            <circle cx="0" cy="0" r="4.5" fill="#52525b" />
          </g>

          <g transform="translate(248, 140)">
            <circle cx="0" cy="0" r="24" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="0" cy="0" r="16" fill="#27272a" />
            {[0, 72, 144, 216, 288].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={14 * Math.cos((deg * Math.PI) / 180)}
                y2={14 * Math.sin((deg * Math.PI) / 180)}
                stroke={rimColor}
                strokeWidth="2.5"
              />
            ))}
            <circle cx="0" cy="0" r="4.5" fill="#52525b" />
          </g>
        </g>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 3. Hatchback (Compact, Agile, Sporty Spoiler)                        */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "hatchback" && (
        <g>
          {/* Rear Wing / Spoiler */}
          <path d="M54 58 L72 56 L72 62 L54 62 Z" fill="#1e293b" />

          {/* Main Body */}
          <path
            d="M48 132 L56 70 C58 64 64 60 74 60 L188 60 C210 60 230 72 246 90 L288 104 C296 108 300 114 300 122 L298 136 C298 140 294 142 288 142 L260 142 C258 122 238 108 218 108 C198 108 178 122 176 142 L120 142 C118 122 98 108 78 108 C58 108 38 122 36 142 L24 142 C20 142 18 138 18 134 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}
            strokeWidth="1.5"
          />

          {/* Windows */}
          <path
            d="M74 94 L76 66 L154 66 L154 94 Z"
            fill={`url(#${glassId})`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
          <path
            d="M160 66 L194 66 C206 66 218 76 228 94 L160 94 Z"
            fill={`url(#${glassId})`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Headlamp */}
          <path d="M284 104 L298 112 L288 116 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
          <path d="M44 80 L56 80 L54 94 L42 94 Z" fill="#ef4444" />

          {/* Wheels */}
          <g transform="translate(78, 140)">
            <circle cx="0" cy="0" r="23" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="0" cy="0" r="15" fill="#27272a" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={13 * Math.cos((deg * Math.PI) / 180)}
                y2={13 * Math.sin((deg * Math.PI) / 180)}
                stroke={rimColor}
                strokeWidth="2.5"
              />
            ))}
            <circle cx="0" cy="0" r="4.5" fill="#52525b" />
          </g>

          <g transform="translate(218, 140)">
            <circle cx="0" cy="0" r="23" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="0" cy="0" r="15" fill="#27272a" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={13 * Math.cos((deg * Math.PI) / 180)}
                y2={13 * Math.sin((deg * Math.PI) / 180)}
                stroke={rimColor}
                strokeWidth="2.5"
              />
            ))}
            <circle cx="0" cy="0" r="4.5" fill="#52525b" />
          </g>
        </g>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 4. Cruiser Bike (Royal Enfield Classic, Hunter, Teardrop Tank)       */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "cruiser" && (
        <g>
          {/* Motorcycle Frame & Engine */}
          <path d="M120 134 L154 96 L224 88 L200 134 Z" fill="#18181b" stroke="#334155" strokeWidth="2" />
          {/* Chrome Cylinder Fins */}
          <rect x="146" y="104" width="36" height="5" rx="2" fill="#94a3b8" />
          <rect x="144" y="112" width="40" height="5" rx="2" fill="#cbd5e1" />
          <rect x="146" y="120" width="36" height="5" rx="2" fill="#94a3b8" />

          {/* Chrome Exhaust Pipe */}
          <path
            d="M174 128 L204 142 L100 142"
            stroke="#cbd5e1"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Teardrop Fuel Tank (Painted) */}
          <path
            d="M164 88 C164 74 192 68 226 76 C236 78 242 86 236 94 C222 102 184 100 164 88 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)"}
            strokeWidth="1.5"
          />

          {/* Cruiser Saddle / Seat */}
          <path
            d="M120 92 C134 90 156 86 170 94 L162 104 C140 102 124 102 120 92 Z"
            fill="#27272a"
            stroke="#09090b"
            strokeWidth="1.5"
          />

          {/* Front Fork & Round Headlamp */}
          <line x1="250" y1="138" x2="236" y2="64" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="260" cy="74" r="9" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2" />
          {/* Handlebar */}
          <path d="M228 60 L242 58 L254 62" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />

          {/* Rear Fender (Painted) */}
          <path
            d="M74 116 C76 96 98 88 126 94 L120 106 C102 102 88 108 86 122 Z"
            fill={`url(#${gradientId})`}
          />

          {/* Front Fender (Painted) */}
          <path
            d="M232 114 C236 100 252 96 274 104 L270 114 C256 108 244 110 240 120 Z"
            fill={`url(#${gradientId})`}
          />

          {/* Spoked Wheels (Front & Rear) */}
          <g transform="translate(94, 136)">
            <circle cx="0" cy="0" r="28" fill="#09090b" stroke="#27272a" strokeWidth="3" />
            <circle cx="0" cy="0" r="21" fill="none" stroke="#64748b" strokeWidth="2" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={20 * Math.cos((deg * Math.PI) / 180)}
                y2={20 * Math.sin((deg * Math.PI) / 180)}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            ))}
            <circle cx="0" cy="0" r="6" fill="#334155" />
          </g>

          <g transform="translate(254, 136)">
            <circle cx="0" cy="0" r="28" fill="#09090b" stroke="#27272a" strokeWidth="3" />
            <circle cx="0" cy="0" r="21" fill="none" stroke="#64748b" strokeWidth="2" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={20 * Math.cos((deg * Math.PI) / 180)}
                y2={20 * Math.sin((deg * Math.PI) / 180)}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            ))}
            <circle cx="0" cy="0" r="6" fill="#334155" />
          </g>
        </g>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 5. Sports Bike (Aggressive Fairings, Sharp Upswept Tail)             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "sportsbike" && (
        <g>
          {/* Main Frame & Angular Tank */}
          <path
            d="M86 96 L144 80 L188 72 L224 72 L248 88 L232 118 L170 128 L114 116 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)"}
            strokeWidth="1.5"
          />

          {/* Upswept Sharp Tail Section */}
          <path
            d="M86 96 L134 82 L126 102 L92 108 Z"
            fill={`url(#${gradientId})`}
          />

          {/* Compact Sport Windscreen */}
          <path d="M226 70 L248 50 L262 70 Z" fill="#0284c7" fillOpacity="0.75" />

          {/* Twin LED Headlamp Slits */}
          <polygon points="260,76 274,80 264,84" fill="#38bdf8" />

          {/* Upswept Carbon Exhaust */}
          <path
            d="M140 128 L190 114 L204 122 L150 134 Z"
            fill="#18181b"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Mono-Shock Coil (Accent Yellow/Red) */}
          <line x1="148" y1="108" x2="160" y2="124" stroke="#f59e0b" strokeWidth="5" />

          {/* Alloy Sports Wheels */}
          <g transform="translate(94, 136)">
            <circle cx="0" cy="0" r="27" fill="#09090b" stroke="#27272a" strokeWidth="3" />
            <circle cx="0" cy="0" r="18" fill="#18181b" />
            {[0, 120, 240].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={16 * Math.cos((deg * Math.PI) / 180)}
                y2={16 * Math.sin((deg * Math.PI) / 180)}
                stroke={baseColor}
                strokeWidth="4"
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
          </g>

          <g transform="translate(254, 136)">
            <circle cx="0" cy="0" r="27" fill="#09090b" stroke="#27272a" strokeWidth="3" />
            <circle cx="0" cy="0" r="18" fill="#18181b" />
            {[0, 120, 240].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={16 * Math.cos((deg * Math.PI) / 180)}
                y2={16 * Math.sin((deg * Math.PI) / 180)}
                stroke={baseColor}
                strokeWidth="4"
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
          </g>
        </g>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 6. Scooter / EV (Ather, Ola, Activa, Step-Through Frame)             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "scooter" && (
        <g>
          {/* Step-through Floorboard */}
          <rect x="144" y="132" width="46" height="10" rx="3" fill="#18181b" />

          {/* Front Apron Body (Painted) */}
          <path
            d="M188 136 L196 90 L226 76 L238 96 L226 136 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)"}
            strokeWidth="1.5"
          />

          {/* Handlebar & Digital Dash Cowl */}
          <path d="M216 70 L236 62 L244 72 L224 78 Z" fill={`url(#${gradientId})`} />
          <line x1="222" y1="64" x2="210" y2="60" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

          {/* Headlight: Ola Twin Spherical Projectors vs Modern Strip */}
          {isOla ? (
            <g>
              <circle cx="230" cy="94" r="4.5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="241" cy="94" r="4.5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
            </g>
          ) : (
            <line x1="230" y1="92" x2="238" y2="108" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          )}

          {/* Rear Body & Underseat Storage Unit (Painted) */}
          <path
            d="M92 126 C94 104 116 94 148 94 L154 136 L108 136 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)"}
            strokeWidth="1.5"
          />

          {/* Single-Piece Contoured Seat */}
          <path
            d="M106 94 C116 86 142 86 168 92 L164 102 C138 98 116 98 106 102 Z"
            fill="#27272a"
            stroke="#09090b"
            strokeWidth="1.5"
          />

          {/* Ather Smart Interactive Ring & Cyan Swingarm or EV Glow */}
          {isAther ? (
            <g>
              <circle cx="152" cy="116" r="6" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="120" y1="128" x2="134" y2="138" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          ) : (isElectric || isOla) ? (
            <circle cx="152" cy="116" r="4" fill="#06b6d4" />
          ) : null}

          {/* 12-inch Urban Wheels */}
          <g transform="translate(104, 140)">
            <circle cx="0" cy="0" r="22" fill="#09090b" stroke="#27272a" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="14" fill="#18181b" />
            <circle cx="0" cy="0" r="4" fill={rimColor} />
          </g>

          <g transform="translate(230, 140)">
            <circle cx="0" cy="0" r="22" fill="#09090b" stroke="#27272a" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="14" fill="#18181b" />
            <circle cx="0" cy="0" r="4" fill={rimColor} />
          </g>
        </g>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 7. Commercial / MPV (Innova, Tata Ace, Van, High Utility)            */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {bodyStyle === "commercial" && (
        <g>
          {/* Main Van/MPV Body */}
          <path
            d="M40 134 L42 80 C44 68 56 60 72 58 L244 58 C266 58 284 72 298 90 L322 106 C328 110 332 116 332 124 L330 136 C330 140 326 142 320 142 L290 142 C288 122 268 108 248 108 C228 108 208 122 206 142 L132 142 C130 122 110 108 90 108 C70 108 50 122 48 142 L28 142 C24 142 22 138 22 134 Z"
            fill={`url(#${gradientId})`}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}
            strokeWidth="1.5"
          />

          {/* Large Panoramic Windows */}
          <rect x="74" y="66" width="56" height="26" rx="3" fill={`url(#${glassId})`} />
          <rect x="136" y="66" width="60" height="26" rx="3" fill={`url(#${glassId})`} />
          <path d="M202 66 L250 66 C262 66 274 76 284 92 L202 92 Z" fill={`url(#${glassId})`} />

          {/* Heavy Wheels */}
          <g transform="translate(90, 140)">
            <circle cx="0" cy="0" r="25" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="16" fill="#334155" />
            <circle cx="0" cy="0" r="6" fill="#64748b" />
          </g>

          <g transform="translate(248, 140)">
            <circle cx="0" cy="0" r="25" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="16" fill="#334155" />
            <circle cx="0" cy="0" r="6" fill="#64748b" />
          </g>
        </g>
      )}
    </svg>
  );
}
