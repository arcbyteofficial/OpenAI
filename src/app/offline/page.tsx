"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

function subscribeToOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function OfflinePage() {
  const t = useTranslations("publicSystem");
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    () => navigator.onLine,
    () => false
  );

  return (
    <main className="min-h-screen text-text-main flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-card border border-border bg-surface p-6 text-center">
        <span
          className="material-symbols-outlined text-[40px] text-text-subtle mb-3"
          aria-hidden="true"
        >
          wifi_off
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("offline.title")}</h1>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">{t("offline.description")}</p>

        <div
          className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] border ${
            isOnline
              ? "border-success/30 text-success bg-success/10"
              : "border-warning/30 text-warning bg-warning/10"
          }`}
          aria-live="polite"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            {isOnline ? "wifi" : "wifi_off"}
          </span>
          <span>
            {isOnline ? t("offline.connectionRestored") : t("offline.offlineModeDetected")}
          </span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-control bg-contrast text-contrast-fg text-sm font-medium hover:bg-contrast-hover transition-colors duration-150 motion-reduce:transition-none"
          >
            {t("offline.retryConnection")}
          </button>
          <Link
            href="/status"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-control text-sm font-medium text-text-main border border-border-strong hover:bg-bg-subtle transition-colors duration-150 motion-reduce:transition-none"
          >
            {t("offline.openStatusPage")}
          </Link>
        </div>
      </section>
    </main>
  );
}
