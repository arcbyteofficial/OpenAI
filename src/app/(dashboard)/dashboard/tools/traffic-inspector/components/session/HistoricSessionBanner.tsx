"use client";

import { useTranslations } from "next-intl";

interface HistoricSessionBannerProps {
  sessionName: string | null;
  onBackToLive: () => void;
}

export function HistoricSessionBanner({ sessionName, onBackToLive }: HistoricSessionBannerProps) {
  const t = useTranslations("trafficInspector");
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-text-main">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-warning" aria-hidden="true">
          history
        </span>
        <span>
          {t("viewingRecordedSession")} — <strong>{sessionName ?? t("untitledSession")}</strong>
        </span>
      </div>
      <button
        type="button"
        onClick={onBackToLive}
        className="rounded-control border border-border-strong bg-surface px-2 py-0.5 text-xs font-medium text-text-main hover:bg-bg-subtle transition-colors focus-ring"
      >
        {t("backToLive")}
      </button>
    </div>
  );
}
