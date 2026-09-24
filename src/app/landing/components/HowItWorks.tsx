"use client";
import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("landing");

  return (
    <section className="py-24 border-y border-border bg-surface" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            {t("howItWorks")}
          </h2>
          <p className="text-text-muted max-w-xl text-lg">{t("howItWorksDescription")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-border -z-10"></div>

          {/* Step 1: CLI & SDKs */}
          <div className="flex flex-col gap-6 relative group">
            <div className="w-24 h-24 rounded-card bg-bg border border-border flex items-center justify-center group-hover:border-border-strong transition-colors z-10 mx-auto md:mx-0">
              <span
                className="material-symbols-outlined text-[32px] text-text-muted"
                aria-hidden="true"
              >
                terminal
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-text-main break-words">
                {t("howItWorksStep1Title")}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed break-words">
                {t("howItWorksStep1Description")}
              </p>
            </div>
          </div>

          {/* Step 2: OmniRoute Hub */}
          <div className="flex flex-col gap-6 relative group md:items-center md:text-center">
            <div className="w-24 h-24 rounded-card bg-contrast border-2 border-contrast flex items-center justify-center z-10 mx-auto">
              <span
                className="material-symbols-outlined text-[32px] text-contrast-fg"
                aria-hidden="true"
              >
                hub
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-text-main break-words">
                {t("howItWorksStep2Title")}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed break-words">
                {t("howItWorksStep2Description")}
              </p>
            </div>
          </div>

          {/* Step 3: AI Providers */}
          <div className="flex flex-col gap-6 relative group md:items-end md:text-right">
            <div className="w-24 h-24 rounded-card bg-bg border border-border flex items-center justify-center group-hover:border-border-strong transition-colors z-10 mx-auto md:mx-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="w-6 h-6 rounded-md bg-bg-subtle border border-border"></div>
                <div className="w-6 h-6 rounded-md bg-bg-subtle border border-border"></div>
                <div className="w-6 h-6 rounded-md bg-bg-subtle border border-border"></div>
                <div className="w-6 h-6 rounded-md bg-bg-subtle border border-border"></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-text-main break-words">
                {t("howItWorksStep3Title")}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed break-words">
                {t("howItWorksStep3Description")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
