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
      <PreviewBanner />
      <SiteHeader />
      <main id="main">
        <LeadershipFullPage />
      </main>
      <SiteFooter />
    </>
  );
}
