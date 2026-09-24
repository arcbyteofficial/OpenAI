"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

// One-cycle migration notice. Settings → AI no longer renders or writes the
// legacy controls; the dedicated Modality Bridge page owns these settings.
export default function ModalityBridgeMovedCard() {
  const t = useTranslations("settings");

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[18px] text-text-muted" aria-hidden="true">
          image_search
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-text-main">{t("modalityBridgeMovedTitle")}</h4>
          <p className="mt-1 text-[13px] text-text-muted">{t("modalityBridgeMovedBody")}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3 text-sm">
        <Link href="/dashboard/settings/modality-bridge" className="text-primary hover:underline">
          {t("modalityBridgeMovedCta")}
        </Link>
      </div>
    </section>
  );
}
