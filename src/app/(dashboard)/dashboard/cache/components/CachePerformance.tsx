"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";

interface CachePerformanceProps {
  hits?: number;
  misses?: number;
  hitRate?: string;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  totalRequests?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function HitRateBar({ hitRate, label }: { hitRate: number; label: string }) {
  const colorClass = hitRate >= 70 ? "bg-success" : hitRate >= 40 ? "bg-warning" : "bg-error";
  const textClass = hitRate >= 70 ? "text-success" : hitRate >= 40 ? "text-warning" : "text-error";

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-label={label}
      aria-valuenow={hitRate}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-text-muted">{label}</span>
        <span className={`font-semibold tabular-nums ${textClass}`}>{hitRate.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${colorClass}`}
          style={{ width: `${Math.min(hitRate, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      data-testid="skeleton"
      className={`animate-pulse rounded bg-bg-subtle ${className ?? ""}`}
    />
  );
}

// ─── CachePerformance ─────────────────────────────────────────────────────────

export default function CachePerformance({
  hits = 0,
  misses = 0,
  hitRate,
  avgLatencyMs,
  p95LatencyMs,
  totalRequests = 0,
  loading = false,
  error = null,
  onRetry,
  stats,
}: CachePerformanceProps) {
  const t = useTranslations("cache");
  // Parse hitRate string (e.g. "85.0%") to number for the bar
  const hitRateNum = hitRate ? parseFloat(hitRate) : 0;

  return (
    <Card>
      <div data-testid="cache-performance" className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">{t("performanceTitle")}</h2>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-error">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="self-start text-xs px-3 py-1.5 rounded-control bg-surface border border-border-strong hover:bg-bg-subtle transition-colors"
                aria-label={t("cachePerformanceRetry")}
              >
                {t("retry")}
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            {(avgLatencyMs !== undefined || p95LatencyMs !== undefined) && (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            )}
          </div>
        )}

        {/* Data state — hidden while loading */}
        {!loading && !error && stats !== null && (
          <>
            {/* Hit rate bar */}
            {hitRate !== undefined && (
              <HitRateBar hitRate={hitRateNum} label={t("cachePerformanceHitRate")} />
            )}

            {/* Hit / Miss / Total breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border text-center">
              <div>
                <div className="text-lg font-semibold tabular-nums text-success">{hits}</div>
                <div className="text-xs text-text-muted mt-0.5">{t("hits")}</div>
              </div>
              <div>
                <div className="text-lg font-semibold tabular-nums text-error">{misses}</div>
                <div className="text-xs text-text-muted mt-0.5">{t("misses")}</div>
              </div>
              <div>
                <div className="text-lg font-semibold tabular-nums">{totalRequests}</div>
                <div className="text-xs text-text-muted mt-0.5">{t("total")}</div>
              </div>
            </div>

            {/* Latency metrics */}
            {(avgLatencyMs !== undefined || p95LatencyMs !== undefined) && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-center">
                {avgLatencyMs !== undefined && (
                  <div>
                    <div className="text-lg font-semibold tabular-nums">{avgLatencyMs}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {t("cachePerformanceAvgLatency")}
                    </div>
                  </div>
                )}
                {p95LatencyMs !== undefined && (
                  <div>
                    <div className="text-lg font-semibold tabular-nums">{p95LatencyMs}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {t("cachePerformanceP95Latency")}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* hitRate as text for test assertions */}
            {hitRate !== undefined && (
              <div className="text-center">
                <span className="text-sm font-semibold tabular-nums">{hitRate}</span>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
