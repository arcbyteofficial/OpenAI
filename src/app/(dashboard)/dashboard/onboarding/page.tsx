"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDisplayBaseUrl } from "@/shared/hooks";
import { FreeProviderOnboardingCard } from "./steps/FreeProviderOnboardingCard";
import { TierTour } from "./steps/TierTour";

const STEP_IDS = ["welcome", "tiers", "security", "provider", "test", "done"];
const STEP_ICONS = ["waving_hand", "layers", "lock", "dns", "play_circle", "check_circle"];

const COMMON_PROVIDERS = [
  { id: "openai", name: "OpenAI", color: "#10A37F" },
  { id: "anthropic", name: "Anthropic", color: "#D97757" },
  { id: "google", name: "Google AI", color: "#4285F4" },
  { id: "openrouter", name: "OpenRouter", color: "#6B21A8" },
  { id: "groq", name: "Groq", color: "#F55036" },
  { id: "mistral", name: "Mistral", color: "#FF7000" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const baseUrl = useDisplayBaseUrl();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const apiEndpoint = `${baseUrl}/api/v1`;

  // Security step state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [skipSecurity, setSkipSecurity] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // #14296: fresh Docker/NAT-forwarded installs (peer isn't 127.0.0.1) hit a
  // 401 on the bootstrap writes below until the operator supplies the
  // one-shot token the server printed to its log.
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [needsBootstrapToken, setNeedsBootstrapToken] = useState(false);

  // Provider step state
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerUrl, setProviderUrl] = useState("");
  const [providerKey, setProviderKey] = useState("");
  const [providerName, setProviderName] = useState("");

  // Test step state
  const [testStatus, setTestStatus] = useState("idle"); // idle, testing, success, error
  const [testMessage, setTestMessage] = useState("");

  // Check if setup is already complete
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const settings = await res.json();
          if (settings.setupComplete) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        // Continue with setup
      }
      setLoading(false);
    };
    checkSetup();
  }, [router]);

  const STEPS = STEP_IDS.map((id, i) => ({
    id,
    title: t(id === "done" ? "ready" : id),
    icon: STEP_ICONS[i],
  }));

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const [errorMessage, setErrorMessage] = useState("");

  // #14296: attach the operator-supplied bootstrap token when we have one —
  // required only for a non-loopback (e.g. Docker/NAT-forwarded) caller
  // completing a fresh install; a no-op header on every other install.
  const bootstrapHeaders = (base: Record<string, string> = {}) =>
    bootstrapToken ? { ...base, "x-omniroute-bootstrap-token": bootstrapToken } : base;

  // Returns true when the caller should stop (a bootstrap-token prompt was
  // shown), false when the response was a "real" failure to report normally.
  const handleBootstrapAuthFailure = (res: Response): boolean => {
    if (res.status === 401 && !bootstrapToken) {
      setNeedsBootstrapToken(true);
      setErrorMessage(t("bootstrapTokenHelp"));
      return true;
    }
    return false;
  };

  const handleSetPassword = async () => {
    setErrorMessage("");
    if (skipSecurity) {
      // (#574) Explicitly disable requireLogin when skipping password setup
      try {
        const res = await fetch("/api/settings/require-login", {
          method: "POST",
          headers: bootstrapHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ requireLogin: false }),
        });
        if (!res.ok) {
          if (!handleBootstrapAuthFailure(res)) setErrorMessage(t("failedSetPassword"));
          return;
        }
      } catch {
        setErrorMessage(t("connectionError"));
        return;
      }
      handleNext();
      return;
    }
    if (password !== confirmPassword) return;
    try {
      const res = await fetch("/api/settings/require-login", {
        method: "POST",
        headers: bootstrapHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ requireLogin: true, password }),
      });
      if (!res.ok) {
        if (handleBootstrapAuthFailure(res)) return;
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || t("failedSetPassword"));
        return;
      }
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        setErrorMessage(data.error || t("connectionError"));
        return;
      }
      handleNext();
    } catch {
      setErrorMessage(t("connectionError"));
    }
  };

  const handleAddProvider = async () => {
    if (!selectedProvider || !providerKey) return;
    setErrorMessage("");
    try {
      const provider = COMMON_PROVIDERS.find((p) => p.id === selectedProvider);
      const defaultUrls = {
        openai: "https://api.openai.com",
        anthropic: "https://api.anthropic.com",
        google: "https://generativelanguage.googleapis.com",
        openrouter: "https://openrouter.ai/api",
        groq: "https://api.groq.com/openai",
        mistral: "https://api.mistral.ai",
      };
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          name: providerName || provider?.name || selectedProvider,
          url: providerUrl || defaultUrls[selectedProvider] || "",
          apiKey: providerKey,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || t("failedAddProvider"));
        return;
      }
      handleNext();
    } catch {
      setErrorMessage(t("connectionError"));
    }
  };

  const handleTestProvider = async () => {
    setTestStatus("testing");
    setTestMessage(t("testingConnection"));
    try {
      const res = await fetch("/api/providers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const conn = data.connections?.[0];
      if (!conn) {
        setTestStatus("error");
        setTestMessage(t("noProviderFound"));
        return;
      }
      const testRes = await fetch(`/api/providers/${conn.id}/test`, { method: "POST" });
      if (testRes.ok) {
        setTestStatus("success");
        setTestMessage(t("connectionSuccessful"));
      } else {
        const err = await testRes.json().catch(() => ({}));
        setTestStatus("error");
        setTestMessage(err.error || t("testFailed"));
      }
    } catch {
      setTestStatus("error");
      setTestMessage(t("couldNotTest"));
    }
  };

  const handleFinish = async () => {
    setErrorMessage("");
    try {
      // (#574) If no password was set during wizard, disable requireLogin
      // to prevent the user from being locked out on the login page
      const settings = await fetch("/api/settings/require-login")
        .then((r) => r.json())
        .catch(() => ({}));
      if (!settings.hasPassword) {
        const requireLoginRes = await fetch("/api/settings/require-login", {
          method: "POST",
          headers: bootstrapHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ requireLogin: false }),
        });
        // #14296: this write used to be fire-and-forget, so a 401 from a
        // Docker/NAT-forwarded install silently left requireLogin untouched
        // and the wizard sailed on to setupComplete/dashboard anyway,
        // reproducing the reported redirect loop. Surface it instead.
        if (!requireLoginRes.ok && handleBootstrapAuthFailure(requireLoginRes)) return;
      }

      const patchRes = await fetch("/api/settings", {
        method: "PATCH",
        headers: bootstrapHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ setupComplete: true }),
      });
      if (!patchRes.ok) {
        if (handleBootstrapAuthFailure(patchRes)) return;
        setErrorMessage(t("connectionError"));
        return;
      }
    } catch {
      setErrorMessage(t("connectionError"));
      return;
    }
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted">{tc("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium tabular-nums transition-colors duration-300 ${
                  i < step
                    ? "bg-success/10 text-success"
                    : i === step
                      ? "bg-contrast text-contrast-fg"
                      : "bg-bg-subtle text-text-muted"
                }`}
              >
                {i < step ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 rounded-full transition-colors ${
                    i < step ? "bg-success/40" : "bg-border-strong"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card border border-border p-6">
          {/* Step Header */}
          <div className="text-center mb-6">
            <span
              className={`material-symbols-outlined text-[40px] mb-3 block ${
                currentStep.id === "done" ? "text-success" : "text-text-main"
              }`}
            >
              {currentStep.icon}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-text-main">
              {currentStep.title}
            </h2>
            {currentStep.id === "tiers" && (
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted text-balance">
                {t("tier.subtitle")}
              </p>
            )}
          </div>

          {/* #14296: fresh-install bootstrap token prompt + generic errors —
              rendered above the step content so it applies regardless of
              which step's write actually failed (security step or the
              Finish/Skip-wizard buttons). */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/25 rounded-lg text-center animate-in fade-in duration-200">
              <p className="text-sm text-warning">{errorMessage}</p>
              {needsBootstrapToken && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder={t("bootstrapTokenLabel")}
                    value={bootstrapToken}
                    onChange={(e) => setBootstrapToken(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-control text-text-main text-sm placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
                  />
                  <button
                    onClick={isLastStep ? handleFinish : handleSetPassword}
                    disabled={!bootstrapToken}
                    className="px-6 py-2 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t("retry")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[200px]">
            {/* Welcome */}
            {currentStep.id === "welcome" && (
              <div className="text-center space-y-4">
                <p className="text-sm text-text-muted">{t("welcomeDesc")}</p>
                <div className="mt-6 grid grid-cols-3 gap-3 items-stretch">
                  {[
                    { icon: "swap_horiz", label: t("multiProvider") },
                    { icon: "monitoring", label: t("usageTracking") },
                    { icon: "shield", label: t("apiKeyMgmt") },
                  ].map((f) => (
                    <div
                      key={f.icon}
                      className="h-full bg-surface-2 rounded-lg p-3 text-center border border-border"
                    >
                      <div className="flex h-full flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-text-muted text-[20px] mb-1 block">
                          {f.icon}
                        </span>
                        <span className="text-xs text-text-muted">{f.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tiers */}
            {currentStep.id === "tiers" && <TierTour />}

            {/* Security */}
            {currentStep.id === "security" && (
              <div className="space-y-4">
                <p className="text-sm text-text-muted text-center">{t("securityDesc")}</p>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={skipSecurity}
                    onChange={(e) => setSkipSecurity(e.target.checked)}
                    className="accent-primary"
                  />
                  {t("skipPassword")}
                </label>
                {skipSecurity && (
                  <p className="text-xs text-warning text-center animate-in fade-in duration-200">
                    {t("securityDescSkipWarning")}
                  </p>
                )}
                {!skipSecurity && (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder={t("enterPassword")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                      className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-control text-text-main text-sm placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
                    />
                    <input
                      type="password"
                      placeholder={t("confirmPasswordPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                      className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-control text-text-main text-sm placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
                    />
                    {capsLockOn && (
                      <p className="text-xs text-warning flex items-center gap-1 animate-in fade-in duration-200">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          keyboard_capslock
                        </span>
                        Caps Lock is on
                      </p>
                    )}
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-error">{t("passwordsMismatch")}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Provider */}
            {currentStep.id === "provider" && (
              <div className="space-y-4">
                <p className="text-sm text-text-muted text-center">{t("providerDesc")}</p>
                {skipSecurity && (
                  <div className="text-center p-3 bg-warning/10 border border-warning/25 rounded-lg animate-in fade-in duration-200">
                    <p className="text-sm text-warning">{t("providerRequiresPassword")}</p>
                  </div>
                )}
                {!skipSecurity && <FreeProviderOnboardingCard />}
                {!skipSecurity && (
                  <div className="flex items-center gap-3 text-[11px] text-text-muted">
                    <span className="h-px flex-1 bg-border" />
                    <span>{t("freeProviders.orUseApiKey")}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                {!skipSecurity && (
                  <div className="grid grid-cols-3 gap-2">
                    {COMMON_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProvider(p.id);
                          setProviderName(p.name);
                        }}
                        className={`p-3 rounded-lg border text-center text-xs font-medium transition-colors cursor-pointer ${
                          selectedProvider === p.id
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text-main"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {!skipSecurity && selectedProvider && (
                  <div className="space-y-3 mt-4">
                    <input
                      type="password"
                      placeholder={t("apiKeyRequired")}
                      value={providerKey}
                      onChange={(e) => setProviderKey(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-control text-text-main text-sm placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
                    />
                    <input
                      type="text"
                      placeholder={t("customUrlOptional")}
                      value={providerUrl}
                      onChange={(e) => setProviderUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-control text-text-main text-sm placeholder:text-text-subtle focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Test */}
            {currentStep.id === "test" && (
              <div className="text-center space-y-4">
                <p className="text-sm text-text-muted">{t("testDesc")}</p>
                {testStatus === "idle" && (
                  <button
                    onClick={handleTestProvider}
                    className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors cursor-pointer"
                  >
                    {t("runTest")}
                  </button>
                )}
                {testStatus === "testing" && (
                  <div className="flex items-center justify-center gap-2 text-text-muted">
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                    <span className="text-sm">{testMessage}</span>
                  </div>
                )}
                {testStatus === "success" && (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="text-sm">{testMessage}</span>
                  </div>
                )}
                {testStatus === "error" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-warning">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                      <span className="text-sm">{testMessage}</span>
                    </div>
                    <button
                      onClick={handleTestProvider}
                      className="text-xs text-text-muted underline cursor-pointer"
                    >
                      {t("retry")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Done */}
            {currentStep.id === "done" && (
              <div className="text-center space-y-4">
                <p className="text-sm text-text-muted">{t("doneDesc")}</p>
                <div className="bg-surface-2 rounded-lg p-4 border border-border text-left">
                  <p className="text-xs text-text-muted mb-2 font-medium">{t("yourEndpoint")}</p>
                  <code className="font-mono text-[13px] text-text-main">{apiEndpoint}</code>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
            <div>
              {step > 0 && !isLastStep && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  {tc("back")}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isLastStep && step > 0 && (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  {t("skip")}
                </button>
              )}
              {currentStep.id === "welcome" && (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors cursor-pointer"
                >
                  {t("getStarted")}
                </button>
              )}
              {currentStep.id === "tiers" && (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors cursor-pointer"
                >
                  {t("continue")}
                </button>
              )}
              {currentStep.id === "security" && (
                <button
                  onClick={handleSetPassword}
                  disabled={!skipSecurity && (!password || password !== confirmPassword)}
                  className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {skipSecurity ? t("skipAndContinue") : t("setPassword")}
                </button>
              )}
              {currentStep.id === "provider" && !skipSecurity ? (
                <button
                  onClick={handleAddProvider}
                  disabled={!selectedProvider || !providerKey}
                  className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t("addProvider")}
                </button>
              ) : null}
              {currentStep.id === "test" && (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors cursor-pointer"
                >
                  {testStatus === "success" ? t("continue") : t("skip")}
                </button>
              )}
              {isLastStep && (
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 bg-contrast rounded-control text-contrast-fg font-medium text-sm hover:bg-contrast-hover transition-colors cursor-pointer"
                >
                  {t("goToDashboard")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Skip Wizard */}
        {!isLastStep && (
          <div className="text-center mt-4">
            <button
              onClick={handleFinish}
              className="text-xs text-text-subtle hover:text-text-main transition-colors cursor-pointer"
            >
              {t("skipWizard")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
