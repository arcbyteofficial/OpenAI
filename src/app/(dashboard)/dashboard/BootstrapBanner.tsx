"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Shown when OmniRoute was started with auto-generated secrets (zero-config mode).
 * The banner is dismissable and persists only for the current session.
 */
export default function BootstrapBanner() {
  const t = useTranslations("common");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Determine default data dir hint based on platform hint from user-agent
  const dataDir =
    typeof navigator !== "undefined" && navigator.platform?.startsWith("Win")
      ? "%APPDATA%\\omniroute\\server.env"
      : "~/.omniroute/server.env";

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-text-main mb-4"
    >
      <span className="text-warning text-base shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-main">{t("zeroConfigBannerTitle")}</p>
        <p className="mt-0.5 text-text-muted">
          {t.rich("zeroConfigBannerBody", {
            dataDir,
            code: (chunks) => (
              <code className="font-mono bg-warning/15 text-text-main px-1 rounded text-xs">
                {chunks}
              </code>
            ),
          })}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-text-subtle hover:text-text-main transition-colors ml-1"
        aria-label={t("bootstrapBannerDismiss")}
      >
        ✕
      </button>
    </div>
  );
}
