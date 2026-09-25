"use client";

import { useTranslations } from "next-intl";

/**
 * Server Error Page — P-1
 *
 * Per-page error boundary for unrecoverable errors within the
 * dashboard layout. Falls back to global-error.tsx if this fails.
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations("publicSystem");
  const tc = useTranslations("common");

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="material-symbols-outlined text-[40px] text-text-subtle mb-4"
        aria-hidden="true"
      >
        build
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2 text-text-main">
        {t("error.title")}
      </h1>
      <p className="text-sm text-text-muted max-w-[400px] leading-relaxed mb-2">
        {t("error.description")}
      </p>
      {error?.digest && (
        <p className="text-xs text-text-subtle mb-6 font-mono">
          {t("error.errorId", { id: error.digest })}
        </p>
      )}
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre
          className="p-4 rounded-lg bg-error/5 border border-error/30 text-error font-mono text-xs max-w-[600px] overflow-auto text-left mb-6"
          aria-label={t("error.detailsAriaLabel")}
        >
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          aria-label={t("error.retryAriaLabel")}
          className="px-4 py-2.5 rounded-control bg-contrast text-contrast-fg text-sm font-medium cursor-pointer transition-colors duration-150 motion-reduce:transition-none hover:bg-contrast-hover focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          {t("error.tryAgain")}
        </button>
        <a
          href="/dashboard"
          className="px-4 py-2.5 rounded-control text-text-main text-sm font-medium cursor-pointer transition-colors duration-150 motion-reduce:transition-none border border-border-strong hover:bg-bg-subtle no-underline focus:outline-2 focus:outline-offset-2 focus:outline-focus"
          aria-label={t("error.dashboardAriaLabel")}
        >
          {tc("goToDashboard")}
        </a>
        <a
          href="/status"
          className="px-4 py-2.5 rounded-control text-text-muted text-sm font-medium cursor-pointer transition-colors duration-150 motion-reduce:transition-none hover:bg-bg-subtle hover:text-text-main no-underline focus:outline-2 focus:outline-offset-2 focus:outline-focus"
          aria-label={t("error.statusAriaLabel")}
        >
          {t("error.systemStatus")}
        </a>
      </div>
    </div>
  );
}
