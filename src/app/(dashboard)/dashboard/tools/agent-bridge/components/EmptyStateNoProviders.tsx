"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Empty state shown when no providers are configured.
 * Matches plan 11 §7.
 */
export function EmptyStateNoProviders() {
  const t = useTranslations("agentBridge");

  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong bg-surface px-8 py-14 text-center gap-4">
      <div className="p-3 rounded-card border border-border bg-bg-subtle">
        <span className="material-symbols-outlined text-[24px] text-text-muted">dns</span>
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-text-main mb-1">
          {t("emptyNoProvidersTitle") || "No providers configured yet"}
        </h3>
        <p className="text-sm text-text-muted max-w-sm">
          {t("emptyNoProvidersBody") ||
            "To use AgentBridge, first connect at least one provider. It will be the destination where IDE requests are routed."}
        </p>
      </div>
      <Link
        href="/dashboard/providers"
        className="inline-flex items-center gap-2 rounded-control bg-contrast px-4 py-2 text-sm font-medium text-contrast-fg hover:bg-contrast-hover transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        {t("emptyGoToProviders") || "Go to Providers"}
      </Link>
    </div>
  );
}
