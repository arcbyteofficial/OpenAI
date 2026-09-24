"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/components";
import {
  fetchNewsPayload,
  listActiveNews,
  type NewsAnnouncement,
} from "@/shared/utils/releaseNotes";

export default function NewsViewer() {
  const locale = useLocale();
  const t = useTranslations("changelogPage");
  const [news, setNews] = useState<NewsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void fetchNewsPayload(fetch, controller.signal)
      .then((payload) => {
        if (payload === null) {
          if (!controller.signal.aborted) setError(true);
          return;
        }
        setNews(listActiveNews(payload, locale));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [locale]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-[24px] text-text-subtle">
          sync
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <span className="material-symbols-outlined mb-4 text-[40px] text-error/60">
          error_outline
        </span>
        <p>{t("announcementsLoadFailed")}</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <span className="material-symbols-outlined mb-4 text-[40px] text-text-subtle">
          notifications_off
        </span>
        <p>{t("noAnnouncements")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {news.map((announcement) => (
        <article
          key={announcement.id}
          className="flex flex-col gap-5 border-l-2 border-border-strong pl-5 md:flex-row md:items-center md:pl-6"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-subtle">
            <span className="material-symbols-outlined text-[24px] text-text-muted">
              {announcement.icon}
            </span>
          </div>

          <div className="flex-1">
            <h2 className="mb-1.5 text-lg font-semibold tracking-tight text-text-main">
              {announcement.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              {announcement.message}
            </p>
          </div>

          {announcement.link && (
            <div className="shrink-0 md:ml-auto">
              <a href={announcement.link} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" className="gap-2">
                  {announcement.linkLabel ?? t("learnMore")}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Button>
              </a>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
