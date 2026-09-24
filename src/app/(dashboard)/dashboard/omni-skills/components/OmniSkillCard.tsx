"use client";

import { useTranslations } from "next-intl";

export interface OmniSkill {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  mode?: "on" | "off" | "auto";
  sourceProvider?: "skillsmp" | "skillssh" | "local";
  tags?: string[];
  installCount?: number;
  createdAt: string;
}

interface OmniSkillCardProps {
  skill: OmniSkill;
  selected: boolean;
  onClick: () => void;
}

export function OmniSkillCard({ skill, selected, onClick }: OmniSkillCardProps): JSX.Element {
  const t = useTranslations("skills");
  const effectiveMode = skill.mode || (skill.enabled ? "on" : "off");

  const modeColor =
    effectiveMode === "on"
      ? "text-success"
      : effectiveMode === "auto"
        ? "text-warning"
        : "text-text-muted";

  const modeDot =
    effectiveMode === "on" ? "bg-success" : effectiveMode === "auto" ? "bg-warning" : "bg-border";

  return (
    <button
      role="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left rounded-lg border p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        selected
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-surface hover:border-border-strong hover:bg-bg-subtle/60"
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex items-center justify-center size-8 rounded-md shrink-0 ${
            selected ? "bg-primary/10" : "bg-bg-subtle"
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-text-muted">
            auto_fix_high
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-text-main truncate">{skill.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle font-mono text-text-muted shrink-0">
              v{skill.version}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-text-muted shrink-0">
              {(skill.sourceProvider || "local").toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{skill.description}</p>
          {Array.isArray(skill.tags) && skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {skill.tags.slice(0, 3).map((tag) => (
                <span
                  key={`${skill.id}-${tag}`}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-block size-2 rounded-full ${modeDot}`} />
          <span className={`text-[10px] font-medium ${modeColor}`}>
            {t(
              effectiveMode === "on" ? "onMode" : effectiveMode === "auto" ? "autoMode" : "offMode"
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

export default OmniSkillCard;
