"use client";

import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryCardsProps {
  memoryEntries?: number;
  dbEntries?: number;
  hits?: number;
  misses?: number;
  hitRate?: string;
  tokensSaved?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// ─── Internal StatCard ────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  valueClass = "text-text-main",
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-card bg-surface border border-border">
      <div className="flex items-center gap-1.5 text-text-muted text-[13px]">
        <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">
          {icon}
        </span>
        {label}
      </div>
      <div className={`text-2xl font-semibold tracking-tight tabular-nums ${valueClass}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton"
      className="h-24 rounded-card bg-bg-subtle border border-border animate-pulse"
    />
  );
}

// ─── MemoryCards ──────────────────────────────────────────────────────────────

export default function MemoryCards({
  memoryEntries = 0,
  dbEntries = 0,
  hits = 0,
  misses: _misses = 0,
  hitRate,
  tokensSaved = 0,
  loading = false,
  error = null,
  onRetry,
}: MemoryCardsProps) {
  const t = useTranslations("cache");

  if (loading) {
    return (
      <div
        data-testid="memory-cards"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 transition-opacity duration-200"
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="memory-cards"
        className="flex flex-col items-center gap-3 p-6 rounded-card bg-surface border border-border text-center transition-opacity duration-200"
      >
        <span className="material-symbols-outlined text-3xl text-error" aria-hidden="true">
          error_outline
        </span>
        <p className="text-sm text-text-muted">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 px-4 py-1.5 rounded-control bg-contrast text-contrast-fg text-xs font-medium hover:bg-contrast-hover transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="memory-cards"
      className="grid grid-cols-2 md:grid-cols-4 gap-4 transition-opacity duration-200"
    >
      <StatCard
        icon="memory"
        label={t("memoryEntries")}
        value={memoryEntries}
        sub={t("memoryEntriesSub")}
      />
      <StatCard icon="storage" label={t("dbEntries")} value={dbEntries} sub={t("dbEntriesSub")} />
      <StatCard
        icon="trending_up"
        label={t("cacheHits")}
        value={hits}
        sub={hitRate ?? ""}
        valueClass="text-success"
      />
      <StatCard
        icon="token"
        label={t("tokensSaved")}
        value={tokensSaved}
        sub={t("tokensSavedSub")}
        valueClass="text-text-main"
      />
    </div>
  );
}
