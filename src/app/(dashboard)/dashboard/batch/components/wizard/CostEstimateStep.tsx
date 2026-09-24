"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { estimateBatchCost } from "@/lib/batches/costEstimator";
import type { CostEstimate } from "@/lib/batches/types";
import type { SupportedBatchEndpoint } from "@/lib/batches/types";

interface CostEstimateStepProps {
  jsonl: string;
  model: string;
  endpoint: SupportedBatchEndpoint;
  onCreate: () => void;
  creating: boolean;
  error: string | null;
}

export default function CostEstimateStep({
  jsonl,
  model,
  endpoint,
  onCreate,
  creating,
  error,
}: CostEstimateStepProps) {
  const t = useTranslations("common");
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Deferred to a microtask: the compiler bars synchronous setState in an
    // effect body; the loading state still settles before the next paint batch.
    void (async () => {
      await Promise.resolve();
      setLoading(true);
      try {
        const est = estimateBatchCost({ jsonl, model, endpoint });
        setEstimate(est);
      } catch (err) {
        console.error("[CostEstimateStep] cost estimation error:", err);
        // Fallback: zero-cost estimate so user can still proceed
        setEstimate({
          model,
          totalRequests: 0,
          estimatedInputTokens: 0,
          estimatedOutputTokens: 0,
          syncCostUsd: 0,
          batchCostUsd: 0,
          savingsUsd: 0,
          pricingSource: "fallback",
          warnings: ["Cost estimation failed — shown as $0."],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [jsonl, model, endpoint]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="material-symbols-outlined text-3xl text-text-muted animate-spin">
          progress_activity
        </span>
        <span className="text-sm text-text-muted">{t("wizardCostEstimating")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cost breakdown card */}
      {estimate && (
        <div className="rounded-lg border border-border bg-bg-subtle divide-y divide-border">
          {/* Sync cost (baseline) */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-text-muted">{t("wizardCostSync")}</span>
            <span className="text-sm text-text-muted line-through tabular-nums">
              ${estimate.syncCostUsd.toFixed(4)}
            </span>
          </div>

          {/* Batch cost (-50%) */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-success">{t("wizardCostBatch")}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-success bg-success/10 rounded px-1.5 py-0.5">
                -50%
              </span>
              <span className="text-sm font-semibold text-success tabular-nums">
                ${estimate.batchCostUsd.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Savings */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-text-muted">{t("wizardCostSavings")}</span>
            <span className="text-sm text-success tabular-nums">
              ${estimate.savingsUsd.toFixed(4)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-text-muted">{t("wizardCostRequests")}</span>
            <span className="text-xs text-text-muted tabular-nums">
              {estimate.totalRequests.toLocaleString()} ·{" "}
              {estimate.estimatedInputTokens.toLocaleString()} {t("wizardCostInputTok")} ·{" "}
              {estimate.estimatedOutputTokens.toLocaleString()} {t("wizardCostOutputTok")}
            </span>
          </div>

          {/* Completion window — spec §5 "janela 24h" (A-3) */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-text-muted">{t("wizardCostWindow")}</span>
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {t("wizardCostWindow24h")}
            </span>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-text-muted italic">{t("wizardCostEstimatedNotice")}</p>

      {/* Warnings */}
      {estimate && estimate.warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {estimate.warnings.map((w) => (
            <div
              key={w}
              className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning"
            >
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Error banner (already sanitized by orchestrator) */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error"
        >
          {error}
        </div>
      )}

      {/* Create button */}
      <button
        type="button"
        onClick={onCreate}
        disabled={creating}
        className="w-full rounded-control py-3 text-sm font-medium bg-contrast text-contrast-fg disabled:opacity-60 hover:bg-contrast-hover transition-colors flex items-center justify-center gap-2"
      >
        {creating ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">
              progress_activity
            </span>
            {t("wizardCreating")}
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
            {t("wizardCreate")}
          </>
        )}
      </button>
    </div>
  );
}
