import { ButtonLink } from "./ui";

type TraceLine = {
  kind: "call" | "result" | "retry";
  tool: string;
  detail: string;
  status: string;
  tone: "ok" | "muted" | "exp";
};

// Mirrors the tool sequence the acceptance proof exercises. Values are the
// contract's synthetic examples; server-generated ids are not invented.
const trace: TraceLine[] = [
  { kind: "call", tool: "list_services", detail: 'business: "demo"', status: "200", tone: "muted" },
  { kind: "call", tool: "get_availability", detail: 'service: "fotvard", date: "2026-11-24"', status: "200", tone: "muted" },
  { kind: "call", tool: "create_booking", detail: 'idempotencyKey: "salon-demo-0924-0900", mandateId: "…"', status: "201", tone: "ok" },
  { kind: "retry", tool: "create_booking", detail: "same key, same body after a dropped response", status: "200", tone: "exp" },
  { kind: "result", tool: "get_booking", detail: 'status: "confirmed"', status: "200", tone: "ok" },
];

const toneClass = { ok: "text-ok", muted: "text-muted", exp: "text-exp" } as const;

function AgentTrace() {
  return (
    <figure className="relative">
      <div aria-hidden className="absolute -inset-6 rounded-[28px] bg-ok/[0.05] blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-ink-2/95 shadow-[0_40px_100px_-40px_rgb(0_0_0/0.9)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="flex shrink-0 gap-1.5">
              <span className="size-2.5 rounded-full bg-white/10" />
              <span className="size-2.5 rounded-full bg-white/10" />
              <span className="size-2.5 rounded-full bg-white/10" />
            </span>
            <span className="ml-2 truncate font-mono text-xs text-faint">
              <span className="hidden sm:inline">agent ▸ </span>127.0.0.1:3218/api/v1/mcp
            </span>
          </div>
          <span className="ml-3 shrink-0 font-mono text-[10px] uppercase tracking-wider text-faint">synthetic</span>
        </div>
        <ol className="divide-y divide-line">
          {trace.map((line, index) => (
            <li
              key={index}
              className="animate-rise grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-3"
              style={{ animationDelay: `${200 + index * 160}ms` }}
            >
              <div className="min-w-0">
                <p className="font-mono text-[13px] text-fg">
                  {line.kind === "retry" ? <span className="text-exp">↻ </span> : <span className="text-faint">→ </span>}
                  {line.tool}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11.5px] text-faint">{line.detail}</p>
              </div>
              <span className={`font-mono text-xs ${toneClass[line.tone]}`}>
                {line.status}
                {line.kind === "retry" ? <span className="text-faint"> replayed</span> : null}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-2 border-t border-line bg-ok/[0.04] px-4 py-3">
          <span aria-hidden className="size-1.5 animate-pulse-soft rounded-full bg-ok" />
          <p className="font-mono text-[11.5px] text-muted">
            One booking. Same id in the salon&apos;s own calendar.
          </p>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-faint">
        Illustrative trace of the MCP tools the local acceptance proof runs.
      </figcaption>
    </figure>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden className="glow-top pointer-events-none absolute inset-0" />
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 [&>*]:min-w-0 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-28 lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] py-1 pl-1.5 pr-3 font-mono text-xs text-muted">
            <span className="rounded-full bg-ok/15 px-2 py-0.5 text-ok">v1</span>
            Booking infrastructure for AI agents
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-fg sm:text-6xl lg:text-[4.1rem]"
          >
            One gateway.
            <br />
            <span className="bg-gradient-to-r from-fg via-fg to-ok/80 bg-clip-text text-transparent">
              Every booking opportunity.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted">
            Connect AI agents to booking systems through one consistent interface. Discover availability, request
            bookings, handle approvals and confirm reservations over <span className="text-fg">REST</span> or{" "}
            <span className="text-fg">MCP</span>.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/docs#sandbox">Explore the sandbox</ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary">
              How it works
            </ButtonLink>
          </div>
          <p className="mt-7 flex max-w-xl items-start gap-2.5 text-sm leading-6 text-faint">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-exp" />
            <span>
              Today: a local proof of concept against Booking Lab&apos;s own synthetic salon. Not hosted, no real
              customers, not pilot-ready.
            </span>
          </p>
        </div>
        <AgentTrace />
      </div>
    </section>
  );
}
