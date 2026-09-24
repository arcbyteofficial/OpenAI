"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { AgentSkill } from "@/lib/agentSkills/types";

interface SkillCardProps {
  skill: AgentSkill;
  selected: boolean;
  onClick: () => void;
}

export function SkillCard({ skill, selected, onClick }: SkillCardProps): JSX.Element {
  const t = useTranslations("agentSkills");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const previewItems: string[] =
    skill.category === "api"
      ? (skill.endpoints ?? []).slice(0, 2)
      : skill.category === "cli"
        ? (skill.cliCommands ?? []).slice(0, 2)
        : [];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-testid={`skill-card-${skill.id}`}
      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        selected
          ? "border-border-strong bg-bg-subtle"
          : "border-border bg-surface hover:bg-bg-subtle hover:border-border-strong"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          selected ? "border border-border bg-surface" : "border border-border bg-bg-subtle"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            selected ? "text-text-main" : "text-text-muted"
          }`}
        >
          {skill.icon ?? "article"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-text-main">{skill.name}</span>

          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              skill.category === "api"
                ? "bg-bg-subtle text-text-muted"
                : skill.category === "cli"
                  ? "bg-bg-subtle text-text-muted"
                  : "bg-bg-subtle text-text-muted"
            }`}
          >
            {skill.category === "api"
              ? t("categoryApi")
              : skill.category === "cli"
                ? t("categoryCli")
                : t("categoryConfig")}
          </span>

          {skill.isEntry && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              start
            </span>
          )}

          {skill.isNew && (
            <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
              new
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed text-text-muted line-clamp-2">{skill.description}</p>

        {previewItems.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {previewItems.map((item) => (
              <code
                key={item}
                className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-muted border border-border"
              >
                {item}
              </code>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SkillCard;
