"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  primary: "bg-contrast text-contrast-fg hover:bg-contrast-hover",
  accent: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "bg-surface border border-border-strong text-text-main hover:bg-bg-subtle hover:border-border-strong",
  outline: "border border-border-strong text-text-main hover:bg-bg-subtle",
  ghost: "text-text-muted hover:bg-bg-subtle hover:text-text-main",
  warning: "bg-warning text-black hover:brightness-95",
  danger: "bg-error text-white hover:brightness-95",
};

export type ButtonVariant = keyof typeof variants;

const sizes = {
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-control",
  md: "h-8 px-3 text-[13px] gap-1.5 rounded-control",
  lg: "h-10 px-4 text-sm gap-2 rounded-control",
};

const iconSizes = {
  sm: "text-[15px]",
  md: "text-[16px]",
  lg: "text-[18px]",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap select-none cursor-pointer",
        "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className={cn(
            "material-symbols-outlined animate-spin pointer-events-none",
            iconSizes[size]
          )}
          aria-hidden="true"
        >
          progress_activity
        </span>
      ) : icon ? (
        <span
          className={cn("material-symbols-outlined pointer-events-none", iconSizes[size])}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span
          className={cn("material-symbols-outlined pointer-events-none", iconSizes[size])}
          aria-hidden="true"
        >
          {iconRight}
        </span>
      )}
    </button>
  );
}
