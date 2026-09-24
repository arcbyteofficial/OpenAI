import Link from "next/link";
import { useTranslations } from "next-intl";

interface PageAction {
  href: string;
  label: string;
}

interface ErrorPageScaffoldProps {
  code: string;
  title: string;
  description: string;
  icon?: string;
  suggestions?: string[];
  primaryAction?: PageAction | null;
  secondaryAction?: PageAction | null;
}

export default function ErrorPageScaffold({
  code,
  title,
  description,
  icon = "error",
  suggestions = [],
  primaryAction,
  secondaryAction,
}: ErrorPageScaffoldProps) {
  const t = useTranslations("common");
  const resolvedPrimary = primaryAction ?? { href: "/dashboard", label: t("goToDashboard") };
  const resolvedSecondary = secondaryAction ?? { href: "/status", label: t("checkSystemStatus") };

  return (
    <main
      className="min-h-screen text-text-main flex items-center justify-center px-6 py-12"
      role="main"
      aria-labelledby="error-page-title"
    >
      <section className="w-full max-w-2xl rounded-card border border-border bg-surface p-6 sm:p-8">
        <header className="text-center">
          <span
            className="material-symbols-outlined text-[28px] text-text-subtle mb-3"
            aria-hidden="true"
          >
            {icon}
          </span>
          <p
            className="text-5xl sm:text-6xl font-semibold tracking-tighter leading-none tabular-nums text-text-main"
            aria-hidden="true"
          >
            {code}
          </p>
          <h1
            id="error-page-title"
            className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight"
          >
            {title}
          </h1>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">{description}</p>
        </header>

        {suggestions.length > 0 && (
          <ul
            className="mt-6 rounded-lg border border-border bg-surface-2 p-4 space-y-2 text-sm text-text-muted"
            aria-label="Recommended actions"
          >
            {suggestions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  className="material-symbols-outlined text-base text-text-subtle mt-0.5"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Link
            href={resolvedPrimary.href}
            className="inline-flex items-center justify-center h-10 px-4 rounded-control bg-contrast text-contrast-fg text-sm font-medium hover:bg-contrast-hover transition-colors duration-150 motion-reduce:transition-none"
          >
            {resolvedPrimary.label}
          </Link>
          <Link
            href={resolvedSecondary.href}
            className="inline-flex items-center justify-center h-10 px-4 rounded-control bg-surface text-text-main text-sm font-medium border border-border-strong hover:bg-bg-subtle transition-colors duration-150 motion-reduce:transition-none"
          >
            {resolvedSecondary.label}
          </Link>
        </div>
      </section>
    </main>
  );
}
