/* eslint-disable */
import React, { useState } from "react";
import {
  CreditCard,
  Wifi,
  Sparkles,
  Camera,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { BankLogo } from "../ui/BrandLogos";
import { resolveCardArtwork, CardArtPreset } from "../../utils/cardAssets";

/** Authentic SVG Payment Network Logos */
export function PaymentNetworkLogo({ network, size = 48 }: { network?: string; size?: number }) {
  const n = (network || "").toLowerCase();

  if (n === "visa") {
    return (
      <svg
        width={size}
        height={(size * 20) / 58}
        viewBox="0 0 58 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
      >
        <text
          x="0"
          y="17"
          fontFamily="'Times New Roman', Times, serif"
          fontSize="22"
          fontWeight="800"
          fontStyle="italic"
          fill="#FFFFFF"
          letterSpacing="-1"
        >
          VISA
        </text>
      </svg>
    );
  }

  if (n === "mastercard") {
    return (
      <svg
        width={(size * 44) / 48}
        height={(size * 28) / 48}
        viewBox="0 0 44 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
      >
        <circle cx="15" cy="14" r="13" fill="#EB001B" />
        <circle cx="29" cy="14" r="13" fill="#F79E1B" />
        <path d="M22 4.8a13 13 0 0 1 0 18.4A13 13 0 0 1 22 4.8z" fill="#FF5F00" />
      </svg>
    );
  }

  if (n === "rupay") {
    return (
      <svg
        width={(size * 68) / 48}
        height={(size * 18) / 48}
        viewBox="0 0 67.583808 17.596123"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
      >
        <g transform="translate(-0.01611121,-1.1444177)">
          <g transform="matrix(0.35277777,0,0,-0.35277777,67.797845,1.4031532)">
            <path style={{ fill: "#00B140" }} d="m 0,0 11.488,-22.811 -24.15,-22.822 z" />
          </g>
          <g transform="matrix(0.35277777,0,0,-0.35277777,64.991459,1.4031532)">
            <path style={{ fill: "#F47920" }} d="M 0,0 11.471,-22.811 -12.663,-45.633 Z" />
          </g>
          <g transform="matrix(0.35277777,0,0,-0.35277777,0.01611121,14.573442)">
            <path
              style={{ fill: "#FFFFFF" }}
              d="m 0,0 11.454,41.266 h 18.312 c 5.723,0 9.546,-0.906 11.491,-2.773 1.931,-1.852 2.303,-4.875 1.139,-9.124 -0.704,-2.503 -1.774,-4.604 -3.244,-6.264 -1.458,-1.663 -3.381,-2.978 -5.749,-3.945 2.009,-0.483 3.287,-1.442 3.86,-2.88 0.57,-1.438 0.504,-3.535 -0.188,-6.284 L 35.682,4.232 35.678,4.076 C 35.276,2.462 35.395,1.598 36.05,1.528 L 35.628,0 H 23.24 c 0.042,0.971 0.119,1.839 0.201,2.568 0.09,0.746 0.201,1.324 0.311,1.721 l 1.155,4.121 c 0.582,2.143 0.618,3.638 0.078,4.499 -0.545,0.884 -1.765,1.319 -3.691,1.319 H 16.088 L 12.118,0 Z m 18.664,23.527 h 5.576 c 1.954,0 3.396,0.279 4.285,0.856 0.893,0.582 1.556,1.565 1.945,2.987 0.403,1.446 0.304,2.454 -0.274,3.027 -0.577,0.582 -1.958,0.865 -4.129,0.865 h -5.256 z"
            />
          </g>
        </g>
      </svg>
    );
  }

  if (n === "amex" || n.includes("american express")) {
    return (
      <div
        style={{
          background: "#006fcf",
          color: "#fff",
          fontWeight: 900,
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 3,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        AMEX
      </div>
    );
  }

  if (n === "diners" || n.includes("diners club")) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.2)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 9.5,
          padding: "2px 6px",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.3)",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <span>DINERS</span>
      </div>
    );
  }

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "2px 6px",
        borderRadius: 4,
        background: "rgba(255,255,255,0.18)",
      }}
    >
      {network || "CARD"}
    </span>
  );
}

/** EMV Gold Microchip Component */
export function EMVChip({ size = "normal" }: { size?: "normal" | "compact" }) {
  const isCompact = size === "compact";
  const w = isCompact ? 28 : 36;
  const h = isCompact ? 21 : 27;

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 5,
        background: "linear-gradient(135deg, #fef08a 0%, #d97706 70%, #fef3c7 100%)",
        position: "relative",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 5px rgba(0,0,0,0.35)",
        overflow: "hidden",
        border: "1px solid rgba(180,83,9,0.6)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          background: "rgba(0,0,0,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 1,
          background: "rgba(0,0,0,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "26%",
          right: "26%",
          top: "22%",
          bottom: "22%",
          borderRadius: 2.5,
          border: "1px solid rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

/** Dynamic SVG Background Pattern for realistic card texture */
function CardPatternSVG({ type, accent }: { type: string; accent: string }) {
  if (type === "mesh") {
    return (
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="card-mesh-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 0 12 L 12 0 L 24 12 L 12 24 Z" fill="none" stroke="#fff" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-mesh-pattern)" />
      </svg>
    );
  }

  if (type === "lines") {
    return (
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="card-lines-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="40" x2="40" y2="0" stroke="#fff" strokeWidth="0.8" />
            <line x1="0" y1="20" x2="20" y2="0" stroke={accent} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-lines-pattern)" />
      </svg>
    );
  }

  if (type === "filigree") {
    return (
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.16 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="card-filigree-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="18" fill="none" stroke={accent} strokeWidth="0.75" />
            <circle cx="30" cy="30" r="28" fill="none" stroke="#fff" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="15" fill="none" stroke={accent} strokeWidth="0.75" />
            <circle cx="60" cy="60" r="15" fill="none" stroke={accent} strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-filigree-pattern)" />
      </svg>
    );
  }

  if (type === "wave") {
    return (
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,80 C120,160 260,20 400,120 L400,240 L0,240 Z"
          fill="rgba(255,255,255,0.08)"
        />
        <path
          d="M0,140 C150,60 280,180 400,90 L400,240 L0,240 Z"
          fill="rgba(255,255,255,0.05)"
        />
      </svg>
    );
  }

  return null;
}

export interface CreditCardVisualProps {
  card: any;
  activeVariantId?: string | null;
  onVariantChange?: (variantId: string | null) => void;
  onEditArt?: (variantId?: string | null) => void;
  showVariantSwitcher?: boolean;
  compact?: boolean;
  isClosed?: boolean;
  cardholderName?: string;
}

export function CreditCardVisual({
  card,
  activeVariantId,
  onVariantChange,
  onEditArt,
  showVariantSwitcher = true,
  compact = false,
  isClosed = false,
  cardholderName = "",
}: CreditCardVisualProps) {
  // Local active variant tracking if uncontrolled
  const [localVariantId, setLocalVariantId] = useState<string | null>(null);
  const currentVariantId = activeVariantId !== undefined ? activeVariantId : localVariantId;

  const variants: any[] = Array.isArray(card.variants) ? card.variants : [];
  const hasVariants = variants.length > 0;

  // Selected variant or primary
  const selectedVariant = hasVariants && currentVariantId ? variants.find((v) => v.id === currentVariantId) : null;
  const isViewingVariant = Boolean(selectedVariant);

  // Active face properties
  const activeName = isViewingVariant
    ? selectedVariant.name || `${card.issuer || "Card"} ${selectedVariant.network}`
    : card.issuer || card.cardName || "Credit Card";

  const activeNetwork = isViewingVariant ? selectedVariant.network : card.network;
  const activeLast4 = isViewingVariant ? selectedVariant.last4 : card.last4;
  const activeImageUrl = isViewingVariant ? selectedVariant.cardImageUrl || card.cardImageUrl : card.cardImageUrl;

  // Resolve artwork (gradient, patterns, presets)
  const art = resolveCardArtwork({
    issuer: activeName,
    cardName: activeName,
    network: activeNetwork,
    cardImageUrl: activeImageUrl,
    status: isClosed ? "closed" : card.status,
  });

  // Smart vertical orientation detection & interactive rotation
  const [isVerticalArt, setIsVerticalArt] = useState(false);
  const [forceRotate, setForceRotate] = useState(false);

  React.useEffect(() => {
    setIsVerticalArt(false);
    setForceRotate(false);
    if (!art.imageUrl) return;

    // Detect image aspect ratio before or on render
    const testImg = new window.Image();
    testImg.onload = () => {
      if (testImg.naturalHeight && testImg.naturalWidth && testImg.naturalHeight > testImg.naturalWidth * 1.05) {
        setIsVerticalArt(true);
      }
    };
    testImg.src = art.imageUrl;
  }, [art.imageUrl]);

  const handleSelectVariant = (vId: string | null) => {
    if (onVariantChange) {
      onVariantChange(vId);
    } else {
      setLocalVariantId(vId);
    }
  };

  const formattedLast4 = activeLast4 ? String(activeLast4).padStart(4, "•") : "••••";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* ── Multi-Card Variant Switcher Strip (if card has variants) ── */}
      {showVariantSwitcher && hasVariants && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {/* Primary Card Tab */}
          <button
            type="button"
            onClick={() => handleSelectVariant(null)}
            style={{
              padding: "4px 9px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: !isViewingVariant ? `1.5px solid ${THEME.accent}` : `1px solid ${THEME.line}`,
              background: !isViewingVariant ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "var(--surface-1)",
              color: !isViewingVariant ? THEME.accent : THEME.muted,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            <CreditCard size={12} />
            <span>Primary ({card.network || "Visa"}) · •••• {card.last4 || "••••"}</span>
          </button>

          {/* Variant Tabs */}
          {variants.map((v, idx) => {
            const isTabActive = currentVariantId === v.id;
            return (
              <button
                key={v.id || idx}
                type="button"
                onClick={() => handleSelectVariant(v.id)}
                style={{
                  padding: "4px 9px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isTabActive ? `1.5px solid ${THEME.accent}` : `1px solid ${THEME.line}`,
                  background: isTabActive ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "var(--surface-1)",
                  color: isTabActive ? THEME.accent : THEME.muted,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.15s ease",
                }}
              >
                <Sparkles size={11} color={isTabActive ? THEME.accent : THEME.gold} />
                <span>
                  {v.name || `${v.network} Variant`} · •••• {v.last4 || "••••"}
                </span>
                {v.cardImageUrl && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: THEME.sage,
                      display: "inline-block",
                    }}
                    title="Custom Variant Art Active"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Physical Card Face ── */}
      <div
        className="credit-card-face"
        style={{
          width: "100%",
          minHeight: compact ? 170 : 210,
          borderRadius: 18,
          background: art.bgGradient,
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.14)",
          boxShadow: isClosed
            ? "0 4px 12px rgba(0,0,0,0.12)"
            : "0 10px 28px -4px rgba(0,0,0,0.22), 0 2px 6px -1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: compact ? "16px 16px 14px" : "20px 20px 18px",
          opacity: isClosed ? 0.78 : 1,
          filter: isClosed ? "grayscale(40%)" : "none",
          transition: "all 0.22s ease-in-out",
        }}
      >
        {/* Layer 0: User / Preset Image Backdrop (if available) */}
        {art.imageUrl ? (
          <>
            {isVerticalArt && !forceRotate ? (
              /* Atmospheric studio backdrop & centered vertical showcase for portrait cards */
              <>
                <img
                  src={art.imageUrl}
                  alt=""
                  aria-hidden="true"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                  style={{
                    position: "absolute",
                    inset: -15,
                    width: "calc(100% + 30px)",
                    height: "calc(100% + 30px)",
                    objectFit: "cover",
                    filter: "blur(22px) brightness(0.52)",
                    transform: "scale(1.15)",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    pointerEvents: "none",
                    padding: "3px 0",
                  }}
                >
                  <img
                    src={art.imageUrl}
                    alt={activeName}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    style={{
                      height: "96%",
                      maxWidth: "60%",
                      objectFit: "contain",
                      borderRadius: 8,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  />
                </div>
              </>
            ) : (
              /* Standard horizontal or user-rotated image */
              <img
                src={art.imageUrl}
                alt={activeName}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalHeight && img.naturalWidth && img.naturalHeight > img.naturalWidth * 1.05) {
                    setIsVerticalArt(true);
                  }
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: forceRotate ? "rotate(90deg) scale(1.58)" : "none",
                  transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  zIndex: 1,
                }}
                onError={(e) => {
                  // If custom image link breaks, hide it gracefully to reveal styled vector art
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            )}

            {/* Ambient translucent scrim for subtle depth without obscuring authentic artwork */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 40%, rgba(0,0,0,0.48) 100%)",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          </>
        ) : (
          /* Layer 0B: Vector SVG Geometric Mesh Texture */
          <CardPatternSVG type={art.patternType} accent={art.accentColor} />
        )}

        {/* Layer 1: Reflective Glass Sheen Effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, transparent 60%)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {/* ── TOP BAR: Issuer / Bank Logo + Card Name + Card Art Button + Network Variant ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 4,
            gap: 8,
          }}
        >
          {/* Bank Logo + Card Name & Variant Tags */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
            }}
          >
            <BankLogo bankName={card.issuer || card.cardName || activeName} size={compact ? 22 : 26} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: compact ? 13 : 14.5,
                  fontWeight: 800,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.01em",
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  maxWidth: compact ? 120 : 180,
                }}
                title={activeName}
              >
                {activeName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                {isViewingVariant ? (
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(254, 240, 138, 0.3)",
                      color: "#fef08a",
                      border: "1px solid rgba(254, 240, 138, 0.5)",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ⚡ {selectedVariant?.name || `${selectedVariant?.network || "LINKED"} VARIANT`}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.85)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {art.badgeText || "PRIMARY CARD"}
                  </span>
                )}
                {card.sharedGroup && (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.22)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.25)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Pool: {card.sharedGroup}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action: Card Art Switcher + Payment Network Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {onEditArt && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditArt(currentVariantId);
                }}
                className="card-interactive"
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
                title="Change card artwork or upload card image"
              >
                <Camera size={11} />
                <span>Card Art</span>
              </button>
            )}

            {/* Interactive Vertical / Rotated View Toggle */}
            {isVerticalArt && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setForceRotate((prev) => !prev);
                }}
                className="card-interactive"
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
                title={forceRotate ? "Switch to Vertical Showcase layout" : "Rotate 90° to fill horizontally"}
              >
                <RotateCw size={11} />
                <span>{forceRotate ? "Portrait" : "Rotate"}</span>
              </button>
            )}

            {/* Payment Network Badge (ALWAYS PROMINENT: Visa, Mastercard, RuPay, Amex, Diners) */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                padding: "3px 8px",
                borderRadius: 7,
                border: "1px solid rgba(255, 255, 255, 0.22)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                minHeight: 28,
              }}
            >
              <PaymentNetworkLogo network={activeNetwork} size={compact ? 34 : 40} />
            </div>
          </div>
        </div>

        {/* ── MIDDLE ROW: EMV Microchip + Contactless Wave + Status Badges ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: compact ? "8px 0 4px" : "14px 0 8px",
            position: "relative",
            zIndex: 4,
          }}
        >
          {!art.imageUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <EMVChip size={compact ? "compact" : "normal"} />
              <Wifi
                size={18}
                style={{
                  transform: "rotate(90deg)",
                  color: "rgba(255,255,255,0.88)",
                  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))",
                }}
              />
            </div>
          ) : (
            <div />
          )}

          {/* Autopay or Status Flag */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {card.autoPay && !isClosed && (
              <div
                style={{
                  padding: "2px 7px",
                  borderRadius: 99,
                  background: "rgba(34, 197, 94, 0.4)",
                  border: "1px solid rgba(34, 197, 94, 0.65)",
                  color: "#86efac",
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                <CheckCircle2 size={10} /> Autopay
              </div>
            )}

            {isClosed && (
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "rgba(239, 68, 68, 0.5)",
                  border: "1px solid rgba(239, 68, 68, 0.7)",
                  color: "#fca5a5",
                  fontSize: 9.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                Closed
              </div>
            )}
          </div>
        </div>

        {/* ── LOWER ROW: Embossed Monospace Card Number & Cardholder Details ── */}
        <div style={{ position: "relative", zIndex: 4, marginTop: "auto" }}>
          {/* Card Number */}
          <div
            style={{
              fontFamily: "'Courier New', Courier, monospace, monospace",
              fontSize: compact ? 15 : 17,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0,0,0,0.95), 0 0 2px rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>{formattedLast4}</span>
          </div>

          {/* Bottom metadata: Cardholder Name + Network/Variant tag */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.88)",
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            <span>{cardholderName || card.owner?.toUpperCase() || "VALUED CARDHOLDER"}</span>
            <span
              style={{
                color: art.accentColor || "#fff",
                letterSpacing: "0.04em",
                background: "rgba(0,0,0,0.45)",
                padding: "1px 6px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(4px)",
              }}
            >
              {isViewingVariant ? selectedVariant?.cardType?.toUpperCase() || "DIGITAL" : "PRIMARY"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
