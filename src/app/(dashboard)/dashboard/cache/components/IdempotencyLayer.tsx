"use client";

import React from "react";
import { Card } from "@/shared/components";
import { useTranslations } from "next-intl";

interface IdempotencyLayerProps {
  activeKeys?: number;
  windowMs?: number;
  deduplicatedRequests?: number;
  totalProcessed?: number;
  savedCalls?: number;
  stats?: {
    activeKeys?: number;
    windowMs?: number;
    deduplicatedRequests?: number;
    totalProcessed?: number;
    savedCalls?: number;
  } | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function Skeleton() {
  return <div data-testid="skeleton" className="animate-pulse rounded bg-bg-subtle h-7 w-16" />;
}

export default function IdempotencyLayer({
  activeKeys,
  windowMs,
  deduplicatedRequests,
  totalProcessed,
  savedCalls,
  stats,
  loading = false,
  error = null,
  onRetry,
}: IdempotencyLayerProps) {
  const t = useTranslations("cache");

  const resolvedActiveKeys = activeKeys ?? stats?.activeKeys ?? 0;
  const resolvedWindowMs = windowMs ?? stats?.windowMs;
  const resolvedDeduplicated = deduplicatedRequests ?? stats?.deduplicatedRequests ?? 0;
  const resolvedTotalProcessed = totalProcessed ?? stats?.totalProcessed ?? 0;
  const resolvedSavedCalls = savedCalls ?? stats?.savedCalls ?? 0;

  return (
    <Card>
      <div data-testid="idempotency-layer" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-text-muted" aria-hidden="true">
            fingerprint
          </span>
          <h2 className="text-sm font-semibold text-text-main">{t("idempotency")}</h2>
        </div>

        {error && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-error">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="self-start text-sm px-3 py-1 rounded-control border border-border-strong text-text-main hover:bg-bg-subtle transition-colors"
                aria-label={t("retry")}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-border bg-surface-2">
            <div className="text-lg font-semibold tabular-nums text-text-main">
              {loading ? <Skeleton /> : resolvedDeduplicated}
            </div>
            <div className="text-xs text-text-muted mt-0.5">{t("deduplicatedRequests")}</div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-2">
            <div className="text-lg font-semibold tabular-nums text-text-main">
              {loading ? <Skeleton /> : resolvedWindowMs != null ? resolvedWindowMs : "—"}
            </div>
            <div className="text-xs text-text-muted mt-0.5">{t("dedupWindow")}</div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-2">
            <div className="text-lg font-semibold tabular-nums text-text-main">
              {loading ? <Skeleton /> : resolvedActiveKeys}
            </div>
            <div className="text-xs text-text-muted mt-0.5">{t("activeDedupKeys")}</div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-2">
            <div className="text-lg font-semibold tabular-nums text-text-main">
              {loading ? <Skeleton /> : resolvedTotalProcessed}
            </div>
            <div className="text-xs text-text-muted mt-0.5">{t("totalProcessed")}</div>
          </div>
        </div>

        {!loading && resolvedSavedCalls > 0 && (
          <div className="p-3 rounded-lg border border-border bg-surface-2">
            <div className="text-lg font-semibold tabular-nums text-text-main">
              {resolvedSavedCalls}
            </div>
            <div className="text-xs text-text-muted mt-0.5">{t("savedCalls")}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
