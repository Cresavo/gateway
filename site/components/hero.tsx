import Link from "next/link";
import { BookingDemo } from "./booking-demo";
import { TryDemoButton } from "./try-demo";
import { buttonStyles } from "./ui";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[1fr_minmax(0,33rem)] lg:gap-14 lg:pb-20 lg:pt-16 [&>*]:min-w-0">
        <div className="lg:pt-8">
          <p className="text-[0.92rem] font-medium text-muted">Booking infrastructure for AI agents</p>
          <h1
            id="hero-title"
            className="mt-4 text-balance text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.035em] text-fg sm:text-[3.4rem] lg:text-[3.75rem]"
          >
            Turn AI requests into confirmed bookings.
          </h1>
          <p className="mt-6 max-w-[33rem] text-pretty text-[1.12rem] leading-[1.65] text-muted">
            A REST and MCP gateway between AI agents and booking providers, with customer approval built into the flow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TryDemoButton />
            <Link href="/docs" className={buttonStyles.secondary}>
              Read the docs
            </Link>
          </div>
          <p className="mt-10 max-w-[33rem] text-[0.95rem] leading-7 text-muted">
            Built for developers of AI assistants and booking integrations. The salon in the demo is one concrete
            example of the general flow.
          </p>
          <p className="mt-3 text-[0.9rem] text-muted">
            Local proof of concept. Not hosted, no real customers yet.{" "}
            <Link href="#status" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              See what works today
            </Link>
          </p>
        </div>
        <BookingDemo />
      </div>
    </section>
  );
}
