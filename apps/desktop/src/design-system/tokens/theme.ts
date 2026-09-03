export interface AccentTheme {
  id: string;
  name: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
}

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: "coral",
    name: "Adharsh Coral (Default)",
    accent: "#ff8a73",
    accentHover: "#ff7457",
    accentActive: "#f05e40",
    accentSoft: "rgba(255, 138, 115, 0.14)",
    accentBorder: "rgba(255, 138, 115, 0.38)",
    accentText: "#ff9980",
  },
  {
    id: "sapphire",
    name: "Industrial Sapphire",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    accentActive: "#1e40af",
    accentSoft: "rgba(37, 99, 235, 0.12)",
    accentBorder: "rgba(37, 99, 235, 0.35)",
    accentText: "#60a5fa",
  },
  {
    id: "teal",
    name: "Factory Teal",
    accent: "#0d9488",
    accentHover: "#0f766e",
    accentActive: "#115e59",
    accentSoft: "rgba(13, 148, 136, 0.12)",
    accentBorder: "rgba(13, 148, 136, 0.35)",
    accentText: "#2dd4bf",
  },
  {
    id: "emerald",
    name: "Production Emerald",
    accent: "#059669",
    accentHover: "#047857",
    accentActive: "#065f46",
    accentSoft: "rgba(5, 150, 105, 0.12)",
    accentBorder: "rgba(5, 150, 105, 0.35)",
    accentText: "#34d399",
  },
  {
    id: "crimson",
    name: "Precision Crimson",
    accent: "#e11d48",
    accentHover: "#be123c",
    accentActive: "#9f1239",
    accentSoft: "rgba(225, 29, 72, 0.12)",
    accentBorder: "rgba(225, 29, 72, 0.35)",
    accentText: "#fb7185",
  },
  {
    id: "zinc",
    name: "Monochrome Zinc",
    accent: "#e4e4e7",
    accentHover: "#d4d4d8",
    accentActive: "#a1a1aa",
    accentSoft: "rgba(228, 228, 231, 0.12)",
    accentBorder: "rgba(228, 228, 231, 0.35)",
    accentText: "#f4f4f5",
  },
];

export function applyAccentTheme(themeId: string) {
  const selected = ACCENT_THEMES.find((t) => t.id === themeId) || ACCENT_THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--accent", selected.accent);
  root.style.setProperty("--accent-hover", selected.accentHover);
  root.style.setProperty("--accent-active", selected.accentActive);
  root.style.setProperty("--accent-soft", selected.accentSoft);
  root.style.setProperty("--accent-border", selected.accentBorder);
  root.style.setProperty("--accent-text", selected.accentText);
  if (selected.id === "coral") {
    root.style.setProperty("--accent-contrast", "#111827");
    root.style.setProperty("--accent-gradient", "linear-gradient(135deg, #ff9980 0%, #ff6b8b 100%)");
  } else {
    root.style.setProperty("--accent-contrast", "#ffffff");
    root.style.setProperty("--accent-gradient", selected.accent);
  }
  localStorage.setItem("officefloww_accent_theme", selected.id);
}

export function initAccentTheme() {
  let saved = localStorage.getItem("officefloww_accent_theme");
  if (!saved || saved === "sapphire") {
    saved = "coral";
    localStorage.setItem("officefloww_accent_theme", "coral");
  }
  applyAccentTheme(saved);
}
