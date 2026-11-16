import { Check, UserRound } from "lucide-react";
import { demo } from "@/lib/demo";

/*
  "The booking path": a request travels through the interface, stops for the
  customer's approval and becomes a concrete time block in the calendar.
  Real text, CSS lines; horizontal on desktop, stacked on mobile.
*/

function Stop({ title, role, strong = false, className = "" }: { title: string; role: string; strong?: boolean; className?: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${strong ? "border-fg bg-fg" : "border-line bg-ink-2"} ${className}`}>
      <p className={`text-[0.98rem] font-medium ${strong ? "text-ink-2" : "text-fg"}`}>{title}</p>
      <p className={`mt-1 text-[0.84rem] leading-5 ${strong ? "text-ink-2/75" : "text-muted"}`}>{role}</p>
    </div>
  );
}

/** Solid rail segment: vertical on mobile, horizontal on desktop. */
function Rail({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex justify-center py-1 lg:items-center lg:px-1 lg:py-0 ${className}`}>
      <span className="h-6 w-0.5 bg-ok/60 lg:h-0.5 lg:w-full" />
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="border-b border-line bg-panel/50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h2 id="how-it-works" className="text-balance text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-fg sm:text-[2.5rem]">
            From request to booking. With the customer in control.
          </h2>
          <p className="mt-4 text-pretty text-[1.05rem] leading-7 text-muted">
            The agent can find times and propose a booking, but it can&apos;t approve one. The booking provider waits
            for the customer&apos;s answer, then books and returns a result the agent can check.
          </p>
        </div>

        <figure className="mt-12">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_2rem_1.1fr_2rem_1.1fr_4.5rem_1fr] lg:grid-rows-[auto_auto]">
            <Stop className="lg:col-start-1 lg:row-start-2" title="AI agent" role="Finds times and proposes a booking. Can't approve it." />
            <Rail className="lg:col-start-2 lg:row-start-2" />
            <Stop className="lg:col-start-3 lg:row-start-2" strong title="Booking Lab" role="One REST and MCP contract. Checks the agent's scopes on every call." />
            <Rail className="lg:col-start-4 lg:row-start-2" />
            <Stop className="lg:col-start-5 lg:row-start-2" title="Booking provider" role="Owns availability, business rules, approvals and the calendar." />

            {/* The pause: the rail stops until the customer answers. */}
            <div aria-hidden className="flex justify-center py-1 lg:col-start-6 lg:row-start-2 lg:items-center lg:px-1 lg:py-0">
              <span className="flex h-10 w-0.5 flex-col justify-between lg:h-0.5 lg:w-full lg:flex-row">
                <span className="h-3 w-0.5 bg-ok/60 lg:h-0.5 lg:w-3" />
                <span className="h-3 w-0.5 bg-ok/60 lg:h-0.5 lg:w-3" />
              </span>
            </div>

            <div className="relative lg:col-span-3 lg:col-start-5 lg:row-start-1 lg:mb-6 lg:flex lg:justify-center">
              <div className="rounded-2xl border-2 border-ok bg-ink-2 px-4 py-3.5 lg:w-[19rem]">
                <p className="inline-flex items-center gap-2 text-[0.95rem] font-medium text-fg">
                  <span className="flex size-6 items-center justify-center rounded-full bg-ok text-ink-2">
                    <UserRound className="size-3.5" aria-hidden />
                  </span>
                  Customer approves
                </p>
                <p className="mt-1 text-[0.84rem] leading-5 text-muted">
                  A separate action, outside the agent&apos;s control. Declining means nothing is booked.
                </p>
              </div>
              <span aria-hidden className="absolute -bottom-6 left-1/2 hidden h-6 border-l-2 border-dashed border-ok lg:block" />
            </div>

            <Rail className="lg:hidden" />
            <div className="lg:col-start-7 lg:row-start-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border-l-4 border-ok bg-ok-dim px-3.5 py-3">
                <div>
                  <p className="text-[0.9rem] font-medium text-fg">
                    {demo.service} · {demo.start}–{demo.end}
                  </p>
                  <p className="text-[0.8rem] text-muted">Confirmed in the calendar</p>
                </div>
                <Check className="size-4 shrink-0 text-ok" aria-hidden />
              </div>
            </div>
          </div>
          <figcaption className="mt-6 max-w-3xl text-[0.92rem] leading-6 text-muted">
            Today the provider is Booking Lab&apos;s own synthetic salon, verified locally. The contract is designed for
            more booking providers, but other systems aren&apos;t supported yet.{" "}
            <a href="#status" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              Current status
            </a>
          </figcaption>
        </figure>

        <dl className="mt-14 grid gap-x-12 gap-y-8 border-t border-line pt-10 md:grid-cols-3">
          <div>
            <dt className="font-medium text-fg">Retries never double-book</dt>
            <dd className="mt-2 text-[0.95rem] leading-7 text-muted">
              Every booking carries an idempotency key. If a response is lost, the agent retries and gets the same booking
              back.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-fg">The business sets the rules</dt>
            <dd className="mt-2 text-[0.95rem] leading-7 text-muted">
              Each agent has its own revocable key, scopes and daily limits. Every attempt, including refusals, is logged
              for the business.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-fg">Approval is not payment</dt>
            <dd className="mt-2 text-[0.95rem] leading-7 text-muted">
              Saying yes to a time doesn&apos;t move money. Any deposit is a separate step with its own consent.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
