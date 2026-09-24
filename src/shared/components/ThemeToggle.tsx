"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/shared/hooks/useTheme";
import { cn } from "@/shared/utils/cn";

export default function ThemeToggle({
  className,
  variant = "default",
}: {
  className?: any;
  variant?: string;
}) {
  const { toggleTheme, isDark } = useTheme();
  const t = useTranslations("header");
  const toggleLabel = isDark ? t("switchToLightMode") : t("switchToDarkMode");

  const variants = {
    default: cn(
      "flex items-center justify-center size-8 rounded-control",
      "text-text-muted",
      "hover:bg-bg-subtle",
      "hover:text-text-main",
      "transition-colors"
    ),
    card: cn(
      "flex items-center justify-center size-9 rounded-control",
      "bg-surface",
      "hover:bg-bg-subtle",
      "border border-border",
      "hover:border-border-strong",
      "text-text-muted hover:text-text-main",
      "cursor-pointer",
      "transition-colors group"
    ),
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(variants[variant], className)}
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      <span
        className={cn("material-symbols-outlined text-[18px]", variant === "card" && "text-[20px]")}
      >
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
