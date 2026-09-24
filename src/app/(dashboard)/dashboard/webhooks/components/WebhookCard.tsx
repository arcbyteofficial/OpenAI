"use client";

import { useState } from "react";
import { WebhookDeliveriesPanel } from "./WebhookDeliveriesPanel";

export type WebhookKind = "slack" | "telegram" | "discord" | "custom";

export interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  enabled: boolean;
  description: string;
  created_at: string;
  last_triggered_at: string | null;
  last_status: number | null;
  failure_count: number;
  kind: WebhookKind;
  metadata_encrypted?: string | null;
}

const KIND_ICONS: Record<WebhookKind, string> = {
  slack: "chat",
  telegram: "send",
  discord: "forum",
  custom: "webhook",
};

const KIND_COLORS: Record<WebhookKind, string> = {
  slack: "text-text-muted",
  telegram: "text-text-muted",
  discord: "text-text-muted",
  custom: "text-text-muted",
};

function getStatus(wh: WebhookItem): "active" | "inactive" | "errored" {
  if (!wh.enabled) return "inactive";
  if (wh.failure_count > 0 || (wh.last_status !== null && wh.last_status >= 400)) return "errored";
  return "active";
}

interface WebhookCardProps {
  webhook: WebhookItem;
  t: (key: string, opts?: Record<string, unknown>) => string;
  testingId: string | null;
  onTest: (wh: WebhookItem) => void;
  onToggleEnabled: (wh: WebhookItem) => void;
  onEdit: (wh: WebhookItem) => void;
  onDelete: (wh: WebhookItem) => void;
}

export function WebhookCard({
  webhook,
  t,
  testingId,
  onTest,
  onToggleEnabled,
  onEdit,
  onDelete,
}: WebhookCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = getStatus(webhook);
  const isTesting = testingId === webhook.id;

  return (
    <div className="rounded-card border border-border bg-surface transition-colors hover:border-border-strong">
      <div className="flex items-center gap-3 p-4">
        <span
          className={`material-symbols-outlined shrink-0 text-[20px] ${KIND_COLORS[webhook.kind]}`}
        >
          {KIND_ICONS[webhook.kind]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-main">
            {webhook.description || t("unnamedWebhook")}
          </p>
          <p className="truncate font-mono text-[12px] text-text-muted">{webhook.url}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
            status === "active"
              ? "border-success/30 bg-success/10 text-success"
              : status === "errored"
                ? "border-error/30 bg-error/10 text-error"
                : "border-border bg-bg-subtle text-text-muted"
          }`}
        >
          {t(status)}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onTest(webhook)}
            disabled={isTesting}
            title={t("testWebhook")}
            className="rounded-control p-2 text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-main disabled:opacity-40"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${isTesting ? "animate-spin" : ""}`}
            >
              {isTesting ? "sync" : "send"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onToggleEnabled(webhook)}
            title={webhook.enabled ? t("disable") : t("enable")}
            className="rounded-control p-2 text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-main"
          >
            <span className="material-symbols-outlined text-[18px]">
              {webhook.enabled ? "toggle_on" : "toggle_off"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(webhook)}
            title={t("edit")}
            className="rounded-control p-2 text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-main"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(webhook)}
            title={t("delete")}
            className="rounded-control p-2 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand"}
            className="rounded-control p-2 text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-main"
          >
            <span className="material-symbols-outlined text-[18px]">
              {expanded ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="mb-3 flex flex-wrap gap-1">
            {webhook.events.map((ev) => (
              <span
                key={ev}
                className="rounded-md border border-border bg-bg-subtle px-2 py-0.5 font-mono text-[11px] text-text-muted"
              >
                {ev === "*" ? t("allEvents") : ev}
              </span>
            ))}
          </div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle">
            {t("deliveries.title")}
          </p>
          <WebhookDeliveriesPanel webhookId={webhook.id} t={t} />
        </div>
      )}
    </div>
  );
}
