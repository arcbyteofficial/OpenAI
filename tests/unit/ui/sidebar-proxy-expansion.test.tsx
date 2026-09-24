import { describe, expect, it } from "vitest";

import {
  HIDEABLE_SIDEBAR_ITEM_IDS,
  SIDEBAR_SECTIONS,
  getSectionItems,
  normalizeHiddenSidebarItems,
  type SidebarSectionId,
} from "../../../src/shared/constants/sidebarVisibility";
import {
  collapsedSections,
  expandActiveSection,
  hydrateExpandedSections,
  toggleExpandedSection,
} from "../../../src/shared/utils/sidebarExpansionState";

const ALL: SidebarSectionId[] = ["omni-proxy", "analytics", "configuration", "monitoring"];

describe("sidebar proxy expansion", () => {
  it("proxy navigation is always present and cannot be hidden by legacy settings", () => {
    const omniProxy = SIDEBAR_SECTIONS.find((section) => section.id === "omni-proxy");
    expect(omniProxy).toBeDefined();
    expect(getSectionItems(omniProxy!).some((item) => item.id === "proxy")).toBe(true);
    expect((HIDEABLE_SIDEBAR_ITEM_IDS as readonly string[]).includes("proxy")).toBe(false);
    expect(normalizeHiddenSidebarItems(["proxy", "logs"])).toEqual(["logs"]);
  });

  it("toggling a section leaves every other section as it was", () => {
    const expanded = new Set<SidebarSectionId>(["omni-proxy", "analytics"]);
    expect([...toggleExpandedSection(expanded, "configuration")]).toEqual([
      "omni-proxy",
      "analytics",
      "configuration",
    ]);
    expect([...toggleExpandedSection(expanded, "analytics")]).toEqual(["omni-proxy"]);
  });

  it("hydration opens every section when nothing is stored", () => {
    expect([...hydrateExpandedSections(ALL, [], new Set())]).toEqual(ALL);
  });

  it("hydration keeps the sections the visitor collapsed closed", () => {
    const expanded = hydrateExpandedSections(ALL, ["analytics", "monitoring"], new Set());
    expect([...expanded]).toEqual(["omni-proxy", "configuration"]);
  });

  it("hydration keeps pinned sections open even when stored as collapsed", () => {
    const expanded = hydrateExpandedSections(ALL, ALL, new Set<SidebarSectionId>(["monitoring"]));
    expect([...expanded]).toEqual(["monitoring"]);
  });

  it("route changes open the destination section without closing the others", () => {
    const expanded = new Set<SidebarSectionId>(["configuration"]);
    expect([...expandActiveSection(expanded, "monitoring")]).toEqual([
      "configuration",
      "monitoring",
    ]);
  });

  it("persists the collapsed sections, so sections added later start open", () => {
    const expanded = new Set<SidebarSectionId>(["omni-proxy", "configuration"]);
    expect(collapsedSections(ALL, expanded)).toEqual(["analytics", "monitoring"]);
  });
});
