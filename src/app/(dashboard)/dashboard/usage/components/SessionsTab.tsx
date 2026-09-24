"use client";

import { useTranslations } from "next-intl";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  mergeDashboardSessions,
  type DashboardSession,
  type ExclusiveDashboardSession,
  type RecentSessionForDashboard,
} from "@/lib/sessionObservability";
import { Card } from "@/shared/components";

type SessionsResponse = {
  sessions: RecentSessionForDashboard[];
  exclusiveSessions: ExclusiveDashboardSession[];
};

const EMPTY_DATA: SessionsResponse = {
  sessions: [],
  exclusiveSessions: [],
};

function isLeaseBackedSession(session: DashboardSession): session is ExclusiveDashboardSession {
  return "leaseBacked" in session && session.leaseBacked;
}

export default function SessionsTab() {
  const t = useTranslations("usage");
  const tCommon = useTranslations("common");
  const [data, setData] = useState<SessionsResponse>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const next = await res.json();
        setData({
          sessions: Array.isArray(next.sessions) ? next.sessions : [],
          exclusiveSessions: Array.isArray(next.exclusiveSessions) ? next.exclusiveSessions : [],
        });
      }
    } catch {
      // A failed background poll leaves the last successful Sessions snapshot visible.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadSessions();
    })();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const displaySessions = useMemo(() => {
    return mergeDashboardSessions(data.exclusiveSessions, data.sessions);
  }, [data.exclusiveSessions, data.sessions]);

  const formatAge = (ms: number | null) => {
    if (ms == null) return t("notAvailableSymbol");
    if (ms < 60000) return t("durationSecondsShort", { value: Math.floor(ms / 1000) });
    if (ms < 3600000) return t("durationMinutesShort", { value: Math.floor(ms / 60000) });
    return t("durationHoursShort", { value: Math.floor(ms / 3600000) });
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="text-text-muted">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            fingerprint
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-main">{t("activeSessions")}</h3>
          <p className="text-[13px] text-text-muted">{t("sessionsTrackedHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-subtle border border-border">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span
              className="text-[13px] font-medium tabular-nums text-text-main"
              data-testid="session-count"
            >
              {displaySessions.length}
            </span>
          </span>
        </div>
      </div>

      {displaySessions.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <span
            className="material-symbols-outlined text-[32px] mb-2 block text-text-subtle"
            aria-hidden="true"
          >
            fingerprint
          </span>
          <p className="text-sm">{t("noSessions")}</p>
          <p className="text-xs mt-1">{t("sessionsHint")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">
                  {t("session")}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">
                  {t("age")}
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  {t("requests")}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">
                  {t("connection")}
                </th>
              </tr>
            </thead>
            <tbody>
              {displaySessions.map((s) => {
                const leaseBacked = isLeaseBackedSession(s);
                return (
                  <tr
                    key={s.sessionId}
                    className="border-b border-border last:border-b-0 hover:bg-bg-subtle transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-[12px] px-1.5 py-0.5 rounded-md bg-bg-subtle text-text-muted"
                          title={s.sessionId}
                        >
                          {s.sessionId.slice(0, 12)}…
                        </span>
                        {leaseBacked && s.active && (
                          <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full border text-success border-success/30 bg-success/10">
                            {tCommon("active")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-text-muted tabular-nums">
                      {formatAge(s.ageMs)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-medium tabular-nums text-text-main">
                        {s.requestCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {s.connectionId ? (
                        <span
                          className="text-[12px] font-mono text-text-main"
                          title={s.connectionId}
                        >
                          {(leaseBacked && s.connectionName) || s.connectionId.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-text-subtle">{t("notAvailableSymbol")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
