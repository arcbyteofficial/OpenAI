"use client";

interface TokenBadgeProps {
  tokensIn?: number | null;
  tokensOut?: number | null;
}

export function TokenBadge({ tokensIn, tokensOut }: TokenBadgeProps) {
  if (!tokensIn && !tokensOut) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-bg-subtle px-2 py-0.5 text-xs text-text-muted font-mono tabular-nums">
      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
        token
      </span>
      {tokensIn != null && <span>{tokensIn}↑</span>}
      {tokensOut != null && <span>{tokensOut}↓</span>}
    </span>
  );
}
