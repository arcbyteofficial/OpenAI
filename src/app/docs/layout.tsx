import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import type { ReactNode } from "react";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Suspense } from "react";
import LanguageSelector from "@/shared/components/LanguageSelector";
import { BrandMark, BrandWordmark } from "@/shared/components/BrandLogo";
import { BRAND } from "@/shared/constants/appConfig";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("docs");
  return {
    title: {
      template: t("metadataTitleTemplate"),
      default: t("metadataDefaultTitle"),
    },
    description: t("metadataDescription"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * The localized "ArcByte | Open AI Docs" title with the brand drawn as the wordmark, so
 * "ArcByte | Open AI" never breaks across lines; a long translation of "Docs" may wrap
 * after it.
 */
function DocsNavTitle({ title }: { title: string }) {
  const at = title.indexOf(BRAND.name);
  return (
    <span className="inline-flex items-center gap-2">
      <BrandMark size={20} className="rounded" />
      <span>
        {at < 0 ? (
          title
        ) : (
          <>
            {title.slice(0, at)}
            <BrandWordmark className="font-medium" />
            {title.slice(at + BRAND.name.length)}
          </>
        )}
      </span>
    </span>
  );
}

export default async function Layout({ children }: { children: ReactNode }) {
  const t = await getTranslations("docs");
  const docsLayoutOptions: BaseLayoutProps = {
    nav: {
      title: <DocsNavTitle title={t("layoutNavTitle")} />,
      url: "/docs",
    },
    links: [
      {
        text: t("layoutHomeLink"),
        url: "/docs",
      },
      {
        text: t("layoutDashboardLink"),
        url: "/dashboard",
        secondary: true,
      },
    ],
    githubUrl: "https://github.com/diegosouzapw/OmniRoute",
  };

  return (
    <RootProvider
      theme={{
        defaultTheme: "dark",
        attribute: "class",
      }}
      search={{
        options: {
          api: "/docs/api/search",
        },
      }}
    >
      <DocsLayout
        tree={source.pageTree}
        {...docsLayoutOptions}
        // The language menu lives at the foot of the sidebar: in the header row it squeezed
        // the title onto three lines.
        sidebar={{
          footer: (
            <Suspense fallback={<div className="h-8" />}>
              <LanguageSelector menuPosition="above-start" />
            </Suspense>
          ),
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
