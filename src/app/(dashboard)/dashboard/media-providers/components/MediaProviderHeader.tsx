"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import ProviderIcon from "@/shared/components/ProviderIcon";

interface MediaProviderHeaderProps {
  providerId: string;
  providerName: string;
  providerColor?: string;
  kindLabel: string;
  website?: string;
  hasFree?: boolean;
  freeNote?: string;
  backHref: string;
}

export default function MediaProviderHeader({
  providerId,
  providerName,
  providerColor,
  kindLabel,
  website,
  hasFree,
  freeNote,
  backHref,
}: MediaProviderHeaderProps) {
  const t = useTranslations("media");

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-main transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        {t("backToProviders")}
      </Link>

      <div className="flex items-start gap-4">
        <div
          className="size-12 rounded-lg border border-border flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${providerColor ?? "#64748b"}20` }}
        >
          <ProviderIcon providerId={providerId} size={32} type="color" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight text-text-main">{providerName}</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bg-subtle border border-border text-text-muted">
              {kindLabel}
            </span>
            {hasFree && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                Free
              </span>
            )}
          </div>
          {freeNote && <p className="text-sm text-text-muted mt-1">{freeNote}</p>}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              {website}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
