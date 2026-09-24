"use client";
import { useLocale, useTranslations } from "next-intl";

/**
 * Shared status badge for CLI tool cards.
 * Shows the effective config/installation status using batch data,
 * so badges are visible even when cards are collapsed.
 * Optionally shows last-configured relative timestamp.
 */

function formatRelativeTime(
  isoDate: string,
  t: (key: string, values?: Record<string, unknown>) => string
): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return t("justNow");

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return t("justNow");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgoShort", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgoShort", { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 30) return t("daysAgoShort", { count: days });

  const months = Math.floor(days / 30);
  if (months < 12) return t("monthsAgoShort", { count: months });

  return t("yearsAgoShort", { count: Math.floor(months / 12) });
}

export default function CliStatusBadge({
  effectiveConfigStatus,
  batchStatus,
  lastConfiguredAt = null,
}) {
  const t = useTranslations("cliTools");
  const locale = useLocale();
  // Determine badge from effectiveConfigStatus or batchStatus
  const status = effectiveConfigStatus || batchStatus?.configStatus || null;

  const badges = {
    configured: {
      dotClass: "bg-success",
      badgeClass: "bg-success/10 text-success",
      text: t("configured"),
    },
    not_configured: {
      dotClass: "bg-warning",
      badgeClass: "bg-warning/10 text-warning",
      text: t("notConfigured"),
    },
    not_installed: {
      dotClass: "bg-text-subtle",
      badgeClass: "bg-bg-subtle text-text-muted",
      text: t("notInstalled"),
    },
    other: {
      dotClass: "bg-primary",
      badgeClass: "bg-primary/10 text-primary",
      text: t("custom"),
    },
    unknown: {
      dotClass: "bg-text-subtle",
      badgeClass: "bg-bg-subtle text-text-muted",
      text: t("unknown"),
    },
  };

  const badge = status ? badges[status] || badges.unknown : null;

  return (
    <>
      {badge && (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ${badge.badgeClass}`}
        >
          <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
          {badge.text}
        </span>
      )}
      {lastConfiguredAt ? (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-text-muted"
          title={t("lastSavedAt", { date: new Date(lastConfiguredAt).toLocaleString(locale) })}
        >
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {formatRelativeTime(lastConfiguredAt, t)}
        </span>
      ) : status && status !== "not_installed" ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-text-muted">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {t("never")}
        </span>
      ) : null}
    </>
  );
}
