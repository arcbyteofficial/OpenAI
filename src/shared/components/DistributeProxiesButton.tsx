"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

type ButtonState = "idle" | "distributing" | "complete";

interface DistributeProxiesButtonProps {
  /** Async callback that performs the actual proxy distribution */
  onDistribute: () => Promise<void>;
  /** Whether the button should be disabled (e.g., during batch testing) */
  disabled?: boolean;
  /** Button label override */
  label?: string;
  /** Size variant */
  size?: "sm" | "md";
}

export default function DistributeProxiesButton({
  onDistribute,
  disabled = false,
  label = "Distribute Proxies",
  size = "md",
}: DistributeProxiesButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const t = useTranslations("sharedComponents.distributeProxies");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (disabled || state === "distributing") return;
    setState("distributing");
    try {
      await onDistribute();
      setState("complete");
      timerRef.current = setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  }, [onDistribute, disabled, state]);

  const isDisabled = disabled || state === "distributing";

  const sizeClasses = size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs";

  const stateClasses =
    state === "distributing"
      ? "bg-primary/10 border-primary/30 text-primary"
      : state === "complete"
        ? "bg-success/10 border-success/30 text-success"
        : "bg-surface border-border-strong text-text-muted hover:text-text-main hover:bg-bg-subtle";

  const icon = state === "distributing" ? "sync" : state === "complete" ? "check" : "swap_horiz";
  const displayLabel =
    state === "distributing"
      ? t("distributing")
      : state === "complete"
        ? t("complete")
        : label || t("defaultLabel");

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center gap-1.5 rounded-control font-medium border transition-colors ${sizeClasses} ${stateClasses}`}
      title={displayLabel}
      aria-label={displayLabel}
    >
      <span
        className={`material-symbols-outlined text-[14px] ${state === "distributing" ? "animate-spin" : ""}`}
      >
        {icon}
      </span>
      {displayLabel}
    </button>
  );
}
