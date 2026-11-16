import { Bot, CalendarCheck2, Network, Plug } from "lucide-react";
import { flowSteps } from "@/lib/content";
import { MaturityBadge, SectionHeading } from "./ui";

function Connector({ label, delay }: { label: string; delay: string }) {
  return (
    <div className="relative flex items-center justify-center py-2 lg:px-1 lg:py-0" aria-hidden>
      {/* vertical on mobile, horizontal on desktop */}
      <div className="relative h-14 w-px bg-gradient-to-b from-line-strong via-ok/40 to-line-strong lg:h-px lg:w-full lg:bg-gradient-to-r">
        <span
          className="motion-packet absolute left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 animate-travel-y rounded-full bg-ok shadow-[0_0_10px_2px_rgb(110_231_183/0.5)] lg:hidden"
          style={{ animationDelay: delay }}
        />
        <span
          className="motion-packet absolute top-1/2 hidden size-1.5 -translate-x-1/2 -translate-y-1/2 animate-travel-x rounded-full bg-ok shadow-[0_0_10px_2px_rgb(110_231_183/0.5)] lg:block"
          style={{ animationDelay: delay }}
        />
      </div>
      <span className="absolute left-[calc(50%+14px)] whitespace-nowrap font-mono text-[10.5px] text-faint lg:left-1/2 lg:top-[calc(50%+10px)] lg:-translate-x-1/2">
        {label}
      </span>
    </div>
  );
}

function Node({
  icon: Icon,
  name,
  role,
  lines,
  highlight = false,
}: {
  icon: typeof Bot;
  name: string;
  role: string;
  lines: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 ${
        highlight
          ? "border-ok/30 bg-[linear-gradient(180deg,rgb(110_231_183/0.08),rgb(110_231_183/0.015))] shadow-[0_0_0_1px_rgb(110_231_183/0.06),0_30px_60px_-30px_rgb(110_231_183/0.25)]"
          : "border-line bg-panel/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-9 items-center justify-center rounded-lg border ${
            highlight ? "border-ok/30 bg-ok/10 text-ok" : "border-line bg-white/[0.03] text-fg"
          }`}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-fg">{name}</p>
          <p className="font-mono text-[11px] text-faint">{role}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="font-mono text-xs text-muted">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="relative border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <SectionHeading
          id="how-it-works"
          eyebrow="How it works"
          title="The agent talks to one contract. The provider keeps control of the booking."
          lead="The gateway is a separate service. It never touches the provider's database, calendar or customer records. It checks the agent's credentials, forwards allowed operations, and returns exactly what the provider decided."
        />

        <figure className="mt-14">
          <div className="grid items-center lg:grid-cols-[1fr_110px_1.15fr_130px_1fr]">
            <Node icon={Bot} name="AI assistant" role="your agent" lines={["REST client", "or MCP host", "agent key + scopes"]} />
            <Connector label="REST · MCP" delay="0s" />
            <Node
              icon={Network}
              name="Booking Lab Gateway"
              role="this repository"
              highlight
              lines={["REST v1 + Streamable HTTP MCP", "discovery + strict schemas", "access check on every call"]}
            />
            <Connector label="service credential" delay="1.6s" />
            <div className="flex flex-col gap-3">
              <Node
                icon={CalendarCheck2}
                name="Booking provider"
                role="Booking Lab salon · synthetic"
                lines={["availability + scheduling", "mandates + booking records", "conflict-safe transactions"]}
              />
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-3.5">
                <Plug className="size-4 shrink-0 text-faint" aria-hidden />
                <p className="text-sm text-faint">Other platforms via adapters</p>
                <MaturityBadge maturity="planned" className="ml-auto" />
              </div>
            </div>
          </div>
          <figcaption className="sr-only">
            An AI assistant calls the Booking Lab Gateway over REST or MCP with an agent key. The gateway calls the
            booking provider with a separate service credential. Today the only provider is Booking Lab&apos;s synthetic
            salon; other platforms through adapters are planned.
          </figcaption>
        </figure>

        <ol className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
          {flowSteps.map((step) => (
            <li key={step.n} className="grid gap-4 bg-ink p-6 sm:p-7 md:grid-cols-[3.5rem_1fr_auto] md:gap-6">
              <span className="font-mono text-sm text-faint">0{step.n}</span>
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-fg">{step.title}</h3>
                <p className="mt-2 max-w-2xl text-pretty leading-7 text-muted">{step.body}</p>
                {step.note ? (
                  <p className="mt-3 max-w-2xl border-l-2 border-exp/40 pl-3 text-sm leading-6 text-faint">{step.note}</p>
                ) : null}
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interface">
                  {step.surface.map((s) => (
                    <li key={s} className="rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-[11.5px] text-muted">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:pt-0.5">
                <MaturityBadge maturity={step.maturity} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
