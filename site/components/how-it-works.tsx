import { SectionHeading, MaturityBadge } from "./ui";

const systems: { name: string; maturity: "verified" | "experimental" | "planned" }[] = [
  { name: "Booking Lab salon", maturity: "verified" },
  { name: "SimplyBook", maturity: "experimental" },
  { name: "Nordic systems", maturity: "planned" },
];

const steps = [
  { n: "01", title: "Ask", body: "The customer asks their assistant. The agent reads services and open times through one contract." },
  { n: "02", title: "Propose", body: "The agent proposes one exact booking: salon, service, time and price." },
  { n: "03", title: "Yes", body: "The customer approves it. The approval becomes a single-use mandate. No API or MCP tool can issue one.", gate: true },
  { n: "04", title: "Book", body: "The salon's system books it in one transaction. A retry returns the same booking, never a second one." },
];

function Box({ label, sub, strong = false }: { label: string; sub: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${strong ? "border-fg bg-fg text-ink-2" : "border-line bg-ink-2"}`}>
      <p className={`text-[0.95rem] font-medium ${strong ? "text-ink-2" : "text-fg"}`}>{label}</p>
      <p className={`mt-0.5 font-mono text-[10.5px] ${strong ? "text-ink-2/70" : "text-faint"}`}>{sub}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div aria-hidden className="flex items-center justify-center py-1.5 lg:px-2 lg:py-0">
      <span className="h-5 w-px bg-line-strong lg:h-px lg:w-full" />
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          id="how-it-works"
          eyebrow="How it works"
          title="Rails between the assistant and the salon."
          lead="Booking Lab doesn't replace anyone's app. Customers keep their assistant, and salons keep their booking system. The gateway in between enforces the rules."
        />

        <figure className="mt-14">
          <div className="grid items-center lg:grid-cols-[1fr_3rem_1.1fr_3rem_1.2fr]">
            <Box label="The customer's assistant" sub="ChatGPT, Claude, Grok or any MCP client" />
            <Arrow />
            <div className="relative">
              <div className="mb-2 flex items-center justify-center gap-2 rounded-full border border-ok/40 bg-ok-dim px-3 py-1.5 text-[0.8rem] text-fg lg:absolute lg:-top-12 lg:inset-x-0 lg:mb-0">
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                Customer&apos;s yes required to book
              </div>
              <Box label="Booking Lab gateway" sub="REST v1 · MCP · keys · limits · audit log" strong />
              <div className="mt-2 flex items-center justify-center gap-2 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-[0.8rem] text-muted lg:absolute lg:-bottom-12 lg:inset-x-0 lg:mt-0 lg:whitespace-nowrap">
                Deposits on their own track · Swish, simulated
              </div>
            </div>
            <Arrow />
            <ul className="space-y-2">
              {systems.map((s) => (
                <li
                  key={s.name}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${
                    s.maturity === "planned" ? "border-dashed border-line-strong" : "border-line bg-ink-2"
                  }`}
                >
                  <span className={`text-[0.92rem] ${s.maturity === "planned" ? "text-muted" : "text-fg"}`}>{s.name}</span>
                  <MaturityBadge maturity={s.maturity} />
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="sr-only">
            The customer&apos;s assistant calls the Booking Lab gateway. The gateway requires the customer&apos;s yes before
            booking, and handles deposits on a separate, simulated Swish track. It forwards to booking systems through
            adapters: Booking Lab&apos;s own salon is verified locally, SimplyBook is experimental, and Nordic systems are planned.
          </figcaption>
        </figure>

        <ol className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className={`p-6 ${s.gate ? "bg-ok-dim" : "bg-ink-2"}`}>
              <p className={`font-mono text-[11px] ${s.gate ? "text-ok" : "text-faint"}`}>{s.n}</p>
              <h3 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.02em] text-fg">{s.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-6 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
