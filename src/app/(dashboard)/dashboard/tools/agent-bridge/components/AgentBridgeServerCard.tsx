"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CertStatusIcon } from "./shared/CertStatusIcon";
import { UpstreamCaField } from "./UpstreamCaField";
import { BypassListEditor } from "./BypassListEditor";
import type { AgentBridgeServerState } from "../AgentBridgePageClient";

interface AgentBridgeServerCardProps {
  serverState: AgentBridgeServerState;
  onAction: (
    action: "start" | "stop" | "restart" | "trust-cert" | "regenerate-cert"
  ) => Promise<void>;
  onUpstreamCaSave: (path: string) => Promise<void>;
  onBypassSave: (patterns: string[]) => Promise<void>;
  bypassPatterns: string[];
}

/**
 * Global server card — status + action buttons + CA field + bypass list.
 * Matches plan 11 §3 AgentBridge Server layout.
 */
export function AgentBridgeServerCard({
  serverState,
  onAction,
  onUpstreamCaSave,
  onBypassSave,
  bypassPatterns,
}: AgentBridgeServerCardProps) {
  const t = useTranslations("agentBridge");
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [upstreamCa, setUpstreamCa] = useState(serverState.upstreamCa ?? "");

  const runAction = async (
    action: "start" | "stop" | "restart" | "trust-cert" | "regenerate-cert"
  ) => {
    setLoading(action);
    try {
      await onAction(action);
    } finally {
      setLoading(null);
    }
  };

  const isRunning = serverState.running;

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border border-border bg-bg-subtle">
            <span className="material-symbols-outlined text-[18px] text-text-muted">link</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
              {t("serverCardTitle") || "AgentBridge Server"}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isRunning ? "bg-success/10 text-success" : "bg-bg-subtle text-text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isRunning ? "bg-success animate-pulse" : "bg-text-subtle"}`}
                />
                {isRunning ? t("statusRunning") || "Running" : t("statusStopped") || "Stopped"}
              </span>
            </h2>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
              <span>
                {t("serverPort") || "Port"}: {serverState.port ?? 443}
              </span>
              <CertStatusIcon trusted={serverState.certTrusted ?? false} />
              {serverState.activeConns !== undefined && (
                <span>
                  {t("serverConns") || "Connections"}: {serverState.activeConns}
                </span>
              )}
              {serverState.interceptedCount !== undefined && (
                <span>
                  {t("serverIntercepted") || "Intercepted"}:{" "}
                  {serverState.interceptedCount.toLocaleString()}
                </span>
              )}
              {serverState.lastStartedAt && (
                <span>
                  {t("serverLastStarted") || "Last started"}:{" "}
                  {new Date(serverState.lastStartedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-text-muted hover:text-text-main transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <button
          type="button"
          onClick={() => runAction("start")}
          disabled={isRunning || loading !== null}
          aria-label={t("startServer")}
          className="inline-flex items-center gap-1.5 rounded-control border border-transparent bg-contrast text-contrast-fg px-3 py-1.5 text-xs font-medium hover:bg-contrast-hover transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
          {loading === "start" ? t("starting") || "Starting…" : t("startServer") || "Start"}
        </button>

        <button
          type="button"
          onClick={() => runAction("stop")}
          disabled={!isRunning || loading !== null}
          aria-label={t("stopServer")}
          className="inline-flex items-center gap-1.5 rounded-control border border-error/30 bg-error/5 text-error px-3 py-1.5 text-xs font-medium hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">stop</span>
          {loading === "stop" ? t("stopping") || "Stopping…" : t("stopServer") || "Stop"}
        </button>

        <button
          type="button"
          onClick={() => runAction("restart")}
          disabled={loading !== null}
          aria-label={t("restartServer")}
          className="inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface text-text-main px-3 py-1.5 text-xs font-medium hover:bg-bg-subtle transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          {loading === "restart"
            ? t("restarting") || "Restarting…"
            : t("restartServer") || "Restart"}
        </button>

        <button
          type="button"
          onClick={() => runAction("trust-cert")}
          disabled={loading !== null}
          aria-label={t("trustCert")}
          className="inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface text-text-main px-3 py-1.5 text-xs font-medium hover:bg-bg-subtle transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">security</span>
          {loading === "trust-cert" ? t("trusting") || "Trusting…" : t("trustCert") || "Trust Cert"}
        </button>

        <a
          href="/api/tools/agent-bridge/cert/download"
          download
          aria-label={t("downloadCert")}
          className="inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface text-text-main px-3 py-1.5 text-xs font-medium hover:bg-bg-subtle transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          {t("downloadCert") || "Download Cert"}
        </a>

        <button
          type="button"
          onClick={() => runAction("regenerate-cert")}
          disabled={loading !== null}
          aria-label={t("regenerateCert")}
          className="inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface text-text-main px-3 py-1.5 text-xs font-medium hover:bg-bg-subtle transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">autorenew</span>
          {loading === "regenerate-cert"
            ? t("regenerating") || "Regenerating…"
            : t("regenerateCert") || "Regenerate Cert"}
        </button>
      </div>

      {/* Expanded: CA + Bypass */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-5">
          <UpstreamCaField value={upstreamCa} onChange={setUpstreamCa} onSave={onUpstreamCaSave} />
          <div>
            <h4 className="text-xs font-semibold text-text-main mb-2">
              {t("bypassSectionTitle") || "Bypass List"}
            </h4>
            <p className="text-xs text-text-muted mb-3">
              {t("bypassSectionDesc") ||
                "Hosts matching these patterns are tunneled directly (no TLS decryption). Defaults include banks, .gov, and corporate SSO."}
            </p>
            <BypassListEditor patterns={bypassPatterns} onSave={onBypassSave} />
          </div>
        </div>
      )}
    </div>
  );
}
