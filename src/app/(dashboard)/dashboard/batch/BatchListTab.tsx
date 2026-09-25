"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { matchesSearch } from "@/shared/utils/turkishText";
import BatchDetailModal from "./BatchDetailModal";
import ExpirationBadge from "./components/ExpirationBadge";
import ProgressBarBicolor from "./components/ProgressBarBicolor";
import { useBatchActions } from "./components/useBatchActions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts * 1000;
  const isFuture = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);
  const diffSec = Math.round(absDiffMs / 1000);

  let res = "";
  if (diffSec < 60) res = `${diffSec}s`;
  else {
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) res = `${diffMin}m`;
    else {
      const diffHr = Math.round(diffMin / 60);
      if (diffHr < 24) res = `${diffHr}h`;
      else res = `${Math.round(diffHr / 24)}d`;
    }
  }

  if (isFuture) return `in ${res}`;
  return `${res} ago`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BatchRecord {
  id: string;
  endpoint: string;
  completionWindow: string;
  status: string;
  inputFileId: string;
  outputFileId?: string | null;
  errorFileId?: string | null;
  createdAt: number;
  inProgressAt?: number | null;
  expiresAt?: number | null;
  finalizingAt?: number | null;
  completedAt?: number | null;
  failedAt?: number | null;
  expiredAt?: number | null;
  cancellingAt?: number | null;
  cancelledAt?: number | null;
  requestCountsTotal: number;
  requestCountsCompleted: number;
  requestCountsFailed: number;
  metadata?: Record<string, unknown> | null;
  errors?: unknown | null;
  model?: string | null;
  usage?: unknown | null;
}

interface FileRecord {
  id: string;
  filename: string;
  bytes: number;
  purpose: string;
  status?: string | null;
  createdAt: number;
}

interface BatchListTabProps {
  batches: BatchRecord[];
  files: FileRecord[];
  batchesTotal?: number;
  loading: boolean;
  onRefresh?: () => void;
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  completed_with_failures: "bg-error/10 text-error border-error/20",
  failed: "bg-error/10 text-error border-error/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  in_progress_with_failures: "bg-warning/10 text-warning border-warning/20",
  finalizing: "bg-primary/10 text-primary border-primary/20",
  finalizing_with_failures: "bg-warning/10 text-warning border-warning/20",
  validating: "bg-warning/10 text-warning border-warning/20",
  cancelling: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-bg-subtle text-text-muted border-border",
  cancelled_with_failures: "bg-error/10 text-error border-error/20",
  expired: "bg-bg-subtle text-text-muted border-border",
  expired_with_failures: "bg-warning/10 text-warning border-warning/20",
};

// A-1 / R2 — Derive Provider label from model id (no provider field on BatchRecord).
// Heuristic-only display; no filter side-effect. Vendor names are proper nouns and
// stay un-translated; "other" / "unknown" return discriminators so the call-site can
// translate via t() — keeps function pure & free of next-intl coupling.
type ProviderLabel = "OpenAI" | "Anthropic" | "Gemini" | "other" | "unknown";
function deriveProvider(model: string | null | undefined): ProviderLabel {
  if (!model) return "unknown";
  const lower = model.toLowerCase();
  // OpenAI family: gpt-*, chatgpt-*, o-series (o1/o3/o4 + suffixes), embeddings, DALL·E
  if (
    lower.startsWith("gpt-") ||
    lower.startsWith("chatgpt-") ||
    /^o[1-9](?:-|$)/.test(lower) ||
    lower.startsWith("text-embedding-") ||
    lower.startsWith("dall-e") ||
    lower.startsWith("whisper") ||
    lower.startsWith("tts-")
  )
    return "OpenAI";
  if (lower.startsWith("claude-")) return "Anthropic";
  if (lower.startsWith("gemini")) return "Gemini";
  return "other";
}

// Maps each known status (raw + composite) to its i18n key in the `common` namespace.
// Falls back to a snake→space transform at render-time if the status isn't mapped.
const STATUS_LABEL_KEYS: Record<string, string> = {
  in_progress: "batchStatusInProgress",
  validating: "batchStatusValidating",
  finalizing: "batchStatusFinalizing",
  completed: "batchStatusCompleted",
  failed: "batchStatusFailed",
  cancelled: "batchStatusCancelled",
  cancelling: "batchStatusCancelling",
  expired: "batchStatusExpired",
  completed_with_failures: "batchStatusCompletedWithFailures",
  in_progress_with_failures: "batchStatusInProgressWithFailures",
  finalizing_with_failures: "batchStatusFinalizingWithFailures",
  cancelled_with_failures: "batchStatusCancelledWithFailures",
  expired_with_failures: "batchStatusExpiredWithFailures",
};

/** Returns a composite status key that reflects whether partial failures occurred. */
function effectiveStatus(batch: BatchRecord): string {
  const hasFailed = (batch.requestCountsFailed ?? 0) > 0;
  if (!hasFailed) return batch.status;
  const map: Record<string, string> = {
    completed: "completed_with_failures",
    in_progress: "in_progress_with_failures",
    finalizing: "finalizing_with_failures",
    cancelled: "cancelled_with_failures",
    expired: "expired_with_failures",
  };
  return map[batch.status] ?? batch.status;
}

function StatusBadge({ batch }: Readonly<{ batch: BatchRecord }>) {
  const t = useTranslations("common");
  const key = effectiveStatus(batch);
  const cls = STATUS_STYLES[key] ?? "bg-bg-subtle text-text-muted border-border";
  const labelKey = STATUS_LABEL_KEYS[key];
  const label = labelKey ? t(labelKey as Parameters<typeof t>[0]) : key.replaceAll("_", " ");
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

const ALL_STATUSES = [
  "all",
  "in_progress",
  "validating",
  "finalizing",
  "completed",
  "failed",
  "cancelled",
  "cancelling",
  "expired",
];

// ── BatchRowActions (internal component) ──────────────────────────────────────

/** Per-row action buttons: cancel, download output/errors, retry, delete. */
function BatchRowActions({
  batch,
  onRefresh,
  deletingId,
  setDeletingId,
}: Readonly<{
  batch: BatchRecord;
  onRefresh?: () => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
}>) {
  const t = useTranslations("common");
  const actions = useBatchActions({ onRefresh, t });

  const isTerminal = ["completed", "failed", "cancelled", "expired"].includes(batch.status);
  const canCancel = ["validating", "in_progress", "finalizing"].includes(batch.status);
  const canRetry = isTerminal && !!batch.errorFileId && (batch.requestCountsFailed ?? 0) > 0;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {/* Cancel — only for non-terminal statuses */}
      {canCancel && (
        <button
          onClick={async () => {
            if (window.confirm(t("batchDetailCancelConfirm"))) {
              await actions.cancel(batch.id);
            }
          }}
          disabled={actions.cancelling}
          title={t("batchActionCancel")}
          className="flex items-center justify-center p-1 rounded-md text-text-muted hover:text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[13px]">
            {actions.cancelling ? "hourglass_empty" : "block"}
          </span>
        </button>
      )}

      {/* Download output */}
      {batch.outputFileId && (
        <a
          href={actions.downloadHrefOutput(batch.outputFileId) ?? "#"}
          download={`batch-${batch.id}-output.jsonl`}
          onClick={(e) => e.stopPropagation()}
          title={t("batchActionDownloadOutput")}
          className="flex items-center justify-center p-1 rounded-md text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors"
        >
          <span className="material-symbols-outlined text-[13px]">download</span>
        </a>
      )}

      {/* Download errors */}
      {batch.errorFileId && (
        <a
          href={actions.downloadHrefErrors(batch.errorFileId) ?? "#"}
          download={`batch-${batch.id}-errors.jsonl`}
          onClick={(e) => e.stopPropagation()}
          title={t("batchActionDownloadErrors")}
          className="flex items-center justify-center p-1 rounded-md text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors"
        >
          <span className="material-symbols-outlined text-[13px]">file_download</span>
        </a>
      )}

      {/* Retry failed — only when terminal + has error file + has failures */}
      {canRetry && (
        <button
          onClick={async () => {
            if (window.confirm(t("batchActionRetryConfirm", { n: batch.requestCountsFailed }))) {
              await actions.retry({
                id: batch.id,
                inputFileId: batch.inputFileId,
                errorFileId: batch.errorFileId,
                endpoint: batch.endpoint,
              });
            }
          }}
          disabled={actions.retrying}
          title={t("batchActionRetry")}
          className="flex items-center justify-center p-1 rounded-md text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[13px]">
            {actions.retrying ? "hourglass_empty" : "replay"}
          </span>
        </button>
      )}

      {/* Delete — only for terminal statuses */}
      {isTerminal && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            setDeletingId(batch.id);
            try {
              const res = await fetch(`/api/v1/batches/${batch.id}`, { method: "DELETE" });
              if (res.ok) {
                onRefresh?.();
              } else {
                console.error(
                  "[BatchRowActions] DELETE returned non-ok status",
                  batch.id,
                  res.status
                );
              }
            } catch (err) {
              console.error("[BatchRowActions] DELETE threw", batch.id, err);
            } finally {
              setDeletingId(null);
            }
          }}
          disabled={deletingId === batch.id}
          title={t("batchListDeleteBatchTitle")}
          className="flex items-center justify-center p-1 rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[13px]">
            {deletingId === batch.id ? "hourglass_empty" : "delete"}
          </span>
        </button>
      )}
    </div>
  );
}

// ── BatchListTab ──────────────────────────────────────────────────────────────

export default function BatchListTab({
  batches,
  files,
  batchesTotal,
  loading,
  onRefresh,
}: Readonly<BatchListTabProps>) {
  const t = useTranslations("common");
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [removingCompleted, setRemovingCompleted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const completedBatches = batches.filter((b) => b.status === "completed");

  const handleRemoveCompleted = async () => {
    if (completedBatches.length === 0) return;
    setRemovingCompleted(true);
    try {
      const res = await fetch("/api/v1/batches/delete-completed", { method: "DELETE" });
      if (res.ok) {
        onRefresh?.();
      } else {
        console.error(
          "[BatchListTab] DELETE /batches/delete-completed returned",
          res.status,
          await res.text().catch(() => "")
        );
      }
    } catch (err) {
      console.error("[BatchListTab] DELETE /batches/delete-completed threw", err);
    } finally {
      setRemovingCompleted(false);
    }
  };

  const filtered = batches.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (searchQuery) {
      return (
        matchesSearch(b.id, searchQuery) ||
        matchesSearch(b.endpoint, searchQuery) ||
        matchesSearch(b.model ?? "", searchQuery)
      );
    }
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-card bg-surface border border-border">
        <span className="text-[13px] text-text-muted self-center">
          {batchesTotal ? t("batchListCount", { count: batchesTotal }) : t("batchListTitle")}
        </span>
        <input
          type="text"
          placeholder={t("batchListSearchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-control text-[13px] bg-surface border border-border-strong text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-control text-[13px] bg-surface border border-border-strong text-text-main focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
        >
          {ALL_STATUSES.map((s) => {
            const labelKey = s === "all" ? "batchStatusAll" : STATUS_LABEL_KEYS[s];
            return (
              <option key={s} value={s}>
                {labelKey ? t(labelKey as Parameters<typeof t>[0]) : s}
              </option>
            );
          })}
        </select>
        <button
          onClick={handleRemoveCompleted}
          disabled={removingCompleted}
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-control bg-surface border border-border-strong text-error hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          title={t("batchListDeleteAllCompletedTitle")}
        >
          <span className="material-symbols-outlined text-[16px]">
            {removingCompleted ? "hourglass_empty" : "delete_sweep"}
          </span>
          {removingCompleted ? t("batchListRemovingCompleted") : t("batchListRemoveCompleted")}
        </button>
      </div>

      {/* Table — 9 columns: Status | ID | Endpoint | Model | Progress | Cost | Created | Expires | Actions */}
      <div className="overflow-x-auto overflow-y-hidden rounded-card border border-border bg-surface">
        <table className="w-full text-[13px]" role="table" aria-label={t("batchListBatchesTable")}>
          <thead>
            <tr className="bg-bg-subtle/50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableStatus")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableId")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListProviderColumn")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableEndpoint")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableModel")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableProgress")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListCostColumn")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableCreated")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchListTableExpires")}
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-text-muted">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-muted" />
                    {t("batchListLoading")}
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-text-muted">
                  {t("batchListEmpty")}
                </td>
              </tr>
            ) : (
              filtered.map((batch) => {
                const total = batch.requestCountsTotal || 0;
                const done = batch.requestCountsCompleted || 0;
                const failed = batch.requestCountsFailed || 0;

                // Cost estimate — lightweight heuristic (D8).
                // Full per-request estimate (using JSONL input) is shown in BatchDetailModal.
                const estimatedCost = (() => {
                  if (!batch.model || total === 0) return "—";
                  // Prefer real usage data when available (completed batches)
                  const usage = batch.usage as
                    { input_tokens?: number; output_tokens?: number } | null | undefined;
                  if (usage?.input_tokens != null && usage?.output_tokens != null) {
                    // batch rate ≈ $0.005/1K tokens (blended, already -50%)
                    const cost = ((usage.input_tokens + usage.output_tokens) * 0.005) / 1000;
                    return `~$${cost.toFixed(2)}`;
                  }
                  // Fallback heuristic: 500 avg tokens/request × batch rate
                  const estCost = (total * 500 * 0.005) / 1000;
                  return `~$${estCost.toFixed(2)}`;
                })();

                return (
                  <tr
                    key={batch.id}
                    onClick={() => setSelectedBatch(batch)}
                    className="border-b border-border last:border-b-0 hover:bg-bg-subtle/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge batch={batch} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[180px]">
                      <span className="truncate block" title={batch.id}>
                        {batch.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-main text-xs whitespace-nowrap">
                      {(() => {
                        const p = deriveProvider(batch.model);
                        if (p === "unknown") return t("batchListProviderUnknown");
                        if (p === "other") return t("batchListProviderOther");
                        return p;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-text-main font-mono text-xs">{batch.endpoint}</td>
                    <td className="px-4 py-3 text-text-muted font-mono text-xs">
                      {batch.model ?? "—"}
                    </td>
                    {/* Progress — ProgressBarBicolor from F3; spinner when validating (G2); (partial) suffix when expired with failures (G-AUD3) */}
                    <td className="px-4 py-3 min-w-[140px]">
                      {batch.status === "validating" ? (
                        <div className="flex items-center gap-2 text-xs text-warning">
                          <span className="material-symbols-outlined text-[14px] animate-spin">
                            hourglass_top
                          </span>
                          {t("batchListValidating")}
                        </div>
                      ) : total > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <ProgressBarBicolor
                            total={total}
                            completed={done}
                            failed={failed}
                            showLabels
                          />
                          {effectiveStatus(batch) === "expired_with_failures" && (
                            <span className="text-[10px] text-warning italic">
                              {t("batchListProgressPartial")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    {/* Cost column — heuristic estimate (D8) with -50% badge per wireframe §3 (G-AUD2) */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="text-text-muted font-mono tabular-nums">
                        {estimatedCost}
                      </span>
                      {estimatedCost !== "—" && (
                        <span className="ml-1 text-[10px] font-medium text-success bg-success/10 rounded px-1 py-0.5 align-middle">
                          -50%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {relativeTime(batch.createdAt)}
                    </td>
                    {/* Expiration — countdown badge for active batches (D11) */}
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {["in_progress", "validating", "finalizing"].includes(batch.status) ? (
                        <ExpirationBadge expiresAt={batch.expiresAt ?? null} variant="compact" />
                      ) : batch.expiresAt ? (
                        relativeTime(batch.expiresAt)
                      ) : (
                        "—"
                      )}
                    </td>
                    {/* Actions — cancel / download / retry / delete */}
                    <td className="px-4 py-3">
                      <BatchRowActions
                        batch={batch}
                        onRefresh={onRefresh}
                        deletingId={deletingId}
                        setDeletingId={setDeletingId}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selectedBatch && (
        <BatchDetailModal
          batch={selectedBatch}
          files={files}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </>
  );
}
