"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";

interface HttpProxySnippetCardProps {
  port: number;
  onClose: () => void;
}

type Lang = "bash" | "python" | "node";

export function HttpProxySnippetCard({ port, onClose }: HttpProxySnippetCardProps) {
  const t = useTranslations("trafficInspector");
  const [lang, setLang] = useState<Lang>("bash");
  const [copied, setCopied] = useState(false);

  const snippets: Record<Lang, string> = {
    bash: `export HTTP_PROXY=http://127.0.0.1:${port}\nexport HTTPS_PROXY=http://127.0.0.1:${port}\nexport NODE_TLS_REJECT_UNAUTHORIZED=0\n# then run your command:\ncurl https://api.openai.com/v1/models`,
    python: `import os\nos.environ["HTTP_PROXY"] = "http://127.0.0.1:${port}"\nos.environ["HTTPS_PROXY"] = "http://127.0.0.1:${port}"\nos.environ["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"\n# then use requests or httpx as usual`,
    node: `process.env.HTTP_PROXY = "http://127.0.0.1:${port}";\nprocess.env.HTTPS_PROXY = "http://127.0.0.1:${port}";\nprocess.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";\n// then use fetch / axios / undici as usual`,
  };

  const copy = async () => {
    await navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-card border border-border bg-surface shadow-[var(--shadow-elevated)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-main">
            {t("httpProxyTitle", { port })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors focus-ring rounded-md"
            aria-label={t("close")}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="flex gap-1 mb-3">
          {(["bash", "python", "node"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md border transition-colors focus-ring",
                lang === l
                  ? "border-border-strong bg-bg-subtle text-text-main"
                  : "border-border text-text-muted hover:text-text-main"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <pre className="rounded-lg bg-bg-subtle border border-border p-3 text-xs font-mono text-text-main overflow-x-auto whitespace-pre">
          {snippets[lang]}
        </pre>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-control border border-border-strong px-3 py-1.5 text-xs font-medium text-text-main hover:bg-bg-subtle transition-colors focus-ring"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      </div>
    </div>
  );
}
