"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("publicSystem");
  const tc = useTranslations("common");

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-bg text-text-main text-center"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div
        className="text-[72px] font-semibold tracking-tight leading-none mb-4 text-text-subtle tabular-nums"
        aria-hidden="true"
      >
        404
      </div>
      <h1 id="not-found-title" className="text-2xl font-semibold tracking-tight mb-2">
        {t("notFound.title")}
      </h1>
      <p className="text-sm text-text-muted max-w-[400px] leading-relaxed mb-6">
        {t("notFound.description")}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-control bg-contrast text-contrast-fg text-sm font-medium no-underline hover:bg-contrast-hover transition-colors duration-150 motion-reduce:transition-none focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          aria-label={t("notFound.dashboardAriaLabel")}
        >
          {tc("goToDashboard")}
        </Link>
        <Link
          href="/status"
          className="px-4 py-2.5 rounded-control text-sm font-medium text-text-muted no-underline hover:bg-bg-subtle hover:text-text-main transition-colors duration-150 motion-reduce:transition-none focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          aria-label={t("notFound.statusAriaLabel")}
        >
          {t("notFound.systemStatus")}
        </Link>
      </div>
    </div>
  );
}
