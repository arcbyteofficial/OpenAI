"use client";

import { useTranslations } from "next-intl";

interface ProxyStatusBadgeProps {
  status?: string;
}

// Mirrors PROXY_ALIVE_PREDICATE (src/lib/db/proxies/guards.ts) — kept as a small
// client-side duplicate rather than importing the server DB module into a "use
// client" component (same pattern as RELAY_PROXY_TYPES in proxies/mappers.ts).
// Any status in this set (including "dead", written by PROXY_AUTO_DISABLE) is
// excluded from pool/rotation resolution, so it must not render as "Active".
const NOT_ALIVE_STATUSES = new Set(["inactive", "error", "disabled", "dead", "down"]);

export function ProxyStatusBadge({ status }: ProxyStatusBadgeProps) {
  const t = useTranslations("settings");
  const isInactive = NOT_ALIVE_STATUSES.has((status ?? "").toLowerCase());
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
        isInactive
          ? "border-error/20 bg-error/10 text-error"
          : "border-success/20 bg-success/10 text-success"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-error" : "bg-success"}`} />
      {isInactive ? t("proxyStatusInactive") : t("proxyStatusActive")}
    </span>
  );
}
