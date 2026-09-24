"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * MITM Proxy page — moved to AgentBridge (plan 11 §12).
 * Shows a "page moved" banner for 2.5 s then redirects.
 */
export default function MitmProxyMovedPage() {
  const router = useRouter();
  const t = useTranslations("agentBridge.pageMoved");

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard/tools/agent-bridge");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-8">
      <div className="rounded-card border border-border bg-surface p-6 text-center max-w-md w-full space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-text-muted text-[20px]">info</span>
          <h1 className="text-base font-semibold tracking-tight text-text-main">{t("title")}</h1>
        </div>
        <p className="text-sm text-text-muted">{t("message")}</p>
        <button
          type="button"
          onClick={() => router.replace("/dashboard/tools/agent-bridge")}
          className="inline-flex items-center gap-1.5 rounded-control bg-contrast text-contrast-fg px-3 py-1.5 text-[13px] font-medium hover:bg-contrast-hover transition-colors"
        >
          {t("goNow")}
        </button>
      </div>
    </div>
  );
}
