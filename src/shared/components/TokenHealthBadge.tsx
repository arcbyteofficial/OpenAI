"use client";

import { useTranslations } from "next-intl";

/**
 * TokenHealthBadge — Batch G
 *
 * Small badge in the Header showing token health status.
 * Polls /api/token-health every 60s.
 */

import { useState, useEffect } from "react";

// Theme-aware status tokens (`--orch-status-*` in src/app/globals.css) instead of the
// fixed dark-mode hexes: the badge sits in the header, which is light in light mode.
const STATUS_MAP = {
  healthy: { icon: "check_circle", color: "var(--orch-status-success)", tooltipKey: "allHealthy" },
  warning: { icon: "warning", color: "var(--orch-status-warning)", tooltipKey: "needsAttention" },
  error: { icon: "error", color: "var(--orch-status-error)", tooltipKey: "refreshFailures" },
  unknown: { icon: "help", color: "var(--orch-status-muted)", tooltipKey: "unknown" },
};

export default function TokenHealthBadge() {
  const t = useTranslations("stats");
  const [health, setHealth] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/token-health");
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch {
        // silent
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!health || health.total === 0) return null;

  const status = STATUS_MAP[health.status] || STATUS_MAP.unknown;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className="flex items-center gap-1 px-2 py-1.5 rounded-control hover:bg-bg-subtle transition-colors"
        title={t(`tokenHealthTooltips.${status.tooltipKey}`)}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ color: status.color }}>
          {status.icon}
        </span>
        {health.errored > 0 && (
          <span className="text-xs font-medium tabular-nums" style={{ color: status.color }}>
            {health.errored}
          </span>
        )}
      </button>

      {showTooltip && (
        <div
          className="absolute top-full right-0 mt-1 z-50 min-w-[200px] p-3 rounded-lg shadow-[var(--shadow-elevated)]"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            backdropFilter: "none",
          }}
        >
          <p className="text-xs font-medium text-text-main mb-2">{t("tokenHealth")}</p>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">{t("totalOAuth")}</span>
              <span className="text-text-main tabular-nums">{health.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-success">{t("healthy")}</span>
              <span className="text-text-main tabular-nums">{health.healthy}</span>
            </div>
            {health.errored > 0 && (
              <div className="flex justify-between">
                <span className="text-error">{t("errored")}</span>
                <span className="text-text-main tabular-nums">{health.errored}</span>
              </div>
            )}
            {health.warning > 0 && (
              <div className="flex justify-between">
                <span className="text-warning">{t("warning")}</span>
                <span className="text-text-main tabular-nums">{health.warning}</span>
              </div>
            )}
            {health.lastCheckAt && (
              <div className="flex justify-between mt-1 pt-1 border-t border-border">
                <span className="text-text-muted">{t("lastCheck")}</span>
                <span className="text-text-muted">
                  {new Date(health.lastCheckAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
