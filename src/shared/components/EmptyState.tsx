"use client";

import { useTranslations } from "next-intl";

/**
 * EmptyState — FASE-07 UX
 *
 * Reusable empty state component for dashboard sections when no data
 * is available. Provides visual feedback and optional action button.
 *
 * Usage:
 *   <EmptyState
 *     icon="📡"
 *     title="No providers yet"
 *     description="Add your first API provider to get started."
 *     actionLabel="Add Provider"
 *     onAction={() => router.push('/providers/add')}
 *   />
 */

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: (() => void) | null;
}

export default function EmptyState({
  icon = "📭",
  title,
  description = "",
  actionLabel = "",
  onAction = null,
}: EmptyStateProps) {
  const t = useTranslations("common");
  const resolvedTitle = title ?? t("nothingHere");
  const usesMaterialSymbol = /^[a-z][a-z0-9_]*$/.test(icon);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        minHeight: "200px",
      }}
    >
      <div
        style={{
          fontSize: "32px",
          marginBottom: "12px",
          opacity: 0.8,
          color: "var(--color-text-subtle)",
          animation: "none",
        }}
        role="img"
        aria-hidden="true"
      >
        {usesMaterialSymbol ? (
          <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>
            {icon}
          </span>
        ) : (
          icon
        )}
      </div>
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text-main)",
          marginBottom: "8px",
          margin: 0,
        }}
      >
        {resolvedTitle}
      </h3>
      {description && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            maxWidth: "320px",
            lineHeight: 1.5,
            marginTop: "4px",
          }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: "16px",
            padding: "6px 12px",
            borderRadius: "var(--radius-control)",
            border: "1px solid transparent",
            background: "var(--color-contrast)",
            color: "var(--color-contrast-fg)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-contrast-hover)";
            (e.currentTarget as HTMLElement).style.transform = "none";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-contrast)";
            (e.currentTarget as HTMLElement).style.transform = "none";
          }}
        >
          {actionLabel}
        </button>
      )}
      <style>{`
        @keyframes emptyBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
