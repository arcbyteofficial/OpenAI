"use client";

import { useTranslations } from "next-intl";
import type { ListFilters } from "@/mitm/inspector/types";
import type { AgentId } from "@/mitm/types";
import { cn } from "@/shared/utils/cn";
import { SessionRecorderBar } from "./session/SessionRecorderBar";
import { SessionPicker } from "./session/SessionPicker";
import type { SessionInfo } from "../hooks/useSessionRecorder";

type Profile = "llm" | "custom" | "all";

// PROFILES labels are resolved inside the component via useTranslations
const PROFILE_IDS: Profile[] = ["llm", "custom", "all"];

interface TopBarControlsProps {
  filters: ListFilters;
  onProfileChange: (p: Profile) => void;
  onHostChange: (h: string | undefined) => void;
  onAgentChange: (a: AgentId | undefined) => void;
  onStatusChange: (s: ListFilters["status"]) => void;
  liveOnly: boolean;
  onToggleLive: () => void;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
  onExport: () => void;
  connected: boolean;
  total: number;
  maxSize?: number;
  pendingCount?: number;
  // session recorder
  recording: boolean;
  session: SessionInfo | null;
  elapsed: number;
  sessions: SessionInfo[];
  onRecordStart: () => void;
  onRecordStop: () => void;
  onSessionSelect: (id: string | undefined) => void;
  onSessionDelete: (id: string) => void;
}

export function TopBarControls({
  filters,
  onProfileChange,
  onHostChange,
  onAgentChange,
  onStatusChange,
  liveOnly,
  onToggleLive,
  paused,
  onPause,
  onResume,
  onClear,
  onExport,
  connected,
  total,
  maxSize = 1000,
  pendingCount = 0,
  recording,
  session,
  elapsed,
  sessions,
  onRecordStart,
  onRecordStop,
  onSessionSelect,
  onSessionDelete,
}: TopBarControlsProps) {
  const t = useTranslations("trafficInspector");
  const profile: Profile = (filters.profile as Profile) ?? "llm";

  const profileLabels: Record<Profile, string> = {
    llm: t("profileLlmOnly"),
    custom: t("profileCustom"),
    all: t("profileAll"),
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg-subtle px-3 py-2">
      {/* Profile selector */}
      <div
        role="radiogroup"
        aria-label={t("trafficProfile")}
        className="flex items-center gap-1 rounded-control border border-border bg-bg-subtle p-0.5"
      >
        {PROFILE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={profile === id}
            onClick={() => onProfileChange(id)}
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded transition-colors focus-ring",
              profile === id
                ? "bg-surface text-text-main ring-1 ring-border"
                : "text-text-muted hover:text-text-main"
            )}
          >
            {profileLabels[id]}
          </button>
        ))}
      </div>

      {/* Host filter */}
      <input
        type="text"
        placeholder={t("filterHost")}
        defaultValue={filters.host ?? ""}
        onChange={(e) => onHostChange(e.target.value || undefined)}
        className="rounded-control border border-border-strong bg-surface px-2 py-1 text-xs text-text-main placeholder:text-text-subtle w-32 focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
      />

      {/* Status filter */}
      <select
        value={filters.status ?? ""}
        onChange={(e) => onStatusChange((e.target.value as ListFilters["status"]) || undefined)}
        className="rounded-control border border-border-strong bg-surface px-2 py-1 text-xs text-text-main focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
      >
        <option value="">{t("anyStatus")}</option>
        <option value="2xx">2xx</option>
        <option value="3xx">3xx</option>
        <option value="4xx">4xx</option>
        <option value="5xx">5xx</option>
        <option value="error">error</option>
      </select>

      {/* Live (in-flight) toggle — Gap 5 */}
      <button
        type="button"
        onClick={onToggleLive}
        aria-pressed={liveOnly}
        title={t("liveOnly")}
        className={cn(
          "inline-flex items-center gap-1 rounded-control border px-2 py-1 text-xs transition-colors focus-ring",
          liveOnly
            ? "border-success/40 bg-success/10 text-success"
            : "border-border-strong bg-surface text-text-muted hover:text-text-main hover:bg-bg-subtle"
        )}
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          sensors
        </span>
        {t("liveOnly")}
      </button>

      {/* Action buttons */}
      <button
        type="button"
        onClick={paused ? onResume : onPause}
        className="inline-flex items-center gap-1 rounded-control border border-border-strong bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors focus-ring"
        title={paused ? t("resumeBtn") : t("pauseBtn")}
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {paused ? "play_arrow" : "pause"}
        </span>
        {paused ? t("resumeBtn") : t("pauseBtn")}
      </button>

      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 rounded-control border border-border-strong bg-surface px-2 py-1 text-xs text-text-muted hover:text-error hover:bg-bg-subtle transition-colors focus-ring"
        title={t("clearBtn")}
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          delete_sweep
        </span>
        {t("clearBtn")}
      </button>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1 rounded-control border border-border-strong bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors focus-ring"
        title={t("exportHar")}
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          download
        </span>
        {t("exportHar")}
      </button>

      {/* Session controls */}
      <div className="flex items-center gap-2 ml-auto">
        <SessionPicker
          sessions={sessions}
          selectedId={filters.sessionId}
          onSelect={onSessionSelect}
          onDelete={onSessionDelete}
        />
        <SessionRecorderBar
          recording={recording}
          session={session}
          elapsed={elapsed}
          onStart={onRecordStart}
          onStop={onRecordStop}
        />

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              connected ? "bg-success animate-pulse" : "bg-text-subtle"
            )}
          />
          {connected ? t("liveBadge") : t("offlineBadge")}
          <span className="text-text-muted font-mono">
            {total}/{maxSize}
          </span>
          {paused && pendingCount > 0 && (
            <span className="inline-flex items-center rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning border border-warning/30">
              {t("pausedNewBadge", { count: pendingCount })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
