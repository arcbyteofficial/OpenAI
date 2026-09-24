"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RoutingEntryLink({ apiKeyId }: { apiKeyId?: string }) {
  const t = useTranslations("reasoningRouting.editor");
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-text-main">{t("pageTitle")}</p>
        <p className="mt-1 text-sm text-text-muted">{t("entryHint")}</p>
      </div>
      <Link
        href={
          apiKeyId
            ? "/dashboard/api-manager/routing?apiKeyId=" + encodeURIComponent(apiKeyId)
            : "/dashboard/api-manager/routing"
        }
        className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-text-main transition-colors hover:bg-bg-subtle focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="material-symbols-outlined text-[16px] text-text-muted" aria-hidden="true">
          route
        </span>
        {t("configure")}
      </Link>
    </div>
  );
}
