"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  default: "bg-bg-subtle text-text-muted border-border",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-primary/10 text-primary",
};

const sizes = {
  sm: "px-1.5 py-0 text-[10px] leading-3.5",
  md: "px-2 py-px text-[11px] leading-4",
  lg: "px-2.5 py-0.5 text-xs leading-[18px]",
};

interface BadgeProps {
  children?: React.ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-transparent font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "error" && "bg-error",
            variant === "info" && "bg-current",
            variant === "primary" && "bg-current",
            variant === "default" && "bg-text-subtle"
          )}
        />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
