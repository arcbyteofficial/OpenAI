"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import ProviderIcon from "@/shared/components/ProviderIcon";
import { BrandMark } from "@/shared/components/BrandLogo";

export default function FlowAnimation() {
  const t = useTranslations("landing");
  const [activeFlow, setActiveFlow] = useState(0);

  const cliTools = [
    { id: "claude", name: t("flowToolClaudeCode") },
    { id: "codex", name: t("flowToolOpenAICodex") },
    { id: "cline", name: t("flowToolCline") },
    { id: "cursor", name: t("flowToolCursor") },
  ];

  const providers = [
    {
      id: "openai",
      name: t("flowProviderOpenAI"),
      color: "bg-surface",
      textColor: "text-text-main",
    },
    {
      id: "anthropic",
      name: t("flowProviderAnthropic"),
      color: "bg-surface",
      textColor: "text-text-main",
    },
    {
      id: "gemini",
      name: t("flowProviderGemini"),
      color: "bg-surface",
      textColor: "text-text-main",
    },
    {
      id: "github",
      name: t("flowProviderGithubCopilot"),
      color: "bg-surface",
      textColor: "text-text-main",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlow((prev) => (prev + 1) % providers.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [providers.length]);

  return (
    <div className="mt-16 w-full max-w-4xl overflow-hidden">
      <div className="relative h-[360px] hidden md:flex items-center justify-center overflow-hidden">
        {/* Brand hub - Center */}
        <div className="relative z-20 w-32 h-32 rounded-full bg-surface border border-border-strong flex flex-col items-center justify-center gap-1.5 group cursor-pointer">
          <BrandMark size={40} className="rounded-lg" />
          <span className="text-[11px] font-semibold text-text-main tracking-wider uppercase">
            {t("brandName")}
          </span>
        </div>

        {/* CLI Tools - Left side */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-7">
          {cliTools.map((tool) => (
            <div
              key={tool.id}
              className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity group"
            >
              <div className="w-16 h-16 rounded-card bg-surface border border-border flex items-center justify-center overflow-hidden p-2 hover:border-border-strong transition-colors">
                <ProviderIcon providerId={tool.id} size={48} type="color" />
              </div>
            </div>
          ))}
        </div>

        {/* SVG Lines from CLI to OmniRoute */}
        <svg
          className="absolute inset-0 w-full h-full z-10 pointer-events-none stroke-border-strong"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="animate-[dash_2s_linear_infinite]"
            d="M 60 50 C 250 70, 250 180, 360 180"
            fill="none"
            strokeDasharray="5,5"
            strokeWidth="2"
          ></path>
          <path
            className="animate-[dash_2s_linear_infinite]"
            d="M 60 140 C 250 140, 250 180, 360 180"
            fill="none"
            strokeDasharray="5,5"
            strokeWidth="2"
          ></path>
          <path
            className="animate-[dash_2s_linear_infinite]"
            d="M 60 210 C 250 210, 250 180, 360 180"
            fill="none"
            strokeDasharray="5,5"
            strokeWidth="2"
          ></path>
          <path
            className="animate-[dash_2s_linear_infinite]"
            d="M 60 300 C 250 280, 250 180, 360 180"
            fill="none"
            strokeDasharray="5,5"
            strokeWidth="2"
          ></path>
        </svg>

        {/* SVG Lines from OmniRoute to Providers */}
        <svg
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 440 180 C 550 180, 550 50, 740 50"
            fill="none"
            stroke={activeFlow === 0 ? "var(--color-primary)" : "var(--color-border-strong)"}
            strokeWidth={activeFlow === 0 ? "3" : "2"}
            className={activeFlow === 0 ? "stroke-primary" : "stroke-border-strong"}
          ></path>
          <path
            d="M 440 180 C 550 180, 550 130, 740 130"
            fill="none"
            stroke={activeFlow === 1 ? "var(--color-primary)" : "var(--color-border-strong)"}
            strokeWidth={activeFlow === 1 ? "3" : "2"}
            className={activeFlow === 1 ? "stroke-primary" : "stroke-border-strong"}
          ></path>
          <path
            d="M 440 180 C 550 180, 550 230, 740 230"
            fill="none"
            stroke={activeFlow === 2 ? "var(--color-primary)" : "var(--color-border-strong)"}
            strokeWidth={activeFlow === 2 ? "3" : "2"}
            className={activeFlow === 2 ? "stroke-primary" : "stroke-border-strong"}
          ></path>
          <path
            d="M 440 180 C 550 180, 550 310, 740 310"
            fill="none"
            stroke={activeFlow === 3 ? "var(--color-primary)" : "var(--color-border-strong)"}
            strokeWidth={activeFlow === 3 ? "3" : "2"}
            className={activeFlow === 3 ? "stroke-primary" : "stroke-border-strong"}
          ></path>
        </svg>

        {/* AI Providers - Right side */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-6">
          {providers.map((provider, idx) => (
            <div
              key={provider.id}
              className={`px-3 py-2 rounded-lg ${provider.color} ${provider.textColor} border flex items-center justify-center font-medium text-xs leading-tight text-center transition-colors cursor-help min-w-[110px] max-w-[140px] ${
                activeFlow === idx ? "border-primary ring-2 ring-primary/15" : "border-border"
              }`}
              title={provider.name}
            >
              {provider.name}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="md:hidden mt-8 w-full p-4 rounded-card bg-surface border border-border">
        <p className="text-sm text-center text-text-muted">{t("interactiveDiagram")}</p>
      </div>
    </div>
  );
}
