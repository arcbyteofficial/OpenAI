"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { NormalizedTurn } from "@/mitm/inspector/types";
import { cn } from "@/shared/utils/cn";
import { formatTime } from "@/shared/utils/formatting";
import { MessageContent } from "./MessageContent";

interface ChatBubbleProps {
  turn: NormalizedTurn;
  /** Optional — makes the bubble clickable when a caller has somewhere to
   * navigate to for this turn (e.g. a tree/list view linking back to the
   * request that produced it). */
  onClick?: () => void;
  /** True when this turn belongs to the request currently open — shown
   * highlighted instead of clickable (nowhere further to navigate to). */
  isCurrent?: boolean;
}

const ROLE_STYLES: Record<NormalizedTurn["role"], string> = {
  system: "border border-dashed border-border-strong bg-surface-2 text-text-main",
  user: "ml-auto bg-primary/10 border border-primary/20 text-text-main",
  assistant: "bg-surface border border-border text-text-main",
  tool: "bg-bg-subtle border border-border text-text-main",
};

const ROLE_LABEL_KEY: Record<NormalizedTurn["role"], string> = {
  system: "roleSystem",
  user: "roleUser",
  assistant: "roleAssistant",
  tool: "roleTool",
};

export function ChatBubble({ turn, onClick, isCurrent }: ChatBubbleProps) {
  const t = useTranslations("trafficInspector");
  const [collapsed, setCollapsed] = useState(turn.role === "system");

  const isSystem = turn.role === "system";
  const isUser = turn.role === "user";
  const clickable = Boolean(onClick) && !isCurrent;

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-lg px-3 py-2",
        isUser ? "ml-auto" : "mr-auto",
        ROLE_STYLES[turn.role],
        clickable && "cursor-pointer hover:border-border-strong transition-colors",
        isCurrent && "ring-2 ring-primary/40"
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">
            {t(ROLE_LABEL_KEY[turn.role])}
          </span>
          {turn.timestamp && (
            <span className="text-[10px] text-text-subtle font-mono">
              {formatTime(turn.timestamp)}
            </span>
          )}
        </div>
        {isSystem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            className="text-xs text-text-muted hover:text-text-main transition-colors focus-ring rounded"
          >
            {collapsed ? t("expand") : t("collapse")}
          </button>
        )}
      </div>
      {!collapsed && <MessageContent blocks={turn.blocks} />}
      {collapsed && isSystem && (
        <p className="text-xs text-text-subtle italic">{t("systemPromptHidden")}</p>
      )}
    </div>
  );
}
