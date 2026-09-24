"use client";

import { useTranslations } from "next-intl";

/**
 * 403 Forbidden Page — Phase 8.1
 *
 * Displayed when access is denied due to:
 * - Invalid API key
 * - IP not in allowlist
 * - Rate limit exceeded
 */

import Link from "next/link";

export default function ForbiddenPage() {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-bg text-text-main text-center">
      <div className="text-[72px] font-semibold tracking-tight leading-none mb-4 text-text-subtle tabular-nums">
        403
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">{t("accessDenied")}</h1>
      <p className="text-sm text-text-muted max-w-[400px] leading-relaxed mb-6">
        {t("accessDeniedDescription")}
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2.5 rounded-control bg-contrast text-contrast-fg text-sm font-medium no-underline hover:bg-contrast-hover transition-colors duration-150 motion-reduce:transition-none"
      >
        {t("goToDashboard")}
      </Link>
    </div>
  );
}
