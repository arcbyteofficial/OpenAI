"use client";
import { useTranslations } from "next-intl";
import type { DiffSegment } from "./compressionFlowModel";
export interface DiffPaneProps {
  segments: DiffSegment[];
  preservedBlocks: Array<{ kind: string; preview: string }>;
}
const SEG_CLASS: Record<DiffSegment["type"], string> = {
  same: "text-text-main",
  removed: "bg-error/15 text-error line-through",
  added: "bg-success/15 text-success",
};
export function DiffPane({ segments, preservedBlocks }: DiffPaneProps) {
  const t = useTranslations("compressionStudio");
  return (
    <div data-testid="diff-pane" className="font-mono text-xs leading-relaxed">
      <div className="mb-2 flex gap-2 text-[10px]">
        <span className="rounded-md border border-border bg-bg-subtle px-2 py-0.5 font-medium text-text-main">
          {t("inlineView")}
        </span>
        <button
          type="button"
          disabled
          title={t("splitComingSoon")}
          className="rounded-md px-2 py-0.5 text-text-muted opacity-50"
        >
          {t("splitComingSoon")}
        </button>
      </div>
      <div className="whitespace-pre-wrap">
        {segments.map((seg, i) => (
          <span key={i} data-testid={`diff-${seg.type}`} className={SEG_CLASS[seg.type]}>
            {seg.text}
          </span>
        ))}
      </div>
      {preservedBlocks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1" data-testid="diff-preserved">
          {preservedBlocks.map((b, i) => (
            <span
              key={i}
              className="rounded-md border border-border bg-bg-subtle px-1 text-[10px] text-text-muted"
            >
              {b.kind}: {b.preview.slice(0, 40)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
