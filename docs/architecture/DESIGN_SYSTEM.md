---
title: "Design System & Visual Identity"
lastUpdated: 2026-09-24
---

# OmniRoute — Design System & Visual Identity

> **Status:** reference — describes the implemented **minimal neutral** identity of the
> dashboard (`src/`). The direction is _quiet, neutral, precise_ — borrowed from Apple, Linear and
> Vercel: grayscale chrome, hairline borders, one monochrome primary action, a single blue accent,
> tight Geist typography. It replaced the previous coral/violet identity (brand gradient,
> graph-paper wallpaper, 14px radii, colored icon chips).
>
> **Guards:** `tests/unit/design-system-identity.test.ts` (tokens, fonts, primitives, no
> gradients) and `tests/unit/theme-store-accent.test.ts` (default accent + migration).

---

## 1. Principles

- **Single source of truth = `src/app/globals.css`.** Tokens live in `:root` (light) and `.dark`
  (dark) and are exposed to Tailwind v4 utilities through `@theme inline`.
- **Tokens, never literals.** Components use semantic utilities (`bg-surface`, `text-text-muted`,
  `border-border`, `bg-contrast`, …). Raw hex/palette classes are reserved for _meaning_: status,
  chart series, provider brand marks, log levels, diff colors, always-dark terminals.
- **Color is information, not decoration.** Chrome is grayscale. The accent marks focus, links,
  selection and small "on" states. Status uses the semantic `success` / `warning` / `error` tokens.
- **Borders before shadows.** Cards and panels are flat surfaces with a hairline border. Only
  floating layers (modal, popover, dropdown, toast, command palette) are elevated.
- **No gradients, glows or decorative motion.** Motion is functional only: spinners, skeletons,
  progress, slide-overs, accordion chevrons, live-activity indicators.
- **Compact density.** 13–14px UI text, 32px default controls, 10px surface radius.

## 2. Tokens

Defined in `src/app/globals.css`. Values below are light / dark.

| Role                          | Utility                                        | Light                             | Dark                              |
| ----------------------------- | ---------------------------------------------- | --------------------------------- | --------------------------------- |
| Page canvas                   | `bg-bg`                                        | `#fafafa`                         | `#0a0a0a`                         |
| Subtle fill / hover / inset   | `bg-bg-subtle`                                 | `#f4f4f5`                         | `#141414`                         |
| Nested surface                | `bg-surface-2`                                 | `#f7f7f8`                         | `#161616`                         |
| Card / panel / popover        | `bg-surface`                                   | `#ffffff`                         | `#111111`                         |
| Sidebar                       | `bg-sidebar`                                   | `#fafafa`                         | `#0a0a0a`                         |
| Hairline border               | `border-border`                                | `rgba(0,0,0,.08)`                 | `rgba(255,255,255,.08)`           |
| Strong border (inputs, hover) | `border-border-strong`                         | `rgba(0,0,0,.14)`                 | `rgba(255,255,255,.14)`           |
| Primary text                  | `text-text-main`                               | `#171717`                         | `#ededed`                         |
| Secondary text                | `text-text-muted`                              | `#666666`                         | `#a1a1a1`                         |
| Tertiary text / placeholders  | `text-text-subtle`                             | `#8f8f8f`                         | `#737373`                         |
| Primary action fill           | `bg-contrast` / `text-contrast-fg`             | `#171717` / `#ffffff`             | `#ededed` / `#0a0a0a`             |
| Accent                        | `text-primary`, `bg-primary`, `ring-primary`   | `#0070f3`                         | `#3291ff`                         |
| Status                        | `text-success` / `text-warning` / `text-error` | `#16a34a` / `#d97706` / `#dc2626` | `#3ecf6e` / `#f5a524` / `#f14c4c` |

- `--color-accent`, `--color-accent-hover` and `--color-accent-light` **alias the accent**
  (`var(--color-primary…)`), so legacy `text-accent` / `bg-accent` classes follow it.
- `--grad-brand` survives only as a flat `var(--color-contrast)` fill for compatibility.
- Data tables read `--table-header-bg`, `--table-row-zebra` (transparent — no striping),
  `--table-row-hover`, `--table-cell-border` and `--table-row-selected`.
- Flow/orchestration surfaces keep the theme-aware `--orch-status-*` tokens; the canonical status
  hex lives in `src/shared/constants/statusColors.ts`.

### Radius, elevation, typography

| Token                                  | Value                                                          | Use                        |
| -------------------------------------- | -------------------------------------------------------------- | -------------------------- |
| `rounded-card` (`--radius`)            | `10px`                                                         | cards, panels, modals      |
| `rounded-control` (`--radius-control`) | `6px`                                                          | buttons, inputs, selects   |
| `shadow-[var(--shadow-elevated)]`      | hairline ring + soft ambient shadow                            | floating layers only       |
| `--font-sans`                          | `"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", …` | all UI text                |
| `--font-mono`                          | `"Geist Mono", ui-monospace, "SF Mono", …`                     | code, IDs, keys, endpoints |

Geist and Geist Mono are self-hosted variable fonts in `src/app/fonts/` (SIL OFL 1.1 —
`src/app/fonts/OFL.txt`, provenance in `THIRD_PARTY_NOTICES.md`), loaded through `@font-face`
with a relative `url()` so the Next CSS pipeline fingerprints them and honours a `basePath`. No
runtime font CDN is involved. `h1`–`h3` get `letter-spacing: -0.02em`. Material Symbols render at
weight 300 / optical size 20 to sit next to Geist.

Base element rules (`:focus-visible` ring, `body`, headings, `code`) live in `@layer base`, so a
component's own utilities (`focus:ring-*`, `rounded-control`, font classes) override them.

## 3. Components

Custom primitives in `src/shared/components/` (no shadcn/Radix); `cn()` is
`twMerge(clsx(...))`, so a caller's `className` replaces a primitive's conflicting class.

| Primitive                       | Look                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                        | `primary` = monochrome `bg-contrast`; `accent` = blue; `secondary`/`outline` = bordered surface; `ghost`; `warning`/`danger`. Sizes 28/32/40px, `rounded-control`, color transitions only |
| `Card`                          | `bg-surface border border-border rounded-card`, no shadow; compact 14px title header                                                                                                      |
| `Input` / `Select` / `Textarea` | `bg-surface border-border-strong rounded-control`, 32px controls; focus `border-primary` + `ring-[3px] ring-primary/15`; error `border-error` + `ring-error/15`                           |
| `Toggle`                        | neutral track, `bg-primary` when on, white knob                                                                                                                                           |
| `Badge`                         | compact pill; neutral default, status variants as 10% tints (`bg-success/10 text-success`, …)                                                                                             |
| `Modal`                         | `bg-black/40` overlay, `bg-surface` panel, `rounded-card`, elevated shadow, hairline header/footer                                                                                        |
| `Tooltip`                       | inverted chip (`bg-contrast text-contrast-fg`) in light mode, dark surface chip in dark mode                                                                                              |
| `SegmentedControl`              | Apple-style track (`bg-bg-subtle`) with a raised active segment                                                                                                                           |
| `DataTable`                     | small medium-weight muted headers, hairline rows, hover tint, `tabular-nums`                                                                                                              |

**App shell** (`Sidebar`, `Header`, `layouts/DashboardLayout.tsx`, `CommandPalette`,
`Breadcrumbs`): Linear-style sidebar (32px items, neutral active state `bg-text-main/[0.07]`,
icons in the text color — no per-item colored accents), a translucent sticky header with a
⌘K search pill, an opaque `bg-bg` canvas and a content column that stays fluid up to 3840px.

### Page conventions

- Page title `text-2xl font-semibold tracking-tight`, description `text-sm text-text-muted`.
- KPI cards: `bg-surface border border-border rounded-card`, label `text-[13px] text-text-muted`,
  value `text-2xl font-semibold tabular-nums` — no colored icon chips.
- Tabs: neutral underline (`border-text-main` on the active tab) or a segmented control.
- Selected toggles/pills: neutral (`bg-bg-subtle text-text-main`) or an accent tint
  (`bg-primary/10 text-primary`).
- Hand-rolled primary CTAs: `bg-contrast text-contrast-fg hover:bg-contrast-hover`.

## 4. Theming mechanics

- **Tailwind v4, CSS-first** (no `tailwind.config.*`); dark mode via the `.dark` class on `<html>`
  (`@custom-variant dark`), toggled by `src/store/themeStore.ts`; default theme = `system`
  (`src/shared/constants/appConfig.ts`).
- **Accent picker.** Settings → Appearance offers preset accents (`COLOR_THEMES` in
  `themeStore.ts`) plus a custom color. The default, `blue`, applies **no inline override** so the
  theme-aware CSS pair above is used; any other preset or custom color sets `--color-primary` /
  `--color-primary-hover` inline on `<html>`. The persisted store is versioned (v1); a v0 state whose
  accent was `coral` — the previous default — migrates to `blue`.
- `viewport.themeColor` in `src/app/layout.tsx` is a light/dark pair (`#fafafa` / `#0a0a0a`).

## 5. Brand

The product is branded **ArcByte | Open AI**. One constant, `BRAND` in
`src/shared/constants/appConfig.ts`, feeds every surface:

| Field       | Value                                      | Used for                                                 |
| ----------- | ------------------------------------------ | -------------------------------------------------------- |
| `name`      | `ArcByte \| Open AI`                       | page titles, lockups, PWA `name`, default `instanceName` |
| `shortName` | `ArcByte`                                  | diagram/hub node labels, PWA `short_name`                |
| `logoLight` | `https://cdn.arcbyte.co/favicon_white.png` | logo on the light theme; favicon for light browser UI    |
| `logoDark`  | `https://cdn.arcbyte.co/favicon_dark.png`  | logo on the dark theme; favicon for dark browser UI      |

- **Components.** `BrandMark` (`src/shared/components/BrandLogo.tsx`) paints each logo as a CSS
  background image and lets `dark:` show the one for the active theme: the server render already
  matches (no hydration flash), only the visible variant is downloaded, and an unreachable CDN
  leaves the slot empty rather than showing a broken-image icon. `BrandWordmark` renders the name
  with a muted separator. The sidebar, login, landing navigation/footer/hub, home topology hub and
  docs navigation use them.
- **Favicons.** `src/app/layout.tsx` links the two logos with `prefers-color-scheme` media queries.
  An operator's custom favicon (Settings → Appearance) still replaces them.
- **CDN-hosted.** The logos load from `https://cdn.arcbyte.co` in the visitor's browser (the CSP
  `img-src` allows `https:`), so an offline or air-gapped install shows the wordmark without the
  mark. The PWA manifest, `apple-touch-icon.png`, service-worker notification icons and the
  `/favicon.ico` liveness probe used by `omniroute doctor` still use the local files in `public/`.
- **Overrides.** Settings → Appearance keeps whitelabeling per instance: a custom `instanceName` or
  logo replaces the default wordmark/mark in the sidebar and the page title.
- **Copy.** Brand-only i18n strings (titles, the home greeting, diagram labels, copyright) carry the
  new name in every locale. Body copy that mentions the upstream project, protocol identifiers
  (`X-OmniRoute-*` headers, User-Agents, config markers) and the `omniroute` package/CLI name are
  unchanged.

## 6. Intentional exceptions

- Categorical palettes stay colored: chart series, provider-category legend dots
  (`ProviderCard`, `ProviderSummaryCard`), combo weight bars (`WeightTotalBar`), gamification tiers,
  console log levels (`ConsoleLogViewer`), HTTP method badges, `STRATEGY_COLORS` / `LAYER_COLORS`
  and the IoNode input/output pair on the flow canvases.
- Provider and agent brand colors (logos, `tool.color` step markers) are kept.
- The Monaco editor keeps its dark theme where configured.

## 7. Reference index

| Area                | Path                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens & base rules | `src/app/globals.css`                                                                                                                                          |
| Fonts               | `src/app/fonts/`                                                                                                                                               |
| Brand               | `src/shared/constants/appConfig.ts` (`BRAND`), `src/shared/components/BrandLogo.tsx`; logos on `https://cdn.arcbyte.co`                                        |
| Theme store         | `src/store/themeStore.ts`, `src/shared/components/ThemeProvider.tsx`, `src/shared/constants/appConfig.ts`                                                      |
| Appearance settings | `src/app/(dashboard)/dashboard/settings/components/AppearanceTab.tsx`                                                                                          |
| Shell               | `src/shared/components/{Sidebar,Header,CommandPalette,Breadcrumbs}.tsx`, `src/shared/components/layouts/`                                                      |
| Primitives          | `src/shared/components/{Button,Card,Input,Select,Textarea,Toggle,Checkbox,Badge,Modal,Tooltip,SegmentedControl,DataTable,EmptyState,Loading}.tsx`              |
| Status colors       | `src/shared/constants/statusColors.ts`, `src/shared/components/flow/edgeStyles.ts`                                                                             |
| `cn` util           | `src/shared/utils/cn.ts`                                                                                                                                       |
| Guards              | `tests/unit/design-system-identity.test.ts`, `tests/unit/theme-store-accent.test.ts`, `tests/unit/brand-identity.test.ts`, `tests/unit/ui/brand-logo.test.tsx` |
