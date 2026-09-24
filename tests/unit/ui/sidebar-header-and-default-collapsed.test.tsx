// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXPANDED_SECTIONS_STORAGE_KEY } from "@/shared/utils/sidebarExpansionState";

// Skip CloudSyncStatus (it polls the cloud-sync API and needs a router).
process.env.NEXT_PUBLIC_OMNIROUTE_E2E_MODE = "1";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) => key;
    translate.has = () => false;
    return translate;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/combos",
}));

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

describe("dashboard sidebar", () => {
  let root: Root | undefined;
  let container: HTMLElement;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}))
    );
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => root!.unmount());
      root = undefined;
    }
    container.remove();
    vi.unstubAllGlobals();
  });

  async function render(props: Record<string, unknown> = {}) {
    const { default: Sidebar } = await import("@/shared/components/Sidebar");
    root = createRoot(container);
    await act(async () => {
      root!.render(<Sidebar {...props} />);
    });
  }

  const sectionToggles = () => [...container.querySelectorAll("nav [aria-expanded]")];
  const openSections = () =>
    sectionToggles().filter((el) => el.getAttribute("aria-expanded") === "true");

  it("opens no section on a first visit, not even the one holding the current page", async () => {
    await render();
    expect(sectionToggles().length).toBeGreaterThan(1);
    expect(openSections()).toEqual([]);
    // Home is a standalone item, not a dropdown; every section item stays hidden.
    const links = [...container.querySelectorAll("nav a")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/home"]);
  });

  it("ignores the unversioned key, which saved the old proxy-open default", async () => {
    localStorage.setItem("sidebar-expanded-sections", JSON.stringify(["omni-proxy"]));
    await render();
    expect(openSections()).toEqual([]);
  });

  it("still remembers a section the visitor opened", async () => {
    localStorage.setItem(EXPANDED_SECTIONS_STORAGE_KEY, JSON.stringify(["omni-proxy"]));
    await render();
    expect(openSections().length).toBeGreaterThan(0);
  });

  it("keeps the collapse toggle on the brand row, level with the logo", async () => {
    await render({ onToggleCollapse: () => {} });
    const toggle = container.querySelector('button[aria-label="collapseSidebar"]');
    const brand = container.querySelector('a[href="/home"]');
    expect(toggle).not.toBeNull();
    expect(toggle!.parentElement).toBe(brand!.parentElement);
  });

  it("keeps the expand toggle next to the logo in the collapsed rail", async () => {
    await render({ collapsed: true, onToggleCollapse: () => {} });
    const toggle = container.querySelector('button[aria-label="expandSidebar"]');
    const brand = container.querySelector('a[href="/home"]');
    expect(toggle).not.toBeNull();
    expect(toggle!.parentElement).toBe(brand!.parentElement);
  });
});
