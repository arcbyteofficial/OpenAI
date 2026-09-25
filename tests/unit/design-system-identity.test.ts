import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Static guards for the dashboard's visual identity — the minimal neutral system
// (Apple / Linear / Vercel direction) described in docs/architecture/DESIGN_SYSTEM.md:
// grayscale surfaces, monochrome primary actions, one blue accent, Geist typography,
// border-first surfaces, no gradients and no graph-paper wallpaper. These lock the
// contract so an accidental edit cannot silently bring back the old identity.

const root = new URL("../../", import.meta.url);
const read = (p: string) => fs.readFileSync(new URL(p, root), "utf8");
const globalsCss = read("src/app/globals.css");

/** Returns the body of the first top-level `selector {` block that defines `marker`. */
function block(css: string, selector: string, marker: string): string {
  let from = 0;
  for (;;) {
    const start = css.indexOf(`\n${selector} {`, from);
    assert.ok(start >= 0, `${selector} block defining ${marker} is present`);
    const end = css.indexOf("\n}", start + 1);
    const body = css.slice(start, end);
    if (body.includes(marker)) return body;
    from = end;
  }
}

const lightTokens = block(globalsCss, ":root", "--color-bg:");
const darkTokens = block(globalsCss, ".dark", "--color-bg:");

test("neutral light + dark palettes", () => {
  const expect: Array<[string, string, string]> = [
    ["--color-bg", "#fafafa", "#0a0a0a"],
    ["--color-surface", "#ffffff", "#111111"],
    ["--color-card", "#ffffff", "#111111"],
    ["--color-text-main", "#171717", "#ededed"],
    ["--color-text-muted", "#666666", "#a1a1a1"],
  ];
  for (const [token, light, dark] of expect) {
    assert.match(lightTokens, new RegExp(`${token}:\\s*${light};`), `${token} light = ${light}`);
    assert.match(darkTokens, new RegExp(`${token}:\\s*${dark};`), `${token} dark = ${dark}`);
  }
  assert.match(lightTokens, /--color-border:\s*rgba\(0, 0, 0, 0\.08\)/);
  assert.match(darkTokens, /--color-border:\s*rgba\(255, 255, 255, 0\.08\)/);
});

test("one blue accent; the legacy accent names alias it", () => {
  assert.match(lightTokens, /--color-primary:\s*#0070f3;/);
  assert.match(darkTokens, /--color-primary:\s*#3291ff;/);
  assert.match(lightTokens, /--color-accent:\s*var\(--color-primary\);/);
  assert.ok(!/#e54d5e|229, 77, 94|#6366f1/i.test(globalsCss), "no coral/indigo brand literals");
});

test("contrast tokens drive monochrome primary actions in both themes", () => {
  assert.match(lightTokens, /--color-contrast:\s*#171717;/);
  assert.match(lightTokens, /--color-contrast-fg:\s*#ffffff;/);
  assert.match(darkTokens, /--color-contrast:\s*#ededed;/);
  assert.match(darkTokens, /--color-contrast-fg:\s*#0a0a0a;/);
  for (const t of ["--color-contrast", "--color-contrast-hover", "--color-contrast-fg"]) {
    assert.ok(globalsCss.includes(`${t}: var(${t});`), `${t} is exposed to Tailwind`);
  }
});

test("radius scale is 10px surfaces / 6px controls", () => {
  assert.match(lightTokens, /--radius:\s*10px;/);
  assert.match(lightTokens, /--radius-control:\s*6px;/);
  assert.match(globalsCss, /--radius-card:\s*var\(--radius\)/);
  assert.match(globalsCss, /--radius-control:\s*var\(--radius-control\)/);
});

test("the graph-paper wallpaper and brand gradient are retired", () => {
  assert.ok(!globalsCss.includes("body::before"), "no body::before wallpaper layer");
  assert.ok(!globalsCss.includes("--grid-line"), "no grid line token");
  assert.match(
    globalsCss,
    /--grad-brand:\s*linear-gradient\(var\(--color-contrast\), var\(--color-contrast\)\)/,
    "--grad-brand survives only as a flat fill for compatibility"
  );
});

test("Geist + Geist Mono are self-hosted and drive the font tokens", () => {
  assert.match(
    globalsCss,
    /font-family: "Geist";\s*src: url\("\.\/fonts\/Geist-Variable\.woff2"\)/
  );
  assert.match(
    globalsCss,
    /font-family: "Geist Mono";\s*src: url\("\.\/fonts\/GeistMono-Variable\.woff2"\)/
  );
  for (const f of ["Geist-Variable.woff2", "GeistMono-Variable.woff2", "OFL.txt"]) {
    assert.ok(fs.existsSync(new URL(`src/app/fonts/${f}`, root)), `src/app/fonts/${f} exists`);
  }
  assert.match(globalsCss, /--font-sans:\s*"Geist",/);
  assert.match(globalsCss, /--font-mono:\s*"Geist Mono",/);
  assert.ok(!/@import\s+url\([^)]*googleapis/.test(globalsCss), "no runtime font CDN import");
});

test("base element rules are layered so utilities can override them", () => {
  const layer = globalsCss.slice(globalsCss.indexOf("@layer base {"));
  assert.ok(layer.length > 0, "@layer base block is present");
  const layerBody = layer.slice(0, layer.indexOf("\n}\n"));
  assert.ok(layerBody.includes(":focus-visible {"), ":focus-visible lives in @layer base");
  assert.ok(layerBody.includes("  body {"), "body base styles live in @layer base");
  assert.match(layerBody, /--focus-ring:.*var\(--color-focus\)/);
});

test("Button: monochrome primary, blue accent variant, control radius", () => {
  const button = read("src/shared/components/Button.tsx");
  assert.match(button, /primary:\s*"bg-contrast text-contrast-fg hover:bg-contrast-hover"/);
  assert.match(button, /accent:\s*"bg-primary text-white/);
  assert.ok(button.includes("rounded-control"), "button sizes use the control radius");
  assert.ok(!button.includes("grad-brand") && !/gradient/.test(button), "no gradient fill");
  assert.ok(!/scale-\[/.test(button), "no press-scale animation");
});

test("Card is a border-only surface; Modal/Input/Select use the radius scale", () => {
  const card = read("src/shared/components/Card.tsx");
  const modal = read("src/shared/components/Modal.tsx");
  const input = read("src/shared/components/Input.tsx");
  const select = read("src/shared/components/Select.tsx");
  assert.ok(card.includes("border border-border") && card.includes("rounded-card"));
  assert.ok(!/\bshadow-(sm|md|lg|xl)\b/.test(card), "cards carry no drop shadow");
  assert.ok(modal.includes("rounded-card"), "modal uses rounded-card");
  assert.ok(modal.includes("shadow-[var(--shadow-elevated)]"), "modal is the elevated layer");
  assert.ok(input.includes("rounded-control"), "input uses rounded-control");
  assert.ok(select.includes("rounded-control"), "select uses rounded-control");
});

test("form controls focus on the accent ring; errors keep a distinct error ring", () => {
  for (const name of ["Input", "Select", "Textarea"]) {
    const src = read(`src/shared/components/${name}.tsx`);
    assert.ok(src.includes("focus:ring-focus/15"), `${name} focuses on the neutral ring`);
    assert.ok(src.includes("focus:ring-error/15"), `${name} keeps the error ring`);
  }
});

test("no gradient utilities anywhere in the app UI", () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "__tests__") continue;
        walk(full);
      } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
        const src = fs.readFileSync(full, "utf8");
        if (/\bbg-(gradient|linear|radial)-to-[a-z]+/.test(src)) offenders.push(full);
      }
    }
  };
  walk(new URL("src", root).pathname);
  assert.deepEqual(offenders, [], "flat surfaces only — no bg-gradient/bg-linear utilities");
});

test("DashboardLayout paints the neutral canvas and stays fluid up to ~4K", () => {
  const layout = read("src/shared/components/layouts/DashboardLayout.tsx");
  assert.ok(layout.includes('className="flex h-dvh min-h-0 w-full overflow-hidden bg-bg"'));
  assert.ok(layout.includes("max-w-[3840px] mx-auto"), "content caps at 3840px and centers");
  assert.ok(!layout.includes("max-w-7xl"), "the old 1280px cap is gone");
});

test("status colors come from one canonical module; flow surfaces use the tokens", () => {
  const mod = read("src/shared/constants/statusColors.ts");
  assert.match(mod, /export const STATUS_HEX/);
  const edges = read("src/shared/components/flow/edgeStyles.ts");
  const badge = read("src/shared/components/TokenHealthBadge.tsx");
  for (const token of ["success", "error", "warning"]) {
    assert.ok(edges.includes(`var(--orch-status-${token})`), `edgeStyles uses ${token} token`);
    assert.ok(badge.includes(`var(--orch-status-${token})`), `TokenHealthBadge uses ${token}`);
  }
  for (const token of ["success", "warning", "error", "muted"]) {
    const hits = globalsCss.match(new RegExp(`--orch-status-${token}:`, "g")) ?? [];
    assert.equal(hits.length, 2, `--orch-status-${token} is defined in light AND dark`);
  }
});

test("DataTable reads the --table-* tokens and paints an opaque surface", () => {
  const dt = read("src/shared/components/DataTable.tsx");
  for (const token of ["--table-header-bg", "--table-row-zebra", "--table-row-hover"]) {
    assert.ok(dt.includes(`var(${token})`), `DataTable uses ${token}`);
  }
  assert.ok(dt.includes("var(--color-surface)"), "scroll container is opaque");
  assert.ok(!/rgba\(|#[0-9a-fA-F]{3,6}\b/.test(dt), "DataTable hardcodes no color literal");
  for (const token of ["--table-header-bg", "--table-row-hover", "--table-cell-border"]) {
    assert.ok(lightTokens.includes(`${token}:`), `${token} defined for light`);
    assert.ok(darkTokens.includes(`${token}:`), `${token} defined for dark`);
  }
});

test("log table cards stay opaque surfaces", () => {
  for (const p of [
    "src/shared/components/ProxyLogger.tsx",
    "src/shared/components/RequestLoggerV2.tsx",
  ]) {
    const src = read(p);
    assert.ok(!src.includes("bg-black/5") && !src.includes("bg-black/20"), `${p}: no tint`);
    assert.ok(src.includes("bg-surface"), `${p} table card uses bg-surface`);
  }
});

test("cn() dedupes conflicting classes; Checkbox + Textarea primitives are exported", () => {
  const cnSrc = read("src/shared/utils/cn.ts");
  assert.match(cnSrc, /twMerge\(clsx\(/);
  const barrel = read("src/shared/components/index.tsx");
  assert.ok(barrel.includes('export { default as Checkbox } from "./Checkbox"'));
  assert.ok(barrel.includes('export { default as Textarea } from "./Textarea"'));
});
