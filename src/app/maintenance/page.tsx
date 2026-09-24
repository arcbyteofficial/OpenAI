import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MaintenancePage() {
  const t = useTranslations("publicSystem");

  return (
    <main className="min-h-screen text-text-main flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-card border border-border bg-surface p-6 text-center">
        <span
          className="material-symbols-outlined text-[40px] text-text-subtle mb-3"
          aria-hidden="true"
        >
          construction
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("maintenance.title")}</h1>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {t("maintenance.description")}
        </p>

        <ul className="mt-5 text-[13px] text-text-muted text-left rounded-lg border border-border bg-bg-subtle p-4 space-y-2">
          <li className="flex items-start gap-2">
            <span
              className="material-symbols-outlined text-base text-text-subtle mt-0.5"
              aria-hidden="true"
            >
              info
            </span>
            {t("maintenance.suggestion1")}
          </li>
          <li className="flex items-start gap-2">
            <span
              className="material-symbols-outlined text-base text-text-subtle mt-0.5"
              aria-hidden="true"
            >
              info
            </span>
            {t("maintenance.suggestion2")}
          </li>
        </ul>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/status"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-control bg-contrast text-contrast-fg text-sm font-medium hover:bg-contrast-hover transition-colors duration-150 motion-reduce:transition-none"
          >
            {t("maintenance.systemStatus")}
          </Link>
          <Link
            href="/dashboard/health"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-control text-sm font-medium text-text-main border border-border-strong hover:bg-bg-subtle transition-colors duration-150 motion-reduce:transition-none"
          >
            {t("maintenance.healthDashboard")}
          </Link>
        </div>
      </section>
    </main>
  );
}
