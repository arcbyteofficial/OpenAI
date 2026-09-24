"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";

type FileTranslator = ReturnType<typeof useTranslations>;

function relativeTime(ts: number, t: FileTranslator): string {
  const diffMs = Date.now() - ts * 1000;
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return t("batchRelativeTimeAgo", { value: `${diffSec}s` });
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return t("batchRelativeTimeAgo", { value: `${diffMin}m` });
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return t("batchRelativeTimeAgo", { value: `${diffHr}h` });
  const diffDays = Math.round(diffHr / 24);
  return t("batchRelativeTimeAgo", { value: `${diffDays}d` });
}

function relativeExpiration(ts: number | null, t: FileTranslator): string {
  if (!ts) return t("batchFilesNeverExpires");
  const diffMs = ts * 1000 - Date.now();
  if (diffMs <= 0) return t("expirationBadgeExpired");
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.round(diffHr / 24);
  return `${diffDays}d`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

interface FileRecord {
  id: string;
  filename: string;
  bytes: number;
  purpose: string;
  createdAt: number;
  expiresAt?: number | null;
}

interface BatchRecord {
  id: string;
  endpoint: string;
  status: string;
  inputFileId: string;
  outputFileId?: string | null;
  errorFileId?: string | null;
  model?: string | null;
}

const BATCH_STATUS_TRANSLATION_KEYS: Record<string, string> = {
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

interface FileDetailModalProps {
  file: FileRecord;
  contents: string | null;
  loading: boolean;
  batches?: BatchRecord[];
  onClose: () => void;
}

export default function FileDetailModal({
  file,
  contents,
  loading,
  batches,
  onClose,
}: Readonly<FileDetailModalProps>) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const relatedBatches = (batches ?? []).filter(
    (b) => b.inputFileId === file.id || b.outputFileId === file.id || b.errorFileId === file.id
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `/api/v1/files/${file.id}/content`;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopy = () => {
    if (contents) {
      navigator.clipboard.writeText(contents);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createdAtTs = file.createdAt;
  const expiresAtTs = file.expiresAt;

  const lineCount = contents ? contents.split("\n").filter((l) => l.trim()).length : 0;
  const isTruncated = lineCount > 1000;
  const displayedLines = contents
    ? contents
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 1000)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-3xl bg-surface border border-border rounded-t-card sm:rounded-card shadow-[var(--shadow-elevated)] animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-text-muted">
              description
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-text-main">
                {t("batchFileContents")}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-text-muted font-mono">{file.id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(file.id);
                  }}
                  className="text-text-muted hover:text-text-main transition-colors"
                  title={t("batchFileDetailCopyId")}
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("batchFileDetailClose")}
            className="p-1.5 rounded-md text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-bg-subtle border border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider font-medium text-text-subtle">
                {t("batchFilesSizeColumn")}
              </span>
              <span className="text-sm text-text-main">{formatBytes(file.bytes)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider font-medium text-text-subtle">
                {t("batchFilesPurpose")}
              </span>
              <span className="text-sm text-text-main">{file.purpose}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider font-medium text-text-subtle">
                {t("batchDetailCreated")}
              </span>
              <span className="text-sm text-text-main">
                {createdAtTs ? relativeTime(createdAtTs, t) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider font-medium text-text-subtle">
                {t("batchFilesExpires")}
              </span>
              <span className="text-sm text-text-main">
                {expiresAtTs ? relativeExpiration(expiresAtTs, t) : t("batchFilesNeverExpires")}
              </span>
            </div>
          </div>

          {/* Related batches */}
          {relatedBatches.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-text-subtle mb-2">
                {t("batchFileUsedByCount", { count: relatedBatches.length })}
              </h3>
              <div className="space-y-1.5">
                {relatedBatches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-subtle border border-border text-xs"
                  >
                    <span className="material-symbols-outlined text-[14px] text-text-muted">
                      pending_actions
                    </span>
                    <span className="font-mono text-text-main truncate">{b.id}</span>
                    <span
                      className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${
                        b.status === "completed"
                          ? "bg-success/10 text-success border-success/20"
                          : b.status === "failed"
                            ? "bg-error/10 text-error border-error/20"
                            : "bg-bg-subtle text-text-muted border-border"
                      }`}
                    >
                      {BATCH_STATUS_TRANSLATION_KEYS[b.status]
                        ? t(BATCH_STATUS_TRANSLATION_KEYS[b.status])
                        : b.status.replaceAll("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contents */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-text-subtle">
                {t("batchFilePreview")}
              </h3>
              {contents && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border border-border-strong bg-surface text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  {copied ? t("copied") : t("copy")}
                </button>
              )}
            </div>

            <div className="flex-1 relative group">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-bg/50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-muted" />
                </div>
              ) : contents ? (
                <div className="h-full flex flex-col">
                  <pre className="flex-1 overflow-auto text-[11px] bg-bg rounded-lg p-4 border border-border text-text-muted font-mono leading-relaxed">
                    {displayedLines.join("\n")}
                  </pre>
                  {isTruncated && (
                    <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      {t("batchFilePreviewTruncated", { shown: 1000, total: lineCount })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 rounded-lg border border-dashed border-border text-text-muted">
                  <span className="material-symbols-outlined text-[32px] mb-2 text-text-subtle">
                    find_in_page
                  </span>
                  <p className="text-sm">{t("batchFileDetailFailedToLoad")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end gap-3 mt-2">
            <Button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-control bg-contrast text-contrast-fg hover:bg-contrast-hover transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {t("batchFileDownloadFull")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
