"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";
import {
  filterRankingsByAuthType,
  sortRankingsAuthTypeFirst,
  type ProviderAuthType,
} from "@/lib/freeProviderRankingsAuthType";
import {
  formatUsageReliability,
  sortRankingsByReliability,
  usageToneClass,
} from "@/lib/freeProviderRankingsUsage";
// Type-only: `freeProviderRankings` wires DB modules at import time, so a
// client component must never take a runtime value from it. The page used to
// keep its own copy of this shape, which had already drifted past the API.
import type { FreeProviderRanking } from "@/lib/freeProviderRankings";

/**
 * Convert a normalized task-fit score (0.4–0.98) to a human-readable label.
 * The score represents relative ranking quality, not a percentage.
 */
function scoreLabel(score: number): string {
  if (score >= 0.9) return "Elite";
  if (score >= 0.8) return "Excellent";
  if (score >= 0.7) return "Very Good";
  if (score >= 0.6) return "Good";
  if (score >= 0.5) return "Average";
  return "Below Average";
}

function scoreColor(score: number): string {
  if (score >= 0.85) return "text-success";
  if (score >= 0.7) return "text-success/80";
  if (score >= 0.55) return "text-warning";
  return "text-text-muted";
}

const CATEGORY_OPTIONS = [
  { value: "", labelKey: "allCategories" },
  { value: "default", labelKey: "categoryDefault" },
  { value: "coding", labelKey: "categoryCoding" },
  { value: "review", labelKey: "categoryReview" },
  { value: "documentation", labelKey: "categoryDocumentation" },
  { value: "debugging", labelKey: "categoryDebugging" },
];

const TYPE_OPTIONS: Array<{ value: ProviderAuthType | ""; labelKey: string }> = [
  { value: "", labelKey: "typeAll" },
  { value: "noauth", labelKey: "typeNoauth" },
  { value: "oauth", labelKey: "typeOauth" },
  { value: "apikey", labelKey: "typeApikey" },
];

export default function FreeProviderRankingsPage() {
  const t = useTranslations("freeProviderRankingsPage");
  const [rankings, setRankings] = useState<FreeProviderRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("");
  const [configuredOnly, setConfiguredOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ProviderAuthType | "">("");
  const [groupByType, setGroupByType] = useState(false);
  const [sortByReliability, setSortByReliability] = useState(false);

  const fetchRankings = useCallback(
    async (category?: string, opts?: { configuredOnly?: boolean; availableOnly?: boolean }) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (opts?.configuredOnly) params.set("configuredOnly", "1");
        if (opts?.availableOnly) params.set("availableOnly", "1");
        // Always: an ELO-only ranking describes a provider that errors on every
        // call as healthy. `usageRange` matches the health matrix default.
        params.set("withUsage", "1");
        params.set("usageRange", "24h");
        const res = await fetch(`/api/free-provider-rankings?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRankings(data.rankings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errorLoading"));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void (async () => {
      await fetchRankings(filter || undefined, { configuredOnly, availableOnly });
    })();
  }, [filter, configuredOnly, availableOnly, fetchRankings]);

  // Client-side Type filter + "group by type" sort (#6915) — purely derived
  // from the already-fetched `rankings`, never trigger a refetch.
  const displayedRankings = useMemo(() => {
    const filtered = filterRankingsByAuthType(rankings, typeFilter);
    // Reliability first, then grouping: the type sort compares categories only,
    // so a stable sort keeps the reliability order inside each group.
    const ordered = sortByReliability ? sortRankingsByReliability(filtered) : filtered;
    return groupByType ? sortRankingsAuthTypeFirst(ordered) : ordered;
  }, [rankings, typeFilter, groupByType, sortByReliability]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-text-muted mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 text-[13px] font-medium rounded-control border transition-colors ${
              filter === opt.value
                ? "bg-bg-subtle border-border-strong text-text-main"
                : "border-border text-text-muted hover:text-text-main hover:border-border-strong"
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Availability toggles (default off → show all providers) */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setConfiguredOnly((v) => !v)}
          aria-pressed={configuredOnly}
          className={`px-3 py-1.5 text-[13px] font-medium rounded-control border transition-colors ${
            configuredOnly
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-text-muted hover:text-text-main hover:border-border-strong"
          }`}
        >
          {t("filterConfiguredOnly")}
        </button>
        <button
          onClick={() => setAvailableOnly((v) => !v)}
          aria-pressed={availableOnly}
          title={t("filterAvailableOnlyHelp")}
          className={`px-3 py-1.5 text-[13px] font-medium rounded-control border transition-colors ${
            availableOnly
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-text-muted hover:text-text-main hover:border-border-strong"
          }`}
        >
          {t("filterAvailableOnly")}
        </button>
      </div>

      {/* Type filter chips + "group by type" sort (#6915) */}
      <div className="flex items-center gap-2 flex-wrap">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all"}
            onClick={() => setTypeFilter(opt.value)}
            aria-pressed={typeFilter === opt.value}
            className={`px-3 py-1.5 text-[13px] font-medium rounded-control border transition-colors ${
              typeFilter === opt.value
                ? "bg-bg-subtle border-border-strong text-text-main"
                : "border-border text-text-muted hover:text-text-main hover:border-border-strong"
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
        <button
          onClick={() => setGroupByType((v) => !v)}
          aria-pressed={groupByType}
          title={t("sortTypeFirstHelp")}
          className={`px-3 py-1.5 text-[13px] font-medium rounded-control border transition-colors ${
            groupByType
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-text-muted hover:text-text-main hover:border-border-strong"
          }`}
        >
          {t("sortTypeFirst")}
        </button>
        <button
          onClick={() => setSortByReliability((v) => !v)}
          aria-pressed={sortByReliability}
          title={t("sortByReliabilityHelp")}
          className={`px-3 py-1.5 text-[13px] font-medium rounded-control border transition-colors ${
            sortByReliability
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-text-muted hover:text-text-main hover:border-border-strong"
          }`}
        >
          {t("sortByReliability")}
        </button>
      </div>
      <p className="text-xs text-text-muted">{t("typeLegend")}</p>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-text-muted">{t("loading")}</div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {displayedRankings.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayedRankings.slice(0, 3).map((provider, idx) => (
                <Card key={provider.id} className="relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      idx === 0 ? "bg-text-main" : idx === 1 ? "bg-text-subtle" : "bg-border-strong"
                    }`}
                  />
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold text-white"
                          style={{ backgroundColor: provider.color }}
                        >
                          {provider.textIcon || provider.name.charAt(0)}
                        </div>
                        <p className="font-semibold truncate">{provider.name}</p>
                      </div>
                      {provider.topModel && (
                        <p className="text-sm text-text-muted mt-1 truncate">
                          {t("bestModel")}: {provider.topModel.modelName}
                        </p>
                      )}
                      {provider.topModel && (
                        <p
                          className={`text-base font-semibold mt-1 ${scoreColor(provider.topModel.score)}`}
                        >
                          {scoreLabel(provider.topModel.score)}
                        </p>
                      )}
                    </div>
                    <div className="text-4xl font-semibold tracking-tight tabular-nums text-text-muted/20">
                      {idx + 1}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Full List */}
          {displayedRankings.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-xs text-text-muted border-b border-border">
                      <th className="pb-3 font-medium w-16">{t("colRank")}</th>
                      <th className="pb-3 font-medium">{t("colProvider")}</th>
                      <th className="pb-3 font-medium">{t("colTopModel")}</th>
                      <th className="pb-3 font-medium text-right">{t("colScore")}</th>
                      <th className="pb-3 font-medium text-right">{t("colAvgScore")}</th>
                      <th className="pb-3 font-medium text-right" title={t("colReliabilityHelp")}>
                        {t("colReliability")}
                      </th>
                      <th className="pb-3 font-medium text-right">{t("colModels")}</th>
                      <th className="pb-3 font-medium text-right" title={t("typeLegend")}>
                        {t("colType")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRankings.map((provider, idx) => (
                      <tr key={provider.id} className="border-b border-border last:border-b-0">
                        <td className="py-2.5 text-text-muted font-mono tabular-nums">{idx + 1}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold text-white"
                              style={{ backgroundColor: provider.color }}
                            >
                              {provider.textIcon || provider.name.charAt(0)}
                            </div>
                            <span className="font-medium">{provider.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-text-muted truncate max-w-[200px]">
                          {provider.topModel?.modelName || "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          {provider.topModel ? (
                            <span
                              className={`font-mono font-medium ${scoreColor(provider.topModel.score)}`}
                            >
                              {scoreLabel(provider.topModel.score)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono text-text-muted">
                          {scoreLabel(provider.averageScore)}
                        </td>
                        <td className="py-2.5 text-right">
                          {(() => {
                            const u = formatUsageReliability(provider.reliability?.usage);
                            const title =
                              u.kind === "rate"
                                ? t("reliabilitySample", {
                                    successes: u.successes,
                                    requests: u.requests,
                                    hours: u.windowHours,
                                  })
                                : u.kind === "insufficient"
                                  ? t("reliabilityTooFew", {
                                      requests: u.requests,
                                      hours: u.windowHours,
                                    })
                                  : t("reliabilityNoTraffic");
                            return (
                              <span className={`font-mono ${usageToneClass(u.tone)}`} title={title}>
                                {u.kind === "rate" ? `${u.percent}%` : "—"}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-2.5 text-right text-text-muted">{provider.modelCount}</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`text-[11px] font-medium font-mono px-1.5 py-0.5 rounded-md ${
                              provider.category === "noauth"
                                ? "bg-success/10 text-success"
                                : provider.category === "oauth"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-bg-subtle text-text-muted"
                            }`}
                          >
                            {provider.category.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {displayedRankings.length === 0 && !error && (
            <Card>
              <div className="text-center py-12 text-text-muted">{t("emptyState")}</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
