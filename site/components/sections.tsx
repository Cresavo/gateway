import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { status, type Maturity } from "@/lib/content";
import { site } from "@/lib/site";
import { AudienceCta } from "./audience-cta";
import { TwoViews } from "./two-views";
import { Logo, MaturityBadge, MaturityDot, SectionHeading } from "./ui";

const agents = [
  { name: "Reception agent", owner: "Salong Eko", scopes: "read · book", limit: "5 / day", state: "Active" },
  { name: "Personal assistant (test)", owner: "Test operator", scopes: "read", limit: "5 / day", state: "Active" },
  { name: "Old demo key", owner: "Test operator", scopes: "read · book", limit: "—", state: "Revoked" },
];

const log = [
  { t: "13:02", event: "booking.created", outcome: "booked", ok: true },
  { t: "13:02", event: "mandate.consumed", outcome: "success", ok: true },
  { t: "13:01", event: "consent.approved", outcome: "customer-consent", ok: true },
  { t: "12:58", event: "proposal.created", outcome: "pending", ok: true },
  { t: "12:40", event: "agent.request", outcome: "403 forbidden_scope", ok: false },
  { t: "12:12", event: "agent.request", outcome: "429 rate_limited", ok: false },
];

const controls = [
  { title: "Choose which agents may book", body: "Every agent has its own key, tied to a named agent and a responsible person. Revoke it any time. The agent's bookings stay attached to it." },
  { title: "Set what they may do", body: "Scopes separate reading the catalog from booking. Daily limits per agent and per customer stop runaway retries." },
  { title: "See everything, refusals included", body: "Proposals, approvals, mandates, bookings and every refused request are written to an audit log the salon can read." },
];

export function ForSalons() {
  return (
    <section aria-labelledby="salons" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-28 [&>*]:min-w-0">
        <div>
          <SectionHeading
            id="salons"
            eyebrow="For salons"
            title="Agents book on your terms."
            lead="Opening your calendar to AI shouldn't mean losing control of it. You decide who gets in, how much they can do, and you can check what happened afterwards."
          />
          <ul className="mt-10 space-y-6">
            {controls.map((c) => (
              <li key={c.title} className="border-l border-line-strong pl-4">
                <h3 className="font-medium text-fg">{c.title}</h3>
                <p className="mt-1 text-[0.92rem] leading-6 text-muted">{c.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1">
            <MaturityBadge maturity="verified" />
            <span className="text-[0.84rem] text-faint">Keys, scopes, limits and the audit log</span>
          </p>
        </div>

        <figure>
          <div className="card surface-shadow overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[0.88rem] font-medium text-fg">Agent access</p>
              <p className="font-mono text-[10.5px] text-faint">Salong Eko</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-[0.84rem]">
                <thead>
                  <tr className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-4 py-2.5 font-normal">Agent</th>
                    <th scope="col" className="px-4 py-2.5 font-normal">Scopes</th>
                    <th scope="col" className="px-4 py-2.5 font-normal">Limit</th>
                    <th scope="col" className="px-4 py-2.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line border-t border-line">
                  {agents.map((a) => (
                    <tr key={a.name} className={a.state === "Revoked" ? "text-faint" : "text-fg"}>
                      <td className="px-4 py-3">
                        <p className={a.state === "Revoked" ? "line-through decoration-faint/60" : ""}>{a.name}</p>
                        <p className="text-[0.75rem] text-faint">{a.owner}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11.5px]">{a.scopes}</td>
                      <td className="px-4 py-3 tabular-nums">{a.limit}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden className={`size-1.5 rounded-full ${a.state === "Active" ? "bg-ok" : "border border-faint"}`} />
                          {a.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line bg-ink px-4 pb-3 pt-3">
              <p className="eyebrow !text-[10px]">Audit log · today</p>
              <ul className="mt-2 space-y-1 font-mono text-[11.5px]">
                {log.map((l, i) => (
                  <li key={i} className="grid grid-cols-[2.6rem_minmax(0,1fr)_auto] gap-3">
                    <span className="tabular-nums text-faint">{l.t}</span>
                    <span className="truncate text-fg">{l.event}</span>
                    <span className={l.ok ? "text-muted" : "text-ok"}>{l.outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <figcaption className="mt-3 text-[0.78rem] leading-5 text-faint">
            Concept screen. The keys, limits and audit events shown here exist in the provider today, under these event
            names. This admin view hasn&apos;t been built in the salon app yet.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

const paths = [
  {
    name: "MCP",
    lead: "For assistants. The same operations as tools over Streamable HTTP.",
    code: `POST /api/v1/mcp
tools: list_services
       get_availability
       create_proposal
       create_booking
       get_booking`,
    href: "/docs#mcp",
  },
  {
    name: "REST v1",
    lead: "For your own agents and backends. OpenAPI 3.1, five operations.",
    code: `GET  /api/v1/availability
POST /api/v1/bookings
     Idempotency-Key: …
GET  /api/v1/bookings/{id}`,
    href: "/docs#rest",
  },
  {
    name: "Discovery",
    lead: "For agents finding their own way: an llms.txt and a USP profile.",
    code: `GET /llms.txt
GET /.well-known/usp
GET /api/v1/openapi
GET /api/v1/mcp/schema`,
    href: "/docs#discovery",
  },
];

export function Developers() {
  return (
    <section aria-labelledby="developers" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 [&>*]:min-w-0">
          <SectionHeading
            id="developers"
            eyebrow="For developers"
            title="One booking. Two views."
            lead={
              <>
                The customer sees a booking they can understand. The agent gets a strict JSON object it can rely on. A
                retry with the same key returns the same booking with{" "}
                <code className="font-mono text-[0.9em] text-fg">replayed: true</code>.
              </>
            }
          />
          <TwoViews />
        </div>

        <ul className="mt-16 grid gap-4 md:grid-cols-3">
          {paths.map((p) => (
            <li key={p.name} className="card flex min-w-0 flex-col p-5">
              <h3 className="font-medium text-fg">{p.name}</h3>
              <p className="mt-1 flex-1 text-[0.88rem] leading-6 text-muted">{p.lead}</p>
              <pre className="code-scroll mt-4 overflow-x-auto rounded-lg bg-panel p-3.5 font-mono text-[11.5px] leading-[1.7] text-fg">
                <code>{p.code}</code>
              </pre>
              <Link
                href={p.href}
                className="mt-4 inline-flex items-center gap-1 self-start text-[0.88rem] text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
              >
                {p.name} reference <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const statusOrder: Maturity[] = ["verified", "experimental", "planned"];

export function Status() {
  return (
    <section aria-labelledby="status" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          id="status"
          eyebrow="Working today vs roadmap"
          title="What works, and what doesn't yet."
          lead={
            <>
              Booking Lab is a local proof of concept with synthetic data. It isn&apos;t hosted, has no real customers, and
              isn&apos;t ready for a pilot.
            </>
          }
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {statusOrder.map((key) => {
            const col = status[key];
            return (
              <div
                key={key}
                className={`rounded-2xl border p-6 ${key === "planned" ? "border-dashed border-line-strong" : "border-line bg-ink-2"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-fg">{col.heading}</h3>
                  <MaturityBadge maturity={key} />
                </div>
                <p className="mt-2 text-[0.84rem] leading-5 text-faint">{col.intro}</p>
                <ul className="mt-6 space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex gap-3 text-[0.9rem] leading-6 text-muted">
                      <MaturityDot maturity={key} className="mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-6 max-w-3xl text-[0.84rem] leading-6 text-faint">
          “Verified locally” means automated tests and a two-process acceptance proof on isolated test databases. It
          doesn&apos;t cover cloud hosting, a real customer&apos;s assistant or a pilot.{" "}
          <Link href="/docs#verification" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
            How this is verified
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="get-started">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
          <div>
            <h2
              id="get-started"
              className="text-balance text-[2.2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-fg sm:text-[3.2rem]"
            >
              Build the booking your customers can say yes to.
            </h2>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-7 text-muted">
              Read the contract, wire up an agent, and run the whole flow on your own machine. The source is private while
              the proof of concept matures.
            </p>
          </div>
          <AudienceCta origin={site.url} />
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo className="size-6" />
            <span className="text-[0.92rem] font-semibold text-fg">Booking Lab</span>
          </div>
          <p className="mt-3 text-[0.84rem] leading-6 text-faint">
            Local proof of concept. Synthetic data only. Product names belong to their owners and don&apos;t imply a
            partnership.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-[0.88rem]">
            <li><Link className="text-muted hover:text-fg" href="/#how-it-works">How it works</Link></li>
            <li><Link className="text-muted hover:text-fg" href="/docs">Documentation</Link></li>
            <li><Link className="text-muted hover:text-fg" href="/#status">Status</Link></li>
            <li><a className="text-muted hover:text-fg" href="/openapi.yaml">OpenAPI</a></li>
            <li><Link className="text-muted hover:text-fg" href="/#salons">For salons</Link></li>
            <li><a className="text-muted hover:text-fg" href="/llms.txt">llms.txt</a></li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <p className="font-mono text-[10.5px] text-faint">AGPL-3.0-only</p>
      </div>
    </footer>
  );
}
