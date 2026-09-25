"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";
import type { A2ATask, TaskState } from "@/lib/a2a/taskManager";

type TaskListResponse = {
  tasks: A2ATask[];
  total: number;
  limit: number;
  offset: number;
};

const A2A_PAGE_SIZE = 25;

const STATE_STYLES: Record<TaskState, string> = {
  submitted: "border-warning/30 bg-warning/10 text-warning",
  working: "border-primary/30 bg-primary/10 text-primary",
  completed: "border-success/30 bg-success/10 text-success",
  failed: "border-error/30 bg-error/10 text-error",
  cancelled: "border-border bg-bg-subtle text-text-muted",
};

function taskDuration(task: A2ATask): string {
  const ms = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function A2aAuditTab() {
  const t = useTranslations("compliance");
  const [data, setData] = useState<TaskListResponse>({
    tasks: [],
    total: 0,
    limit: A2A_PAGE_SIZE,
    offset: 0,
  });
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("");
  const [stateFilter, setStateFilter] = useState<TaskState | "all">("all");
  const [offset, setOffset] = useState(0);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(A2A_PAGE_SIZE));
      params.set("offset", String(offset));
      if (skillFilter) params.set("skill", skillFilter);
      if (stateFilter !== "all") params.set("state", stateFilter);

      const response = await fetch(`/api/a2a/tasks?${params.toString()}`);
      const json = (await response.json().catch(() => ({}))) as Partial<TaskListResponse>;
      setData({
        tasks: Array.isArray(json.tasks) ? json.tasks : [],
        total: Number(json.total || 0),
        limit: Number(json.limit || A2A_PAGE_SIZE),
        offset: Number(json.offset || offset),
      });
    } finally {
      setLoading(false);
    }
  }, [offset, skillFilter, stateFilter]);

  useEffect(() => {
    void (async () => {
      await fetchTasks();
    })();
  }, [fetchTasks]);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-text-main">{t("a2aAudit")}</h2>
            <p className="mt-1 text-sm text-text-muted">{t("a2aAuditDesc")}</p>
            <p className="mt-2 text-xs text-text-muted">
              {t("a2aShowingTasks", { count: data.tasks.length, total: data.total })}
            </p>
          </div>
          <button
            onClick={() => void fetchTasks()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-control border border-border-strong px-3 py-2 text-[13px] font-medium text-text-main transition-colors hover:bg-bg-subtle disabled:opacity-40"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}
            >
              refresh
            </span>
            {t("refresh")}
          </button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-subtle">
              {t("a2aSkill")}
            </span>
            <input
              value={skillFilter}
              onChange={(e) => {
                setOffset(0);
                setSkillFilter(e.target.value);
              }}
              placeholder={t("a2aSkillPlaceholder")}
              className="w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-[13px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-subtle">
              {t("a2aState")}
            </span>
            <select
              value={stateFilter}
              onChange={(e) => {
                setOffset(0);
                setStateFilter(e.target.value as TaskState | "all");
              }}
              className="w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-[13px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
            >
              <option value="all">{t("a2aAllStates")}</option>
              <option value="submitted">{t("a2aStateSubmitted")}</option>
              <option value="working">{t("a2aStateWorking")}</option>
              <option value="completed">{t("a2aStateCompleted")}</option>
              <option value="failed">{t("a2aStateFailed")}</option>
              <option value="cancelled">{t("a2aStateCancelled")}</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSkillFilter("");
                setStateFilter("all");
                setOffset(0);
              }}
              className="w-full rounded-control border border-border-strong px-3 py-2 text-[13px] font-medium text-text-main transition-colors hover:bg-bg-subtle"
            >
              {t("clearFilters")}
            </button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-text-muted">{t("a2aLoadingTasks")}</div>
        ) : data.tasks.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-[32px] text-text-subtle">
              device_hub
            </span>
            <p className="mt-3 text-sm text-text-muted">{t("a2aNoTasks")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-border bg-bg-subtle/50 text-xs text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("timestamp")}</th>
                  <th className="px-4 py-3 font-medium">{t("a2aTaskId")}</th>
                  <th className="px-4 py-3 font-medium">{t("a2aSkill")}</th>
                  <th className="px-4 py-3 font-medium">{t("a2aState")}</th>
                  <th className="px-4 py-3 font-medium">{t("duration")}</th>
                  <th className="px-4 py-3 font-medium">{t("a2aEvents")}</th>
                  <th className="px-4 py-3 font-medium">{t("a2aArtifacts")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-bg-subtle/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-muted">
                      {new Date(task.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {task.id.slice(0, 8)}&hellip;
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-main">{task.skill}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATE_STYLES[task.state]}`}
                      >
                        {t(`a2aState${task.state.charAt(0).toUpperCase()}${task.state.slice(1)}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{taskDuration(task)}</td>
                    <td className="px-4 py-3 text-text-muted">{task.events.length}</td>
                    <td className="px-4 py-3 text-text-muted">{task.artifacts.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setOffset((c) => Math.max(0, c - A2A_PAGE_SIZE))}
          disabled={offset === 0 || loading}
          className="rounded-control border border-border-strong px-3 py-2 text-[13px] font-medium text-text-main transition-colors hover:bg-bg-subtle disabled:opacity-40"
        >
          {t("previous")}
        </button>
        <button
          onClick={() => setOffset((c) => c + A2A_PAGE_SIZE)}
          disabled={offset + A2A_PAGE_SIZE >= data.total || loading}
          className="rounded-control border border-border-strong px-3 py-2 text-[13px] font-medium text-text-main transition-colors hover:bg-bg-subtle disabled:opacity-40"
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}
