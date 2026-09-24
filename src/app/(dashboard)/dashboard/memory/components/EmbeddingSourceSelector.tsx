"use client";

import { useTranslations } from "next-intl";
import type { MemorySettingsExtended } from "@/shared/schemas/memory";
import type { EmbeddingProviderListing } from "@/lib/memory/embedding/types";
import CustomEmbeddingEndpointFields from "./CustomEmbeddingEndpointFields";

interface Props {
  settings: MemorySettingsExtended;
  providers: EmbeddingProviderListing[];
  onSave: (updates: Partial<MemorySettingsExtended>) => Promise<boolean>;
  saving?: boolean;
}

type EmbeddingSourceValue = "remote" | "static" | "transformers" | "auto";

export default function EmbeddingSourceSelector({ settings, providers, onSave, saving }: Props) {
  const t = useTranslations("memory");

  const remoteProviders = providers.filter((p) => p.hasKey);
  const currentSource = settings.embeddingSource ?? "auto";
  const currentProviderModel = settings.embeddingProviderModel ?? "";

  const handleSourceChange = (source: EmbeddingSourceValue) => {
    onSave({ embeddingSource: source });
  };

  const handleProviderModelChange = (value: string) => {
    onSave({ embeddingProviderModel: value || null });
  };

  const options: Array<{ value: EmbeddingSourceValue; label: string; desc: string }> = [
    {
      value: "auto",
      label: t("embedding.autoLabel"),
      desc: t("embedding.autoDesc"),
    },
    {
      value: "remote",
      label: t("embedding.remoteLabel"),
      desc: t("embedding.remoteDesc"),
    },
    {
      value: "static",
      label: t("embedding.staticLabel"),
      desc: t("embedding.staticDesc"),
    },
    {
      value: "transformers",
      label: t("embedding.transformersLabel"),
      desc: t("embedding.transformersDesc"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-testid={`embedding-source-${opt.value}`}
            onClick={() => handleSourceChange(opt.value)}
            disabled={saving}
            className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
              currentSource === opt.value
                ? "border-primary/60 bg-primary/5 ring-1 ring-primary/15"
                : "border-border hover:border-border-strong hover:bg-bg-subtle"
            }`}
          >
            <span
              className={`text-sm font-medium ${currentSource === opt.value ? "text-primary" : "text-text-main"}`}
            >
              {opt.label}
            </span>
            <span className="text-xs text-text-muted mt-0.5 leading-relaxed">{opt.desc}</span>
          </button>
        ))}
      </div>

      {currentSource === "remote" && (
        <div className="p-3 rounded-lg bg-surface-2 border border-border">
          <label className="block text-sm font-medium text-text-main mb-2">
            {t("embedding.providerModelLabel")}
          </label>
          {remoteProviders.length === 0 ? (
            <p className="text-xs text-warning flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">warning</span>
              {t("embedding.noRemoteProviders")}
            </p>
          ) : (
            <>
              <select
                value={
                  remoteProviders.some((p) => p.models.some((m) => m.id === currentProviderModel))
                    ? currentProviderModel
                    : ""
                }
                onChange={(e) => handleProviderModelChange(e.target.value)}
                disabled={saving}
                data-testid="embedding-provider-model-select"
                className="w-full px-3 py-2 rounded-control bg-surface border border-border-strong text-sm text-text-main focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              >
                <option value="">{t("embedding.selectProviderModel")}</option>
                {remoteProviders.map((p) =>
                  p.models.length > 0 ? (
                    p.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.dimensions ? `${m.dimensions}d` : "?"})
                      </option>
                    ))
                  ) : (
                    <optgroup key={p.provider} label={p.provider}>
                      <option value="">{`— ${p.provider} (no curated models)`}</option>
                    </optgroup>
                  )
                )}
              </select>
              {/* Free-text override: the runtime accepts any configured provider's
                OpenAI-compatible model id, including ones without a curated
                registry entry (e.g. groq/, mistral/, cf/...). */}
              <input
                type="text"
                value={currentProviderModel}
                onChange={(e) => handleProviderModelChange(e.target.value)}
                disabled={saving}
                placeholder="provider/model — e.g. mistral/mistral-embed"
                data-testid="embedding-provider-model-input"
                className="w-full mt-2 px-3 py-2 rounded-control bg-surface border border-border-strong text-sm font-mono text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              />
            </>
          )}
          <CustomEmbeddingEndpointFields settings={settings} onSave={onSave} saving={saving} />
        </div>
      )}

      {currentSource === "transformers" && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning flex items-start gap-2">
          <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">info</span>
          <span>{t("embedding.transformersWarning")}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
          <div>
            <span className="text-sm font-medium text-text-main">
              {t("embedding.staticEnabledLabel")}
            </span>
            <p className="text-xs text-text-muted mt-0.5">{t("embedding.staticEnabledDesc")}</p>
          </div>
          <button
            type="button"
            data-testid="toggle-static-enabled"
            onClick={() => onSave({ staticEnabled: !settings.staticEnabled })}
            disabled={saving}
            role="switch"
            aria-checked={settings.staticEnabled ?? false}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              settings.staticEnabled ? "bg-primary" : "bg-border-strong"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.staticEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
          <div>
            <span className="text-sm font-medium text-text-main">
              {t("embedding.transformersEnabledLabel")}
            </span>
            <p className="text-xs text-text-muted mt-0.5">
              {t("embedding.transformersEnabledDesc")}
            </p>
          </div>
          <button
            type="button"
            data-testid="toggle-transformers-enabled"
            onClick={() => onSave({ transformersEnabled: !settings.transformersEnabled })}
            disabled={saving}
            role="switch"
            aria-checked={settings.transformersEnabled ?? false}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              settings.transformersEnabled ? "bg-primary" : "bg-border-strong"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.transformersEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
