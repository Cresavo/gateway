import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Developers, FinalCta, SiteFooter, Status, UseCases, Why } from "@/components/sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Why />
        <Developers />
        <UseCases />
        <Status />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
