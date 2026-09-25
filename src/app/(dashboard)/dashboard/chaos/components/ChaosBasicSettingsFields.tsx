"use client";

import { useTranslations } from "next-intl";

export interface ChaosBasicSettings {
  enabled: boolean;
  timeoutMs: number;
  maxTokens: number;
  systemPrompt?: string;
}

function ChaosSystemPromptField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("chaosConfig");
  return (
    <div className="p-4 rounded-card border border-border bg-surface">
      <p className="text-sm font-medium text-text-main">{t("systemPrompt")}</p>
      <p className="text-xs text-text-muted mb-2">{t("systemPromptDesc")}</p>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-1.5 rounded-control border border-border-strong bg-surface text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15 transition-[border-color,box-shadow] resize-y"
        placeholder={t("systemPromptPlaceholder")}
      />
    </div>
  );
}

/**
 * Enable toggle + timeout + max tokens + system prompt fields for the Chaos
 * Mode config page. Extracted out of ChaosConfigPageClient.tsx to keep the
 * page component under the complexity/size ratchet
 * (config/quality/complexity-baseline.json).
 */
export function ChaosBasicSettingsFields({
  settings,
  onChange,
}: {
  settings: ChaosBasicSettings;
  onChange: (patch: Partial<ChaosBasicSettings>) => void;
}) {
  const t = useTranslations("chaosConfig");

  return (
    <>
      {/* Enable/Disable Toggle */}
      <div className="flex items-start justify-between gap-3 p-4 rounded-card border border-border bg-surface">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-main">{t("enableChaos")}</p>
          <p className="text-xs text-text-muted">{t("enableChaosDesc")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => onChange({ enabled: !settings.enabled })}
          className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium transition-colors ${
            settings.enabled
              ? "bg-warning/10 text-warning border border-warning/30"
              : "bg-bg-subtle text-text-muted border border-border"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {settings.enabled ? "toggle_on" : "toggle_off"}
          </span>
          {settings.enabled ? t("enabled") : t("disabled")}
        </button>
      </div>

      {/* Timeout */}
      <div className="p-4 rounded-card border border-border bg-surface">
        <p className="text-sm font-medium text-text-main">{t("timeout")}</p>
        <p className="text-xs text-text-muted mb-2">{t("timeoutDesc")}</p>
        <input
          type="number"
          min={5000}
          max={600000}
          step={5000}
          value={settings.timeoutMs}
          onChange={(e) =>
            onChange({
              timeoutMs: Math.max(5000, Math.min(600000, Number(e.target.value) || 120000)),
            })
          }
          className="w-full px-3 py-1.5 rounded-control border border-border-strong bg-surface text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15 transition-[border-color,box-shadow]"
        />
      </div>

      {/* Max Tokens */}
      <div className="p-4 rounded-card border border-border bg-surface">
        <p className="text-sm font-medium text-text-main">{t("maxTokens")}</p>
        <p className="text-xs text-text-muted mb-2">{t("maxTokensDesc")}</p>
        <input
          type="number"
          min={256}
          max={128000}
          step={256}
          value={settings.maxTokens}
          onChange={(e) =>
            onChange({
              maxTokens: Math.max(256, Math.min(128000, Number(e.target.value) || 4096)),
            })
          }
          className="w-full px-3 py-1.5 rounded-control border border-border-strong bg-surface text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15 transition-[border-color,box-shadow]"
        />
      </div>

      <ChaosSystemPromptField
        value={settings.systemPrompt}
        onChange={(systemPrompt) => onChange({ systemPrompt })}
      />
    </>
  );
}
