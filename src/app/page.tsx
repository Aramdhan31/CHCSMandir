import { PreviewBanner } from "@/components/PreviewBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroSection } from "@/components/HeroSection";
import { EventsSection } from "@/components/EventsSection";
import { AboutSection } from "@/components/AboutSection";
import { MembershipSection } from "@/components/MembershipSection";
import { PeopleSection } from "@/components/PeopleSection";
import { LeadershipHomeTeaser } from "@/components/LeadershipHomeTeaser";
import { ConnectSection } from "@/components/ConnectSection";
import { VisitSection } from "@/components/VisitSection";

export default function HomePage() {
  return (
    <>
      <PreviewBanner />
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <EventsSection />
        <AboutSection />
        <MembershipSection />
        <PeopleSection />
        <LeadershipHomeTeaser />
        <ConnectSection />
        <VisitSection />
      </main>
      <SiteFooter />
    </>
  );
}
