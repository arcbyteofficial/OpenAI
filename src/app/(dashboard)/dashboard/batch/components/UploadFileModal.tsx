"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const MAX_BYTES = 512 * 1024 * 1024; // 512 MB

interface Props {
  onClose: () => void;
  onUploaded: (fileId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadFileModal({ onClose, onUploaded }: Props) {
  const t = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape key → onClose
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function validateAndSet(picked: File) {
    setError(null);
    if (!picked.name.endsWith(".jsonl")) {
      setError(t("uploadModalError"));
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(t("uploadModalError"));
      return;
    }
    setFile(picked);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) validateAndSet(picked);
    // Reset input so the same file can be re-picked after Remove
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const picked = e.dataTransfer.files?.[0];
    if (picked) validateAndSet(picked);
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("purpose", "batch"); // D22 hardcoded
      form.append("file", file);
      const res = await fetch("/api/v1/files", { method: "POST", body: form });
      if (!res.ok) {
        setError(t("uploadModalError"));
        return;
      }
      const data = (await res.json()) as { id: string };
      onUploaded(data.id);
      onClose();
    } catch (err) {
      console.error("[UploadFileModal]", err);
      setError(t("uploadModalError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md bg-surface border border-border rounded-card shadow-[var(--shadow-elevated)] animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={t("uploadModalTitle")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-text-muted">
              upload_file
            </span>
            <h2 className="text-base font-semibold tracking-tight text-text-main">
              {t("uploadModalTitle")}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="p-1.5 rounded-md text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-error text-[13px]"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {/* Drop zone or file info */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-10 cursor-pointer transition-colors select-none ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border-strong hover:border-text-subtle hover:bg-bg-subtle"
              }`}
              role="button"
              tabIndex={0}
              aria-label={t("uploadModalDropOrPick")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
            >
              <span
                className={`material-symbols-outlined text-[32px] ${dragging ? "text-primary" : "text-text-subtle"}`}
              >
                upload_file
              </span>
              <span className="text-sm text-text-main text-center">
                {t("uploadModalDropOrPick")}
              </span>
              <span className="text-xs text-text-muted text-center">
                {t("uploadModalSizeLimit")}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".jsonl"
                className="hidden"
                onChange={handleInputChange}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-subtle border border-border">
              <span className="material-symbols-outlined text-[20px] text-text-muted shrink-0">
                description
              </span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-text-main truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs text-text-muted">{formatBytes(file.size)}</span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
                className="shrink-0 text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded-md border border-border-strong hover:border-error/40"
              >
                {t("uploadFileModalRemove")}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-control bg-surface text-text-main hover:bg-bg-subtle transition-colors border border-border-strong"
          >
            {t("uploadModalCancel")}
          </button>
          <button
            onClick={() => void handleUpload()}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-control bg-contrast text-contrast-fg hover:bg-contrast-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <span className="animate-spin inline-block rounded-full h-4 w-4 border-b-2 border-contrast-fg" />
                {t("uploadFileModalUploading")}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">upload</span>
                {t("uploadModalUpload")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
