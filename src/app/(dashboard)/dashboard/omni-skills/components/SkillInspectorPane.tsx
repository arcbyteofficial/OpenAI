"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { OmniSkill } from "./OmniSkillCard";

interface SkillDetail extends OmniSkill {
  schema?: {
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  };
  handler?: string;
}

interface SkillExecution {
  id: string;
  skillId: string;
  skillName: string;
  status: string;
  duration: number;
  createdAt: string;
}

type InspectorTab = "schema" | "handler" | "executions" | "sandbox";

interface SkillInspectorPaneProps {
  selectedSkillId: string | null;
  skill: OmniSkill | null;
  onSetMode: (skillId: string, mode: "on" | "off" | "auto") => void;
  onUninstall: (skillId: string) => void;
}

export function SkillInspectorPane({
  selectedSkillId,
  skill,
  onSetMode,
  onUninstall,
}: SkillInspectorPaneProps): JSX.Element {
  const locale = useLocale();
  const t = useTranslations("skills");
  const [activeTab, setActiveTab] = useState<InspectorTab>("schema");
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [executions, setExecutions] = useState<SkillExecution[]>([]);
  const [loadingExecs, setLoadingExecs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!selectedSkillId) {
      // Reset via microtask to avoid synchronous setState-in-effect
      Promise.resolve().then(() => {
        if (!cancelled) {
          setDetail(null);
          setExecutions([]);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    // Fetch full skill detail for schema + handler
    fetch(`/api/skills/${selectedSkillId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SkillDetail | null) => {
        if (!cancelled && data) setDetail(data);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [selectedSkillId]);

  useEffect(() => {
    if (!selectedSkillId || activeTab !== "executions") return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoadingExecs(true);
    });
    fetch(`/api/skills/executions?skillId=${selectedSkillId}&limit=20`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((data: { data?: SkillExecution[] }) => {
        if (!cancelled) {
          setExecutions(data.data || []);
          setLoadingExecs(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingExecs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSkillId, activeTab]);

  if (!selectedSkillId || !skill) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-text-muted text-sm text-center p-6">
        <span className="material-symbols-outlined text-[32px] mb-3 text-text-subtle">
          manage_search
        </span>
        <span>{t("selectSkillToInspect")}</span>
      </div>
    );
  }

  const effectiveMode = skill.mode || (skill.enabled ? "on" : "off");

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "schema", label: t("schemaTab") },
    { id: "handler", label: t("handlerTab") },
    { id: "executions", label: t("executionsTab") },
    { id: "sandbox", label: t("sandboxTab") },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Inspector header */}
      <div className="px-4 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[18px] text-text-muted">
            auto_fix_high
          </span>
          <h3 className="font-semibold tracking-tight text-text-main text-sm">{skill.name}</h3>
        </div>
        <p className="text-xs text-text-muted line-clamp-2">{skill.description}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              effectiveMode === "on"
                ? "bg-success/10 text-success"
                : effectiveMode === "auto"
                  ? "bg-warning/10 text-warning"
                  : "bg-bg-subtle text-text-muted"
            }`}
          >
            {t("mode")}: {effectiveMode}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-text-muted">
            {(skill.sourceProvider || "local").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Inspector sub-tabs */}
      <div className="flex gap-0 border-b border-border px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-text-main text-text-main"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inspector content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "schema" && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1.5">
                {t("inputSchema")}
              </p>
              <pre className="text-xs bg-bg-subtle border border-border rounded-lg p-3 overflow-auto max-h-[200px] text-text-main font-mono whitespace-pre-wrap">
                {JSON.stringify(detail?.schema?.input ?? {}, null, 2) || "{}"}
              </pre>
            </div>
            <div>
              <p className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1.5">
                {t("outputSchema")}
              </p>
              <pre className="text-xs bg-bg-subtle border border-border rounded-lg p-3 overflow-auto max-h-[200px] text-text-main font-mono whitespace-pre-wrap">
                {JSON.stringify(detail?.schema?.output ?? {}, null, 2) || "{}"}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "handler" && (
          <div>
            <p className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1.5">
              {t("handlerCode")}
            </p>
            <pre className="text-xs bg-bg-subtle border border-border rounded-lg p-3 overflow-auto max-h-[400px] text-text-main font-mono whitespace-pre-wrap">
              {detail?.handler ?? `// ${t("handlerUnavailable")}`}
            </pre>
          </div>
        )}

        {activeTab === "executions" && (
          <div>
            {loadingExecs ? (
              <div className="text-xs text-text-muted">{t("loading")}...</div>
            ) : executions.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-6">{t("noExecutions")}</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border">
                    <th className="pb-2 font-medium">{t("status")}</th>
                    <th className="pb-2 font-medium">{t("duration")}</th>
                    <th className="pb-2 font-medium">{t("time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr key={exec.id} className="border-b border-border last:border-b-0">
                      <td className="py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium ${
                            exec.status === "success"
                              ? "bg-success/10 text-success"
                              : exec.status === "error"
                                ? "bg-error/10 text-error"
                                : "bg-warning/10 text-warning"
                          }`}
                        >
                          {exec.status}
                        </span>
                      </td>
                      <td className="py-2 font-mono tabular-nums text-text-muted">
                        {exec.duration}ms
                      </td>
                      <td className="py-2 text-text-muted">
                        {new Date(exec.createdAt).toLocaleString(locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "sandbox" && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1.5">
              {t("sandboxConfig")}
            </p>
            {[
              { label: t("cpuLimit"), desc: t("cpuLimitDesc"), value: "100ms" },
              { label: t("memoryLimit"), desc: t("memoryLimitDesc"), value: "256MB" },
              { label: t("timeout"), desc: t("timeoutDesc"), value: "30s" },
              { label: t("networkAccess"), desc: t("networkAccessDesc"), value: t("disabled") },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-2.5 rounded-lg bg-bg-subtle border border-border"
              >
                <div>
                  <p className="text-xs font-medium text-text-main">{item.label}</p>
                  <p className="text-[10px] text-text-muted">{item.desc}</p>
                </div>
                <span className="text-xs font-mono text-text-muted">{item.value}</span>
              </div>
            ))}
            <button className="w-full mt-3 px-3 py-2 text-xs font-medium rounded-control border border-border-strong bg-surface text-text-main hover:bg-bg-subtle transition-colors">
              {t("runTestPlaceholder")}
            </button>
          </div>
        )}
      </div>

      {/* Inspector action buttons */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-1.5">
        {(["on", "auto", "off"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onSetMode(skill.id, mode)}
            aria-label={t("setModeAria", { mode })}
            className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-control border transition-colors ${
              effectiveMode === mode
                ? mode === "on"
                  ? "border-success/40 text-success bg-success/10"
                  : mode === "auto"
                    ? "border-warning/40 text-warning bg-warning/10"
                    : "border-border-strong text-text-main bg-bg-subtle"
                : "border-border text-text-muted hover:border-border-strong hover:text-text-main"
            }`}
          >
            {mode === "on" ? t("onMode") : mode === "auto" ? t("autoMode") : t("offMode")}
          </button>
        ))}
        <button
          onClick={() => onUninstall(skill.id)}
          aria-label={t("uninstallSkill")}
          className="flex-1 text-xs font-medium px-2 py-1.5 rounded-control border border-border text-error hover:bg-error/10 transition-colors"
        >
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

export default SkillInspectorPane;
