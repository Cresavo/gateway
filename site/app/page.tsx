import type { Metadata } from "next";
import { SalonPage } from "@/components/salon/salon-page";

export const metadata: Metadata = {
  title: { absolute: "Booking Lab – låt assistenter boka era tider" },
  description:
    "Kunden godkänner varje bokning. Ni bestämmer vilka agenter som får boka, med gränser och en logg. Depositioner via Swish, separat från bokningen.",
  alternates: { canonical: "/", languages: { sv: "/", en: "/en" } },
  openGraph: { locale: "sv_SE" },
};

export default function Home() {
  return <SalonPage lang="sv" />;
}
