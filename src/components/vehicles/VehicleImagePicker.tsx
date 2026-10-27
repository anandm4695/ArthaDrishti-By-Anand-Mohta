import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  Check,
  Trash2,
  Car,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  CURATED_VEHICLE_PRESETS,
  CuratedVehiclePreset,
  VehicleBodyStyle,
  compressVehiclePhotoFile,
  findMatchingVehiclePreset,
} from "../../utils/vehicleAssets";
import { VehicleImage } from "./VehicleImage";
import { Button } from "../ui/Button";
import { Field } from "../ui/Form";
import { THEME } from "../../utils/constants";

export interface VehicleImagePickerProps {
  photoUrl: string;
  make: string;
  model: string;
  color?: string;
  vehicleType?: string;
  fuelType?: string;
  onChange: (photoUrl: string) => void;
  onSelectPreset?: (preset: CuratedVehiclePreset) => void;
}

export function VehicleImagePicker({
  photoUrl,
  make,
  model,
  color,
  vehicleType,
  fuelType,
  onChange,
  onSelectPreset,
}: VehicleImagePickerProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "url">("gallery");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [urlInput, setUrlInput] = useState(photoUrl.startsWith("http") ? photoUrl : "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-match recommendation based on user input
  const autoMatch = findMatchingVehiclePreset(make, model);
  const isAutoMatchApplied = autoMatch && photoUrl === autoMatch.imageUrl;

  // Filtered preset gallery
  const filteredPresets = CURATED_VEHICLE_PRESETS.filter((p) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "suv") return p.bodyStyle === "suv";
    if (categoryFilter === "sedan") return p.bodyStyle === "sedan";
    if (categoryFilter === "hatchback") return p.bodyStyle === "hatchback";
    if (categoryFilter === "two-wheeler")
      return p.bodyStyle === "cruiser" || p.bodyStyle === "sportsbike" || p.bodyStyle === "scooter";
    if (categoryFilter === "electric") return p.fuelType === "electric";
    if (categoryFilter === "commercial") return p.bodyStyle === "commercial";
    return true;
  });

  // Handle local file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const compressedDataUrl = await compressVehiclePhotoFile(file);
      onChange(compressedDataUrl);
      setActiveTab("gallery");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm, 8px)",
    border: "1px solid var(--t-line, var(--border))",
    background: "var(--surface-0, var(--surface))",
    color: "var(--text)",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-md, 12px)",
        border: "1px solid var(--t-line, var(--border))",
        background: "var(--surface-1, rgba(255,255,255,0.03))",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* ── Active Photo Header & Quick Actions ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <VehicleImage
            photoUrl={photoUrl}
            make={make}
            model={model}
            color={color}
            vehicleType={vehicleType}
            fuelType={fuelType}
            size="sm"
            showBrandBadge
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
              Vehicle Photo & Avatar
            </div>
            <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 2 }}>
              {photoUrl
                ? photoUrl.startsWith("data:")
                  ? "Custom Device Photo"
                  : "Gallery Stock Photo"
                : "Dynamic Metallic Studio Render"}
            </div>
          </div>
        </div>

        {photoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Trash2 size={12} color="var(--t-rust)" />}
            onClick={() => {
              onChange("");
              setUrlInput("");
            }}
            style={{ color: "var(--t-rust)", fontSize: 11 }}
          >
            Clear Photo
          </Button>
        )}
      </div>

      {/* ── Auto-Match Recommendation Banner ── */}
      {autoMatch && !isAutoMatchApplied && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: 8,
            background: "color-mix(in srgb, var(--t-accent) 12%, var(--surface-0))",
            border: "1px solid var(--t-accent)",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Sparkles size={14} color="var(--t-accent)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Suggested Photo: <strong>{autoMatch.name}</strong> ({autoMatch.badge})
            </div>
          </div>
          <Button
            type="button"
            variant="accent"
            size="xs"
            onClick={() => {
              onChange(autoMatch.imageUrl);
              onSelectPreset?.(autoMatch);
            }}
          >
            Apply
          </Button>
        </div>
      )}

      {/* ── Picker Navigation Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          borderBottom: "1px solid var(--t-line)",
          paddingBottom: 8,
        }}
      >
        {[
          { id: "gallery", label: "Garage Gallery", icon: ImageIcon },
          { id: "upload", label: "Upload Photo", icon: Upload },
          { id: "url", label: "Web Image Link", icon: LinkIcon },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                padding: "5px 10px",
                borderRadius: 6,
                border: active ? "1px solid var(--t-accent)" : "1px solid transparent",
                background: active
                  ? "color-mix(in srgb, var(--t-accent) 12%, transparent)"
                  : "transparent",
                color: active ? "var(--t-accent)" : "var(--t-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <TabIcon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Curated Model Gallery ── */}
      {activeTab === "gallery" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Models" },
              { id: "suv", label: "SUVs" },
              { id: "sedan", label: "Sedans" },
              { id: "hatchback", label: "Hatchbacks" },
              { id: "two-wheeler", label: "Bikes & Scooters" },
              { id: "electric", label: "EVs" },
              { id: "commercial", label: "Commercial" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  fontSize: 10,
                  fontWeight: categoryFilter === cat.id ? 700 : 500,
                  padding: "3px 8px",
                  borderRadius: 12,
                  border:
                    categoryFilter === cat.id
                      ? `1px solid ${THEME.accent}`
                      : "1px solid var(--t-line)",
                  background:
                    categoryFilter === cat.id
                      ? `color-mix(in srgb, ${THEME.accent} 15%, transparent)`
                      : "transparent",
                  color: categoryFilter === cat.id ? "var(--t-accent)" : "var(--t-muted)",
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Preset Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {filteredPresets.map((preset) => {
              const selected = photoUrl === preset.imageUrl;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    onChange(preset.imageUrl);
                    onSelectPreset?.(preset);
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    border: selected
                      ? "2px solid var(--t-accent)"
                      : "1px solid var(--t-line)",
                    background: selected
                      ? "color-mix(in srgb, var(--t-accent) 8%, var(--surface-0))"
                      : "var(--surface-0)",
                    padding: 6,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 60,
                      borderRadius: 6,
                      background: "transparent",
                      border: "none",
                      overflow: "visible",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 2,
                      boxSizing: "border-box",
                    }}
                  >
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.22))",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {preset.name}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--t-muted)",
                        marginTop: 1,
                      }}
                    >
                      {preset.badge}
                    </div>
                  </div>

                  {selected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "var(--t-accent)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 2: Upload Photo from Device ── */}
      {activeTab === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            style={{
              padding: "24px 16px",
              borderRadius: 10,
              border: "1.5px dashed var(--t-line)",
              background: "var(--surface-0)",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
          >
            <Upload size={24} style={{ color: "var(--t-accent)", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              {isUploading ? "Compressing & Processing Photo..." : "Click to Upload Vehicle Photo"}
            </div>
            <div style={{ fontSize: 11, color: "var(--t-muted)", marginTop: 4 }}>
              Supports PNG, JPG, or WebP. Automatically optimized for offline speed.
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {uploadError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--t-rust)",
              }}
            >
              <AlertCircle size={13} />
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Direct Web Image Link ── */}
      {activeTab === "url" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inp, flex: 1 }}
              placeholder="Paste direct image URL (https://...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={!urlInput.trim()}
              onClick={() => onChange(urlInput.trim())}
            >
              Apply Link
            </Button>
          </div>
          <div style={{ fontSize: 11, color: "var(--t-muted)" }}>
            Tip: You can use direct image links from Google Photos, Unsplash, or manufacturer websites.
          </div>
        </div>
      )}
    </div>
  );
}
