"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import type { SessionInfo } from "../../hooks/useSessionRecorder";

interface SessionRecorderBarProps {
  recording: boolean;
  session: SessionInfo | null;
  elapsed: number;
  onStart: (name?: string) => void;
  onStop: () => void;
}

function formatElapsed(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function SessionRecorderBar({
  recording,
  session,
  elapsed,
  onStart,
  onStop,
}: SessionRecorderBarProps) {
  const t = useTranslations("trafficInspector");
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border transition-colors",
        recording
          ? "border-error/30 bg-error/10 text-error"
          : "border-border bg-bg-subtle text-text-muted"
      )}
    >
      {recording ? (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-error animate-pulse" />
          <span className="font-mono text-xs tabular-nums">{formatElapsed(elapsed)}</span>
          {session?.name && (
            <span className="text-xs opacity-70 truncate max-w-[120px]">{session.name}</span>
          )}
          <button
            type="button"
            onClick={onStop}
            aria-label={t("stopSession")}
            className="ml-auto rounded-control border border-error/40 px-2 py-0.5 text-xs font-medium hover:bg-error/10 transition-colors focus-ring"
          >
            {t("stopSession")}
          </button>
        </>
      ) : (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-text-subtle" />
          <span className="text-xs">{t("notRecording")}</span>
          <button
            type="button"
            onClick={() => onStart()}
            aria-label={t("recordSession")}
            className="ml-auto rounded-control border border-border-strong bg-surface px-2 py-0.5 text-xs font-medium text-text-main hover:bg-bg-subtle transition-colors focus-ring"
          >
            {t("recordSession")}
          </button>
        </>
      )}
    </div>
  );
}
