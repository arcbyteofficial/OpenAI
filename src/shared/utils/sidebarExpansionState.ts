import type { SidebarSectionId } from "@/shared/constants/sidebarVisibility";

/**
 * localStorage key for the sidebar sections the visitor collapsed. Every section starts
 * expanded, so storing the collapsed ones (not the open ones) keeps a section added in a
 * later release open by default. It replaces "sidebar-expanded-sections" and its "-v2",
 * which stored the open set under the old accordion / collapsed-by-default behaviour.
 */
export const COLLAPSED_SECTIONS_STORAGE_KEY = "sidebar-collapsed-sections";

/** Every section open except the ones the visitor collapsed; pinned sections always open. */
export function hydrateExpandedSections(
  allSections: readonly SidebarSectionId[],
  storedCollapsed: readonly SidebarSectionId[],
  pinned: ReadonlySet<SidebarSectionId>
): Set<SidebarSectionId> {
  const collapsed = new Set(storedCollapsed);
  return new Set([...allSections.filter((id) => !collapsed.has(id)), ...pinned]);
}

/** Flip one section; every other section keeps its state (no accordion). */
export function toggleExpandedSection(
  expanded: ReadonlySet<SidebarSectionId>,
  sectionId: SidebarSectionId
): Set<SidebarSectionId> {
  const next = new Set(expanded);
  if (next.has(sectionId)) next.delete(sectionId);
  else next.add(sectionId);
  return next;
}

/** Open the section holding the page just navigated to, leaving the others as they are. */
export function expandActiveSection(
  expanded: ReadonlySet<SidebarSectionId>,
  sectionId: SidebarSectionId
): Set<SidebarSectionId> {
  return new Set([...expanded, sectionId]);
}

/** The sections to persist: the ones currently collapsed. */
export function collapsedSections(
  allSections: readonly SidebarSectionId[],
  expanded: ReadonlySet<SidebarSectionId>
): SidebarSectionId[] {
  return allSections.filter((id) => !expanded.has(id));
}
