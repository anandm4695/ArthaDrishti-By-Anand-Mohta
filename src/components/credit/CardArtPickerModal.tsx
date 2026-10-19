/* eslint-disable */
import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Search,
  Check,
  RotateCcw,
  ExternalLink,
  Layers,
} from "lucide-react";
import { THEME } from "../../utils/constants";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  CARD_ART_PRESETS,
  CardArtPreset,
  compressCardImageFile,
  resolveCardArtwork,
} from "../../utils/cardAssets";
import { BankLogo } from "../ui/BrandLogos";

export interface CardArtPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, preset?: CardArtPreset) => void;
  currentImageUrl?: string;
  cardName: string;
  network?: string;
  isVariant?: boolean;
}

export function CardArtPickerModal({
  isOpen,
  onClose,
  onSelectImage,
  currentImageUrl = "",
  cardName,
  network = "Visa",
  isVariant = false,
}: CardArtPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "upload" | "url">("presets");
  const [searchQuery, setSearchQuery] = useState("");
  const [bankFilter, setBankFilter] = useState("all");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(currentImageUrl.startsWith("http") ? currentImageUrl : "");
  const [uploadedDataUrl, setUploadedDataUrl] = useState(
    currentImageUrl.startsWith("data:") ? currentImageUrl : ""
  );
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Banks list for filter pills
  const banks = [
    { id: "all", label: "All Banks" },
    { id: "hdfc", label: "HDFC" },
    { id: "icici", label: "ICICI" },
    { id: "sbi", label: "SBI" },
    { id: "axis", label: "Axis" },
    { id: "hsbc", label: "HSBC" },
    { id: "idfc", label: "IDFC FIRST" },
    { id: "indusind", label: "IndusInd" },
    { id: "federal", label: "Federal / Scapia" },
    { id: "amex", label: "Amex" },
    { id: "kotak", label: "Kotak" },
    { id: "onecard", label: "OneCard" },
  ];

  const filteredPresets = CARD_ART_PRESETS.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBank =
      bankFilter === "all" ||
      p.bankName.toLowerCase().includes(bankFilter) ||
      p.id.toLowerCase().includes(bankFilter);

    return matchesSearch && matchesBank;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadError(null);

    try {
      const compressedDataUrl = await compressCardImageFile(file, 900, 560, 0.85);
      setUploadedDataUrl(compressedDataUrl);
      setActiveTab("upload");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process card image file.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleApply = () => {
    if (activeTab === "presets" && selectedPresetId) {
      const preset = CARD_ART_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        onSelectImage(preset.imageUrl || "", preset);
      }
    } else if (activeTab === "upload" && uploadedDataUrl) {
      onSelectImage(uploadedDataUrl);
    } else if (activeTab === "url" && urlInput.trim()) {
      onSelectImage(urlInput.trim());
    }
    onClose();
  };

  const handleResetToAuto = () => {
    onSelectImage("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {isVariant ? `Card Art & Image: ${cardName || "Card Variant"}` : `Card Artwork: ${cardName || "Credit Card"}`}
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, color: THEME.muted, marginTop: 2 }}>
            Select authentic card design, upload a custom card photo, or paste an image URL
          </div>
        </div>
      }
      maxWidth={760}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Button variant="ghost" onClick={handleResetToAuto} style={{ gap: 6, fontSize: 12 }}>
            <RotateCcw size={13} /> Reset to Auto Design
          </Button>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleApply}>
              Apply Card Art
            </Button>
          </div>
        </div>
      }
    >
      <div>
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: `1px solid ${THEME.line}`,
            paddingBottom: 10,
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "presets" ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "transparent",
              color: activeTab === "presets" ? THEME.accent : THEME.muted,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={14} /> Curated Card Gallery ({CARD_ART_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "upload" ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "transparent",
              color: activeTab === "upload" ? THEME.accent : THEME.muted,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Upload size={14} /> Upload Card Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "url" ? "color-mix(in srgb, var(--t-accent) 15%, transparent)" : "transparent",
              color: activeTab === "url" ? THEME.accent : THEME.muted,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <ImageIcon size={14} /> Custom Image URL
          </button>
        </div>

        {/* ── TAB 1: CURATED PRESETS GALLERY ── */}
        {activeTab === "presets" && (
          <div>
            {/* Search & Bank Filter Bar */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: THEME.muted,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search card name (Infinia, Scapia, Amazon Pay, Atlas...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 32px",
                    borderRadius: 8,
                    border: `1px solid ${THEME.line}`,
                    background: "var(--surface-1)",
                    color: THEME.ink,
                    fontSize: 12.5,
                    outline: "none",
                  }}
                />
              </div>

              {/* Bank Pills */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {banks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBankFilter(b.id)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      border: bankFilter === b.id ? `1px solid ${THEME.accent}` : `1px solid ${THEME.line}`,
                      background: bankFilter === b.id ? "color-mix(in srgb, var(--t-accent) 12%, transparent)" : "var(--surface-1)",
                      color: bankFilter === b.id ? THEME.accent : THEME.muted,
                      cursor: "pointer",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 12,
                maxHeight: "420px",
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {filteredPresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    style={{
                      borderRadius: 14,
                      padding: "12px 14px",
                      background: preset.bgGradient,
                      color: preset.textColor,
                      border: isSelected ? `2.5px solid ${THEME.accent}` : "1px solid rgba(255,255,255,0.14)",
                      boxShadow: isSelected
                        ? "0 0 0 2px var(--t-accent), 0 8px 24px rgba(0,0,0,0.4)"
                        : "0 4px 12px rgba(0,0,0,0.25)",
                      cursor: "pointer",
                      position: "relative",
                      minHeight: 125,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {/* Official Bank Website Card Image Backdrop */}
                    {preset.imageUrl && (
                      <>
                        <img
                          src={preset.imageUrl}
                          alt={preset.name}
                          loading="lazy"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            zIndex: 1,
                            opacity: 0.92,
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)",
                            zIndex: 2,
                            pointerEvents: "none",
                          }}
                        />
                      </>
                    )}

                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: THEME.accent,
                          color: "#fff",
                          borderRadius: 99,
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 5,
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 3 }}>
                      <BankLogo bankName={preset.bankName} size={24} />
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(0,0,0,0.4)",
                          backdropFilter: "blur(4px)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        {preset.network}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, position: "relative", zIndex: 3 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                          color: "#ffffff",
                          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                        }}
                      >
                        {preset.name}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                        {preset.bankName} · {preset.badgeText || preset.category}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: "rgba(255,255,255,0.9)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        marginTop: 6,
                        position: "relative",
                        zIndex: 3,
                      }}
                    >
                      <span>•••• •••• •••• 4589</span>
                      {preset.suggestedVariants && (
                        <span style={{ fontSize: 9, color: preset.accentColor || "#fde047", fontWeight: 700 }}>
                          +{preset.suggestedVariants.length} Variants
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: UPLOAD IMAGE ── */}
        {activeTab === "upload" && (
          <div style={{ padding: "10px 0" }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${uploadedDataUrl ? THEME.accent : THEME.line}`,
                borderRadius: 14,
                padding: "36px 20px",
                textAlign: "center",
                background: "var(--surface-1)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              {isProcessingFile ? (
                <div style={{ color: THEME.accent, fontWeight: 600 }}>Optimizing card image...</div>
              ) : uploadedDataUrl ? (
                <div>
                  <div
                    style={{
                      width: 220,
                      height: 138,
                      margin: "0 auto 14px",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: `2px solid ${THEME.accent}`,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    <img
                      src={uploadedDataUrl}
                      alt="Uploaded card face"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent }}>
                    ✓ Image uploaded and compressed successfully
                  </div>
                  <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>
                    Click here to replace with a different photo
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={36} style={{ color: THEME.muted, margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: THEME.ink }}>
                    Click or drag & drop a card photo
                  </div>
                  <div style={{ fontSize: 11.5, color: THEME.muted, marginTop: 4 }}>
                    Supports PNG, JPG, or WebP. Automatically scaled and optimized.
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: 12,
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                      color: THEME.accent,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Browse Files
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div style={{ color: THEME.rust, fontSize: 12, marginTop: 8 }}>{uploadError}</div>
            )}
          </div>
        )}

        {/* ── TAB 3: CUSTOM IMAGE URL ── */}
        {activeTab === "url" && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: THEME.ink,
                  marginBottom: 6,
                }}
              >
                Card Face Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/images/card-face.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${THEME.line}`,
                  background: "var(--surface-1)",
                  color: THEME.ink,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: THEME.muted, marginTop: 5 }}>
                Paste direct URL to a card image or render. You can find official card visuals on bank websites.
              </div>
            </div>

            {urlInput.trim() && (
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: THEME.muted, marginBottom: 8, fontWeight: 600 }}>
                  Live Image Preview:
                </div>
                <div
                  style={{
                    width: 240,
                    height: 151,
                    margin: "0 auto",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${THEME.line}`,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                    background: "var(--surface-1)",
                  }}
                >
                  <img
                    src={urlInput.trim()}
                    alt="Card Preview"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
