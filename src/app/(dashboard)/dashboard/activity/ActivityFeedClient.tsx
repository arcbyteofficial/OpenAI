"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { AuditLogEntry } from "@/lib/compliance/index";
import ActivityFeed from "./components/ActivityFeed";
import EventTypeFilter, { type EventCategory, matchesCategory } from "./components/EventTypeFilter";

const FEED_LIMIT = 200;

export default function ActivityFeedClient() {
  const t = useTranslations("activity");
  const [allEntries, setAllEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<EventCategory>("all");
  // State (not a ref) because it is rendered: refs cannot be read during
  // render, and Date.now() cannot run there either — the fetch settles it.
  const [referenceNowMs, setReferenceNowMs] = useState<number>(0);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        level: "high",
        limit: String(FEED_LIMIT),
      });
      const res = await fetch(`/api/compliance/audit-log?${params.toString()}`);
      if (!res.ok) {
        throw new Error(t("description"));
      }
      const data = (await res.json()) as AuditLogEntry[];
      // Reset reference time on fresh load so relative timestamps are stable
      setReferenceNowMs(Date.now());
      setAllEntries(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("fetchFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void (async () => {
      await fetchEntries();
    })();
  }, [fetchEntries]);

  const filtered =
    category === "all"
      ? allEntries
      : allEntries.filter((e) => {
          const action = typeof e.action === "string" ? e.action : "";
          return matchesCategory(action, category);
        });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-main">{t("title")}</h1>
          <p className="text-sm text-text-muted mt-1">{t("description")}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchEntries()}
          disabled={loading}
          className="px-3 py-1.5 rounded-control text-[13px] font-medium bg-surface border border-border-strong text-text-main hover:bg-bg-subtle transition-colors disabled:opacity-50"
          aria-label={t("refreshAria")}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[16px] animate-spin"
                aria-hidden="true"
              >
                progress_activity
              </span>
              {t("loading")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                refresh
              </span>
              {t("refresh")}
            </span>
          )}
        </button>
      </div>

      {/* Filter */}
      <EventTypeFilter value={category} onChange={setCategory} />

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Feed */}
      <div className="rounded-card border border-border overflow-hidden bg-surface">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted">
            <span
              className="material-symbols-outlined text-[20px] animate-spin mr-3"
              aria-hidden="true"
            >
              progress_activity
            </span>
            <span className="text-sm">{t("loadingActivity")}</span>
          </div>
        ) : (
          <ActivityFeed entries={filtered} referenceNowMs={referenceNowMs} />
        )}
      </div>
    </div>
  );
}
