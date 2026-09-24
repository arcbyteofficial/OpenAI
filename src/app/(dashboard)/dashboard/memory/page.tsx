"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import MemoryConceptCard from "./components/MemoryConceptCard";
import MemoriesTab from "./components/tabs/MemoriesTab";
import PlaygroundTab from "./components/tabs/PlaygroundTab";
import EngineTab from "./components/tabs/EngineTab";
import { useMemorySettings } from "./hooks/useMemorySettings";

type TabId = "memories" | "playground" | "engine";

const TABS: TabId[] = ["memories", "engine", "playground"];

function MemoryPageContent() {
  const t = useTranslations("memory");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings, save } = useMemorySettings();
  const memoryEnabled = settings?.enabled ?? true;

  const rawTab = searchParams.get("tab") ?? "";
  const activeTab: TabId = TABS.includes(rawTab as TabId) ? (rawTab as TabId) : "memories";

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Concept card */}
      <MemoryConceptCard />

      {/* Tab navigation + memory enable toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg bg-bg-subtle border border-border w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              data-testid={`tab-${tab}`}
              onClick={() => setTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-surface dark:bg-white/10 text-text-main shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.06)]"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-medium text-text-muted">{t("memoryEnabled")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={memoryEnabled}
            data-testid="memory-enabled-toggle"
            onClick={() => void save({ enabled: !memoryEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              memoryEnabled ? "bg-primary" : "bg-border-strong"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                memoryEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Tab content */}
      {activeTab === "memories" && <MemoriesTab />}
      {activeTab === "playground" && <PlaygroundTab />}
      {activeTab === "engine" && <EngineTab />}
    </div>
  );
}

export default function MemoryPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center" />}>
      <MemoryPageContent />
    </Suspense>
  );
}
