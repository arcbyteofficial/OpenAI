"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE } from "@/i18n/config";
import enMessages from "@/i18n/messages/en.json";

/**
 * Global Error Page — FASE-04 Error Handling
 *
 * Root-level error boundary for unrecoverable errors.
 * This is the last resort — catches errors that the per-page
 * error.js boundaries don't handle.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getCookieLocale() {
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
  const locale = cookie?.slice(`${LOCALE_COOKIE}=`.length) || DEFAULT_LOCALE;
  return LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}

function buildGlobalErrorMessages(localeMessages: Record<string, unknown>) {
  const publicSystem = localeMessages.publicSystem;
  const globalError =
    publicSystem && typeof publicSystem === "object" && !Array.isArray(publicSystem)
      ? (publicSystem as Record<string, unknown>).globalError
      : null;
  const translated =
    globalError && typeof globalError === "object" && !Array.isArray(globalError)
      ? Object.fromEntries(
          Object.entries(globalError).filter(
            ([, value]) => typeof value === "string" && !value.startsWith("__MISSING__:")
          )
        )
      : {};

  return {
    publicSystem: {
      globalError: {
        ...enMessages.publicSystem.globalError,
        ...translated,
      },
    },
  };
}

function GlobalErrorContent({ error, reset }: GlobalErrorProps) {
  const t = useTranslations("publicSystem");

  return (
    <main role="alert" aria-live="assertive" className="flex flex-col items-center">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">{t("globalError.title")}</h1>
      <p className="text-sm text-text-muted max-w-[400px] leading-relaxed mb-6">
        {t("globalError.description")}
      </p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre
          className="p-4 rounded-lg bg-error/5 border border-error/30 text-error font-mono text-xs max-w-[600px] overflow-auto text-left mb-6"
          aria-label={t("globalError.detailsAriaLabel")}
        >
          {error.message}
        </pre>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          aria-label={t("globalError.retryAriaLabel")}
          className="px-4 py-2.5 rounded-control bg-contrast text-contrast-fg border-none text-sm font-medium cursor-pointer transition-colors duration-150 motion-reduce:transition-none hover:bg-contrast-hover focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          {t("globalError.tryAgain")}
        </button>
        <a
          href="/status"
          className="px-4 py-2.5 rounded-control text-sm font-medium text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors duration-150 motion-reduce:transition-none no-underline focus:outline-2 focus:outline-offset-2 focus:outline-focus"
          aria-label={t("globalError.statusAriaLabel")}
        >
          {t("globalError.systemStatus")}
        </a>
      </div>
    </main>
  );
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Record<string, unknown>>(() =>
    buildGlobalErrorMessages(enMessages)
  );

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      const nextLocale = getCookieLocale();
      setLocale(nextLocale);
      if (nextLocale === DEFAULT_LOCALE) return;
      try {
        const mod = await import(`../i18n/messages/${nextLocale}.json`);
        setMessages(buildGlobalErrorMessages(mod.default as Record<string, unknown>));
      } catch {
        setMessages(buildGlobalErrorMessages(enMessages));
      }
    })();
  }, []);

  return (
    <html lang={locale}>
      <body className="flex flex-col items-center justify-center min-h-screen p-6 bg-bg text-text-main font-[system-ui,-apple-system,sans-serif] text-center m-0">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GlobalErrorContent error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
