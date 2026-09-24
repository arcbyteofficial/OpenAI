"use client";

import { useTranslations } from "next-intl";

interface CertStatusIconProps {
  trusted: boolean;
  size?: number;
}

export function CertStatusIcon({ trusted, size = 16 }: CertStatusIconProps) {
  const t = useTranslations("agentBridge");
  return trusted ? (
    <span
      className="material-symbols-outlined text-success"
      style={{ fontSize: size }}
      title={t("certTrusted")}
    >
      verified_user
    </span>
  ) : (
    <span
      className="material-symbols-outlined text-text-subtle"
      style={{ fontSize: size }}
      title={t("certNotTrusted")}
    >
      lock_open
    </span>
  );
}
