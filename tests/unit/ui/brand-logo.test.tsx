// @vitest-environment jsdom
/**
 * BrandMark / BrandWordmark — the ArcByte lockup used by the sidebar, login, landing and docs.
 * Both logo variants must be in the markup so CSS (`dark:`) can pick one before hydration, and
 * they are background images so an unreachable CDN leaves the slot empty (no broken-image icon).
 */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { BrandMark, BrandWordmark } from "../../../src/shared/components/BrandLogo";
import { BRAND } from "../../../src/shared/constants/appConfig";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(node: React.ReactElement): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(node));
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("BrandMark", () => {
  it("paints the light and dark logos as background images, one per theme", () => {
    const el = render(<BrandMark size={28} />);
    const box = el.firstElementChild as HTMLElement;
    // No <img>: a failed load must never show a broken-image icon.
    expect(el.querySelectorAll("img")).toHaveLength(0);

    const [light, dark] = Array.from(box.children) as HTMLElement[];
    expect(light.style.backgroundImage).toBe(`url("${BRAND.logoLight}")`);
    expect(light.className).toContain("dark:hidden");
    expect(dark.style.backgroundImage).toBe(`url("${BRAND.logoDark}")`);
    expect(dark.className).toContain("hidden");
    expect(dark.className).toContain("dark:block");
    for (const variant of [light, dark]) {
      expect(variant.className).toContain("bg-contain");
      expect(variant.className).toContain("bg-no-repeat");
    }
  });

  it("sizes the box to the requested size", () => {
    const el = render(<BrandMark size={40} className="rounded-lg" />);
    const box = el.firstElementChild as HTMLElement;
    expect(box.style.width).toBe("40px");
    expect(box.style.height).toBe("40px");
    expect(box.className).toContain("rounded-lg");
  });

  it("is decorative by default and takes an accessible name when standing alone", () => {
    const decorative = render(<BrandMark />);
    const hidden = decorative.firstElementChild as HTMLElement;
    expect(hidden.getAttribute("aria-hidden")).toBe("true");
    expect(hidden.getAttribute("role")).toBeNull();
    act(() => root?.unmount());
    container?.remove();

    const named = render(<BrandMark alt={BRAND.name} />);
    const labelled = named.firstElementChild as HTMLElement;
    expect(labelled.getAttribute("role")).toBe("img");
    expect(labelled.getAttribute("aria-label")).toBe(BRAND.name);
    expect(labelled.getAttribute("aria-hidden")).toBeNull();
  });
});

describe("BrandWordmark", () => {
  it("reads 'ArcByte | Open AI' with the separator hidden from assistive tech", () => {
    const el = render(<BrandWordmark className="text-base" />);
    const mark = el.firstElementChild as HTMLElement;
    expect(mark.textContent).toBe("ArcByte | Open AI");
    expect(mark.className).toContain("text-base");

    const separator = mark.querySelector('[aria-hidden="true"]');
    expect(separator?.textContent).toBe("|");
  });
});
