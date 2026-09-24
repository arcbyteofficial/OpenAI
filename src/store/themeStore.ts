"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME_CONFIG } from "@/shared/constants/appConfig";

interface ThemeState {
  theme: string;
  colorTheme: string;
  customColor: string;
  setTheme: (theme: string) => void;
  setColorTheme: (colorTheme: string) => void;
  setCustomColorTheme: (color: string) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

// The default accent has no inline override: globals.css defines a theme-aware
// value (#0070f3 light / #3291ff dark) that a single inline hex would flatten.
export const DEFAULT_COLOR_THEME = "blue";
const THEME_STORE_VERSION = 1;

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: THEME_CONFIG.defaultTheme,
      colorTheme: DEFAULT_COLOR_THEME,
      customColor: "#3b82f6",

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        applyColorTheme(colorTheme, get().customColor);
      },

      setCustomColorTheme: (color) => {
        const normalized = normalizeHexColor(color);
        set({ colorTheme: "custom", customColor: normalized });
        applyColorTheme("custom", normalized);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        set({ theme: newTheme });
        applyTheme(newTheme);
      },

      initTheme: () => {
        const { theme, colorTheme, customColor } = get();
        applyTheme(theme);
        applyColorTheme(colorTheme, customColor);
      },
    }),
    {
      name: THEME_CONFIG.storageKey,
      version: THEME_STORE_VERSION,
      migrate: (persisted, version) => migrateThemeState(persisted, version),
    }
  )
);

// v0 → v1: "coral" was the store default before the neutral redesign, so a persisted
// "coral" almost always means "never picked one" — move it to the new default accent.
export function migrateThemeState(persisted: unknown, version: number) {
  if (!persisted || typeof persisted !== "object") return persisted as ThemeState;
  const state = { ...(persisted as Partial<ThemeState>) };
  if (version < 1 && state.colorTheme === "coral") {
    state.colorTheme = DEFAULT_COLOR_THEME;
  }
  return state as ThemeState;
}

export const COLOR_THEMES: Record<string, string> = {
  blue: "#0070f3",
  coral: "#e54d5e",
  red: "#ef4444",
  green: "#22c55e",
  violet: "#8b5cf6",
  orange: "#f97316",
  cyan: "#06b6d4",
};

// Apply light/dark theme to document
function applyTheme(theme: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const effectiveTheme = theme === "system" ? systemTheme : theme;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// Returns the inline accent override for a color theme, or null when the theme-aware
// CSS default from globals.css should apply (the default theme or an unknown id).
export function resolveColorThemeOverride(colorTheme: string, customColor: string) {
  if (colorTheme !== "custom" && !Object.hasOwn(COLOR_THEMES, colorTheme)) return null;
  if (colorTheme === DEFAULT_COLOR_THEME) return null;
  const baseColor =
    colorTheme === "custom" ? normalizeHexColor(customColor) : COLOR_THEMES[colorTheme];
  return { primary: baseColor, hover: shadeHexColor(baseColor, -0.14) };
}

function applyColorTheme(colorTheme: string, customColor: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const override = resolveColorThemeOverride(colorTheme, customColor);
  if (!override) {
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-primary-hover");
    return;
  }

  root.style.setProperty("--color-primary", override.primary);
  root.style.setProperty("--color-primary-hover", override.hover);
}

function normalizeHexColor(color: string) {
  const value = (color || "").trim();
  const hex = value.startsWith("#") ? value : `#${value}`;
  const valid = /^#([0-9a-fA-F]{6})$/.test(hex);
  return valid ? hex.toLowerCase() : "#3b82f6";
}

function shadeHexColor(hex: string, percent: number) {
  const normalized = normalizeHexColor(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const shade = (channel: number) => {
    const target = percent < 0 ? 0 : 255;
    const amount = Math.round((target - channel) * Math.abs(percent));
    const next = percent < 0 ? channel - amount : channel + amount;
    return Math.max(0, Math.min(255, next));
  };

  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(shade(r))}${toHex(shade(g))}${toHex(shade(b))}`;
}

export default useThemeStore;
