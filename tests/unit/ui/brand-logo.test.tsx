// @vitest-environment jsdom
/**
 * BrandMark / BrandWordmark — the ArcByte lockup used by the sidebar, login, landing and docs.
 * Both logo variants must be in the markup so CSS (`dark:`) can pick one before hydration.
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
  it("renders the light and dark logo files, one per theme", () => {
    const el = render(<BrandMark size={28} />);
    const imgs = Array.from(el.querySelectorAll("img"));
    expect(imgs).toHaveLength(2);

    const [light, dark] = imgs;
    expect(light.getAttribute("src")).toBe(BRAND.logoLight);
    expect(light.className).toContain("dark:hidden");
    expect(dark.getAttribute("src")).toBe(BRAND.logoDark);
    expect(dark.className).toContain("hidden");
    expect(dark.className).toContain("dark:block");
  });

  it("sizes the box and both images to the requested size", () => {
    const el = render(<BrandMark size={40} className="rounded-lg" />);
    const box = el.firstElementChild as HTMLElement;
    expect(box.style.width).toBe("40px");
    expect(box.style.height).toBe("40px");
    expect(box.className).toContain("rounded-lg");
    for (const img of Array.from(el.querySelectorAll("img"))) {
      expect(img.getAttribute("width")).toBe("40");
      expect(img.getAttribute("height")).toBe("40");
    }
  });

  it("is decorative by default and takes an accessible name when standing alone", () => {
    const decorative = render(<BrandMark />);
    for (const img of Array.from(decorative.querySelectorAll("img"))) {
      expect(img.getAttribute("alt")).toBe("");
    }
    act(() => root?.unmount());
    container?.remove();

    const named = render(<BrandMark alt={BRAND.name} />);
    for (const img of Array.from(named.querySelectorAll("img"))) {
      expect(img.getAttribute("alt")).toBe(BRAND.name);
    }
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
