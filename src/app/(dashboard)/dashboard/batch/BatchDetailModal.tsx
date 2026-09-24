"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useBatchActions } from "./components/useBatchActions";

type BatchTranslator = ReturnType<typeof useTranslations>;

function relativeTime(ts: number, t: BatchTranslator): string {
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

  return isFuture
    ? t("batchRelativeTimeIn", { value: res })
    : t("batchRelativeTimeAgo", { value: res });
}

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

interface BatchDetailModalProps {
  batch: BatchRecord;
  files: FileRecord[];
  onClose: () => void;
  /** Called after a successful cancel/retry action so the parent can refresh its list. */
  onActionDone?: () => void;
}

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

const STATUS_LABELS: Record<string, string> = {
  completed_with_failures: "completed with failures",
  in_progress_with_failures: "in progress (with failures)",
  finalizing_with_failures: "finalizing (with failures)",
  cancelled_with_failures: "cancelled with failures",
  expired_with_failures: "expired (partial)",
};

const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  completed: "batchStatusCompleted",
  completed_with_failures: "batchStatusCompletedWithFailures",
  failed: "batchStatusFailed",
  in_progress: "batchStatusInProgress",
  in_progress_with_failures: "batchStatusInProgressWithFailures",
  finalizing: "batchStatusFinalizing",
  finalizing_with_failures: "batchStatusFinalizingWithFailures",
  validating: "batchStatusValidating",
  cancelling: "batchStatusCancelling",
  cancelled: "batchStatusCancelled",
  cancelled_with_failures: "batchStatusCancelledWithFailures",
  expired: "batchStatusExpired",
  expired_with_failures: "batchStatusExpiredWithFailures",
};

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

function StatusBadge({ batch, t }: { batch: BatchRecord; t: BatchTranslator }) {
  const key = effectiveStatus(batch);
  const cls = STATUS_STYLES[key] ?? "bg-bg-subtle text-text-muted border-border";
  const label = STATUS_TRANSLATION_KEYS[key]
    ? t(STATUS_TRANSLATION_KEYS[key])
    : (STATUS_LABELS[key] ?? key.replace(/_/g, " "));
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider font-medium text-text-subtle">
        {label}
      </span>
      <span className="text-[13px] text-text-main font-mono break-all">{value}</span>
    </div>
  );
}

function formatTs(ts: number | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function BatchDetailModal({
  batch,
  files,
  onClose,
  onActionDone,
}: BatchDetailModalProps) {
  const t = useTranslations("common");

  // ── Action hook (F7) ─────────────────────────────────────────────────────────
  const {
    cancelling,
    retrying,
    error: actionError,
    cancel,
    retry,
    downloadHrefOutput,
    downloadHrefErrors,
  } = useBatchActions({ onRefresh: onActionDone, t });

  // ── Status flags ──────────────────────────────────────────────────────────────
  const isTerminal = ["completed", "failed", "cancelled", "expired"].includes(batch.status);
  const canCancel = ["validating", "in_progress", "finalizing"].includes(batch.status);
  const canRetry = isTerminal && !!batch.errorFileId && (batch.requestCountsFailed ?? 0) > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const total = batch.requestCountsTotal || 0;
  const completed = batch.requestCountsCompleted || 0;
  const failed = batch.requestCountsFailed || 0;
  const donePct = total > 0 ? (completed / total) * 100 : 0;
  const failedPct = total > 0 ? (failed / total) * 100 : 0;
  const pct = Math.round(donePct + failedPct);

  const inputFile = files.find((f) => f.id === batch.inputFileId);
  const outputFile = batch.outputFileId ? files.find((f) => f.id === batch.outputFileId) : null;
  const errorFile = batch.errorFileId ? files.find((f) => f.id === batch.errorFileId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-2xl bg-surface border border-border rounded-t-card sm:rounded-card shadow-[var(--shadow-elevated)] animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-detail-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-text-muted">
              pending_actions
            </span>
            <div>
              <h2
                id="batch-detail-modal-title"
                className="text-base font-semibold tracking-tight text-text-main"
              >
                {t("batchDetailsTitle")}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-text-muted font-mono">{batch.id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(batch.id);
                  }}
                  className="text-text-muted hover:text-text-main transition-colors"
                  title={t("batchDetailCopyId")}
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("batchDetailClose")}
            className="p-1.5 rounded-md text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Status + meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wider font-medium text-text-subtle">
                {t("status")}
              </span>
              <StatusBadge batch={batch} t={t} />
            </div>
            <Field label={t("batchDetailEndpoint")} value={batch.endpoint} />
            {batch.model && <Field label={t("batchDetailModel")} value={batch.model} />}
            <Field label={t("batchDetailWindow")} value={batch.completionWindow} />
            <Field
              label={t("batchDetailCreated")}
              value={
                <span title={formatTs(batch.createdAt)}>{relativeTime(batch.createdAt, t)}</span>
              }
            />
          </div>

          {/* Progress */}
          {total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-subtle uppercase tracking-wider font-medium">
                  {t("batchProgress")}
                </span>
                <span className="text-text-muted tabular-nums">
                  {completed} / {total} ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-subtle overflow-hidden flex">
                <div
                  className="h-full bg-success transition-[width]"
                  style={{ width: `${donePct}%` }}
                />
                <div
                  className="h-full bg-error transition-[width]"
                  style={{ width: `${failedPct}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-text-muted">
                <span>{t("batchCompletedCount", { count: completed })}</span>
                {failed > 0 && <span>{t("batchFailedCount", { count: failed })}</span>}
                <span>{t("batchPendingCount", { count: total - completed - failed })}</span>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-[11px] uppercase tracking-wider font-medium text-text-subtle mb-3">
              {t("batchTimeline")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { label: t("batchDetailCreated"), ts: batch.createdAt },
                { label: t("batchTimelineInProgress"), ts: batch.inProgressAt },
                { label: t("batchTimelineFinalizing"), ts: batch.finalizingAt },
                { label: t("batchTimelineCompleted"), ts: batch.completedAt },
                { label: t("batchTimelineFailed"), ts: batch.failedAt },
                { label: t("batchTimelineExpires"), ts: batch.expiresAt },
                { label: t("batchTimelineExpired"), ts: batch.expiredAt },
                { label: t("batchTimelineCancelling"), ts: batch.cancellingAt },
                { label: t("batchTimelineCancelled"), ts: batch.cancelledAt },
              ]
                .filter((t) => t.ts)
                .map(({ label, ts }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-text-subtle">
                      {label}
                    </span>
                    <span className="text-xs font-mono text-text-main">{formatTs(ts)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Files */}
          <div>
            <h3 className="text-[11px] uppercase tracking-wider font-medium text-text-subtle mb-3">
              Files
            </h3>
            <div className="space-y-2">
              {[
                {
                  role: t("filesListUsedByRoleInput"),
                  fileId: batch.inputFileId,
                  record: inputFile,
                },
                {
                  role: t("filesListUsedByRoleOutput"),
                  fileId: batch.outputFileId,
                  record: outputFile,
                },
                {
                  role: t("filesListUsedByRoleError"),
                  fileId: batch.errorFileId,
                  record: errorFile,
                },
              ]
                .filter((f) => f.fileId)
                .map(({ role, fileId, record }) => (
                  <div
                    key={role}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-subtle border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-[16px] text-text-muted flex-shrink-0">
                        insert_drive_file
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-muted">{role}</p>
                        <p className="text-xs font-mono text-text-main truncate">
                          {record?.filename ?? fileId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {record && (
                        <span className="text-xs text-text-muted">
                          {(record.bytes / 1024).toFixed(1)} KB
                        </span>
                      )}
                      <a
                        href={`/api/v1/files/${fileId}/content`}
                        download={record?.filename || fileId}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-surface border border-border-strong text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors"
                      >
                        <span className="material-symbols-outlined text-[13px]">download</span>
                        {t("filesListDownload")}
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Usage */}
          {batch.usage && (
            <div>
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-text-subtle mb-3">
                {t("batchTokenUsage")}
              </h3>
              <pre className="p-3 rounded-lg bg-bg-subtle border border-border text-xs font-mono text-text-main overflow-x-auto">
                {JSON.stringify(batch.usage, null, 2)}
              </pre>
            </div>
          )}

          {/* Errors */}
          {batch.errors && (
            <div>
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-error mb-3">
                {t("errors")}
              </h3>
              <pre className="p-3 rounded-lg bg-error/5 border border-error/20 text-xs font-mono text-error overflow-x-auto">
                {JSON.stringify(batch.errors, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {batch.metadata && Object.keys(batch.metadata).length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-text-subtle mb-3">
                {t("batchMetadata")}
              </h3>
              <div className="space-y-1">
                {Object.entries(batch.metadata).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-bg-subtle border border-border"
                  >
                    <span className="text-text-muted">{k}</span>
                    <span className="text-text-muted">=</span>
                    <span className="text-text-main">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Action footer (F7) ─────────────────────────────────────────── */}
        {(canCancel || canRetry || batch.outputFileId || batch.errorFileId) && (
          <div className="flex flex-wrap gap-2 px-6 py-4 border-t border-border flex-shrink-0">
            {/* Download output */}
            {batch.outputFileId && (
              <a
                href={downloadHrefOutput(batch.outputFileId) ?? "#"}
                download={`batch-${batch.id}-output.jsonl`}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-control bg-surface border border-border-strong text-text-main hover:bg-bg-subtle transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                {t("batchActionDownloadOutput")}
              </a>
            )}

            {/* Download errors */}
            {batch.errorFileId && (
              <a
                href={downloadHrefErrors(batch.errorFileId) ?? "#"}
                download={`batch-${batch.id}-errors.jsonl`}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-control bg-surface border border-border-strong text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">error_outline</span>
                {t("batchActionDownloadErrors")}
              </a>
            )}

            {/* Retry failed */}
            {canRetry && (
              <button
                onClick={async () => {
                  if (
                    window.confirm(
                      t("batchDetailActionRetry") +
                        ` (${batch.requestCountsFailed} ${t("batchActionRetry")})?`
                    )
                  ) {
                    const result = await retry({
                      id: batch.id,
                      inputFileId: batch.inputFileId,
                      errorFileId: batch.errorFileId,
                      endpoint: batch.endpoint,
                    });
                    if (result?.newBatchId) onClose();
                  }
                }}
                disabled={retrying}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-control bg-surface border border-border-strong text-text-main hover:bg-bg-subtle transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {retrying ? "hourglass_empty" : "refresh"}
                </span>
                {retrying ? t("batchDetailRetrying") : t("batchDetailActionRetry")}
              </button>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={async () => {
                  if (window.confirm(t("batchDetailCancelConfirm"))) {
                    await cancel(batch.id);
                    onClose();
                  }
                }}
                disabled={cancelling}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-control bg-surface border border-border-strong text-warning hover:bg-warning/10 transition-colors disabled:opacity-50 ml-auto"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {cancelling ? "hourglass_empty" : "close"}
                </span>
                {cancelling ? t("batchDetailCancelling") : t("batchDetailActionCancel")}
              </button>
            )}

            {/* Action error — uses i18n key set by hook (D14: never raw err.message/stack) */}
            {actionError && (
              <div role="alert" className="basis-full mt-1 text-xs text-error">
                {/* actionError is an i18n key from the hook (e.g. "batchActionCancel").
                    Cast is needed because next-intl types its arg as a specific union;
                    the hook guarantees this is always a valid message key. */}
                {t(actionError as Parameters<typeof t>[0])}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
