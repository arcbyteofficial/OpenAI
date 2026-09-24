"use client";

import { useTranslations } from "next-intl";

import { useState, useEffect } from "react";
import { Button, Input } from "@/shared/components";
import { BrandMark, BrandWordmark } from "@/shared/components/BrandLogo";
import { BRAND } from "@/shared/constants/appConfig";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [oidcEnabled, setOidcEnabled] = useState<boolean | null>(null);
  const [oidcDisablePasswordLogin, setOidcDisablePasswordLogin] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nodeVersion, setNodeVersion] = useState(null);
  const [nodeCompatible, setNodeCompatible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    async function checkAuth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

      try {
        const res = await fetch(`${baseUrl}/api/settings/require-login`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.nodeVersion) setNodeVersion(data.nodeVersion);
          if (data.nodeCompatible === false) setNodeCompatible(false);
          if (data.authenticated === true || data.requireLogin === false) {
            window.location.href = "/dashboard";
            return;
          }
          setHasPassword(!!data.hasPassword);
          setSetupComplete(!!data.setupComplete);
          setOidcEnabled(!!data.oidcEnabled);
          setOidcDisablePasswordLogin(!!data.oidcDisablePasswordLogin);
        } else {
          setHasPassword(true);
          setSetupComplete(true);
          setOidcEnabled(false);
          setOidcDisablePasswordLogin(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setHasPassword(true);
        setSetupComplete(true);
        setOidcEnabled(false);
        setOidcDisablePasswordLogin(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem("omniroute_login_time", String(Date.now()));
        window.location.href = "/dashboard";
      } else {
        const data = await res.json();
        // (#521) If no password is set, redirect to onboarding instead of showing an error
        if (data.needsSetup) {
          window.location.href = "/dashboard/onboarding";
          return;
        }
        setError(data.error || t("invalidPassword"));
      }
    } catch (err) {
      setError(t("errorOccurredRetry"));
    } finally {
      setLoading(false);
    }
  };

  const nodeWarningBanner =
    !nodeCompatible && nodeVersion ? (
      <div className="w-full max-w-lg mx-auto mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="bg-error/5 border border-error/30 rounded-card p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-error text-[22px]">error</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-main mb-1">
                {t("nodeIncompatibleTitle")}
              </h3>
              <p className="text-[13px] text-text-muted leading-relaxed mb-3">
                {t("nodeIncompatibleDesc", { version: nodeVersion })}
              </p>
              <div className="bg-bg-subtle rounded-lg px-3 py-2.5 font-mono text-[13px] border border-border">
                <div className="flex items-center gap-2 text-text-subtle mb-1">
                  <span className="material-symbols-outlined text-[14px]">terminal</span>
                  <span className="text-xs">{t("nodeIncompatibleFixLabel")}</span>
                </div>
                <code className="text-text-main">nvm install 22 && nvm use 22</code>
              </div>
              <p className="text-xs text-text-subtle mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">info</span>
                {t("nodeIncompatibleHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    ) : null;
  if (
    hasPassword === null ||
    setupComplete === null ||
    oidcEnabled === null ||
    (oidcEnabled && oidcDisablePasswordLogin === null)
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {nodeWarningBanner}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-border rounded-full"></div>
            <div className="absolute inset-0 w-10 h-10 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-sm text-text-muted">{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (!hasPassword && !setupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {nodeWarningBanner}
        <div
          className={`w-full max-w-md transition-[opacity,translate] duration-500 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-card bg-surface border border-border mb-5">
              <span className="material-symbols-outlined text-text-main text-[32px]">
                rocket_launch
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-text-main tracking-tight">{t("welcome")}</h1>
            <p className="text-sm text-text-muted mt-2">{t("configureInstance")}</p>
          </div>

          <div className="bg-surface border border-border rounded-card p-6">
            <div className="text-center">
              <p className="text-sm text-text-muted leading-relaxed mb-5">
                {t("runOnboardingWizard")}
              </p>
              <Button
                variant="primary"
                className="w-full h-11 text-sm font-medium"
                onClick={() => router.push("/dashboard/onboarding")}
              >
                {t("startOnboarding")}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-text-subtle mt-6">
            {BRAND.name} — {t("unifiedProxy")}
          </p>
        </div>
      </div>
    );
  }

  if (!hasPassword && setupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {nodeWarningBanner}
        <div
          className={`w-full max-w-md transition-[opacity,translate] duration-500 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-card bg-surface border border-border mb-5">
              <span className="material-symbols-outlined text-warning text-[32px]">
                shield_person
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-text-main tracking-tight">
              {t("secureYourInstance")}
            </h1>
            <p className="text-sm text-text-muted mt-2">{t("passwordNotEnabled")}</p>
          </div>

          <div className="bg-surface border border-border rounded-card p-6">
            <div className="text-center">
              <p className="text-sm text-text-muted leading-relaxed mb-5">
                {t("setPasswordDescription")}
              </p>
              <Button
                variant="primary"
                className="w-full h-11 text-sm font-medium"
                onClick={() => router.push("/dashboard/onboarding")}
              >
                {t("configurePassword")}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-text-subtle mt-6">
            {BRAND.name} — {t("unifiedAiApiProxy")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {nodeWarningBanner && (
        <div className="flex justify-center pt-6 px-6">{nodeWarningBanner}</div>
      )}
      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className={`w-full max-w-sm transition-[opacity,translate] duration-500 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-8">
                <BrandMark size={40} className="rounded-lg" />
                <BrandWordmark className="text-base" />
              </div>
              <h1 className="text-2xl font-semibold text-text-main tracking-tight">
                {t("signIn")}
              </h1>
              <p className="text-sm text-text-muted mt-1.5">
                {oidcEnabled && oidcDisablePasswordLogin
                  ? t("continueWithOidc")
                  : t("enterPassword")}
              </p>
            </div>

            {oidcEnabled && oidcDisablePasswordLogin ? (
              <div className="space-y-4 bg-surface border border-border rounded-card p-6">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full h-11 text-sm font-medium flex items-center justify-center gap-2"
                  onClick={() => (window.location.href = "/api/auth/oidc/login")}
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  {t("continueWithOidc")}
                </Button>
              </div>
            ) : (
              <>
                <form
                  onSubmit={handleLogin}
                  className="space-y-5 w-full bg-surface border border-border rounded-card p-6"
                >
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-text-main">
                      {t("password")}
                    </label>
                    <Input
                      type="password"
                      placeholder={t("enterPassword")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      className="h-11"
                    />
                    {error && (
                      <p className="text-[13px] text-error flex items-center gap-1.5 pt-1">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {error}
                      </p>
                    )}
                    <p className="text-xs text-text-subtle pt-0.5">{t("defaultPasswordHint")}</p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 text-sm font-medium"
                    loading={loading}
                  >
                    {t("continue")}
                  </Button>
                </form>

                {oidcEnabled && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full h-11 text-sm font-medium flex items-center justify-center gap-2"
                      onClick={() => (window.location.href = "/api/auth/oidc/login")}
                    >
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      {t("continueWithOidc")}
                    </Button>
                  </div>
                )}
              </>
            )}

            {!oidcEnabled && (
              <div className="mt-5">
                <a
                  href="/forgot-password"
                  className="text-[13px] text-text-muted hover:text-text-main transition-colors"
                >
                  {t("forgotPassword")}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 bg-bg-subtle border-l border-border items-center justify-center p-12">
          <div
            className={`max-w-md transition-[opacity,translate] duration-500 delay-100 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-text-main mb-2">
                  {t("unifiedAiApiProxy")}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  {t("unifiedAiApiProxyDesc")}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: "swap_horiz",
                    title: t("featureMultiProviderTitle"),
                    desc: t("featureMultiProviderDesc"),
                  },
                  {
                    icon: "speed",
                    title: t("featureLoadBalancingTitle"),
                    desc: t("featureLoadBalancingDesc"),
                  },
                  {
                    icon: "analytics",
                    title: t("featureUsageTrackingTitle"),
                    desc: t("featureUsageTrackingDesc"),
                  },
                ].map((item) => (
                  <div
                    key={item.icon}
                    className="flex items-start gap-3 p-4 rounded-card bg-surface border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-bg-subtle border border-border flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-text-muted text-[18px]">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text-main">{item.title}</h3>
                      <p className="text-[13px] text-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
