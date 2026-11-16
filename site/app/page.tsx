import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Developers, FinalCta, ForSalons, SiteFooter, Status } from "@/components/sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <ForSalons />
        <Developers />
        <Status />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
