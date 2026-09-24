"use client";
import { useTranslations } from "next-intl";
import type { EncoderComparison } from "./compressionFlowModel";

const fmt = (n: number) => n.toLocaleString("en-US");

export function EncoderComparisonTable({ comparison }: { comparison: EncoderComparison }) {
  const t = useTranslations("compressionStudio");
  if (!comparison || comparison.arraysCompared === 0) return null;
  const rows: Array<{
    key: "gcf" | "toon" | "json";
    label: string;
    size: { bytes: number; tokens: number } | null;
  }> = [
    { key: "gcf", label: "GCF", size: comparison.gcf },
    { key: "toon", label: "TOON", size: comparison.toonAvailable ? comparison.toon : null },
    { key: "json", label: "JSON", size: comparison.json },
  ].sort((a, b) => (a.size?.tokens ?? Infinity) - (b.size?.tokens ?? Infinity));

  return (
    <section
      data-testid="encoder-comparison"
      className="rounded-lg border border-border bg-surface p-3 text-xs"
    >
      <header className="mb-2 font-semibold text-text-main">
        {t("encoderComparison", { count: comparison.arraysCompared })}{" "}
        <span data-testid="encoder-winner" className="font-mono">
          {t("encoderWinner", { winner: comparison.winner })}
        </span>
      </header>
      <table className="w-full font-mono">
        <thead>
          <tr className="border-b border-border text-left font-medium text-text-muted">
            <th>{t("encoder")}</th>
            <th>{t("bytes")}</th>
            <th>{t("tokensCl100k")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={
                r.key === comparison.winner ? "font-semibold text-text-main" : "text-text-muted"
              }
            >
              <td>
                {r.label}
                {r.key === comparison.winner ? " ✓" : ""}
              </td>
              {r.size ? (
                <>
                  <td>{fmt(r.size.bytes)}</td>
                  <td>{fmt(r.size.tokens)}</td>
                </>
              ) : (
                <td colSpan={2} data-testid="encoder-toon-na">
                  n/a
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
