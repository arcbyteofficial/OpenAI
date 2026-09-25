"use client";

import { cn } from "@/shared/utils/cn";

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  title?: string;
  ariaLabel?: string;
}

export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  className,
  title,
  ariaLabel,
}: ToggleProps) {
  const sizes = {
    xs: {
      track: "w-6 h-3",
      thumb: "size-[8px]",
      translate: "translate-x-3.5",
    },
    sm: {
      track: "w-8 h-4",
      thumb: "size-3",
      translate: "translate-x-[18px]",
    },
    md: {
      track: "w-11 h-6",
      thumb: "size-5",
      translate: "translate-x-[22px]",
    },
    lg: {
      track: "w-14 h-7",
      thumb: "size-6",
      translate: "translate-x-[30px]",
    },
  };

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || description || title || "Toggle"}
        title={title}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center shrink-0 cursor-pointer rounded-full",
          "transition-colors duration-200 ease-in-out",
          "focus:outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-focus/25",
          checked ? "bg-primary" : "bg-border-strong",
          sizes[size].track,
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.06)]",
            "transition-transform duration-200 ease-in-out",
            checked ? sizes[size].translate : "translate-x-0.5",
            sizes[size].thumb,
            "shrink-0"
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-[13px] font-medium text-text-main">{label}</span>}
          {description && <span className="text-xs text-text-muted">{description}</span>}
        </div>
      )}
    </div>
  );
}
