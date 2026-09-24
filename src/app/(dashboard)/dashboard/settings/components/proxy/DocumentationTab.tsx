"use client";
import { useTranslations } from "next-intl";
import { Card } from "@/shared/components";

export default function DocumentationTab() {
  const t = useTranslations("settings");

  return (
    <Card className="p-6 space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-text-main mb-2">
          {t("proxyDocumentationScopeTitle")}
        </h3>
        <p className="text-sm text-text-muted">
          {t("proxyDocumentationScopeDescBefore")}
          <strong>{t("proxyDocumentationScopeOrder")}</strong>
          {t("proxyDocumentationScopeDescAfter")}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-main mb-2">
          {t("proxyDocumentationAddTitle")}
        </h3>
        <p className="text-sm text-text-muted">
          {t("proxyDocumentationAddDescBefore")}
          <strong>{t("proxyPoolTab")}</strong>
          {t("proxyDocumentationAddDescMiddle")}
          <em>{t("proxyDocumentationAddCta")}</em>
          {t("proxyDocumentationAddDescAfter")}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-main mb-2">
          {t("proxyDocumentationBulkTitle")}
        </h3>
        <pre className="font-mono text-[12px] text-text-main bg-bg-subtle border border-border p-3 rounded-lg mt-1 overflow-x-auto">
          {`http://user:pass@1.2.3.4:8080\nhttps://5.6.7.8:3128\nsocks5://9.0.1.2:1080`}
        </pre>
        <p className="text-sm text-text-muted mt-1">
          {t("proxyDocumentationBulkDesc")} <code>type|host|port|user|pass|name</code>
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-main mb-2">SOCKS5</h3>
        <p className="text-sm text-text-muted">
          {t("proxyDocumentationSocks5DescBefore")}{" "}
          <code className="rounded bg-bg-subtle px-1 text-xs">ENABLE_SOCKS5_PROXY=false</code>{" "}
          {t("proxyDocumentationSocks5DescAfter")}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-main mb-2">{t("freePoolTab")}</h3>
        <p className="text-sm text-text-muted">{t("proxyDocumentationFreePoolDesc")}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-main mb-2">Vercel Relay</h3>
        <p className="text-sm text-text-muted">
          {t("proxyDocumentationVercelRelayDescBefore")} (
          <code className="rounded bg-bg-subtle px-1 text-xs">x-relay-auth</code>).{" "}
          {t("proxyDocumentationVercelRelayDescAfter")}
        </p>
      </section>
    </Card>
  );
}
