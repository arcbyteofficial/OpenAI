"use client";

import { Input } from "@/shared/components";
import { useTranslations } from "next-intl";

export function UsageLimitSettings({
  enabled,
  dailyLimitUsd,
  weeklyLimitUsd,
  enabledLabel,
  disabledLabel,
  onEnabledChange,
  onDailyLimitUsdChange,
  onWeeklyLimitUsdChange,
}: {
  enabled: boolean;
  dailyLimitUsd: string;
  weeklyLimitUsd: string;
  enabledLabel: string;
  disabledLabel: string;
  onEnabledChange: (enabled: boolean) => void;
  onDailyLimitUsdChange: (value: string) => void;
  onWeeklyLimitUsdChange: (value: string) => void;
}) {
  const t = useTranslations("usageLimits");
  return (
    <div className="mt-1 rounded-lg border border-border bg-surface/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-main">{t("usdUsageQuota")}</p>
          <p className="text-xs text-text-muted">{t("usdUsageQuotaDescription")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            enabled
              ? "bg-success/10 text-success border border-success/30"
              : "bg-bg-subtle text-text-muted border border-border"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">paid</span>
          {enabled ? enabledLabel : disabledLabel}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted mb-1 block">{t("dailyQuotaUsd")}</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={dailyLimitUsd}
            onChange={(event) => onDailyLimitUsdChange(event.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">{t("weeklyQuotaUsd")}</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={weeklyLimitUsd}
            onChange={(event) => onWeeklyLimitUsdChange(event.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-text-muted">{t("quotaWindowDescription")}</p>
    </div>
  );
}
