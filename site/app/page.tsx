import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { CustomerMoment } from "@/components/customer-moment";
import { Developers, FinalCta, SiteFooter, Status } from "@/components/sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <CustomerMoment />
        <Developers />
        <Status />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
