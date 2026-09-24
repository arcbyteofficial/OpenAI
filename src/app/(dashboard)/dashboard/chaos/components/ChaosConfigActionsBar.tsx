"use client";

import { useTranslations } from "next-intl";
import { chaosText, type ChaosTranslator } from "../chaosI18n";

/**
 * Save/Reset + Test-run action buttons for the Chaos Mode config page.
 * Extracted out of ChaosConfigPageClient.tsx to keep the page component under
 * the complexity/size ratchet (config/quality/complexity-baseline.json).
 */
export function ChaosConfigActionsBar({
  saving,
  testing,
  testDisabled,
  onSave,
  onReset,
  onTest,
}: {
  saving: boolean;
  testing: boolean;
  testDisabled: boolean;
  onSave: () => void;
  onReset: () => void;
  onTest: () => void;
}) {
  const t = useTranslations("chaosConfig") as ChaosTranslator;

  return (
    <>
      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-control bg-contrast text-contrast-fg text-sm font-medium hover:bg-contrast-hover transition-colors disabled:opacity-50"
        >
          {saving ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">save</span>
          )}
          {t("saveConfig")}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-control border border-border-strong bg-surface text-text-main text-sm font-medium hover:bg-bg-subtle transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          {t("configReset")}
        </button>
      </div>

      {/* Test Button */}
      <div className="p-4 rounded-card border border-border bg-surface">
        <p className="text-sm font-medium text-text-main mb-2">{t("testButton")}</p>
        <button
          type="button"
          onClick={onTest}
          disabled={testing || testDisabled}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-control border border-border-strong bg-surface text-text-main text-sm font-medium hover:bg-bg-subtle transition-colors disabled:opacity-50"
        >
          {testing ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
          )}
          {testing ? chaosText(t, "running", "Running...") : t("testButton")}
        </button>
      </div>
    </>
  );
}
