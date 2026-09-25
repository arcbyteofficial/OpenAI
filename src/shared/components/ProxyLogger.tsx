"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import Card from "./Card";
import ProxyLogDetail from "./ProxyLogDetail";
import {
  TYPE_COLORS,
  LEVEL_COLORS,
  PROVIDER_COLORS,
  getProxyStatusStyle as getStatusStyle,
} from "@/shared/constants/colors";
import {
  formatTime,
  formatDuration as formatLatency,
  truncateUrl,
} from "@/shared/utils/formatting";
import { getProviderDisplayLabel } from "@/shared/utils/providerDisplayLabel";
import {
  LOG_TABLE_CLASS,
  LOG_TABLE_HEAD_CLASS,
  LOG_TABLE_HEADER_BG_STYLE,
  LOG_TABLE_HEADER_CELL_CLASS,
  LOG_TABLE_HEADER_CELL_RIGHT_CLASS,
  LOG_TABLE_ROW_CLASS,
} from "./logTableStyles";

const PROXY_COLUMN_KEYS = [
  "status",
  "proxy",
  "tls",
  "type",
  "level",
  "provider",
  "target",
  "latency",
  "ip",
  "time",
];

const DEFAULT_VISIBLE = Object.fromEntries(PROXY_COLUMN_KEYS.map((key) => [key, true]));

export default function ProxyLogger() {
  const t = useTranslations("proxyLogger");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedType, setSelectedType] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedLog, setSelectedLog] = useState(null);
  const [providerNodes, setProviderNodes] = useState<
    Array<{ id?: string; prefix?: string; name?: string }>
  >([]);
  const intervalRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const logsSignatureRef = useRef("");

  const statusFilters = useMemo(
    () => [
      { key: "all", label: t("filterAll") },
      { key: "error", label: t("filterErrors"), icon: "error" },
      { key: "ok", label: t("filterSuccess"), icon: "check_circle" },
      { key: "timeout", label: t("filterTimeout"), icon: "timer_off" },
    ],
    [t]
  );

  const columns = useMemo(
    () => [
      { key: "status", label: t("colStatus") },
      { key: "proxy", label: t("colProxy") },
      { key: "tls", label: t("colTls") },
      { key: "type", label: t("colType") },
      { key: "level", label: t("colLevel") },
      { key: "provider", label: t("colProvider") },
      { key: "target", label: t("colTarget") },
      { key: "latency", label: t("colLatency") },
      { key: "ip", label: t("colClientIp") },
      { key: "time", label: t("colTime") },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE;
    try {
      const saved = localStorage.getItem("proxyLoggerVisibleColumns");
      return saved ? { ...DEFAULT_VISIBLE, ...JSON.parse(saved) } : DEFAULT_VISIBLE;
    } catch {
      return DEFAULT_VISIBLE;
    }
  });

  const toggleColumn = useCallback((key) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("proxyLoggerVisibleColumns", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const fetchLogs = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (activeFilter === "error") params.set("status", "error");
        if (activeFilter === "ok") params.set("status", "ok");
        if (activeFilter === "timeout") params.set("status", "timeout");
        if (selectedType) params.set("type", selectedType);
        if (selectedProvider) params.set("provider", selectedProvider);
        if (selectedLevel) params.set("level", selectedLevel);
        params.set("limit", "300");

        const res = await fetch(`/api/usage/proxy-logs?${params}`);
        if (res.ok) {
          const data = await res.json();
          // Skip re-render if data hasn't changed (#1369 GPU perf)
          const sig = JSON.stringify(data.map?.((l: any) => l.id) ?? []);
          if (sig !== logsSignatureRef.current) {
            logsSignatureRef.current = sig;
            setLogs(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch proxy logs:", error);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [search, activeFilter, selectedType, selectedProvider, selectedLevel]
  );

  useEffect(() => {
    const showLoading = !hasLoadedRef.current;
    hasLoadedRef.current = true;
    fetchLogs(showLoading);
  }, [fetchLogs]);

  // Fetch provider nodes for display labels
  useEffect(() => {
    fetch("/api/provider-nodes")
      .then((r) => (r.ok ? r.json() : { nodes: [] }))
      .then((d) => setProviderNodes(d.nodes || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recording) {
      intervalRef.current = setInterval(() => fetchLogs(false), 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [recording, fetchLogs]);

  const sortedLogs = useMemo(() => {
    const arr = [...logs];
    arr.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "latency_desc":
          return (b.latencyMs || 0) - (a.latencyMs || 0);
        case "latency_asc":
          return (a.latencyMs || 0) - (b.latencyMs || 0);
        case "newest":
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });
    return arr;
  }, [logs, sortBy]);

  const uniqueProviders = [...new Set(logs.map((l) => l.provider).filter(Boolean))].sort();
  const uniqueTypes = [...new Set(logs.map((l) => l.proxy?.type).filter(Boolean))].sort();
  const uniqueLevels = [...new Set(logs.map((l) => l.level).filter(Boolean))].sort();

  const totalCount = logs.length;
  const okCount = logs.filter((l) => l.status === "success").length;
  const errorCount = logs.filter((l) => l.status === "error").length;
  const timeoutCount = logs.filter((l) => l.status === "timeout").length;
  const directCount = logs.filter((l) => l.level === "direct").length;
  const tlsCount = logs.filter((l) => l.tlsFingerprint).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Recording Toggle */}
        <button
          onClick={() => setRecording(!recording)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            recording
              ? "bg-error/10 border-error/30 text-error"
              : "bg-surface border-border-strong text-text-muted hover:bg-bg-subtle"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${recording ? "bg-error animate-pulse" : "bg-text-subtle"}`}
          />
          {recording ? t("recording") : t("paused")}
        </button>

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-10 pr-4 rounded-control bg-surface border border-border-strong text-[13px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus"
          />
        </div>

        {/* Type Dropdown */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="h-8 px-2.5 rounded-control bg-surface border border-border-strong text-[13px] text-text-main focus:outline-none focus:border-focus appearance-none cursor-pointer min-w-[120px]"
        >
          <option value="">{t("allTypes")}</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {(TYPE_COLORS[t]?.label || t).toUpperCase()}
            </option>
          ))}
        </select>

        {/* Level Dropdown */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="h-8 px-2.5 rounded-control bg-surface border border-border-strong text-[13px] text-text-main focus:outline-none focus:border-focus appearance-none cursor-pointer min-w-[120px]"
        >
          <option value="">{t("allLevels")}</option>
          {uniqueLevels.map((l) => (
            <option key={l} value={l}>
              {LEVEL_COLORS[l]?.label || l}
            </option>
          ))}
        </select>

        {/* Provider Dropdown */}
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="h-8 px-2.5 rounded-control bg-surface border border-border-strong text-[13px] text-text-main focus:outline-none focus:border-focus appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="">{t("allProviders")}</option>
          {uniqueProviders.map((p) => {
            const pc = PROVIDER_COLORS[p];
            return (
              <option key={p} value={p}>
                {pc?.label || p.toUpperCase()}
              </option>
            );
          })}
        </select>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="px-2 py-1 rounded-md bg-bg-subtle border border-border font-mono tabular-nums">
            {totalCount} {t("total")}
          </span>
          <span className="px-2 py-1 rounded-md bg-success/10 text-success font-mono tabular-nums">
            {okCount} {t("ok")}
          </span>
          {errorCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-error/10 text-error font-mono tabular-nums">
              {errorCount} {t("err")}
            </span>
          )}
          {timeoutCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-warning/10 text-warning font-mono tabular-nums">
              {timeoutCount} {t("timeoutShort")}
            </span>
          )}
          {directCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-bg-subtle text-text-muted font-mono tabular-nums">
              {directCount} {t("direct")}
            </span>
          )}
          {tlsCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-bg-subtle text-text-muted font-mono tabular-nums">
              🔒 {tlsCount} TLS
            </span>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-8 px-2.5 rounded-control bg-surface border border-border-strong text-[13px] text-text-main focus:outline-none focus:border-focus appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="newest">{t("newest")}</option>
          <option value="oldest">{t("oldest")}</option>
          <option value="latency_desc">{t("latencyDesc")}</option>
          <option value="latency_asc">{t("latencyAsc")}</option>
        </select>

        {/* Refresh */}
        <button
          onClick={() => fetchLogs(false)}
          className="p-2 rounded-control hover:bg-bg-subtle text-text-muted hover:text-text-main transition-colors"
          title={t("refresh")}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(activeFilter === f.key ? "all" : f.key)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeFilter === f.key
                ? f.key === "error"
                  ? "bg-error/10 text-error border-error/30"
                  : f.key === "ok"
                    ? "bg-success/10 text-success border-success/30"
                    : f.key === "timeout"
                      ? "bg-warning/10 text-warning border-warning/30"
                      : "bg-contrast text-contrast-fg border-contrast"
                : "bg-surface border-border text-text-muted hover:border-border-strong hover:text-text-main"
            }`}
          >
            {f.icon && <span className="material-symbols-outlined text-[14px]">{f.icon}</span>}
            {f.label}
          </button>
        ))}

        {uniqueProviders.length > 0 && <span className="w-px h-5 bg-border mx-1" />}

        {uniqueProviders.map((p) => {
          const pc = PROVIDER_COLORS[p] || { bg: "#374151", text: "#fff", label: p.toUpperCase() };
          const isActive = selectedProvider === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedProvider(isActive ? "" : p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border transition ${
                isActive
                  ? "border-transparent ring-1 ring-text-main/30"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              style={{
                backgroundColor: isActive ? pc.bg : `${pc.bg}33`,
                color: isActive ? pc.text : pc.bg,
              }}
            >
              {pc.label}
            </button>
          );
        })}
      </div>

      {/* Column Visibility Toggles */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mr-1">
          {t("columns")}
        </span>
        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => toggleColumn(col.key)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
              visibleColumns[col.key]
                ? "bg-surface text-text-main border-border-strong"
                : "bg-transparent text-text-subtle border-border opacity-60 hover:opacity-100"
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden bg-surface">
        <div className="p-0 overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">{t("loadingProxyLogs")}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <span className="material-symbols-outlined text-[48px] mb-2 block opacity-40">
                vpn_lock
              </span>
              {t("noProxyLogs")}
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">{t("noMatchingLogs")}</div>
          ) : (
            <table className={LOG_TABLE_CLASS}>
              <thead className={LOG_TABLE_HEAD_CLASS} style={LOG_TABLE_HEADER_BG_STYLE}>
                <tr className={LOG_TABLE_ROW_CLASS} style={LOG_TABLE_HEADER_BG_STYLE}>
                  {visibleColumns.status && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colStatus")}</th>
                  )}
                  {visibleColumns.proxy && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colProxy")}</th>
                  )}
                  {visibleColumns.tls && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colTls")}</th>
                  )}
                  {visibleColumns.type && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colType")}</th>
                  )}
                  {visibleColumns.level && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colLevel")}</th>
                  )}
                  {visibleColumns.provider && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colProvider")}</th>
                  )}
                  {visibleColumns.target && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colTarget")}</th>
                  )}
                  {visibleColumns.latency && (
                    <th className={LOG_TABLE_HEADER_CELL_RIGHT_CLASS}>{t("colLatency")}</th>
                  )}
                  {visibleColumns.ip && (
                    <th className={LOG_TABLE_HEADER_CELL_CLASS}>{t("colClientIp")}</th>
                  )}
                  {visibleColumns.time && (
                    <th className={LOG_TABLE_HEADER_CELL_RIGHT_CLASS}>{t("colTime")}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedLogs.map((log) => {
                  const statusStyle = getStatusStyle(log.status);
                  const typeColor = TYPE_COLORS[log.proxy?.type] || {
                    bg: "#6B7280",
                    text: "#fff",
                    label: log.proxy?.type || "-",
                  };
                  const levelColor = LEVEL_COLORS[log.level] || LEVEL_COLORS.direct;
                  const resolvedProviderLabel =
                    getProviderDisplayLabel(log.provider, providerNodes) ||
                    (log.provider || "-").toUpperCase();
                  const providerColor = PROVIDER_COLORS[log.provider] || {
                    bg: "#374151",
                    text: "#fff",
                    label: resolvedProviderLabel,
                  };
                  const isError = log.status === "error" || log.status === "timeout";

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      className={`cursor-pointer hover:bg-sky-500/10 dark:hover:bg-sky-400/10 transition-colors ${isError ? "bg-error/5" : ""}`}
                    >
                      {visibleColumns.status && (
                        <td className="px-3 py-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold min-w-[50px] text-center uppercase"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          >
                            {log.status}
                          </span>
                        </td>
                      )}
                      {visibleColumns.proxy && (
                        <td className="px-3 py-2 font-mono text-[11px] text-text-main">
                          {log.proxy
                            ? log.proxy.name || `${log.proxy.host}:${log.proxy.port}`
                            : "—"}
                        </td>
                      )}
                      {visibleColumns.tls && (
                        <td className="px-3 py-2">
                          {log.tlsFingerprint ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase"
                              style={{
                                backgroundColor:
                                  "color-mix(in srgb, var(--color-success) 12%, transparent)",
                                color: "var(--color-success)",
                              }}
                              title={t("tlsFingerprint")}
                            >
                              <span style={{ fontSize: "10px" }}>🔒</span> TLS
                            </span>
                          ) : (
                            <span className="text-text-muted text-[10px]">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.type && (
                        <td className="px-3 py-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold uppercase"
                            style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                          >
                            {typeColor.label}
                          </span>
                        </td>
                      )}
                      {visibleColumns.level && (
                        <td className="px-3 py-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold uppercase"
                            style={{ backgroundColor: levelColor.bg, color: levelColor.text }}
                          >
                            {levelColor.label}
                          </span>
                        </td>
                      )}
                      {visibleColumns.provider && (
                        <td className="px-3 py-2">
                          {log.provider ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold uppercase"
                              style={{
                                backgroundColor: providerColor.bg,
                                color: providerColor.text,
                              }}
                            >
                              {providerColor.label}
                            </span>
                          ) : (
                            <span className="text-text-muted text-[10px]">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.target && (
                        <td
                          className="px-3 py-2 text-text-muted truncate max-w-[200px] font-mono text-[10px]"
                          title={log.targetUrl}
                        >
                          {truncateUrl(log.targetUrl)}
                        </td>
                      )}
                      {visibleColumns.latency && (
                        <td className="px-3 py-2 text-right text-text-muted font-mono tabular-nums">
                          {formatLatency(log.latencyMs)}
                        </td>
                      )}
                      {visibleColumns.ip && (
                        <td className="px-3 py-2 font-mono text-[11px] text-text-muted">
                          {log.clientIp || "—"}
                        </td>
                      )}
                      {visibleColumns.time && (
                        <td className="px-3 py-2 text-right text-text-muted tabular-nums">
                          {formatTime(log.timestamp)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Detail Panel */}
      {selectedLog && <ProxyLogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
