/**
 * G-09 — Install Wizard for 9Router.
 * Shown only when service state === "not_installed".
 * Calls POST /api/services/9router/install and triggers a status mutate on success.
 */
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button } from "@/shared/components";
import { useServiceStatus } from "../hooks/useServiceStatus";

const NAME = "9router";
const DEFAULT_PORT = 20130;

export function NinerouterInstallWizard() {
  const t = useTranslations("embeddedServices");
  const { mutate } = useServiceStatus(NAME);
  const [version, setVersion] = useState("latest");
  const [port, setPort] = useState(String(DEFAULT_PORT));
  const [installing, setInstalling] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleInstall() {
    setInstalling(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/services/${NAME}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: version.trim() || "latest" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorMsg =
          body?.error?.message ?? body?.message ?? t("installationFailed", { status: res.status });
        setMsg({ ok: false, text: errorMsg });
        return;
      }
      setMsg({ ok: true, text: t("installationSucceeded") });
      mutate();
    } catch {
      setMsg({ ok: false, text: t("networkInstallFailed") });
    } finally {
      setInstalling(false);
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-8 rounded-lg flex items-center justify-center bg-bg-subtle border border-border">
          <span className="material-symbols-outlined text-text-muted text-[18px]">download</span>
        </div>
        <div>
          <h3 className="font-semibold text-sm tracking-tight text-text-main">
            {t("install9Router")}
          </h3>
          <p className="text-xs text-text-muted">{t("install9RouterDescription")}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Version field */}
        <div>
          <label
            className="block text-[13px] font-medium text-text-main mb-1.5"
            htmlFor="ninerouter-version"
          >
            {t("version")}
          </label>
          <input
            id="ninerouter-version"
            type="text"
            className="w-full rounded-control border border-border-strong bg-surface px-3 py-1.5 text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-[border-color,box-shadow]"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="latest"
            disabled={installing}
          />
          <p className="mt-1 text-xs text-text-muted">{t("versionHint")}</p>
        </div>

        {/* Port field */}
        <div>
          <label
            className="block text-[13px] font-medium text-text-main mb-1.5"
            htmlFor="ninerouter-port"
          >
            {t("servicePort")}
          </label>
          <input
            id="ninerouter-port"
            type="number"
            className="w-full rounded-control border border-border-strong bg-surface px-3 py-1.5 text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-[border-color,box-shadow]"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            min={1024}
            max={65535}
            disabled={installing}
          />
          <p className="mt-1 text-xs text-text-muted">{t("servicePortHint")}</p>
        </div>

        {/* Message */}
        {msg && (
          <div
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs ${
              msg.ok ? "bg-success/10 text-success" : "bg-error/10 text-error"
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">
              {msg.ok ? "check_circle" : "error"}
            </span>
            {msg.text}
          </div>
        )}

        {/* Install button */}
        <Button onClick={handleInstall} disabled={installing} className="w-full">
          {installing ? (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined animate-spin text-[14px]">
                progress_activity
              </span>
              {t("installing")}
            </span>
          ) : (
            t("install9Router")
          )}
        </Button>
      </div>
    </Card>
  );
}
