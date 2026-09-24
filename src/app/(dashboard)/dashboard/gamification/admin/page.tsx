"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";

interface Anomaly {
  apiKeyId: string;
  xpLastHour: number;
  zScore: number;
}

export default function GamificationAdminPage() {
  const t = useTranslations("common");
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const res = await fetch("/api/gamification/anomalies");
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      } catch {
        // ignore fetch errors
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">
          {t("gamificationAdmin")}
        </h1>
        <p className="text-sm text-text-muted mt-1">{t("monitorAnomaliesAndHealth")}</p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold tracking-tight text-text-main mb-3">
          {t("flaggedAnomalies")}
        </h2>
        {loading ? (
          <div className="text-text-muted" role="status" aria-live="polite" aria-busy="true">
            {t("loading")}
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-text-muted" role="status" aria-live="polite">
            {t("noAnomaliesDetected")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-xs font-medium text-text-muted">
                    {t("apiKey")}
                  </th>
                  <th className="text-right p-2 text-xs font-medium text-text-muted">
                    {t("xpLastHour")}
                  </th>
                  <th className="text-right p-2 text-xs font-medium text-text-muted">
                    {t("zScore")}
                  </th>
                  <th className="text-center p-2 text-xs font-medium text-text-muted">
                    {t("status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a.apiKeyId} className="border-b border-border/50 last:border-b-0">
                    <td className="p-2 font-mono text-[12px]">{a.apiKeyId.slice(0, 16)}...</td>
                    <td className="p-2 text-right tabular-nums">{a.xpLastHour.toLocaleString()}</td>
                    <td className="p-2 text-right tabular-nums text-error">
                      {a.zScore.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 text-xs font-medium bg-error/10 text-error rounded-full">
                        {t("suspicious")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
