"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Card from "./Card";
import { matchesOnlyPaidModels } from "@/shared/utils/freeModels";

export interface ModelMapping {
  id: string;
  pattern: string;
  comboId: string;
  comboName?: string;
  priority: number;
  enabled: boolean;
  description: string;
}

interface Combo {
  id: string;
  name: string;
}

export default function ModelRoutingSection({ combos: externalCombos }: { combos?: Combo[] } = {}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [mappings, setMappings] = useState<ModelMapping[]>([]);
  const [internalCombos, setInternalCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidePaidModels, setHidePaidModels] = useState(false);
  const combos = externalCombos || internalCombos;

  // Form state
  const [pattern, setPattern] = useState("");
  const [comboId, setComboId] = useState("");
  const [priority, setPriority] = useState(0);
  const [description, setDescription] = useState("");

  const loadMappings = async () => {
    try {
      const res = await fetch("/api/model-combo-mappings");
      if (res.ok) {
        const data = await res.json();
        return data.mappings || [];
      }
    } catch {}
    return [];
  };

  useEffect(() => {
    let cancelled = false;
    loadMappings().then((data) => {
      if (!cancelled) {
        setMappings(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // #6540: read hidePaidModels once so the pattern field can warn (fail-open)
  // when it resolves only to paid model families.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setHidePaidModels(data.hidePaidModels === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (externalCombos !== undefined) return;
    let cancelled = false;
    fetch("/api/combos")
      .then((res) => (res.ok ? res.json() : { combos: [] }))
      .then((data) => {
        if (!cancelled) {
          setInternalCombos(Array.isArray(data?.combos) ? data.combos : []);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [externalCombos]);

  const refetchMappings = async () => {
    const data = await loadMappings();
    setMappings(data);
  };

  const resetForm = () => {
    setPattern("");
    setComboId("");
    setPriority(0);
    setDescription("");
    setAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!pattern.trim() || !comboId) return;

    try {
      if (editingId) {
        const res = await fetch(`/api/model-combo-mappings/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pattern: pattern.trim(), comboId, priority, description }),
        });
        if (res.ok) await refetchMappings();
      } else {
        const res = await fetch("/api/model-combo-mappings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pattern: pattern.trim(), comboId, priority, description }),
        });
        if (res.ok) await refetchMappings();
      }
    } catch {}
    resetForm();
  };

  const handleEdit = (m: ModelMapping) => {
    setPattern(m.pattern);
    setComboId(m.comboId);
    setPriority(m.priority);
    setDescription(m.description);
    setEditingId(m.id);
    setAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteRoutingRule"))) return;
    try {
      await fetch(`/api/model-combo-mappings/${id}`, { method: "DELETE" });
      setMappings((prev) => prev.filter((m) => m.id !== id));
    } catch {}
  };

  const handleToggle = async (m: ModelMapping) => {
    try {
      const res = await fetch(`/api/model-combo-mappings/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !m.enabled }),
      });
      if (res.ok) {
        setMappings((prev) => prev.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)));
      }
    } catch {}
  };

  // #6540: fail-open heuristic — only warn/block when the pattern resolves
  // to at least one model AND every match is paid. A pattern matching a
  // mix of free and paid models (or nothing recognizable) is left alone.
  const patternIsPaidOnly = hidePaidModels && matchesOnlyPaidModels(pattern);

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-bg-subtle text-text-muted">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              route
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-text-main">
              {t("modelRoutingTitle")}
            </h3>
            <p className="text-sm text-text-muted">{t("modelRoutingDesc")}</p>
          </div>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-control
                       border border-border-strong bg-surface text-text-main hover:bg-bg-subtle transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            {t("addRule")}
          </button>
        )}
      </div>

      {/* Inline form */}
      {adding && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-bg-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-text-subtle uppercase tracking-wider">
                {t("pattern")}
              </label>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="claude-sonnet*"
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-control border border-border-strong
                           bg-surface text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
              />
              <p className="text-[11px] text-text-subtle mt-0.5">{t("patternHint")}</p>
              {patternIsPaidOnly && (
                <p className="text-[11px] text-warning mt-0.5">
                  {t("paidModelPatternWarning") ||
                    "This pattern only matches paid models — enable paid models or adjust the pattern."}
                </p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-subtle uppercase tracking-wider">
                {t("routeToCombo")}
              </label>
              <select
                value={comboId}
                onChange={(e) => setComboId(e.target.value)}
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-control border border-border-strong
                           bg-surface text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
              >
                <option value="">{t("selectCombo")}</option>
                {combos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-subtle uppercase tracking-wider">
                {t("priority")}
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-control border border-border-strong
                           bg-surface text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
              />
              <p className="text-[11px] text-text-subtle mt-0.5">{t("priorityHint")}</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-subtle uppercase tracking-wider">
                {t("description")}
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("modelRoutingDescriptionPlaceholder")}
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-control border border-border-strong
                           bg-surface text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleSave}
              disabled={!pattern.trim() || !comboId || patternIsPaidOnly}
              className="px-3 py-1 text-xs font-medium rounded-control bg-contrast text-contrast-fg
                         hover:bg-contrast-hover disabled:opacity-40 transition-colors"
            >
              {editingId ? t("update") : t("save")}
            </button>
            <button
              onClick={resetForm}
              className="px-3 py-1 text-xs font-medium rounded-control
                         text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Mappings list */}
      {loading ? (
        <div className="mt-3 text-xs text-text-muted">{t("loading")}</div>
      ) : mappings.length === 0 ? (
        <div className="mt-3 text-center py-4">
          <p className="text-xs text-text-muted">{t("noRoutingRules")}</p>
          <p className="text-[11px] text-text-subtle mt-1">{t("routingRuleHint")}</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-1.5">
          {mappings.map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors
                ${
                  m.enabled
                    ? "border-border bg-surface hover:border-border-strong"
                    : "border-border bg-bg-subtle opacity-50"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-[12px] px-1.5 py-0.5 rounded bg-bg-subtle text-text-main font-mono shrink-0">
                  {m.pattern}
                </code>
                <span className="text-text-muted text-[10px]">→</span>
                <span className="text-xs font-medium text-text-main truncate">
                  {m.comboName || m.comboId.slice(0, 8)}
                </span>
                {m.description && (
                  <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                    {m.description}
                  </span>
                )}
                <span className="text-[10px] px-1 py-0.5 rounded bg-bg-subtle text-text-muted font-mono tabular-nums shrink-0">
                  P{m.priority}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(m)}
                  className="p-1 rounded-md text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors"
                  title={m.enabled ? t("disable") : t("enable")}
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${m.enabled ? "text-primary" : "text-text-muted"}`}
                  >
                    {m.enabled ? "toggle_on" : "toggle_off"}
                  </span>
                </button>
                <button
                  onClick={() => handleEdit(m)}
                  className="p-1 rounded-md text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors"
                  title={tCommon("edit")}
                >
                  <span className="material-symbols-outlined text-[14px] text-text-muted">
                    edit
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1 rounded-md hover:bg-error/10 transition-colors"
                  title={tCommon("delete")}
                >
                  <span className="material-symbols-outlined text-[14px] text-error">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
