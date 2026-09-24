"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";
import { copyToClipboard } from "@/shared/utils/clipboard";
import McpDashboardPage from "../endpoint/components/MCPDashboard";

type ServiceStatus = { online: boolean; loading: boolean };
type McpTransport = "stdio" | "sse" | "streamable-http";

function ServiceToggle({
  label,
  status,
  enabled,
  onToggle,
  toggling,
}: {
  label: string;
  status: ServiceStatus;
  enabled: boolean;
  onToggle: () => void;
  toggling: boolean;
}) {
  const t = useTranslations("mcpDashboard");
  const online = enabled && status.online;
  const loading = enabled && status.loading;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
        style={{
          borderColor: loading
            ? "var(--color-border)"
            : online
              ? "color-mix(in srgb, var(--color-success) 30%, transparent)"
              : "color-mix(in srgb, var(--color-error) 30%, transparent)",
          background: loading
            ? "transparent"
            : online
              ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
              : "color-mix(in srgb, var(--color-error) 10%, transparent)",
          color: loading
            ? "var(--color-text-muted)"
            : online
              ? "var(--color-success)"
              : "var(--color-error)",
        }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: loading
              ? "var(--color-text-muted)"
              : online
                ? "var(--color-success)"
                : "var(--color-error)",
            animation: online ? "pulse 2s infinite" : "none",
          }}
        />
        {loading ? "..." : online ? t("online") : t("offline")}
      </div>

      <button
        onClick={onToggle}
        disabled={toggling}
        className="relative inline-flex items-center h-7 w-[52px] rounded-full transition-colors duration-200 focus:outline-none border"
        style={{
          background: enabled ? "var(--color-primary)" : "var(--color-bg-subtle)",
          borderColor: enabled ? "var(--color-primary)" : "var(--color-border-strong)",
          opacity: toggling ? 0.6 : 1,
          cursor: toggling ? "wait" : "pointer",
        }}
        title={enabled ? t("disableLabel", { label }) : t("enableLabel", { label })}
      >
        <span
          className="inline-block w-5 h-5 rounded-full shadow-sm transition-[transform,background-color] duration-200"
          style={{
            transform: enabled ? "translateX(26px)" : "translateX(3px)",
            background: enabled ? "#fff" : "var(--color-text-muted)",
          }}
        />
      </button>

      <span
        className="text-xs font-medium min-w-[24px]"
        style={{ color: enabled ? "var(--color-text-main)" : "var(--color-text-muted)" }}
      >
        {toggling ? "..." : enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
}

function TransportSelector({
  value,
  onChange,
  disabled,
  baseUrl,
}: {
  value: McpTransport;
  onChange: (t: McpTransport) => void;
  disabled: boolean;
  baseUrl: string;
}) {
  const t = useTranslations("mcpDashboard");
  const options: { value: McpTransport; label: string; desc: string }[] = [
    { value: "stdio", label: "stdio", desc: t("transportStdioDesc") },
    { value: "sse", label: "SSE", desc: t("transportSseDesc") },
    {
      value: "streamable-http",
      label: "Streamable HTTP",
      desc: t("transportStreamableHttpDesc"),
    },
  ];

  const urlMap: Record<McpTransport, string> = {
    stdio: "omniroute --mcp",
    sse: `${baseUrl}/api/mcp/sse`,
    "streamable-http": `${baseUrl}/api/mcp/stream`,
  };

  return (
    <div
      className="rounded-card border p-4"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="material-symbols-outlined text-base"
          style={{ color: "var(--color-text-muted)" }}
        >
          swap_horiz
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-main)" }}>
          {t("transportMode")}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className="flex flex-col items-start px-4 py-2.5 rounded-lg border transition-colors duration-150 text-left"
            style={{
              borderColor: value === opt.value ? "var(--color-primary)" : "var(--color-border)",
              background:
                value === opt.value
                  ? "color-mix(in srgb, var(--color-primary) 8%, transparent)"
                  : "transparent",
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "wait" : "pointer",
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{
                color: value === opt.value ? "var(--color-primary)" : "var(--color-text-main)",
              }}
            >
              {opt.label}
            </span>
            <span className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {opt.desc}
            </span>
          </button>
        ))}
      </div>

      <div
        className="mt-3 rounded-md px-3 py-2 flex items-center gap-2"
        style={{ background: "var(--color-bg-subtle)" }}
      >
        <span
          className="material-symbols-outlined text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {value === "stdio" ? "terminal" : "link"}
        </span>
        <code
          className="font-mono text-[12px] break-all"
          style={{ color: "var(--color-text-muted)" }}
        >
          {urlMap[value]}
        </code>
        {value !== "stdio" && (
          <button
            className="ml-auto text-xs font-medium px-2 py-0.5 rounded-control border hover:opacity-80 transition-opacity"
            style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-main)" }}
            onClick={() => void copyToClipboard(urlMap[value])}
            title={t("mcpDashboardCopyUrl")}
          >
            {t("copy")}
          </button>
        )}
      </div>
    </div>
  );
}

function DisabledPanel() {
  const t = useTranslations("mcpDashboard");
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: "var(--color-bg-subtle)" }}
        >
          <span
            aria-hidden="true"
            className="relative block size-5 rounded-full border-2"
            style={{ borderColor: "var(--color-text-muted)" }}
          >
            <span
              className="absolute left-1/2 top-[-3px] h-3 w-0.5 -translate-x-1/2 rounded-full"
              style={{ background: "var(--color-text-muted)" }}
            />
          </span>
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-main)" }}>
            {t("mcpDisabledTitle")}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {t("mcpDisabledDesc")}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function McpPage() {
  const t = useTranslations("mcpDashboard");
  const [mcpStatus, setMcpStatus] = useState<ServiceStatus>({ online: false, loading: true });
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [mcpToggling, setMcpToggling] = useState(false);
  const [mcpTransport, setMcpTransport] = useState<McpTransport>("stdio");
  const [transportSaving, setTransportSaving] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      setBaseUrl(`${window.location.protocol}//${window.location.host}`);
    })();
  }, []);

  const patchSetting = useCallback(async (body: Record<string, unknown>) => {
    return fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setMcpEnabled(!!data.mcpEnabled);
          setMcpTransport((data.mcpTransport as McpTransport) || "stdio");
        }
      } catch {
        // defaults stay
      }
    };
    void fetchSettings();
  }, []);

  const refreshStatus = useCallback(async () => {
    setMcpStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/mcp/status");
      setMcpStatus({ online: res.ok ? !!(await res.json()).online : false, loading: false });
    } catch {
      setMcpStatus({ online: false, loading: false });
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshStatus();
    })();
    const interval = setInterval(() => void refreshStatus(), 30000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const toggleMcp = useCallback(async () => {
    const newValue = !mcpEnabled;
    setMcpToggling(true);
    try {
      const res = await patchSetting({ mcpEnabled: newValue });
      if (res.ok) setMcpEnabled(newValue);
    } catch {
      // keep current
    } finally {
      setMcpToggling(false);
    }
  }, [mcpEnabled, patchSetting]);

  const changeTransport = useCallback(
    async (newTransport: McpTransport) => {
      setTransportSaving(true);
      try {
        const res = await patchSetting({ mcpTransport: newTransport });
        if (res.ok) setMcpTransport(newTransport);
      } catch {
        // keep current
      } finally {
        setTransportSaving(false);
      }
    },
    [patchSetting]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t("mcpIntro", { tools: 37, scopes: 13, transports: 3 })}
            </p>
            <ol
              className="mt-2 text-sm space-y-0.5 list-decimal list-inside"
              style={{ color: "var(--color-text-muted)" }}
            >
              <li>
                {t.rich("mcpStep1", {
                  code: (chunks) => <code className="font-mono text-[12px]">{chunks}</code>,
                })}
              </li>
              <li>{t("mcpStep2")}</li>
              <li>
                {t.rich("mcpStep3", {
                  code1: (chunks) => <code className="text-xs">omniroute_get_health</code>,
                  code2: (chunks) => <code className="text-xs">omniroute_list_combos</code>,
                })}
              </li>
            </ol>
          </div>
          <div className="shrink-0">
            <ServiceToggle
              label="MCP"
              status={mcpStatus}
              enabled={mcpEnabled}
              onToggle={() => void toggleMcp()}
              toggling={mcpToggling}
            />
          </div>
        </div>
      </Card>

      {mcpEnabled && (
        <TransportSelector
          value={mcpTransport}
          onChange={(t) => void changeTransport(t)}
          disabled={transportSaving}
          baseUrl={baseUrl}
        />
      )}

      {mcpEnabled ? <McpDashboardPage /> : <DisabledPanel />}
    </div>
  );
}
