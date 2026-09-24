"use client";

import { useTranslations } from "next-intl";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/shared/components";

export default function RateLimitStatus() {
  const t = useTranslations("usage");
  const tc = useTranslations("common");
  const [data, setData] = useState({ lockouts: [], cacheStats: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rate-limits");
      if (res.ok) setData(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const formatMs = (ms) => {
    if (ms < 1000) return t("durationMillisecondsShort", { value: ms });
    if (ms < 60000) return t("durationSecondsShort", { value: Math.ceil(ms / 1000) });
    return t("durationMinutesShort", { value: Math.ceil(ms / 60000) });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* {t("modelLockouts")} */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-text-muted">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              lock_clock
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-main">{t("modelLockouts")}</h3>
            <p className="text-[13px] text-text-muted">{t("lockoutsAutoRefreshHint")}</p>
          </div>
          {data.lockouts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium tabular-nums bg-warning/10 text-warning border border-warning/20">
              {t("lockedCount", { count: data.lockouts.length })}
            </span>
          )}
        </div>

        {data.lockouts.length === 0 ? (
          <div className="text-center py-6 text-text-muted">
            <span
              className="material-symbols-outlined text-[32px] mb-2 block text-text-subtle"
              aria-hidden="true"
            >
              lock_open
            </span>
            <p className="text-sm">{t("noLockouts")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.lockouts.map((lock, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg
                           bg-bg-subtle border border-border"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-[16px] text-warning"
                    aria-hidden="true"
                  >
                    lock
                  </span>
                  <div>
                    <p className="font-mono text-[13px] font-medium text-text-main">{lock.model}</p>
                    <p className="text-xs text-text-muted">
                      {t("account")}:{" "}
                      <span className="font-mono">
                        {lock.accountId?.slice(0, 12) || tc("none")}
                      </span>
                      {lock.reason && (
                        <>
                          {t("reasonSeparator")}
                          {lock.reason}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums text-warning">
                  {t("timeLeft", { time: formatMs(lock.remainingMs) })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
