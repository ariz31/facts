export const DEFAULT_CARD_DESIGN = Object.freeze({
  preset: "classic",
  accent: "#315efb",
  background: "#ffffff",
  text: "#14213d",
  muted: "#64748b",
  font: "system",
  radius: 24,
  spacing: "comfortable",
  shadow: "soft",
  imageOverlay: 35,
  imagePosition: "center",
  imageFit: "cover",
  imageEnabled: true,
});

export const CARD_DESIGN_PRESETS = Object.freeze({
  classic: { accent: "#315efb", background: "#ffffff", text: "#14213d", muted: "#64748b", font: "system", radius: 24, spacing: "comfortable", shadow: "soft" },
  minimal: { accent: "#111827", background: "#ffffff", text: "#111827", muted: "#6b7280", font: "system", radius: 8, spacing: "spacious", shadow: "none" },
  editorial: { accent: "#8b2f2f", background: "#fffaf0", text: "#2d241f", muted: "#75685f", font: "serif", radius: 4, spacing: "spacious", shadow: "soft" },
  notebook: { accent: "#1d4ed8", background: "#fffef4", text: "#1f2937", muted: "#667085", font: "rounded", radius: 18, spacing: "comfortable", shadow: "soft" },
  neon: { accent: "#22d3ee", background: "#07111f", text: "#ecfeff", muted: "#a5c7d0", font: "mono", radius: 22, spacing: "comfortable", shadow: "strong" },
  photo: { accent: "#ffffff", background: "#172033", text: "#ffffff", muted: "#e2e8f0", font: "system", radius: 28, spacing: "spacious", shadow: "strong", imageOverlay: 48 },
});

const ALLOWED_FONTS = new Set(["system", "serif", "mono", "rounded"]);
const ALLOWED_SPACING = new Set(["compact", "comfortable", "spacious"]);
const ALLOWED_SHADOWS = new Set(["none", "soft", "strong"]);
const ALLOWED_POSITIONS = new Set(["center", "top", "bottom", "left", "right"]);
const ALLOWED_FITS = new Set(["cover", "contain"]);

export function normalizeCardDesign(design = {}) {
  const selectedPreset = CARD_DESIGN_PRESETS[design.preset] ? design.preset : DEFAULT_CARD_DESIGN.preset;
  const displayPreset = design.preset === "custom" ? "custom" : selectedPreset;
  const merged = {
    ...DEFAULT_CARD_DESIGN,
    ...CARD_DESIGN_PRESETS[selectedPreset],
    ...design,
    preset: displayPreset,
  };

  return {
    ...merged,
    accent: normalizeColor(merged.accent, DEFAULT_CARD_DESIGN.accent),
    background: normalizeColor(merged.background, DEFAULT_CARD_DESIGN.background),
    text: normalizeColor(merged.text, DEFAULT_CARD_DESIGN.text),
    muted: normalizeColor(merged.muted, DEFAULT_CARD_DESIGN.muted),
    font: ALLOWED_FONTS.has(merged.font) ? merged.font : DEFAULT_CARD_DESIGN.font,
    radius: clampNumber(merged.radius, 0, 40, DEFAULT_CARD_DESIGN.radius),
    spacing: ALLOWED_SPACING.has(merged.spacing) ? merged.spacing : DEFAULT_CARD_DESIGN.spacing,
    shadow: ALLOWED_SHADOWS.has(merged.shadow) ? merged.shadow : DEFAULT_CARD_DESIGN.shadow,
    imageOverlay: clampNumber(merged.imageOverlay, 0, 85, DEFAULT_CARD_DESIGN.imageOverlay),
    imagePosition: ALLOWED_POSITIONS.has(merged.imagePosition) ? merged.imagePosition : DEFAULT_CARD_DESIGN.imagePosition,
    imageFit: ALLOWED_FITS.has(merged.imageFit) ? merged.imageFit : DEFAULT_CARD_DESIGN.imageFit,
    imageEnabled: merged.imageEnabled !== false,
  };
}

export function applyPreset(currentDesign, presetName) {
  if (!CARD_DESIGN_PRESETS[presetName]) return normalizeCardDesign(currentDesign);
  return normalizeCardDesign({ ...currentDesign, ...CARD_DESIGN_PRESETS[presetName], preset: presetName });
}

export function designToCssVariables(design, imageUrl = "") {
  const normalized = normalizeCardDesign(design);
  const hasImage = Boolean(imageUrl && normalized.imageEnabled);
  const fonts = {
    system: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    rounded: 'ui-rounded, "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif',
  };
  const spacing = {
    compact: "24px",
    comfortable: "clamp(24px, 5vw, 48px)",
    spacious: "clamp(32px, 6vw, 64px)",
  };
  const shadows = {
    none: "none",
    soft: "0 20px 55px rgba(20, 33, 61, .12)",
    strong: "0 28px 80px rgba(0, 0, 0, .34)",
  };

  return {
    "--card-custom-accent": normalized.accent,
    "--card-custom-bg": normalized.background,
    "--card-custom-text": normalized.text,
    "--card-custom-muted": normalized.muted,
    "--card-custom-font": fonts[normalized.font],
    "--card-custom-radius": `${normalized.radius}px`,
    "--card-custom-padding": spacing[normalized.spacing],
    "--card-custom-shadow": shadows[normalized.shadow],
    "--card-image": hasImage ? `url("${imageUrl}")` : "none",
    "--card-image-overlay": hasImage ? `rgb(0 0 0 / ${normalized.imageOverlay / 100})` : "transparent",
    "--card-image-position": normalized.imagePosition,
    "--card-image-fit": normalized.imageFit,
  };
}

function normalizeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value).toLowerCase() : fallback;
}

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(number)));
}
