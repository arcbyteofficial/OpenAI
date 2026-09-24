"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  TYPE_COLORS,
  LEVEL_COLORS,
  PROVIDER_COLORS,
  getProxyStatusStyle as getStatusStyle,
} from "@/shared/constants/colors";
import { formatDuration as formatLatency } from "@/shared/utils/formatting";

/**
 * Proxy log detail modal — shows full proxy event metadata, error info, and config.
 * Extracted from ProxyLogger.js for maintainability.
 */
/**
 * Proxy label for the detail pane: the registry name when the log carries one
 * (`murphy-eu-fr (http://host:port)`), else `type://host:port`, else the direct label.
 * Module-scope so the component's cyclomatic complexity stays inside the ratchet.
 */
function formatProxyLabel(proxy, directLabel) {
  if (!proxy) return directLabel;
  const endpoint = `${proxy.type}://${proxy.host}:${proxy.port}`;
  return proxy.name ? `${proxy.name} (${endpoint})` : endpoint;
}

export default function ProxyLogDetail({ log, onClose }) {
  const t = useTranslations("proxyLog");
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusStyle = getStatusStyle(log.status);
  const typeColor = TYPE_COLORS[log.proxy?.type] || {
    bg: "#6B7280",
    text: "#fff",
    label: log.proxy?.type || "-",
  };
  const levelColor = LEVEL_COLORS[log.level] || LEVEL_COLORS.direct;
  const providerColor = PROVIDER_COLORS[log.provider] || {
    bg: "#374151",
    text: "#fff",
    label: (log.provider || "-").toUpperCase(),
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString("pt-BR") + ", " + d.toLocaleTimeString("en-US", { hour12: false })
      );
    } catch {
      return iso;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("detailAriaLabel")}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-surface border border-border rounded-card w-full max-w-[700px] max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/95 backdrop-blur-sm rounded-t-card">
          <div className="flex items-center gap-3">
            <span
              className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {log.status}
            </span>
            <span className="font-semibold text-base tracking-tight text-text-main">
              {t("event")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-control hover:bg-bg-subtle text-text-muted hover:text-text-main transition-colors"
            aria-label={t("close")}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-bg-subtle rounded-lg border border-border">
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("time")}
              </div>
              <div className="text-sm font-medium">{formatDate(log.timestamp)}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("latency")}
              </div>
              <div className="text-sm font-medium">{formatLatency(log.latencyMs)}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("clientIp")}
              </div>
              <div className="text-[13px] font-medium font-mono text-text-main">
                {log.clientIp || "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("proxy")}
              </div>
              <div className="text-[13px] font-medium font-mono text-text-main">
                {formatProxyLabel(log.proxy, t("direct"))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("type")}
              </div>
              <span
                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
              >
                {typeColor.label}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("level")}
              </div>
              <span
                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: levelColor.bg, color: levelColor.text }}
              >
                {levelColor.label}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("provider")}
              </div>
              {log.provider ? (
                <span
                  className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: providerColor.bg, color: providerColor.text }}
                >
                  {providerColor.label}
                </span>
              ) : (
                <div className="text-sm text-text-muted">—</div>
              )}
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("tlsFingerprint")}
              </div>
              {log.tlsFingerprint ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: "var(--color-border)", color: "inherit" }}
                >
                  <span style={{ fontSize: "12px" }}>🔒</span> Chrome 124
                </span>
              ) : (
                <div className="text-sm text-text-muted">{t("directNative")}</div>
              )}
            </div>
            <div className="col-span-2">
              <div className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1">
                {t("targetUrl")}
              </div>
              <div className="text-[13px] font-medium font-mono text-text-muted break-all">
                {log.targetUrl || "—"}
              </div>
            </div>
          </div>

          {/* Error */}
          {log.error && (
            <div className="p-4 rounded-lg bg-error/10 border border-error/20">
              <div className="text-[11px] text-error uppercase tracking-wider mb-1 font-medium">
                {t("error")}
              </div>
              <div className="text-[13px] text-error font-mono">{log.error}</div>
            </div>
          )}

          {/* Proxy Config Details */}
          {log.proxy && (
            <div className="p-4 rounded-lg bg-bg-subtle border border-border">
              <div className="text-[11px] text-text-subtle uppercase tracking-wider mb-2 font-medium">
                {t("configuration")}
              </div>
              <pre className="text-[12px] font-mono text-text-main bg-surface border border-border rounded-md p-3 overflow-x-auto">
                {JSON.stringify(log.proxy, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
