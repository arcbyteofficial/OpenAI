"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";

import type { RadarIntelFeed } from "@/lib/radar/intelFeedSchema";
import { Card } from "@/shared/components";

interface IntelMeta {
  version: string;
  tier: "live";
  fetchedAt: string;
  supporterVerified: true;
}

export default function RadarIntelPage() {
  const t = useTranslations("radarIntelPage");
  const [intel, setIntel] = useState<RadarIntelFeed | null>(null);
  const [meta, setMeta] = useState<IntelMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [flagOff, setFlagOff] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/radar/intel");
    if (response.status === 404) {
      setFlagOff(true);
      return;
    }
    if (!response.ok) throw new Error("intel_load_failed");
    const body = (await response.json()) as {
      intel?: RadarIntelFeed | null;
      meta?: IntelMeta | null;
    };
    setIntel(body.intel ?? null);
    setMeta(body.meta ?? null);
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError("");
    try {
      const response = await fetch("/api/radar/intel/sync", { method: "POST" });
      if (response.status === 404) {
        setFlagOff(true);
        return;
      }
      if (!response.ok) throw new Error("intel_sync_failed");
      const status = (await response.json()) as { status?: string };
      if (
        ["error", "invalid_signature", "invalid_schema", "wrong_tier", "too_large"].includes(
          status.status ?? ""
        )
      ) {
        setError(t("loadFailed"));
      }
      await load();
    } catch {
      setError(t("loadFailed"));
      await load().catch(() => undefined);
    } finally {
      setSyncing(false);
    }
  }, [load, t]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        setError(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [load, t]);

  if (flagOff) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/radar"
            className="text-sm text-text-muted hover:text-text-main transition-colors"
          >
            ← {t("backToRadar")}
          </Link>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-text-main">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {meta?.supporterVerified === true && (
            <span
              data-badge-id="radar-supporter"
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {t("supporterBadge")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void sync()}
            disabled={syncing}
            className="rounded-control border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-text-main hover:bg-bg-subtle transition-colors disabled:opacity-50"
          >
            {syncing ? t("syncing") : t("refresh")}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-error/10 p-3 text-sm text-error">{error}</div>}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-text-muted">
          {t("loading")}
        </div>
      ) : !intel || !meta ? (
        <Card>
          <p className="py-8 text-center text-text-muted">{t("empty")}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-[13px] text-text-muted">{t("methodology")}</p>
              <p className="mt-2 font-semibold text-text-main">
                {t("eloMethod", {
                  initial: intel.methodology.initialRating,
                  factor: intel.methodology.kFactor,
                })}
              </p>
            </Card>
            <Card>
              <p className="text-[13px] text-text-muted">{t("freshness")}</p>
              <p className="mt-2 font-semibold text-text-main">
                {t(`freshnessValues.${intel.catalog.freshness}`)}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {t("ageDays", { days: intel.catalog.ageDays })}
              </p>
            </Card>
            <Card>
              <p className="text-[13px] text-text-muted">{t("trend")}</p>
              <p className="mt-2 font-semibold text-text-main">
                {t(`trendValues.${intel.catalog.trend}`)}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {t("modelDelta", {
                  current: intel.catalog.models.current,
                  added: intel.catalog.models.added,
                  removed: intel.catalog.models.removed,
                })}
              </p>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight text-text-main">
                {t("ranking")}
              </h2>
              <span className="font-mono text-[12px] text-text-muted">{meta.version}</span>
            </div>
            {intel.rankings.length === 0 ? (
              <p className="py-6 text-center text-text-muted">{t("noRankings")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-xs font-medium text-text-muted">
                    <tr>
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">{t("model")}</th>
                      <th className="pb-3 font-medium">{t("category")}</th>
                      <th className="pb-3 font-medium text-right">{t("rating")}</th>
                      <th className="pb-3 font-medium text-right">{t("matches")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intel.rankings.map((ranking) => (
                      <tr
                        key={`${ranking.category}:${ranking.provider}:${ranking.modelId}`}
                        className="border-t border-border"
                      >
                        <td className="py-3 tabular-nums text-text-muted">{ranking.rank}</td>
                        <td className="py-3 font-mono text-[12px] text-text-main">
                          {ranking.provider}/{ranking.modelId}
                        </td>
                        <td className="py-3">{ranking.category}</td>
                        <td className="py-3 text-right tabular-nums">{ranking.rating}</td>
                        <td className="py-3 text-right tabular-nums">{ranking.matches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
