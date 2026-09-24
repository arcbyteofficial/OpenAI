"use client";

import { cn } from "@/shared/utils/cn";

interface ApiKeyFilterChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  dotColor?: string | null;
  onClick: () => void;
}

export default function ApiKeyFilterChip({
  label,
  count,
  isActive,
  dotColor,
  onClick,
}: ApiKeyFilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums transition-colors",
        isActive
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-surface border-border text-text-muted hover:text-text-main hover:border-border-strong"
      )}
    >
      {dotColor && <span className={cn("size-2 rounded-full shrink-0", dotColor)} />}
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn("text-[11px]", isActive ? "text-primary/80" : "text-text-subtle")}>
          {count}
        </span>
      )}
    </button>
  );
}
