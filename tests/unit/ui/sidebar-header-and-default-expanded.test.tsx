// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COLLAPSED_SECTIONS_STORAGE_KEY } from "@/shared/utils/sidebarExpansionState";

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
  const expandedState = () => sectionToggles().map((el) => el.getAttribute("aria-expanded"));
  const header = (title: string) =>
    sectionToggles().find((el) => el.textContent?.trim().startsWith(title)) as HTMLElement;

  it("opens every section on a first visit", async () => {
    await render();
    expect(sectionToggles().length).toBeGreaterThan(1);
    expect(expandedState().every((state) => state === "true")).toBe(true);
  });

  it("ignores the older keys, which stored the open set under the accordion", async () => {
    localStorage.setItem("sidebar-expanded-sections", JSON.stringify(["costs"]));
    localStorage.setItem("sidebar-expanded-sections-v2", JSON.stringify([]));
    await render();
    expect(expandedState().every((state) => state === "true")).toBe(true);
  });

  it("closes only the section the visitor collapses, and remembers it", async () => {
    await render();
    const costs = header("Costs");
    await act(async () => {
      costs.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(costs.getAttribute("aria-expanded")).toBe("false");
    // No accordion: every other section stays open.
    expect(expandedState().filter((state) => state === "false")).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(COLLAPSED_SECTIONS_STORAGE_KEY) || "[]")).toEqual([
      "costs",
    ]);

    await act(async () => {
      costs.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(expandedState().every((state) => state === "true")).toBe(true);
  });

  it("restores the collapsed sections on the next visit", async () => {
    localStorage.setItem(COLLAPSED_SECTIONS_STORAGE_KEY, JSON.stringify(["analytics"]));
    await render();
    expect(header("Analytics").getAttribute("aria-expanded")).toBe("false");
    expect(expandedState().filter((state) => state === "false")).toHaveLength(1);
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
