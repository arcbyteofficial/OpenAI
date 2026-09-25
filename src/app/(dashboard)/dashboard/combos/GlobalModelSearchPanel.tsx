import Button from "@/shared/components/Button";
import {
  hasExactModelStepDuplicate,
  type ComboBuilderGlobalModelEntry,
} from "@/lib/combos/builderDraft";

type TranslationFn = {
  (key: string, values?: Record<string, unknown>): string;
  has?: (key: string) => boolean;
};

const QUICK_PRESETS = ["Opus", "Sonnet", "DeepSeek", "Kimi", "Qwen", "Gemini Pro", "Flash"];

type Props = {
  builderSelectionMode: "step" | "global";
  onSelectionModeChange: (mode: "step" | "global") => void;
  globalSearchQuery: string;
  onGlobalSearchQueryChange: (query: string) => void;
  filteredGlobalModels: ComboBuilderGlobalModelEntry[];
  models: unknown[];
  onAddOne: (step: unknown) => void;
  onAddAll: () => void;
  t: TranslationFn;
};

function getI18nOrFallback(
  t: TranslationFn,
  key: string,
  fallback: string,
  values?: Record<string, unknown>
): string {
  try {
    if (typeof t.has === "function" && t.has(key)) return t(key, values);
  } catch {}
  return fallback;
}

/**
 * The combo builder's "Step by step" / "Global model search" mode toggle plus
 * the global-search panel itself (search box, quick presets, add-all, result
 * list). Extracted from ComboFormModal (#8285) to keep the mode toggle and
 * search UI cohesive and out of the already-frozen page.tsx.
 */
export default function GlobalModelSearchPanel({
  builderSelectionMode,
  onSelectionModeChange,
  globalSearchQuery,
  onGlobalSearchQueryChange,
  filteredGlobalModels,
  models,
  onAddOne,
  onAddAll,
  t,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-1.5 mt-2.5 mb-2 p-1 bg-bg-subtle rounded-lg">
        <button
          type="button"
          onClick={() => onSelectionModeChange("step")}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors text-center flex items-center justify-center gap-1 ${
            builderSelectionMode === "step"
              ? "bg-surface text-text-main ring-1 ring-border"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">schema</span>
          {getI18nOrFallback(t, "builderModeStep", "Step by step (Provider → Model)")}
        </button>
        <button
          type="button"
          onClick={() => onSelectionModeChange("global")}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors text-center flex items-center justify-center gap-1 ${
            builderSelectionMode === "global"
              ? "bg-surface text-text-main ring-1 ring-border"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">search</span>
          {getI18nOrFallback(t, "builderModeGlobal", "Global model search (Custom combo)")}
        </button>
      </div>

      {builderSelectionMode === "global" && (
        <div className="mt-3 space-y-2.5 rounded-lg border border-border bg-surface-2 p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => onGlobalSearchQueryChange(e.target.value)}
                placeholder={getI18nOrFallback(
                  t,
                  "builderGlobalSearchPlaceholder",
                  "Search models across all providers (e.g. opus, sonnet, deepseek, kimi, qwen)..."
                )}
                className="w-full text-xs py-2 pl-3 pr-7 rounded-control border border-border-strong bg-surface text-text-main focus:border-focus focus:outline-none"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => onGlobalSearchQueryChange("")}
                  className="absolute right-2.5 top-2 text-text-muted hover:text-text-main text-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
            {filteredGlobalModels.length > 0 && (
              <Button
                type="button"
                onClick={onAddAll}
                variant="secondary"
                size="sm"
                className="shrink-0 text-xs"
              >
                <span className="material-symbols-outlined text-[14px] mr-1">playlist_add</span>
                {getI18nOrFallback(t, "builderGlobalAddAll", "Add all")} (
                {filteredGlobalModels.length})
              </Button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-text-subtle uppercase font-medium tracking-wider mr-1">
              {getI18nOrFallback(t, "builderGlobalShortcuts", "Shortcuts:")}
            </span>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onGlobalSearchQueryChange(preset.toLowerCase())}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  globalSearchQuery.toLowerCase() === preset.toLowerCase()
                    ? "border-primary/50 bg-primary/10 text-primary font-medium"
                    : "border-border text-text-muted hover:border-border-strong hover:text-text-main"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-[220px] overflow-y-auto rounded-lg border border-border bg-surface divide-y divide-border">
            {filteredGlobalModels.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                {getI18nOrFallback(
                  t,
                  "builderGlobalNoResults",
                  `No model found for "${globalSearchQuery}".`,
                  {
                    query: globalSearchQuery,
                  }
                )}
              </div>
            ) : (
              filteredGlobalModels.map((item) => {
                const isAdded = hasExactModelStepDuplicate(models, item.step);
                return (
                  <div
                    key={`${item.providerId}-${item.modelId}`}
                    className="flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-bg-subtle"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-medium text-text-main truncate">{item.modelName}</span>
                      <span className="text-[10px] text-text-muted truncate">
                        {getI18nOrFallback(t, "builderGlobalProviderLabel", "Provider:")}{" "}
                        <strong className="text-text-main">{item.providerName}</strong> (
                        {getI18nOrFallback(
                          t,
                          "builderGlobalAccountCount",
                          `${item.connectionCount} account${item.connectionCount === 1 ? "" : "s"}`,
                          { count: item.connectionCount }
                        )}
                        )
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddOne(item.step)}
                      disabled={isAdded}
                      className={`text-[11px] px-2.5 py-1 rounded-control transition-colors shrink-0 flex items-center gap-1 ${
                        isAdded
                          ? "bg-success/10 text-success opacity-70 cursor-default"
                          : "bg-bg-subtle text-text-main ring-1 ring-inset ring-border hover:ring-border-strong font-medium"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isAdded ? "check" : "add"}
                      </span>
                      {isAdded
                        ? getI18nOrFallback(t, "builderGlobalAdded", "Added")
                        : getI18nOrFallback(t, "builderGlobalAdd", "Add")}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
