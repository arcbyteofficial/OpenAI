"use client";

import { cn } from "@/shared/utils/cn";
import type { UtilizationTimeRange } from "@/shared/types/utilization";

interface TimeRangeSelectorProps {
  value: UtilizationTimeRange;
  onChange: (range: UtilizationTimeRange) => void;
}

const OPTIONS: Array<{ value: UtilizationTimeRange; label: string }> = [
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Select time range"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg-subtle p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring h-9 rounded-md px-3 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-surface text-text-main ring-1 ring-border"
                : "text-text-muted hover:text-text-main"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
