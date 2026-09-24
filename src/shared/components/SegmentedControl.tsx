"use client";

import { cn } from "@/shared/utils/cn";

interface SegmentedOption {
  value: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  options?: SegmentedOption[];
  value?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  const sizes = {
    sm: "h-6 text-xs",
    md: "h-7 text-[13px]",
    lg: "h-9 text-sm",
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center p-0.5 rounded-lg", "bg-bg-subtle", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 rounded-md font-medium transition-colors",
            sizes[size],
            value === option.value
              ? "bg-surface dark:bg-white/10 text-text-main shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.06)]"
              : "text-text-muted hover:text-text-main",
            option.icon && "flex items-center"
          )}
        >
          {option.icon && (
            <span className="material-symbols-outlined text-[15px] mr-1.5" aria-hidden="true">
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}
