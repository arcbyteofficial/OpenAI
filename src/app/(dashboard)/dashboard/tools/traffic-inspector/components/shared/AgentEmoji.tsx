"use client";

import type { AgentId } from "@/mitm/types";

const AGENT_COLORS: Record<AgentId, { emoji: string; label: string; color: string }> = {
  antigravity: { emoji: "🔵", label: "AG", color: "text-text-muted" },
  kiro: { emoji: "🟠", label: "KR", color: "text-text-muted" },
  copilot: { emoji: "🟢", label: "CP", color: "text-text-muted" },
  "ghe-copilot": { emoji: "🟩", label: "GHE", color: "text-text-muted" },
  codex: { emoji: "🟣", label: "CD", color: "text-text-muted" },
  cursor: { emoji: "🔶", label: "CU", color: "text-text-muted" },
  zed: { emoji: "🔷", label: "ZD", color: "text-text-muted" },
  "claude-code": { emoji: "🟡", label: "CC", color: "text-text-muted" },
  "open-code": { emoji: "⚪", label: "OC", color: "text-text-muted" },
  trae: { emoji: "⬛", label: "TR", color: "text-text-muted" },
};

interface AgentEmojiProps {
  agentId?: AgentId | string;
  className?: string;
}

export function AgentEmoji({ agentId, className }: AgentEmojiProps) {
  if (!agentId) return <span className={`text-sm ${className ?? ""}`}>🌐</span>;
  const info = AGENT_COLORS[agentId as AgentId];
  if (!info) return <span className={`text-sm ${className ?? ""}`}>🌐</span>;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono ${info.color} ${className ?? ""}`}
      title={agentId}
    >
      {info.emoji} {info.label}
    </span>
  );
}
