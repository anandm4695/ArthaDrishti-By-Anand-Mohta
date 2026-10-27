import React from "react";
import { X, Sparkles, User, Gauge, Calendar, Car, ExternalLink, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { IndianNumberPlate, resolveVehicleColor } from "../tabs/VehiclesTab";
import { VehicleMakeLogo } from "../ui/BrandLogos";
import { VehicleStudioIllustration } from "./VehicleStudioIllustration";
import { detectVehicleBodyStyle } from "../../utils/vehicleAssets";

export interface VehicleLightboxModalProps {
  vehicle: any;
  onClose: () => void;
  onChangePhoto?: () => void;
  onRemovePhoto?: () => void;
}

export function VehicleLightboxModal({
  vehicle,
  onClose,
  onChangePhoto,
  onRemovePhoto,
}: VehicleLightboxModalProps) {
  if (!vehicle) return null;

  const make = vehicle.make || vehicle.name?.split(" ")[0] || "Vehicle";
  const model = vehicle.model || vehicle.name?.split(" ").slice(1).join(" ") || "";
  const bodyStyle = detectVehicleBodyStyle(make, model, vehicle.vehicleType);
  const cInfo = resolveVehicleColor(vehicle.color, make);
  const hasCustomPhoto = !!vehicle.photoUrl;

  return (
    <Modal
      title={`${make} ${model} — Digital Showcase`}
      onClose={onClose}
      maxWidth={720}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div>
            {hasCustomPhoto && onRemovePhoto && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={13} color="var(--t-rust)" />}
                onClick={() => {
                  onRemovePhoto();
                  onClose();
                }}
                style={{ color: "var(--t-rust)" }}
              >
                Reset to Studio Render
              </Button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {onChangePhoto && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} />}
                onClick={() => {
                  onClose();
                  onChangePhoto();
                }}
              >
                Change Photo
              </Button>
            )}
            <Button variant="accent" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Full Image Studio Hero Canvas */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "clamp(240px, 45vh, 380px)",
            borderRadius: "var(--radius-lg, 16px)",
            overflow: "hidden",
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%)",
            border: "1px solid var(--t-line, rgba(255,255,255,0.12))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 30px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {vehicle.photoUrl ? (
            <img
              src={vehicle.photoUrl}
              alt={`${make} ${model}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.45))",
                padding: "16px",
              }}
            />
          ) : (
            <div style={{ width: "85%", height: "85%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <VehicleStudioIllustration
                bodyStyle={bodyStyle}
                color={vehicle.color}
                fallbackMake={make}
                make={make}
                model={model}
                isElectric={vehicle.fuelType === "electric"}
              />
            </div>
          )}

          {/* Floating Brand Emblem */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px 4px 6px",
              borderRadius: 24,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <VehicleMakeLogo make={make} size={28} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
              {make}
            </span>
          </div>

          {/* HSRP Number Plate Badge (Bottom-Right) */}
          {vehicle.registrationNumber && (
            <div
              style={{
                position: "absolute",
                bottom: 14,
                right: 14,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
              }}
            >
              <IndianNumberPlate
                registrationNumber={vehicle.registrationNumber}
                isElectric={vehicle.fuelType === "electric"}
                size="md"
              />
            </div>
          )}
        </div>

        {/* Identity & Color Specification Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            padding: "14px 16px",
            borderRadius: "var(--radius-md, 12px)",
            background: "var(--surface-1, rgba(255,255,255,0.04))",
            border: "1px solid var(--t-line)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase" }}>
              Paint Finish & Finish
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: cInfo.hex,
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  boxShadow: `0 0 6px ${cInfo.hex}`,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {vehicle.color || "Standard Finish"}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase" }}>
              Body Class & Fuel
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
              {bodyStyle.toUpperCase()} • {vehicle.fuelType || "Petrol"}
            </div>
          </div>

          {vehicle.year && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase" }}>
                Manufacturing Year
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
                {vehicle.year}
              </div>
            </div>
          )}

          {vehicle.currentOdometer && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-muted)", textTransform: "uppercase" }}>
                Odometer
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
                {Number(vehicle.currentOdometer).toLocaleString("en-IN")} km
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
