"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { getActiveSidebarHref } from "@/shared/utils/sidebarRouteMatch";
import { filterSidebarSectionsByQuery } from "@/shared/utils/sidebarSearch";
import {
  COLLAPSED_SECTIONS_STORAGE_KEY,
  collapsedSections,
  expandActiveSection,
  hydrateExpandedSections,
  toggleExpandedSection,
} from "@/shared/utils/sidebarExpansionState";
import { APP_CONFIG } from "@/shared/constants/appConfig";
import { BrandMark, BrandWordmark } from "./BrandLogo";
import Button from "./Button";
import Input from "./Input";
import { ConfirmModal } from "./Modal";
import CloudSyncStatus from "./CloudSyncStatus";
import { useTranslations } from "next-intl";
import {
  HIDDEN_SIDEBAR_GROUP_LABELS_SETTING_KEY,
  normalizeHiddenSidebarGroupLabels,
} from "@/shared/constants/sidebarGroupVisibility";
import {
  HIDDEN_SIDEBAR_ITEMS_SETTING_KEY,
  SIDEBAR_SETTINGS_UPDATED_EVENT,
  SIDEBAR_SECTION_ORDER_KEY,
  SIDEBAR_ITEM_ORDER_KEY,
  SIDEBAR_SECTIONS,
  normalizeHiddenSidebarItems,
  applySectionOrder,
  applyItemOrder,
  isSidebarItemVisibleForFlags,
  resolveRuntimeSidebarSections,
  type SidebarSectionId,
  type SidebarItemDefinition,
  type SidebarItemGroup,
  type SidebarItemOrder,
} from "@/shared/constants/sidebarVisibility";

const isE2EMode = process.env.NEXT_PUBLIC_OMNIROUTE_E2E_MODE === "1";
const COLLAPSED_SECTIONS_KEY = COLLAPSED_SECTIONS_STORAGE_KEY;
const PINNED_SECTIONS_KEY = "sidebar-pinned-sections";
const PINNED_ITEMS_KEY = "sidebar-pinned-items";
const ALL_SECTION_IDS = SIDEBAR_SECTIONS.map((section) => section.id as SidebarSectionId);

type SidebarProps = {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMacElectron?: boolean;
};

type HoveredItem = { id: string; label: string; x: number; y: number } | null;

function parseStoredArray<T>(raw: string | null, fallback: T): T {
  try {
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T;
    }
  } catch {}
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// useSyncExternalStore plumbing for the one-shot localStorage hydration reads:
// nothing to subscribe to (the values are only read once, before
// sidebarExpansionLoaded flips), and the server snapshot is always null so the
// SSR/hydration render matches the server output.
const noopSubscribe = () => () => {};
const getServerSnapshotNull = () => null;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;
function readStoredCollapsedRaw() {
  try {
    return localStorage.getItem(COLLAPSED_SECTIONS_KEY);
  } catch {
    return null;
  }
}
function readStoredPinnedRaw() {
  try {
    return localStorage.getItem(PINNED_SECTIONS_KEY);
  } catch {
    return null;
  }
}
function readStoredPinnedItemsRaw() {
  try {
    return localStorage.getItem(PINNED_ITEMS_KEY);
  } catch {
    return null;
  }
}

export default function Sidebar({
  onClose,
  collapsed = false,
  onToggleCollapse,
  isMacElectron = false,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const tc = useTranslations("common");
  const sidebarRef = useRef<HTMLElement>(null);
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hiddenSidebarItems, setHiddenSidebarItems] = useState<string[]>([]);
  const [hiddenSidebarGroupLabels, setHiddenSidebarGroupLabels] = useState<string[]>([]);
  // Feature-flag map for flag-gated items (e.g. "radar" -> RADAR_ENABLED).
  // Fails open (see isSidebarItemVisibleForFlags) so a missing key never
  // hides an unrelated item — only set once /api/settings resolves.
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [radarAdminUrl, setRadarAdminUrl] = useState<unknown>(null);
  const [sidebarSectionOrder, setSidebarSectionOrder] = useState<SidebarSectionId[]>([]);
  const [sidebarItemOrder, setSidebarItemOrder] = useState<SidebarItemOrder>({});
  const [customAppName, setCustomAppName] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  // Every section starts expanded; only the visitor collapses one (see sidebarExpansionState).
  const [expandedSections, setExpandedSections] = useState<Set<SidebarSectionId>>(
    () => new Set(ALL_SECTION_IDS)
  );
  const [pinnedSections, setPinnedSections] = useState<Set<SidebarSectionId>>(new Set());
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(new Set());
  const [pinnedSectionCollapsed, setPinnedSectionCollapsed] = useState(false);
  const [sidebarExpansionLoaded, setSidebarExpansionLoaded] = useState(false);
  const [skipInitialActiveExpansion, setSkipInitialActiveExpansion] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<HoveredItem>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load persisted state once the client has hydrated. The stored list holds the sections the
  // visitor collapsed; everything else is open. localStorage is read through
  // useSyncExternalStore snapshots (server snapshot: null) and the states are
  // adjusted during render (react.dev "You Might Not Need an Effect") so the
  // stored expansion applies before paint without a synchronous effect setState.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const storedCollapsedRaw = useSyncExternalStore(
    noopSubscribe,
    readStoredCollapsedRaw,
    getServerSnapshotNull
  );
  const storedPinnedRaw = useSyncExternalStore(
    noopSubscribe,
    readStoredPinnedRaw,
    getServerSnapshotNull
  );
  const storedPinnedItemsRaw = useSyncExternalStore(
    noopSubscribe,
    readStoredPinnedItemsRaw,
    getServerSnapshotNull
  );
  if (hydrated && !sidebarExpansionLoaded) {
    const storedCollapsed = parseStoredArray<SidebarSectionId[]>(storedCollapsedRaw, []);
    const storedPinned: SidebarSectionId[] =
      storedPinnedRaw !== null
        ? parseStoredArray<SidebarSectionId[]>(storedPinnedRaw, [])
        : (SIDEBAR_SECTIONS.filter((s) => s.defaultPinned).map((s) => s.id) as SidebarSectionId[]);
    const storedPinnedItems = parseStoredArray<string[]>(storedPinnedItemsRaw, []);

    const initialPinned = new Set<SidebarSectionId>(storedPinned);
    const initialExpanded = hydrateExpandedSections(
      ALL_SECTION_IDS,
      storedCollapsed,
      initialPinned
    );

    // On load, a section the visitor collapsed stays collapsed even if it holds the current
    // page; later navigation opens the destination's section.
    setSkipInitialActiveExpansion(true);
    setExpandedSections(initialExpanded);
    setPinnedSections(initialPinned);
    setPinnedItems(new Set(storedPinnedItems));
    setSidebarExpansionLoaded(true);
  }

  useEffect(() => {
    const applySettings = (data) => {
      setShowDebug(data?.debugMode === true);
      setHiddenSidebarItems(normalizeHiddenSidebarItems(data?.[HIDDEN_SIDEBAR_ITEMS_SETTING_KEY]));
      setHiddenSidebarGroupLabels(
        normalizeHiddenSidebarGroupLabels(data?.[HIDDEN_SIDEBAR_GROUP_LABELS_SETTING_KEY])
      );
      setCustomAppName(data?.instanceName || null);
      setCustomLogo(data?.customLogoBase64 || data?.customLogoUrl || null);
      if (typeof data?.radarEnabled === "boolean") {
        setFeatureFlags((prev) => ({ ...prev, RADAR_ENABLED: data.radarEnabled }));
      }
      setRadarAdminUrl(data?.radarAdminUrl ?? null);
    };

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        applySettings(data);
        if (Array.isArray(data?.[SIDEBAR_SECTION_ORDER_KEY])) {
          setSidebarSectionOrder(data[SIDEBAR_SECTION_ORDER_KEY] as SidebarSectionId[]);
        }
        if (data?.[SIDEBAR_ITEM_ORDER_KEY] && typeof data[SIDEBAR_ITEM_ORDER_KEY] === "object") {
          setSidebarItemOrder(data[SIDEBAR_ITEM_ORDER_KEY] as SidebarItemOrder);
        }
      })
      .catch(() => {});

    const handleSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
      if ("debugMode" in detail) setShowDebug(detail.debugMode === true);
      if (HIDDEN_SIDEBAR_ITEMS_SETTING_KEY in detail) {
        setHiddenSidebarItems(
          normalizeHiddenSidebarItems(detail[HIDDEN_SIDEBAR_ITEMS_SETTING_KEY])
        );
      }
      if (HIDDEN_SIDEBAR_GROUP_LABELS_SETTING_KEY in detail) {
        setHiddenSidebarGroupLabels(
          normalizeHiddenSidebarGroupLabels(detail[HIDDEN_SIDEBAR_GROUP_LABELS_SETTING_KEY])
        );
      }
      if (SIDEBAR_SECTION_ORDER_KEY in detail && Array.isArray(detail[SIDEBAR_SECTION_ORDER_KEY])) {
        setSidebarSectionOrder(detail[SIDEBAR_SECTION_ORDER_KEY] as SidebarSectionId[]);
      }
      if (
        SIDEBAR_ITEM_ORDER_KEY in detail &&
        detail[SIDEBAR_ITEM_ORDER_KEY] &&
        typeof detail[SIDEBAR_ITEM_ORDER_KEY] === "object"
      ) {
        setSidebarItemOrder(detail[SIDEBAR_ITEM_ORDER_KEY] as SidebarItemOrder);
      }
      if ("instanceName" in detail) setCustomAppName((detail.instanceName as string) || null);
      if ("customLogoBase64" in detail) {
        setCustomLogo((detail.customLogoBase64 as string) || null);
      } else if ("customLogoUrl" in detail) {
        setCustomLogo((detail.customLogoUrl as string) || null);
      }
    };

    window.addEventListener(SIDEBAR_SETTINGS_UPDATED_EVENT, handleSettingsUpdated as EventListener);
    return () =>
      window.removeEventListener(
        SIDEBAR_SETTINGS_UPDATED_EVENT,
        handleSettingsUpdated as EventListener
      );
  }, []);

  const getSidebarLabel = (key: string, fallback: string) =>
    typeof t.has === "function" && t.has(key) ? t(key) : fallback;

  const resolveItem = (item: SidebarItemDefinition, hidden: Set<string>) => {
    if (hidden.has(item.id)) return null;
    if (!isSidebarItemVisibleForFlags(item, featureFlags)) return null;
    const subtitle = item.subtitleKey
      ? getSidebarLabel(item.subtitleKey, item.subtitleFallback ?? "")
      : item.subtitleFallback;
    return {
      ...item,
      label: getSidebarLabel(item.i18nKey, item.labelFallback ?? item.id),
      subtitle: subtitle || undefined,
    };
  };

  const hiddenSidebarSet = new Set(hiddenSidebarItems);
  const hiddenSidebarGroupLabelsSet = new Set(hiddenSidebarGroupLabels);

  const runtimeSections = resolveRuntimeSidebarSections(SIDEBAR_SECTIONS, { radarAdminUrl });
  const orderedSections = applySectionOrder(
    runtimeSections.filter((section) => section.visibility !== "debug" || showDebug),
    sidebarSectionOrder
  );

  const visibleSections = orderedSections
    .map((section) => {
      const orderedChildren = applyItemOrder(
        section.children,
        sidebarItemOrder[section.id as SidebarSectionId] ?? []
      );

      const children = orderedChildren
        .map((child) => {
          if ("type" in child && child.type === "group") {
            const items = child.items
              .map((item) => resolveItem(item, hiddenSidebarSet))
              .filter(Boolean) as (SidebarItemDefinition & { label: string })[];
            if (items.length === 0) return null;
            // Smart-grouping: single visible item → inline flat (no group header)
            if (items.length === 1) return items[0];
            return {
              ...child,
              title: getSidebarLabel(child.titleKey, child.titleFallback),
              separatorHidden: hiddenSidebarGroupLabelsSet.has(child.id),
              items,
            } as SidebarItemGroup & {
              title: string;
              separatorHidden: boolean;
              items: (SidebarItemDefinition & { label: string })[];
            };
          }
          return resolveItem(child as SidebarItemDefinition, hiddenSidebarSet);
        })
        .filter(Boolean);

      return {
        ...section,
        title: getSidebarLabel(section.titleKey, section.titleFallback),
        children,
      };
    })
    .filter((section) => {
      const allItems = section.children.flatMap((child: any) =>
        child.type === "group" ? child.items : [child]
      );
      return allItems.length > 0;
    });

  const allVisibleItems = visibleSections.flatMap((section) =>
    section.children.flatMap((child: any) => (child.type === "group" ? child.items : [child]))
  );

  const pinnedItemList = Array.from(pinnedItems)
    .map((id) => allVisibleItems.find((item) => item.id === id))
    .filter(Boolean) as (SidebarItemDefinition & { label: string; subtitle?: string })[];

  const homeIndex = visibleSections.findIndex((s) => s.id === "home");
  const insertIndex = homeIndex >= 0 ? homeIndex + 1 : 0;
  // Same element type as visibleSections so the union keeps `showTitle` and the
  // other resolved-section fields the renderer reads below.
  const pinnedSection: (typeof visibleSections)[number] = {
    id: "pinned" as SidebarSectionId,
    titleKey: "pinnedSection",
    titleFallback: "Pinned",
    title: getSidebarLabel("pinnedSection", "Pinned"),
    children: pinnedItemList,
  };
  const sectionsWithPinned =
    pinnedItemList.length > 0
      ? [
          ...visibleSections.slice(0, insertIndex),
          pinnedSection,
          ...visibleSections.slice(insertIndex),
        ]
      : visibleSections;

  const activeHref = getActiveSidebarHref(pathname, allVisibleItems);

  const isSearching = searchQuery.trim().length > 0;
  const displaySections = isSearching
    ? filterSidebarSectionsByQuery(sectionsWithPinned, searchQuery)
    : sectionsWithPinned;

  // Keep the active page visible after navigation: open its section, never close another.
  // Render-time adjustment (react.dev "You Might Not Need
  // an Effect"): the composite key mirrors the old effect's
  // [activeHref, collapsed, pinnedSections, sidebarExpansionLoaded] deps.
  const activeExpansionKey = `${collapsed}|${sidebarExpansionLoaded}|${activeHref ?? ""}|${[
    ...pinnedSections,
  ]
    .sort()
    .join(",")}`;
  const [prevActiveExpansionKey, setPrevActiveExpansionKey] = useState<string | null>(null);
  if (activeExpansionKey !== prevActiveExpansionKey) {
    setPrevActiveExpansionKey(activeExpansionKey);
    if (!collapsed && sidebarExpansionLoaded) {
      if (skipInitialActiveExpansion) {
        setSkipInitialActiveExpansion(false);
      } else {
        for (const section of visibleSections) {
          const sectionItems = section.children.flatMap((child: any) =>
            child.type === "group" ? child.items : [child]
          );
          if (sectionItems.some((item: any) => !item.external && item.href === activeHref)) {
            setExpandedSections((prev) =>
              prev.has(section.id as SidebarSectionId)
                ? prev
                : expandActiveSection(prev, section.id as SidebarSectionId)
            );
            break;
          }
        }
      }
    }
  }

  // Persist the collapsed sections whenever the expansion changes after hydration —
  // single writer replacing the saveToStorage calls that used to run inside
  // setState updaters (side effects belong outside updaters).
  useEffect(() => {
    if (!sidebarExpansionLoaded) return;
    saveToStorage(COLLAPSED_SECTIONS_KEY, collapsedSections(ALL_SECTION_IDS, expandedSections));
  }, [expandedSections, sidebarExpansionLoaded]);

  // Toggle one section; the others keep their state.
  const toggleSection = useCallback((sectionId: SidebarSectionId) => {
    if (sectionId === "pinned") {
      setPinnedSectionCollapsed((prev) => !prev);
      return;
    }
    setExpandedSections((prev) => toggleExpandedSection(prev, sectionId));
  }, []);

  const togglePin = useCallback((sectionId: SidebarSectionId) => {
    setPinnedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
        // Ensure the section is expanded when pinned
        setExpandedSections((prevExp) => {
          if (prevExp.has(sectionId)) return prevExp;
          const nextExp = new Set(prevExp);
          nextExp.add(sectionId);
          return nextExp;
        });
      }
      saveToStorage(PINNED_SECTIONS_KEY, [...next]);
      return next;
    });
  }, []);

  const togglePinItem = useCallback((itemId: string) => {
    setPinnedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      saveToStorage(PINNED_ITEMS_KEY, [...next]);
      return next;
    });
  }, []);

  const handleShutdown = async () => {
    setIsShuttingDown(true);
    try {
      await fetch("/api/shutdown", { method: "POST" });
    } catch (e) {
      // Expected to fail as server shuts down
    }
    setIsShuttingDown(false);
    setShowShutdownModal(false);
    setIsDisconnected(true);
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await fetch("/api/restart", { method: "POST" });
    } catch (e) {
      // Expected to fail as server restarts
    }
    setIsRestarting(false);
    setShowRestartModal(false);
    setIsDisconnected(true);
    setTimeout(() => globalThis.location.reload(), 3000);
  };

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, id: string, label: string) => {
      if (!collapsed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const sidebarRect = sidebarRef.current?.getBoundingClientRect();
      setHoveredItem({
        id,
        label,
        x: (sidebarRect?.right ?? 64) + 8,
        y: rect.top + rect.height / 2,
      });
    },
    [collapsed]
  );

  const handleMouseLeave = useCallback(() => setHoveredItem(null), []);

  const renderNavLink = (item: any, keyPrefix?: string) => {
    const active = !item.external && activeHref === item.href;
    const isItemPinned = pinnedItems.has(item.id);
    const itemKey = keyPrefix ? `${keyPrefix}-${item.href}` : item.href;
    const className = cn(
      "flex items-center gap-2 rounded-md transition-colors group",
      collapsed ? "justify-center px-2 h-9" : "px-2 min-h-8 py-1",
      active
        ? "bg-text-main/[0.07] text-text-main"
        : "text-text-muted hover:bg-text-main/[0.04] hover:text-text-main"
    );
    const iconClassName = cn(
      "material-symbols-outlined text-[18px] shrink-0",
      active ? "fill-1" : "transition-colors"
    );
    const content = (
      <>
        <span className={iconClassName}>{item.icon}</span>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium">{item.label}</span>
            {item.subtitle && (
              <span className="truncate text-[11px] text-text-subtle">{item.subtitle}</span>
            )}
          </div>
        )}
      </>
    );
    const sharedProps = {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => handleMouseEnter(e, item.id, item.label),
      onMouseLeave: handleMouseLeave,
    };

    if (collapsed) {
      if (item.external) {
        return (
          <a
            key={itemKey}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={className}
            {...sharedProps}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          key={itemKey}
          href={item.href}
          prefetch={false}
          onClick={onClose}
          className={className}
          {...sharedProps}
        >
          {content}
        </Link>
      );
    }

    const pinButton = item.id !== "home" && (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          togglePinItem(item.id);
        }}
        title={isItemPinned ? t("unpinItem") : t("pinItem")}
        aria-label={isItemPinned ? t("unpinItem") : t("pinItem")}
        className={cn(
          "mr-1 p-0.5 rounded transition-[color,opacity] shrink-0",
          isItemPinned
            ? "text-text-muted opacity-100 hover:text-text-main"
            : "text-text-subtle opacity-0 group-hover/nav-item:opacity-100 hover:text-text-main"
        )}
      >
        <span
          className="material-symbols-outlined text-[13px]"
          style={{
            fontSize: "13px",
            ...(isItemPinned ? { fontVariationSettings: "'FILL' 1" } : {}),
          }}
        >
          push_pin
        </span>
      </button>
    );

    const containerClassName = cn(
      "group/nav-item flex items-center rounded-md transition-colors",
      active
        ? "bg-text-main/[0.07] text-text-main"
        : "text-text-muted hover:bg-text-main/[0.04] hover:text-text-main"
    );
    const innerLinkClassName = "flex min-w-0 flex-1 items-center gap-2 px-2 min-h-8 py-1";

    if (item.external) {
      return (
        <div key={itemKey} className={containerClassName}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={innerLinkClassName}
            {...sharedProps}
          >
            {content}
          </a>
          {pinButton}
        </div>
      );
    }

    return (
      <div key={itemKey} className={containerClassName}>
        <Link
          href={item.href}
          prefetch={false}
          onClick={onClose}
          className={innerLinkClassName}
          {...sharedProps}
        >
          {content}
        </Link>
        {pinButton}
      </div>
    );
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "flex h-full min-h-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out",
          collapsed ? "w-16" : "w-[220px]"
        )}
        style={{ paddingTop: isMacElectron ? "var(--desktop-safe-top)" : undefined }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-contrast focus:text-contrast-fg focus:rounded-control focus:m-2"
        >
          {t("skipToContent")}
        </a>

        {/* Brand row: the collapse toggle sits at the row's end, level with the logo; in the
            collapsed rail it stacks under the logo. */}
        <div
          className={cn(
            "flex items-center pb-2",
            isMacElectron ? "pt-3" : "pt-2",
            collapsed ? "flex-col gap-1 px-2" : "gap-1 px-3"
          )}
        >
          <Link
            href="/home"
            prefetch={false}
            className={cn(
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "flex-1 gap-2.5 ps-2"
            )}
          >
            {customLogo ? (
              <div className="flex items-center justify-center size-7 rounded-md bg-contrast shrink-0">
                <img
                  src={customLogo}
                  alt={customAppName || APP_CONFIG.name}
                  className="size-5 object-contain"
                />
              </div>
            ) : (
              <BrandMark size={28} className="rounded-md" />
            )}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-[13px] font-semibold tracking-tight text-text-main truncate">
                  {customAppName || <BrandWordmark />}
                </h1>
                <span className="text-[11px] text-text-subtle">v{APP_CONFIG.version}</span>
              </div>
            )}
          </Link>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
              className="shrink-0 rounded-md p-1 text-text-subtle transition-colors hover:bg-text-main/[0.04] hover:text-text-main"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                {collapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="px-3 pb-2">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tc("search")}
              aria-label={tc("search")}
              icon="search"
              className="gap-0"
              inputClassName="h-8 py-0 text-[13px] sm:text-[13px] bg-surface border-border"
            />
          </div>
        )}

        <nav
          aria-label={t("mainNavigation")}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto py-1 custom-scrollbar",
            collapsed ? "px-2 space-y-0.5" : "px-3"
          )}
        >
          {isSearching && displaySections.length === 0 && (
            <p className="px-2 py-3 text-[13px] text-text-subtle">{tc("noResults")}</p>
          )}
          {displaySections.map((section, idx) => {
            const sectionId = section.id as SidebarSectionId;
            const isExpanded =
              isSearching ||
              (sectionId === "pinned" ? !pinnedSectionCollapsed : expandedSections.has(sectionId));
            const isPinned = pinnedSections.has(sectionId);
            const isFirst = idx === 0;
            const sectionItems = section.children.flatMap((child: any) =>
              child.type === "group" ? child.items : [child]
            );

            // Collapsed (mini) mode: flat items with dividers between sections
            if (collapsed) {
              return (
                <div key={section.id}>
                  {!isFirst && <div className="border-t border-border my-1.5" />}
                  {sectionItems.map((item: any) =>
                    renderNavLink(item, section.id === "pinned" ? "pinned" : undefined)
                  )}
                </div>
              );
            }

            // Sections without a visible title (e.g. Home) render items directly
            if (section.showTitle === false) {
              return (
                <div key={section.id} className={cn("space-y-0.5", !isFirst && "mt-1")}>
                  {sectionItems.map((item: any) =>
                    renderNavLink(item, section.id === "pinned" ? "pinned" : undefined)
                  )}
                </div>
              );
            }

            // Expanded mode: collapsible section with pin
            return (
              <div key={section.id} className={isFirst ? "space-y-0.5" : "mt-2"}>
                <div
                  className="flex items-center gap-0.5 px-2 h-7 rounded-md hover:bg-text-main/[0.04] transition-colors cursor-pointer group/header"
                  onClick={() => toggleSection(sectionId)}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <span className="flex-1 text-[11px] font-medium text-text-subtle tracking-normal group-hover/header:text-text-muted transition-colors">
                    {section.title}
                  </span>

                  {/* Pin button — right side near chevron (only for standard sections) */}
                  {sectionId !== "pinned" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(sectionId);
                      }}
                      title={isPinned ? t("unpinSection") : t("pinSectionOpen")}
                      className={cn(
                        "p-0.5 rounded transition-[color,opacity] shrink-0",
                        isPinned
                          ? "text-text-muted opacity-100"
                          : "text-text-subtle opacity-0 group-hover/header:opacity-100 hover:text-text-main"
                      )}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "12px",
                          ...(isPinned ? { fontVariationSettings: "'FILL' 1" } : {}),
                        }}
                      >
                        push_pin
                      </span>
                    </button>
                  )}

                  <span
                    className={cn(
                      "material-symbols-outlined text-[14px] text-text-subtle transition-[color,transform] duration-200 group-hover/header:text-text-muted shrink-0",
                      isExpanded && "rotate-180"
                    )}
                  >
                    expand_more
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {section.children.map((child: any) => {
                      if (child.type === "group") {
                        if (child.items.length === 0) return null;
                        const separatorHidden = child.separatorHidden === true;
                        return (
                          <div key={child.id} className={separatorHidden ? "mt-0.5" : "mt-2"}>
                            {!separatorHidden && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 mb-0.5">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-[10px] font-medium text-text-subtle">
                                  {child.title}
                                </span>
                              </div>
                            )}
                            {child.items.map((item: any) =>
                              renderNavLink(item, section.id === "pinned" ? "pinned" : undefined)
                            )}
                          </div>
                        );
                      }
                      return renderNavLink(child, section.id === "pinned" ? "pinned" : undefined);
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!isE2EMode && <CloudSyncStatus collapsed={collapsed} />}

        <div
          className={cn(
            "shrink-0 border-t border-border",
            collapsed ? "p-2 flex flex-col gap-1" : "p-2 flex gap-2"
          )}
          style={{
            paddingBottom: isMacElectron ? "calc(0.5rem + var(--desktop-safe-bottom))" : undefined,
          }}
        >
          <button
            onClick={() => setShowRestartModal(true)}
            title={t("restart")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-control font-medium transition-colors",
              "text-text-muted border border-border hover:text-warning hover:bg-warning/10 hover:border-warning/30",
              collapsed ? "p-2" : "flex-1 min-w-0 px-2 py-1.5 text-xs"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            {!collapsed && <span className="truncate">{t("restart")}</span>}
          </button>
          <button
            onClick={() => setShowShutdownModal(true)}
            title={t("shutdown")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-control font-medium transition-colors",
              "text-text-muted border border-border hover:text-error hover:bg-error/10 hover:border-error/30",
              collapsed ? "p-2" : "flex-1 min-w-0 px-2 py-1.5 text-xs"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
            {!collapsed && <span className="truncate">{t("shutdown")}</span>}
          </button>
        </div>
      </aside>

      {/* Styled tooltip for collapsed (mini) sidebar */}
      {collapsed && hoveredItem && (
        <div
          className="fixed z-[200] pointer-events-none flex items-center"
          style={{ left: hoveredItem.x, top: hoveredItem.y, transform: "translateY(-50%)" }}
        >
          <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-r-[6px] border-t-transparent border-b-transparent border-r-contrast" />
          <div className="px-2 py-1 bg-contrast text-contrast-fg text-xs font-medium rounded-md shadow-[var(--shadow-elevated)] whitespace-nowrap">
            {hoveredItem.label}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showShutdownModal}
        onClose={() => setShowShutdownModal(false)}
        onConfirm={handleShutdown}
        title={t("shutdown")}
        message={t("shutdownConfirm")}
        confirmText={t("shutdown")}
        cancelText={tc("cancel")}
        variant="danger"
        loading={isShuttingDown}
      />

      <ConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={handleRestart}
        title={t("restart")}
        message={t("restartConfirm")}
        confirmText={t("restart")}
        cancelText={tc("cancel")}
        variant="warning"
        loading={isRestarting}
      />

      {isDisconnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-8">
            <div className="flex items-center justify-center size-16 rounded-full bg-error/15 text-error mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">power_off</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{t("serverDisconnected")}</h2>
            <p className="text-text-muted mb-6">{t("serverDisconnectedMsg")}</p>
            <Button variant="secondary" onClick={() => globalThis.location.reload()}>
              {t("reloadPage")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
