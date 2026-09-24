import test from "node:test";
import assert from "node:assert/strict";

// The neutral redesign made "blue" the default accent and moved its value into
// globals.css as a theme-aware pair (#0070f3 light / #3291ff dark). The store must
// therefore NOT pin an inline --color-primary for the default, and a persisted v0
// "coral" (the old store default) must migrate to the new default.

const { COLOR_THEMES, DEFAULT_COLOR_THEME, migrateThemeState, resolveColorThemeOverride } =
  await import("../../src/store/themeStore.ts");

test("default accent is blue and uses the theme-aware CSS value (no inline override)", () => {
  assert.equal(DEFAULT_COLOR_THEME, "blue");
  assert.equal(COLOR_THEMES.blue, "#0070f3");
  assert.equal(resolveColorThemeOverride("blue", "#123456"), null);
});

test("unknown or prototype-key color themes fall back to the CSS default", () => {
  assert.equal(resolveColorThemeOverride("does-not-exist", "#123456"), null);
  assert.equal(resolveColorThemeOverride("toString", "#123456"), null);
});

test("preset and custom accents still produce an inline override with a hover shade", () => {
  const coral = resolveColorThemeOverride("coral", "#000000");
  assert.equal(coral?.primary, "#e54d5e");
  assert.match(coral?.hover ?? "", /^#[0-9a-f]{6}$/);
  assert.notEqual(coral?.hover, coral?.primary);
  const custom = resolveColorThemeOverride("custom", "22c55e");
  assert.equal(custom?.primary, "#22c55e");
  assert.match(custom?.hover ?? "", /^#[0-9a-f]{6}$/);
  // invalid custom input is normalized to the documented fallback
  assert.equal(resolveColorThemeOverride("custom", "not-a-color")?.primary, "#3b82f6");
});

test("v0 persisted 'coral' (old default) migrates to the new default accent", () => {
  const migrated = migrateThemeState(
    { theme: "dark", colorTheme: "coral", customColor: "#abcdef" },
    0
  );
  assert.equal(migrated.colorTheme, "blue");
  assert.equal(migrated.theme, "dark", "light/dark choice is preserved");
  assert.equal(migrated.customColor, "#abcdef", "custom color is preserved");
});

test("migration keeps explicit non-default choices and never re-migrates v1 state", () => {
  assert.equal(migrateThemeState({ colorTheme: "violet" }, 0).colorTheme, "violet");
  assert.equal(migrateThemeState({ colorTheme: "custom" }, 0).colorTheme, "custom");
  // a user who deliberately picks coral after the redesign keeps it
  assert.equal(migrateThemeState({ colorTheme: "coral" }, 1).colorTheme, "coral");
  assert.equal(migrateThemeState(null, 0), null);
});
