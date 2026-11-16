import { Check, Minus, UserRound } from "lucide-react";
import { demo } from "@/lib/demo";

/*
  "The booking path": a request travels through the interface, stops at the
  provider until the customer answers, and becomes a time block in the calendar.
  Real text and CSS lines. One row on desktop, one column on mobile.
*/

function Stop({ title, role, strong = false, className = "" }: { title: string; role: string; strong?: boolean; className?: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${strong ? "border-fg bg-fg" : "border-line-strong bg-ink-2"} ${className}`}>
      <p className={`text-[1rem] font-medium ${strong ? "text-ink-2" : "text-fg"}`}>{title}</p>
      <p className={`mt-1 text-[0.86rem] leading-[1.45] ${strong ? "text-ink-2/80" : "text-muted"}`}>{role}</p>
    </div>
  );
}

/** A labelled arrow: points down on mobile, right on desktop. */
function Leg({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-1.5 pl-7 lg:flex-col lg:justify-center lg:gap-1.5 lg:px-1.5 lg:py-0 ${className}`}>
      <span aria-hidden className="flex flex-col items-center lg:hidden">
        <span className="h-5 w-0.5 bg-ok" />
        <span className="size-0 border-x-[4px] border-t-[6px] border-x-transparent border-t-ok" />
      </span>
      <span className="whitespace-nowrap text-[0.8rem] leading-4 text-muted lg:order-first lg:text-center">{label}</span>
      <span aria-hidden className="hidden w-full items-center lg:flex">
        <span className="h-0.5 flex-1 bg-ok" />
        <span className="size-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-ok" />
      </span>
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

        <figure className="mt-10 lg:mt-12">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_6rem_1fr_6rem_1fr_7rem_1.08fr] lg:grid-rows-[auto_auto_auto]">
            <Stop className="lg:col-start-1 lg:row-start-3" title="AI agent" role="Finds times and proposes a booking. Can't approve it." />
            <Leg className="lg:col-start-2 lg:row-start-3" label="REST or MCP" />
            <Stop
              className="lg:col-start-3 lg:row-start-3"
              strong
              title="Booking Lab"
              role="One contract for every agent. Checks key and scopes on each call."
            />
            <Leg className="lg:col-start-4 lg:row-start-3" label="Provider API" />
            <Stop
              className="lg:col-start-5 lg:row-start-3"
              title="Booking provider"
              role="Owns availability, business rules and the calendar. Waits for the customer's answer."
            />

            {/* The stop: the provider asks, the customer answers. Dashed, because the path waits here. */}
            <div className="flex items-center gap-3 py-1.5 pl-7 lg:col-span-3 lg:col-start-5 lg:row-start-2 lg:py-0 lg:pl-[4.25rem]">
              <span aria-hidden className="h-7 border-l-2 border-dashed border-ok lg:h-9" />
              <span className="text-[0.8rem] leading-4 text-muted">The provider asks. Only the customer answers.</span>
            </div>
            <div className="rounded-xl border-2 border-ok bg-ink-2 px-4 py-3.5 lg:col-span-3 lg:col-start-5 lg:row-start-1 lg:max-w-[23rem]">
              <p className="inline-flex items-center gap-2 text-[1rem] font-medium text-fg">
                <span className="flex size-6 items-center justify-center rounded-md bg-ok text-ink-2">
                  <UserRound className="size-3.5" aria-hidden />
                </span>
                Customer approves
              </p>
              <p className="mt-1 text-[0.86rem] leading-[1.45] text-muted">
                A separate action, outside the agent&apos;s control. If the customer declines, nothing is booked.
              </p>
            </div>

            <Leg className="lg:col-start-6 lg:row-start-3" label="Only after a yes" />
            <div className="rounded-xl border border-line-strong bg-ink-2 px-4 py-3.5 lg:col-start-7 lg:row-start-3">
              <p className="text-[1rem] font-medium text-fg">Calendar</p>
              <div className="mt-2 rounded-md border-l-[3px] border-ok bg-ok-dim px-2.5 py-2">
                <p className="text-[0.86rem] font-medium leading-5 text-fg">
                  {demo.service} <span className="whitespace-nowrap">{demo.start}–{demo.end}</span>
                </p>
                <p className="flex items-center gap-1 text-[0.8rem] leading-5 text-muted">
                  <Check className="size-3.5 shrink-0 text-ok" aria-hidden /> Confirmed
                </p>
              </div>
            </div>
          </div>
          <figcaption className="mt-6 max-w-3xl text-[0.92rem] leading-6 text-muted">
            Today the provider is Booking Lab&apos;s own synthetic salon, verified locally. The contract is designed for
            more booking providers, but other systems aren&apos;t supported yet, and the customer approval step is still
            experimental.{" "}
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
              Saying yes to a time doesn&apos;t move money. A deposit would be a separate step with its own consent.
              <div className="mt-4 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-[0.88rem] leading-6">
                <p className="flex items-center justify-between gap-3">
                  <span className="text-fg">Booking approval</span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-ok">
                    <Check className="size-3.5" aria-hidden /> Approved
                  </span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="text-fg">Example deposit: 100 kr via Swish</span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted">
                    <Minus className="size-3.5" aria-hidden /> Not paid
                  </span>
                </p>
                <p className="mt-1.5 text-[0.82rem] leading-5 text-muted">
                  Concept illustration. Simulation only. No payment is collected.
                </p>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
