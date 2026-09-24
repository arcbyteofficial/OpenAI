"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function HeroSection() {
  const t = useTranslations("landing");
  const router = useRouter();

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      <div className="relative z-10 max-w-4xl w-full text-center flex flex-col items-center gap-6">
        {/* Version badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
          <span className="flex h-2 w-2 rounded-full bg-success"></span>
          {t("versionLive")}
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tighter text-text-main break-words">
          {t("oneEndpoint")} <br />
          <span className="text-text-muted">{t("allProviders")}</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed break-words">
          {t("heroDescription")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto h-12 px-6 rounded-control bg-contrast text-contrast-fg hover:bg-contrast-hover text-[15px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              rocket_launch
            </span>
            {t("getStarted")}
          </button>
          <a
            href="https://github.com/diegosouzapw/OmniRoute"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto h-12 px-6 rounded-control border border-border-strong bg-surface hover:bg-bg-subtle text-text-main text-[15px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              code
            </span>
            {t("viewOnGithub")}
          </a>
        </div>
      </div>
    </section>
  );
}
