"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";

interface Execution {
  id: string;
  skillId: string;
  skillName: string;
  status: string;
  duration: number;
  createdAt: string;
}

interface OmniExecutionsTabProps {
  executions: Execution[];
  execPage: number;
  execTotalPages: number;
  execTotal: number;
  onPagePrev: () => void;
  onPageNext: () => void;
}

export function OmniExecutionsTab({
  executions,
  execPage,
  execTotalPages,
  execTotal,
  onPagePrev,
  onPageNext,
}: OmniExecutionsTabProps): JSX.Element {
  const t = useTranslations("skills");

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-xs text-text-muted border-b border-border">
              <th className="pb-3 font-medium">{t("skill")}</th>
              <th className="pb-3 font-medium">{t("status")}</th>
              <th className="pb-3 font-medium">{t("duration")}</th>
              <th className="pb-3 font-medium">{t("time")}</th>
            </tr>
          </thead>
          <tbody>
            {executions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted">
                  {t("noExecutions")}
                </td>
              </tr>
            ) : (
              executions.map((exec) => (
                <tr key={exec.id} className="border-b border-border last:border-b-0">
                  <td className="py-3 font-medium text-text-main">{exec.skillName}</td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md ${
                        exec.status === "success"
                          ? "bg-success/10 text-success"
                          : exec.status === "error"
                            ? "bg-error/10 text-error"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      {exec.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs tabular-nums text-text-muted">
                    {exec.duration}ms
                  </td>
                  <td className="py-3 text-text-muted text-xs tabular-nums">
                    {new Date(exec.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="text-[13px] text-text-muted">
          {t("pageInfo", { page: execPage, totalPages: execTotalPages, total: execTotal }) ||
            `Page ${execPage} of ${execTotalPages} (${execTotal} total)`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onPagePrev}
            disabled={execPage === 1}
            className="px-3 py-1 text-[13px] rounded-control border border-border-strong bg-surface text-text-main hover:bg-bg-subtle disabled:opacity-40 transition-colors"
          >
            {t("previous") || "Prev"}
          </button>
          <button
            onClick={onPageNext}
            disabled={execPage === execTotalPages || execTotalPages === 0}
            className="px-3 py-1 text-[13px] rounded-control border border-border-strong bg-surface text-text-main hover:bg-bg-subtle disabled:opacity-40 transition-colors"
          >
            {t("next") || "Next"}
          </button>
        </div>
      </div>
    </Card>
  );
}

export default OmniExecutionsTab;
