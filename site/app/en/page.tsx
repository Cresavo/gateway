import type { Metadata } from "next";
import { SalonPage } from "@/components/salon/salon-page";

export const metadata: Metadata = {
  title: { absolute: "Booking Lab – let assistants book your chairs" },
  description:
    "Customers approve every booking. You decide which agents may book, with limits and a log. Deposits through Swish, separate from the booking.",
  alternates: { canonical: "/en", languages: { sv: "/", en: "/en" } },
  openGraph: { locale: "en_GB" },
};

export default function HomeEn() {
  return <SalonPage lang="en" />;
}
