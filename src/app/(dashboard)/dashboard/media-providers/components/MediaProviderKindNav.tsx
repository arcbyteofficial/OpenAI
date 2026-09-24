"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { MEDIA_KINDS, type MediaKind } from "./mediaKinds";

export { MEDIA_KINDS, type MediaKind };

interface MediaProviderKindNavProps {
  activeKind: MediaKind;
}

export default function MediaProviderKindNav({ activeKind }: MediaProviderKindNavProps) {
  const t = useTranslations("media");

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      {MEDIA_KINDS.map((kind) => {
        const isActive = kind === activeKind;
        const label = t(`kinds.${kind}`);
        return (
          <Link
            key={kind}
            href={`/dashboard/media-providers/${kind}`}
            className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              isActive
                ? "bg-bg-subtle border-border-strong text-text-main"
                : "bg-transparent border-border text-text-muted hover:text-text-main hover:bg-bg-subtle"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
