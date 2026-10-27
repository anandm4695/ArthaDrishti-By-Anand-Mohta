import React, { useState } from "react";
import { VehicleStudioIllustration } from "./VehicleStudioIllustration";
import { VehicleLightboxModal } from "./VehicleLightboxModal";
import { VehicleMakeLogo } from "../ui/BrandLogos";
import {
  detectVehicleBodyStyle,
  findMatchingVehiclePreset,
  VehicleBodyStyle,
} from "../../utils/vehicleAssets";
import { resolveVehicleColor } from "../tabs/VehiclesTab";
import { Eye, Sparkles } from "lucide-react";

export interface VehicleImageProps {
  vehicle?: any;
  photoUrl?: string;
  make?: string;
  model?: string;
  color?: string;
  vehicleType?: string;
  fuelType?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  borderRadius?: number;
  showBrandBadge?: boolean;
  showColorDot?: boolean;
  enlargeable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onPhotoChange?: () => void;
  onPhotoRemove?: () => void;
}

const SIZE_PRESETS: Record<
  "xs" | "sm" | "md" | "lg" | "xl" | "full",
  { width: number | string; height: number | string; logoSize: number; br: number }
> = {
  xs: { width: 44, height: 28, logoSize: 14, br: 6 },
  sm: { width: 62, height: 40, logoSize: 18, br: 8 },
  md: { width: 104, height: 68, logoSize: 24, br: 12 },
  lg: { width: 168, height: 108, logoSize: 28, br: 14 },
  xl: { width: "100%", height: 180, logoSize: 34, br: 16 },
  full: { width: "100%", height: "100%", logoSize: 28, br: 12 },
};

/**
 * Universal Vehicle Image Component with Multi-Tier Intelligence:
 * 1. User's custom photo (direct upload or web URL)
 * 2. Curated model photo preset match (if no photo provided)
 * 3. Dynamic metallic paint-matched vector studio illustration (fallback)
 * 4. High-res interactive lightbox modal
 */
export function VehicleImage({
  vehicle,
  photoUrl: propPhotoUrl,
  make: propMake,
  model: propModel,
  color: propColor,
  vehicleType: propVehicleType,
  fuelType: propFuelType,
  size = "md",
  borderRadius,
  showBrandBadge = false,
  showColorDot = false,
  enlargeable = false,
  className,
  style,
  onPhotoChange,
  onPhotoRemove,
}: VehicleImageProps) {
  const [imageError, setImageError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [activeSrcOverride, setActiveSrcOverride] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Extract attributes from vehicle object or explicit props
  const make = propMake || vehicle?.make || vehicle?.name?.split(" ")[0] || "Vehicle";
  const model = propModel || vehicle?.model || vehicle?.name?.split(" ").slice(1).join(" ") || "";
  const color = propColor || vehicle?.color || "";
  const vehicleType = propVehicleType || vehicle?.vehicleType || "four-wheeler";
  const fuelType = propFuelType || vehicle?.fuelType || "petrol";
  const isElectric = fuelType === "electric";

  // Reset image error state whenever vehicle props or photo source update
  React.useEffect(() => {
    setImageError(false);
    setFallbackAttempted(false);
    setActiveSrcOverride(null);
  }, [propPhotoUrl, vehicle?.photoUrl, make, model]);

  // Photo resolution: explicit override > prop > vehicle.photoUrl > curated preset match
  const rawSrc = propPhotoUrl !== undefined ? propPhotoUrl : (vehicle?.photoUrl ?? "");
  const preset = findMatchingVehiclePreset(make, model);

  let displaySrc: string | null = activeSrcOverride;
  if (!displaySrc) {
    if (rawSrc && (rawSrc.includes("imgd.aeplcdn.com") || rawSrc.includes("aeplcdn.com")) && preset?.imageUrl) {
      displaySrc = preset.imageUrl;
    } else if (rawSrc && rawSrc.trim().length > 0) {
      displaySrc = rawSrc.trim();
    } else if (preset?.imageUrl) {
      displaySrc = preset.imageUrl;
    }
  }

  const handleImageError = () => {
    // If external/custom URL failed and we have a local curated preset photo, fall back to it
    if (!fallbackAttempted && preset?.imageUrl && displaySrc !== preset.imageUrl) {
      setFallbackAttempted(true);
      setActiveSrcOverride(preset.imageUrl);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  const bodyStyle = detectVehicleBodyStyle(make, model, vehicleType);
  const cInfo = resolveVehicleColor(color, make);
  const presetConf = SIZE_PRESETS[size] || SIZE_PRESETS.md;
  const br = borderRadius ?? presetConf.br;

  const handleClick = (e: React.MouseEvent) => {
    if (enlargeable) {
      e.stopPropagation();
      setLightboxOpen(true);
    }
  };

  const isRealPhoto = Boolean(displaySrc && !imageError);

  return (
    <>
      <div
        className={`vehicle-image-container ${className || ""}`}
        onClick={handleClick}
        title={enlargeable ? `Click to view ${make} ${model} photo` : undefined}
        style={{
          position: "relative",
          width: presetConf.width,
          height: presetConf.height,
          borderRadius: br,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          overflow: "visible",
          flexShrink: 0,
          cursor: enlargeable ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          ...style,
        }}
      >
        {/* Render either authentic photo or metallic studio illustration */}
        {displaySrc && !imageError ? (
          <img
            src={displaySrc}
            alt={`${make} ${model}`}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 6px 14px rgba(0, 0, 0, 0.28))",
              padding: 0,
              boxSizing: "border-box",
            }}
          />
        ) : (
          <div
            style={{
              width: "90%",
              height: "90%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 2,
            }}
          >
            <VehicleStudioIllustration
              bodyStyle={bodyStyle}
              color={color}
              fallbackMake={make}
              make={make}
              model={model}
              isElectric={isElectric}
            />
          </div>
        )}

        {/* Floating Brand Emblem Badge */}
        {showBrandBadge && (
          <div
            style={{
              position: "absolute",
              bottom: size === "xs" || size === "sm" ? 2 : 4,
              right: size === "xs" || size === "sm" ? 2 : 4,
              borderRadius: "50%",
              background: "#ffffff",
              padding: 1.5,
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,0,0,0.15)",
              zIndex: 2,
            }}
          >
            <VehicleMakeLogo make={make} size={presetConf.logoSize} borderRadius={999} />
          </div>
        )}

        {/* Floating Paint Color Dot */}
        {showColorDot && color && (
          <div
            title={`Color: ${color}`}
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: cInfo.hex,
              border: "1.5px solid rgba(255,255,255,0.75)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
              zIndex: 2,
            }}
          />
        )}

        {/* Hover Inspect Indicator for Large / Interactive Sizes */}
        {enlargeable && (
          <div
            className="hover-inspect-overlay"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              opacity: 0,
              transition: "opacity 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              pointerEvents: "none",
            }}
          >
            <Eye size={16} />
          </div>
        )}
      </div>

      {/* Lightbox Full-Screen Modal */}
      {lightboxOpen && (
        <VehicleLightboxModal
          vehicle={{
            ...vehicle,
            make,
            model,
            color,
            vehicleType,
            fuelType,
            photoUrl: displaySrc && !imageError ? displaySrc : undefined,
          }}
          onClose={() => setLightboxOpen(false)}
          onChangePhoto={onPhotoChange}
          onRemovePhoto={onPhotoRemove}
        />
      )}
    </>
  );
}
