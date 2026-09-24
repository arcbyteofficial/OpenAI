"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { matchesSearch } from "@/shared/utils/turkishText";
import FileDetailModal from "./FileDetailModal";
import ExpirationBadge from "./components/ExpirationBadge";

function relativeTime(ts: number, locale: string): string {
  // ts is in seconds (Unix timestamp)
  const diffMs = Date.now() - ts * 1000;
  const diffSec = Math.round(diffMs / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffSec < 60) return formatter.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return formatter.format(-diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return formatter.format(-diffHr, "hour");
  const diffDays = Math.round(diffHr / 24);
  return formatter.format(-diffDays, "day");
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

interface FilesListTabProps {
  files: FileRecord[];
  filesTotal?: number;
  loading: boolean;
  onRefresh?: () => void;
  batches?: BatchRecord[];
}

const PURPOSE_STYLES_MAP: Record<string, string> = {
  batch: "bg-primary/10 text-primary border-primary/20",
  "batch-output": "bg-success/10 text-success border-success/20",
  "fine-tune": "bg-bg-subtle text-text-main border-border-strong",
  assistants: "bg-bg-subtle text-text-main border-border-strong",
};

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "expired"]);

function Badge({ value, styles }: Readonly<{ value: string; styles: Record<string, string> }>) {
  const cls = styles[value] ?? "bg-bg-subtle text-text-muted border-border";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {value}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function FilesListTab({
  files,
  filesTotal,
  loading,
  onRefresh,
  batches,
}: Readonly<FilesListTabProps>) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<string | null>(null);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const purposes = ["all", ...Array.from(new Set(files.map((f) => f.purpose)))];

  const filtered = files.filter((f) => {
    if (purposeFilter !== "all" && f.purpose !== purposeFilter) return false;
    if (searchQuery) {
      return matchesSearch(f.id, searchQuery) || matchesSearch(f.filename, searchQuery);
    }
    return true;
  });

  const selectedFile = selectedFileId ? files.find((f) => f.id === selectedFileId) : null;

  const handleFileClick = async (file: FileRecord) => {
    setSelectedFileId(file.id);
    setFileContents(null);
    setContentsLoading(true);
    try {
      const response = await fetch(`/api/v1/files/${file.id}/content`);
      if (response.ok) {
        const text = await response.text();
        setFileContents(text);
      } else {
        setFileContents(t("batchFileDetailFailedToLoad"));
      }
    } catch (error) {
      console.error("Failed to fetch file contents:", error);
      setFileContents(t("batchFileDetailLoadError"));
    } finally {
      setContentsLoading(false);
    }
  };

  const handleDeleteFile = async (file: FileRecord) => {
    setDeletingId(file.id);
    try {
      const res = await fetch(`/api/v1/files/${file.id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh?.();
      } else {
        console.error("[FilesListTab] DELETE returned", res.status);
      }
    } catch (err) {
      console.error("[FilesListTab] DELETE threw", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-card bg-surface border border-border">
        <span className="text-[13px] text-text-muted self-center">
          {typeof filesTotal === "number"
            ? t("batchFilesCount", { count: filesTotal })
            : t("batchFilesListFilesTable")}
        </span>
        <input
          type="text"
          placeholder={t("batchFilesListSearchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-control text-[13px] bg-surface border border-border-strong text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
        />
        <select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="px-3 py-2 rounded-control text-[13px] bg-surface border border-border-strong text-text-main focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
        >
          {purposes.map((p) => (
            <option key={p} value={p}>
              {p === "all" ? t("batchFilesAllPurposes") : t(`batchFilePurpose.${p}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-hidden rounded-card border border-border bg-surface">
        <table
          className="w-full text-[13px]"
          role="table"
          aria-label={t("batchFilesListFilesTable")}
        >
          <thead>
            <tr className="bg-bg-subtle/50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">ID</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchFilesFilename")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchFilesPurpose")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("filesListSizeColumn")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("filesListUsedByColumn")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("created")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {t("batchFilesExpires")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-text-muted text-xs">
                {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-muted">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-muted" />
                    {t("loading")}
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-muted">
                  {t("batchFilesNoneFound")}
                </td>
              </tr>
            ) : (
              filtered.map((file) => {
                const fileCreatedAt = file.createdAt;
                const fileExpiresAt = file.expiresAt;

                // D12 — derive "Used by" from batches prop
                const related = (batches ?? []).filter(
                  (b) =>
                    b.inputFileId === file.id ||
                    b.outputFileId === file.id ||
                    b.errorFileId === file.id
                );
                const allTerminal = related.every((b) => TERMINAL_STATUSES.has(b.status));
                const canDelete = related.length === 0 || allTerminal;

                return (
                  <tr
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className={`border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                      selectedFileId === file.id ? "bg-primary/5" : "hover:bg-bg-subtle/60"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[140px]">
                      <span className="truncate block" title={file.id}>
                        {file.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-main font-mono text-xs max-w-[180px]">
                      <span className="truncate block" title={file.filename}>
                        {file.filename}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={file.purpose} styles={PURPOSE_STYLES_MAP} />
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatBytes(file.bytes)}
                    </td>
                    {/* "Used by" column (D12) — shows batch id + role (input/output/error) per plan §4 */}
                    <td className="px-4 py-3 text-xs">
                      {related.length === 0 ? (
                        <span className="text-text-muted">{t("filesListUsedByNone")}</span>
                      ) : (
                        (() => {
                          const roleFor = (b: BatchRecord): string =>
                            b.inputFileId === file.id
                              ? t("filesListUsedByRoleInput")
                              : b.outputFileId === file.id
                                ? t("filesListUsedByRoleOutput")
                                : t("filesListUsedByRoleError");
                          return (
                            <div
                              className="flex flex-col gap-0.5"
                              title={related.map((b) => `${b.id} (${roleFor(b)})`).join(", ")}
                            >
                              {related.slice(0, 2).map((b) => (
                                <span key={b.id} className="font-mono text-[10px] text-text-main">
                                  {b.id.slice(0, 12)}…{" "}
                                  <span className="text-text-muted">({roleFor(b)})</span>
                                </span>
                              ))}
                              {related.length > 2 && (
                                <span className="text-[10px] text-text-muted">
                                  +{related.length - 2}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {fileCreatedAt ? relativeTime(fileCreatedAt, locale) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {fileExpiresAt ? (
                        <ExpirationBadge expiresAt={fileExpiresAt} variant="compact" />
                      ) : (
                        <span className="text-xs text-text-muted">
                          {t("batchFilesNeverExpires")}
                        </span>
                      )}
                    </td>
                    {/* Actions column */}
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {/* Download button */}
                        <a
                          href={`/api/v1/files/${file.id}/content`}
                          download={file.filename}
                          className="p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors"
                          title={t("filesListDownload")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </a>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteFile(file);
                          }}
                          disabled={!canDelete || deletingId === file.id}
                          title={
                            canDelete ? t("filesListDelete") : t("batchFileInUseByActiveBatch")
                          }
                          className="p-1.5 rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {deletingId === file.id ? "hourglass_empty" : "delete"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* File Info Modal */}
      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          contents={fileContents}
          loading={contentsLoading}
          batches={batches}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </div>
  );
}
