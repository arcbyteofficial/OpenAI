import type { SidebarSectionId } from "@/shared/constants/sidebarVisibility";

/**
 * localStorage key for the open sidebar sections. Sections start collapsed. The key is
 * versioned because the unversioned "sidebar-expanded-sections" auto-saved the previous
 * default (the proxy section open) for every visitor, which would keep it open.
 */
export const EXPANDED_SECTIONS_STORAGE_KEY = "sidebar-expanded-sections-v2";

export function hydrateExpandedSections(
  storedExpanded: readonly SidebarSectionId[],
  pinned: ReadonlySet<SidebarSectionId>
): Set<SidebarSectionId> {
  return new Set([...storedExpanded, ...pinned]);
}

export function toggleExpandedSection(
  expanded: ReadonlySet<SidebarSectionId>,
  pinned: ReadonlySet<SidebarSectionId>,
  sectionId: SidebarSectionId
): Set<SidebarSectionId> {
  if (expanded.has(sectionId)) {
    const next = new Set(expanded);
    next.delete(sectionId);
    return next;
  }

  return new Set([...pinned, sectionId]);
}

export function expandActiveSection(
  pinned: ReadonlySet<SidebarSectionId>,
  sectionId: SidebarSectionId
): Set<SidebarSectionId> {
  return new Set([...pinned, sectionId]);
}
