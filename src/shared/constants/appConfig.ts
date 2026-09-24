import pkg from "../../../package.json" with { type: "json" };

/**
 * Product branding shown in the UI, page titles and the PWA manifest.
 * The logo files live in public/: `logoLight` is drawn on the light theme and `logoDark` on
 * the dark theme. Operators can still override the name and logo per instance from
 * Settings → Appearance (instanceName / custom logo), which take precedence in the sidebar.
 */
export const BRAND = {
  name: "ArcByte | Open AI",
  company: "ArcByte",
  product: "Open AI",
  /** For space-constrained surfaces: diagram nodes, the PWA home-screen label. */
  shortName: "ArcByte",
  logoLight: "/logo_white.png",
  logoDark: "/logo_dark.png",
} as const;

export const APP_CONFIG = {
  name: BRAND.name,
  description: "AI Gateway for Multi-Provider LLMs",
  version: pkg.version,
};

export const THEME_CONFIG = {
  storageKey: "theme",
  defaultTheme: "system",
};
