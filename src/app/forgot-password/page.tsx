"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useIsElectron } from "@/shared/hooks/useElectron";

/**
 * Forgot Password Page — Phase 8.2
 *
 * Provides recovery methods:
 * - Web/CLI: CLI reset via omniroute-reset-password command + manual database reset
 * - Electron: Data directory reset instructions
 */

import Link from "next/link";
import { Card } from "@/shared/components";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const isElectron = useIsElectron();
  const [dataDir, setDataDir] = useState<string | null>(null);

  useEffect(() => {
    if (isElectron && typeof window !== "undefined" && (window as any).electronAPI?.getDataDir) {
      (window as any).electronAPI
        .getDataDir()
        .then((dir: string) => setDataDir(dir))
        .catch(() => {});
    }
  }, [isElectron]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-text-main mb-2">
            {t("resetPassword")}
          </h1>
          <p className="text-sm text-text-muted">{t("resetDescription")}</p>
        </div>

        {isElectron ? (
          <>
            {/* Electron: App Reset Method */}
            <Card className="mb-4">
              <div className="flex items-start gap-4 p-2">
                <div className="flex items-center justify-center size-10 rounded-lg bg-bg-subtle border border-border text-text-muted shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    folder_open
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-text-main mb-1">
                    {t("resetViaAppData")}
                  </h2>
                  <p className="text-sm text-text-muted mb-3">{t("deleteSettingsToReset")}</p>
                  <ol className="text-sm text-text-muted space-y-2 list-decimal list-inside mb-3">
                    <li>{t("quitAppCompletely")}</li>
                    <li>
                      {t("navigateToAppData")}:
                      {dataDir ? (
                        <div className="bg-bg-subtle rounded-lg p-2 mt-1 font-mono text-xs text-text-main border border-border break-all">
                          {dataDir}
                        </div>
                      ) : (
                        <div className="bg-bg-subtle rounded-lg p-2 mt-1 font-mono text-xs text-text-main border border-border">
                          <span className="text-text-subtle">({t("checkAppDataFolder")})</span>
                        </div>
                      )}
                    </li>
                    <li>
                      {t("deleteSettingsJson")}{" "}
                      <code className="bg-bg-subtle border border-border px-1 rounded font-mono text-[0.9em] text-text-main">
                        settings.json
                      </code>{" "}
                      ({t("orRemovePasswordHashField")})
                    </li>
                    <li>{t("relaunchAppFresh")}</li>
                  </ol>
                </div>
              </div>
            </Card>

            {/* Electron: Env File Method */}
            <Card className="mb-6">
              <div className="flex items-start gap-4 p-2">
                <div className="flex items-center justify-center size-10 rounded-lg bg-bg-subtle border border-border text-text-muted shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    settings
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-text-main mb-1">
                    {t("alternativeSetPassword")}
                  </h2>
                  <p className="text-sm text-text-muted mb-3">{t("setNewPasswordViaEnv")}</p>
                  <ol className="text-sm text-text-muted space-y-2 list-decimal list-inside mb-3">
                    <li>{t("quitAppCompletely")}</li>
                    <li>
                      {t("openServerEnv")}{" "}
                      <code className="bg-bg-subtle border border-border px-1 rounded font-mono text-[0.9em] text-text-main">
                        server.env
                      </code>{" "}
                      {t("inDataDirectory")}
                      {dataDir && (
                        <div className="bg-bg-subtle rounded-lg p-2 mt-1 font-mono text-xs text-text-main border border-border break-all">
                          {dataDir}/server.env
                        </div>
                      )}
                    </li>
                    <li>
                      {t("addOrUpdate")}:
                      <div className="bg-bg-subtle rounded-lg p-2 mt-1 font-mono text-xs text-text-main border border-border">
                        INITIAL_PASSWORD={t("newPasswordPlaceholder")}
                      </div>
                    </li>
                    <li>
                      {t("deleteAndRelaunch")}{" "}
                      <code className="bg-bg-subtle border border-border px-1 rounded font-mono text-[0.9em] text-text-main">
                        {t("settingsJson")}
                      </code>{" "}
                      {t("fromDataDir")}
                    </li>
                    <li>{t("relaunchApp")}</li>
                  </ol>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Method 1: CLI Reset */}
            <Card className="mb-4">
              <div className="flex items-start gap-4 p-2">
                <div className="flex items-center justify-center size-10 rounded-lg bg-bg-subtle border border-border text-text-muted shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    terminal
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-text-main mb-1">
                    {t("methodCliTitle")}
                  </h2>
                  <p className="text-sm text-text-muted mb-3">{t("methodCliDescription")}</p>
                  <div className="bg-bg-subtle rounded-lg p-3 mb-3 font-mono text-[13px] text-text-main border border-border">
                    <code>npx omniroute reset-password</code>
                  </div>
                  <p className="text-xs text-text-muted">{t("methodCliHint")}</p>
                </div>
              </div>
            </Card>

            {/* Method 2: Database Reset */}
            <Card className="mb-6">
              <div className="flex items-start gap-4 p-2">
                <div className="flex items-center justify-center size-10 rounded-lg bg-bg-subtle border border-border text-text-muted shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    database
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-text-main mb-1">
                    {t("methodManualTitle")}
                  </h2>
                  <p className="text-sm text-text-muted mb-3">{t("methodManualDescription")}</p>
                  <ol className="text-sm text-text-muted space-y-2 list-decimal list-inside mb-3">
                    <li>{t("stopServer")}</li>
                    <li>
                      {t("setPasswordInYour")}{" "}
                      <code className="bg-bg-subtle border border-border px-1 rounded font-mono text-[0.9em] text-text-main">
                        .env
                      </code>{" "}
                      {t("fileLabelSuffix")}
                      <div className="bg-bg-subtle rounded-lg p-2 mt-1 font-mono text-xs text-text-main border border-border">
                        INITIAL_PASSWORD={t("newPasswordPlaceholder")}
                      </div>
                    </li>
                    <li>
                      {t("deleteSettingsFile")}{" "}
                      <code className="bg-bg-subtle border border-border px-1 rounded font-mono text-[0.9em] text-text-main">
                        data/settings.json
                      </code>{" "}
                      ({t("orRemovePasswordHashField")})
                    </li>
                    <li>{t("restartServerWithNewPassword")}</li>
                  </ol>
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-[13px] text-text-muted hover:text-text-main transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              arrow_back
            </span>
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
