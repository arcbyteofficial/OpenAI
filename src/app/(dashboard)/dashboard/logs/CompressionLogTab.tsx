"use client";

import { useState, useEffect } from "react";
import { Card } from "@/shared/components";
import { useTranslations } from "next-intl";

interface CompressionStats {
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
  techniquesUsed: string[];
  mode: string;
  timestamp: number;
  rulesApplied?: string[];
  durationMs?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  compressionStats?: CompressionStats | null;
}

export default function CompressionLogTab() {
  const t = useTranslations("logs");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/logs?filter=compressed&limit=50")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-text-muted">{t("loading")}</p>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-text-muted text-[18px]">compress</span>
          <h3 className="text-sm font-semibold text-text-main">{t("compressionLogTitle")}</h3>
        </div>
        <p className="text-sm text-text-muted">{t("compressionLogEmpty")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="material-symbols-outlined text-text-muted text-[18px]">compress</span>
        <h3 className="text-sm font-semibold text-text-main">{t("compressionLogTitle")}</h3>
      </div>

      <div className="space-y-3">
        {logs.map((entry) => {
          const stats = entry.compressionStats;
          if (!stats) return null;

          return (
            <div
              key={entry.id}
              className="p-3 rounded-lg border border-border bg-surface-2 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-[13px] text-text-main">
                    {entry.provider}/{entry.model}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-subtle text-text-muted border border-border">
                    {stats.mode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    {stats.originalTokens} → {stats.compressedTokens} {t("tokens")}
                  </span>
                  <span
                    className={`font-medium ${
                      stats.savingsPercent >= 25
                        ? "text-success"
                        : stats.savingsPercent >= 10
                          ? "text-warning"
                          : "text-text-muted"
                    }`}
                  >
                    -{stats.savingsPercent.toFixed(1)}%
                  </span>
                  {stats.durationMs !== undefined && <span>{stats.durationMs}ms</span>}
                </div>
              </div>

              {stats.techniquesUsed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {stats.techniquesUsed.map((technique) => (
                    <span
                      key={technique}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-bg-subtle text-text-muted border border-border"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              )}

              {stats.rulesApplied && stats.rulesApplied.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {stats.rulesApplied.map((rule) => (
                    <span
                      key={rule}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20"
                    >
                      {rule.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
