import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-xl flex-col items-center px-5 py-32 text-center">
        <p className="font-mono text-sm text-faint">404 · booking_not_found</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg">This page doesn&apos;t exist.</h1>
        <p className="mt-3 text-muted">Nothing was booked, so there&apos;s nothing to retry.</p>
        <div className="mt-8">
          <ButtonLink href="/">Back to overview</ButtonLink>
        </div>
      </main>
    </>
  );
}
