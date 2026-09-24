"use client";
import { useTranslations } from "next-intl";

const FEATURES = [
  {
    icon: "link",
    titleKey: "featureUnifiedEndpointTitle",
    descKey: "featureUnifiedEndpointDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "bolt",
    titleKey: "featureEasySetupTitle",
    descKey: "featureEasySetupDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "shield_with_heart",
    titleKey: "featureModelFallbackTitle",
    descKey: "featureModelFallbackDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "monitoring",
    titleKey: "featureUsageTrackingTitle",
    descKey: "featureUsageTrackingDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "key",
    titleKey: "featureOAuthApiKeysTitle",
    descKey: "featureOAuthApiKeysDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "cloud_sync",
    titleKey: "featureCloudSyncTitle",
    descKey: "featureCloudSyncDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "terminal",
    titleKey: "featureCliSupportTitle",
    descKey: "featureCliSupportDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
  {
    icon: "dashboard",
    titleKey: "featureDashboardTitle",
    descKey: "featureDashboardDesc",
    colors: {
      border: "hover:border-border-strong",
      bg: "hover:bg-surface-2",
      iconBg: "bg-bg-subtle border border-border",
      iconText: "text-text-muted group-hover:text-text-main",
      titleHover: "",
    },
  },
];

export default function Features() {
  const t = useTranslations("landing");

  return (
    <section className="py-24 px-6" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            {t("powerfulFeatures")}
          </h2>
          <p className="text-text-muted max-w-xl text-lg">{t("featuresSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className={`p-5 rounded-card bg-surface border border-border ${feature.colors.border} ${feature.colors.bg} transition-colors group`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${feature.colors.iconBg} flex items-center justify-center mb-4 ${feature.colors.iconText} transition-colors`}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {feature.icon}
                </span>
              </div>
              <h3
                className={`text-[15px] font-semibold tracking-tight mb-1.5 text-text-main break-words ${feature.colors.titleHover} transition-colors`}
              >
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed break-words">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
