import type { Metadata } from "next";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LeadershipFullPage } from "@/components/LeadershipFullPage";
import { leadership, leadershipPageMeta, site } from "@/content/site";

export const metadata: Metadata = {
  title: leadershipPageMeta.documentTitle,
  description: `${leadership.intro} — ${site.nameFull}.`,
};

export default function ExecutiveCommitteePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-deep focus:shadow-lg"
      >
        Skip to content
      </a>
      <PreviewBanner />
      <SiteHeader />
      <main id="main">
        <LeadershipFullPage />
      </main>
      <SiteFooter />
    </>
  );
}
