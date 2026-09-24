import pkg from "../../../package.json" with { type: "json" };

/**
 * Product branding shown in the UI, page titles and the PWA manifest.
 * The logos are served from the ArcByte CDN: `logoLight` is drawn on the light theme and
 * `logoDark` on the dark theme (also used as the matching favicons). They load in the
 * visitor's browser, so an offline or air-gapped install shows the name without the mark.
 * Operators can still override the name and logo per instance from Settings → Appearance
 * (instanceName / custom logo), which take precedence in the sidebar.
 */
export const BRAND = {
  name: "ArcByte | Open AI",
  company: "ArcByte",
  product: "Open AI",
  /** For space-constrained surfaces: diagram nodes, the PWA home-screen label. */
  shortName: "ArcByte",
  logoLight: "https://cdn.arcbyte.co/favicon_white.png",
  logoDark: "https://cdn.arcbyte.co/favicon_dark.png",
  /**
   * Promotions that belong to the upstream OmniRoute project: the home-page partner banners
   * (Kimi, Cheaper Inference, the VS Code extension), its remote news feed and the
   * "Open Source Friend" chips on provider cards. Off for this brand.
   */
  showUpstreamPromotions: false as boolean,
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
