"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";

export function OmniSandboxTab(): JSX.Element {
  const t = useTranslations("skills");

  return (
    <div className="grid gap-4">
      <Card>
        <h3 className="text-sm font-semibold tracking-tight text-text-main mb-4">
          {t("sandboxConfig")}
        </h3>
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-border">
            <div>
              <p className="text-sm font-medium text-text-main">{t("cpuLimit")}</p>
              <p className="text-xs text-text-muted">{t("cpuLimitDesc")}</p>
            </div>
            <span className="font-mono text-[13px] text-text-main">100ms</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-border">
            <div>
              <p className="text-sm font-medium text-text-main">{t("memoryLimit")}</p>
              <p className="text-xs text-text-muted">{t("memoryLimitDesc")}</p>
            </div>
            <span className="font-mono text-[13px] text-text-main">256MB</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-border">
            <div>
              <p className="text-sm font-medium text-text-main">{t("timeout")}</p>
              <p className="text-xs text-text-muted">{t("timeoutDesc")}</p>
            </div>
            <span className="font-mono text-[13px] text-text-main">30s</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-border">
            <div>
              <p className="text-sm font-medium text-text-main">{t("networkAccess")}</p>
              <p className="text-xs text-text-muted">{t("networkAccessDesc")}</p>
            </div>
            <span className="text-[13px] text-text-muted">{t("disabled")}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default OmniSandboxTab;
