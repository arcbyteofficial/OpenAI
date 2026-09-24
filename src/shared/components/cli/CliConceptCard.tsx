"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import Badge from "@/shared/components/Badge";
import { cn } from "@/shared/utils/cn";

export type CliConceptType = "code" | "agent" | "acp";

export interface CliConceptCardProps {
  currentType: CliConceptType;
}

const TYPE_HREFS: Record<CliConceptType, string> = {
  code: "/dashboard/cli-code",
  agent: "/dashboard/cli-agents",
  acp: "/dashboard/acp-agents",
};

export default function CliConceptCard({ currentType }: CliConceptCardProps) {
  const t = useTranslations("cliCommon");

  const types: CliConceptType[] = ["code", "agent", "acp"];

  return (
    <div className={cn("bg-surface border rounded-card p-4", "border-primary/20 bg-primary/5")}>
      <div className="flex flex-col gap-3">
        {/* Current type — highlighted */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
              {t(`concept.${currentType}.title`)}
            </span>
            {currentType === "acp" && (
              <Badge variant="warning" size="sm">
                {t("concept.acp.warning")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-muted">{t(`concept.${currentType}.phrase`)}</p>
          <p className="text-[11px] text-text-muted font-mono">
            {t(`concept.${currentType}.flow`)}
          </p>
        </div>

        {/* Other types as chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
          {types
            .filter((type) => type !== currentType)
            .map((type) => (
              <Link
                key={type}
                href={TYPE_HREFS[type]}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-surface text-text-muted hover:text-text-main transition-colors"
              >
                {t(`concept.${type}.title`)} — {t(`concept.${type}.seeOther`)}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
