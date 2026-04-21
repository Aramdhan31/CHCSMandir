import type { Metadata } from "next";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutFullPage } from "@/components/AboutFullPage";
import { aboutPageMeta, site } from "@/content/site";

export const metadata: Metadata = {
  title: aboutPageMeta.documentTitle,
  description: `${aboutPageMeta.description} ${site.nameFull}.`,
};

export default function AboutPage() {
  return (
    <>
      <PreviewBanner />
      <SiteHeader />
      <main id="main">
        <AboutFullPage />
      </main>
      <SiteFooter />
    </>
  );
}
