"use client";

import { useTranslations } from "next-intl";

export interface FreeProxyRowData {
  id: string;
  source: string;
  host: string;
  port: number;
  type: string;
  countryCode: string | null;
  qualityScore: number | null;
  latencyMs: number | null;
  anonymity: string | null;
  inPool: boolean;
}

interface FreeProxyRowProps {
  proxy: FreeProxyRowData;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onAddToPool: (id: string) => void;
  adding: boolean;
}

export default function FreeProxyRow({
  proxy,
  selected,
  onToggleSelect,
  onAddToPool,
  adding,
}: FreeProxyRowProps) {
  const t = useTranslations("settings");
  const qualityColor =
    proxy.qualityScore == null
      ? "text-text-muted"
      : proxy.qualityScore >= 80
        ? "text-success"
        : proxy.qualityScore >= 50
          ? "text-warning"
          : "text-error";

  return (
    <tr className="border-b border-border hover:bg-bg-subtle transition-colors text-[13px]">
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(proxy.id)}
          className="rounded accent-primary"
          disabled={proxy.inPool}
          aria-label={t("proxyFreePoolSelectProxy", { endpoint: `${proxy.host}:${proxy.port}` })}
        />
      </td>
      <td className="px-3 py-2 text-text-muted text-xs">{proxy.source}</td>
      <td className="px-3 py-2 font-mono text-xs">
        {proxy.host}:{proxy.port}
      </td>
      <td className="px-3 py-2 uppercase text-xs">{proxy.type}</td>
      <td className="px-3 py-2 text-xs">{proxy.countryCode || "—"}</td>
      <td className={`px-3 py-2 text-xs font-medium tabular-nums ${qualityColor}`}>
        {proxy.qualityScore != null ? proxy.qualityScore : "—"}
      </td>
      <td className="px-3 py-2 text-xs tabular-nums text-text-muted">
        {proxy.latencyMs != null ? `${proxy.latencyMs}ms` : "—"}
      </td>
      <td className="px-3 py-2">
        {proxy.inPool ? (
          <span className="px-2 py-0.5 rounded-md text-xs bg-success/10 text-success border border-success/20">
            {t("proxyFreePoolInPool")}
          </span>
        ) : (
          <button
            onClick={() => onAddToPool(proxy.id)}
            disabled={adding}
            aria-label={t("proxyFreePoolAddProxy", { endpoint: `${proxy.host}:${proxy.port}` })}
            className="px-2 py-0.5 rounded-md text-xs bg-surface text-text-main border border-border-strong hover:bg-bg-subtle transition-colors disabled:opacity-50"
          >
            {adding ? t("proxyFreePoolAdding") : "⊕"}
          </button>
        )}
      </td>
    </tr>
  );
}
