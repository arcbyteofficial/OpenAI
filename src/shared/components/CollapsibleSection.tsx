"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/cn";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  description,
  count,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-border rounded-card", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 text-left",
          "hover:bg-bg-subtle/60 transition-colors",
          "rounded-t-card",
          !open && "rounded-b-card"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-text-main truncate">{title}</span>
          {count != null && (
            <span className="px-1.5 text-[11px] leading-4 font-medium tabular-nums rounded-full border border-border bg-bg-subtle text-text-muted">
              {count}
            </span>
          )}
          {description && (
            <span className="text-xs text-text-muted truncate hidden sm:inline">{description}</span>
          )}
        </div>
        <span
          className="material-symbols-outlined text-[18px] text-text-subtle transition-transform duration-200 shrink-0"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          expand_more
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-200 ease-in-out",
          open ? "max-h-[2000px]" : "max-h-0"
        )}
      >
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}
