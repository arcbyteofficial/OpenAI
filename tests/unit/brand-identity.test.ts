import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Guards the "ArcByte | Open AI" branding: one BRAND constant feeds the UI lockups, page
// titles, favicons and the PWA manifest, and the brand-only i18n strings carry the new name
// in every locale. Body copy that merely mentions the old product name is out of scope.

const { BRAND, APP_CONFIG } = await import("../../src/shared/constants/appConfig.ts");
const { default: manifest } = await import("../../src/app/manifest.ts");

const root = path.resolve(import.meta.dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

test("BRAND is the single source of the product name and logo files", () => {
  assert.equal(BRAND.name, "ArcByte | Open AI");
  assert.equal(BRAND.company, "ArcByte");
  assert.equal(BRAND.product, "Open AI");
  assert.equal(BRAND.shortName, "ArcByte");
  assert.equal(BRAND.logoLight, "/logo_white.png");
  assert.equal(BRAND.logoDark, "/logo_dark.png");
  assert.equal(APP_CONFIG.name, BRAND.name);
});

test("default favicons are the theme-matched brand logos", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(
    layout,
    /\{ url: BRAND\.logoLight, type: "image\/png", media: "\(prefers-color-scheme: light\)" \}/
  );
  assert.match(
    layout,
    /\{ url: BRAND\.logoDark, type: "image\/png", media: "\(prefers-color-scheme: dark\)" \}/
  );
  assert.ok(!layout.includes("/favicon.svg"), "the old OmniRoute SVG favicon is not linked");
  // an operator's custom favicon still wins
  assert.ok(layout.includes('"/api/settings/favicon"'));

  const faviconRoute = read("src/app/api/settings/favicon/route.ts");
  assert.ok(!faviconRoute.includes("/favicon.svg"), "fallback redirects to the brand logo");
  assert.ok(faviconRoute.includes("NextResponse.redirect(BRAND.logoLight)"));
});

test("PWA manifest carries the brand in English", () => {
  const m = manifest();
  assert.equal(m.name, BRAND.name);
  assert.equal(m.short_name, BRAND.shortName);
  assert.ok(m.description?.startsWith(BRAND.name));
  assert.equal(m.lang, "en");
  assert.ok(!/[㐀-鿿]/.test(`${m.name}${m.description}`), "no leftover Chinese copy");
  for (const shot of m.screenshots ?? []) {
    assert.ok(!shot.label?.includes("OmniRoute"), "screenshot label is rebranded");
  }
});

test("brand lockups render BrandMark / BrandWordmark, not the retired OmniRoute mark", () => {
  const lockups = [
    "src/shared/components/Sidebar.tsx",
    "src/shared/components/Footer.tsx",
    "src/app/login/page.tsx",
    "src/app/landing/components/Navigation.tsx",
    "src/app/landing/components/Footer.tsx",
    "src/app/landing/components/FlowAnimation.tsx",
    "src/app/(dashboard)/home/ProviderTopology.tsx",
    "src/app/docs/layout.tsx",
  ];
  for (const file of lockups) {
    assert.ok(read(file).includes("BrandMark"), `${file} renders the brand mark`);
  }
  assert.ok(!fs.existsSync(path.join(root, "src/shared/components/OmniRouteLogo.tsx")));

  const login = read("src/app/login/page.tsx");
  assert.ok(!login.includes("OmniRoute"), "login no longer hardcodes the old name");
  assert.ok(login.includes("<BrandWordmark"), "login shows the wordmark");

  const sidebar = read("src/shared/components/Sidebar.tsx");
  assert.ok(sidebar.includes("{customAppName || <BrandWordmark />}"), "custom name still wins");
});

test("brand-only i18n strings carry the new name in every locale", () => {
  const FULL = [
    "header.homeDescription",
    "docs.layoutNavTitle",
    "docs.metadataDefaultTitle",
    "docs.metadataTitleTemplate",
    "docs.homeTitle",
    "docs.pageMetadataTitle",
    "legal.privacyMetadataTitle",
    "legal.termsMetadataTitle",
    "metadata.relayTitle",
    "metadata.trafficInspectorTitle",
    "translator.metaTitle",
    "landing.howItWorks",
  ];
  const SHORT = [
    "landing.brandName",
    "landing.howItWorksStep2Title",
    "landing.copyright",
    "apiManager.requestFlowOmniRoute",
    "agents.flowDiagramOmniRoute",
  ];
  const OLD =
    /OmniRoute|OmniRuta|オムニルート|ОмниРоут|ओम्निरूट|ओमनीरूट|ओम्नीरूट|أومنيروتي|أومني روت|ওমনি রুট|ઓમ્નીરૂટ|ઓમ્નિરાઉટ|ஒம்னி ரவுட்|ఒమ్నిరూట్|ఓమ్నిరూట్|اومنی روٹ/;

  const dir = path.join(root, "src/i18n/messages");
  const locales = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(locales.length >= 60, "all locale catalogs are checked");
  for (const file of locales) {
    const messages = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const get = (key: string) =>
      key
        .split(".")
        .reduce((node: Record<string, unknown>, part) => node?.[part] as never, messages);
    for (const key of [...FULL, ...SHORT]) {
      const value = get(key) as unknown as string;
      assert.equal(typeof value, "string", `${file} ${key} exists`);
      assert.doesNotMatch(value, OLD, `${file} ${key} has no old brand name`);
    }
    for (const key of FULL) {
      assert.ok((get(key) as unknown as string).includes(BRAND.name), `${file} ${key}`);
    }
    for (const key of SHORT) {
      assert.ok((get(key) as unknown as string).includes(BRAND.shortName), `${file} ${key}`);
    }
  }
});
