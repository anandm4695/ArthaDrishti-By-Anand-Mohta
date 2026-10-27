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
  }, [propPhotoUrl, vehicle?.photoUrl, make, model]);

  // Photo resolution: prop > vehicle.photoUrl > curated preset match
  const rawSrc = propPhotoUrl !== undefined ? propPhotoUrl : (vehicle?.photoUrl ?? "");
  let activeSrc: string | null = rawSrc && rawSrc.trim().length > 0 ? rawSrc.trim() : null;
  if (!activeSrc && !imageError) {
    const preset = findMatchingVehiclePreset(make, model);
    if (preset?.imageUrl) {
      activeSrc = preset.imageUrl;
    }
  }

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

  const isRealPhoto = Boolean(activeSrc && !imageError);

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
          background: isRealPhoto
            ? "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
            : "radial-gradient(ellipse at 50% 65%, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
          border: isRealPhoto
            ? "1px solid rgba(0, 0, 0, 0.08)"
            : "1px solid var(--t-line, rgba(255,255,255,0.12))",
          boxShadow: isRealPhoto
            ? "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)"
            : "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
          overflow: "hidden",
          flexShrink: 0,
          cursor: enlargeable ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
          ...style,
        }}
      >
        {/* Render either authentic photo or metallic studio illustration */}
        {activeSrc && !imageError ? (
          <img
            src={activeSrc}
            alt={`${make} ${model}`}
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: size === "xs" ? 1 : size === "sm" ? 2 : 4,
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
            photoUrl: activeSrc && !imageError ? activeSrc : undefined,
          }}
          onClose={() => setLightboxOpen(false)}
          onChangePhoto={onPhotoChange}
          onRemovePhoto={onPhotoRemove}
        />
      )}
    </>
  );
}
