import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/sections";
import { CodeBlock } from "@/components/code-panel";
import { Code, MaturityBadge } from "@/components/ui";
import {
  discoveryEndpoints,
  errorCodes,
  gatewayErrors,
  LOCAL_GATEWAY,
  mcpTools,
  restEndpoints,
} from "@/lib/content";
import { examples } from "@/lib/examples";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "How the Booking Lab Gateway works: running the local sandbox, authentication, discovery, the REST v1 and MCP contract, idempotent booking, and error codes.",
  alternates: { canonical: "/docs" },
};

const toc = [
  { id: "sandbox", label: "Run the sandbox" },
  { id: "architecture", label: "Architecture" },
  { id: "authorization", label: "Authorisation & mandates" },
  { id: "discovery", label: "Discovery" },
  { id: "rest", label: "REST v1" },
  { id: "mcp", label: "MCP tools" },
  { id: "idempotency", label: "Idempotency & retries" },
  { id: "errors", label: "Errors" },
  { id: "limits", label: "Sandbox limits" },
  { id: "verification", label: "Verification" },
];

const tokenCmd = `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`;

const providerCmd = `# In the booking-lab-se (provider) checkout
npm ci
npx prisma generate
npm run db:migrate && npm run db:seed
npm run build

# DATABASE_URL must point to a loopback PostgreSQL database whose name ends in _test.
# SESSION_SECRET: a separate temporary value, at least 32 characters.
export PORT=3217
export BOOKING_SERVICE_ROLE=salon
export BOOKING_PUBLIC_ORIGIN=${LOCAL_GATEWAY}
export GATEWAY_SERVICE_TOKEN=<64-hex-token>
npm start`;

const gatewayCmd = `# In the booking-lab-gateway checkout (Node 24)
npm ci
npm test
export SALON_ORIGIN=http://127.0.0.1:3217
export PORT=3218
export GATEWAY_SERVICE_TOKEN=<same-64-hex-token>
npm start          # prints GATEWAY_READY 3218`;

const discoverCmd = `curl -sS ${LOCAL_GATEWAY}/.well-known/usp
curl -sS ${LOCAL_GATEWAY}/llms.txt
curl -sS ${LOCAL_GATEWAY}/api/v1/openapi`;

const proofCmd = `# Back in the provider checkout, against the same _test database
export AGENTPROV_BASE_URL=${LOCAL_GATEWAY}
export AGENTPROV_SALON_URL=http://127.0.0.1:3217
npm run agent:proof
# Expect ten PASS lines, including:
#   SEPARATE_SALON_AUTHENTICATED_CALENDAR
#   TWO_TRANSPORTS_ONE_WINNER_ONE_CONTROLLED_CONFLICT`;

const availabilityCmd = `curl -sS "${LOCAL_GATEWAY}/api/v1/availability?business=demo&service=fotvard&date=2026-11-24" \\
  -H "Authorization: Bearer $BOOKING_LAB_AGENT_KEY"`;

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-tight text-fg">
      <a href={`#${id}`} className="group">
        {children}
        <span aria-hidden className="ml-2 text-faint opacity-0 transition-opacity group-hover:opacity-100">#</span>
      </a>
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-pretty leading-7 text-muted">{children}</p>;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-10">
      <span className="absolute left-0 top-0 flex size-7 items-center justify-center rounded-full border border-line-strong font-mono text-xs text-muted">
        {n}
      </span>
      <h3 className="pt-0.5 font-medium text-fg">{title}</h3>
      <div className="mt-2 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </li>
  );
}

export default function DocsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 lg:pt-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> Back to overview
        </Link>
        <header className="mt-6 max-w-3xl">
          <p className="eyebrow">Documentation · v1</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
            Booking Lab Gateway
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            An agent-facing REST v1 and Streamable HTTP MCP service in front of a booking provider. This page follows the
            gateway&apos;s README and its <Code>openapi.yaml</Code>. When they disagree with this page, they are correct.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/openapi.yaml"
              download
              className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-ink hover:bg-white"
            >
              <Download className="size-4" aria-hidden /> Download OpenAPI
            </a>
          </div>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[13rem_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="eyebrow">On this page</p>
              <ul className="mt-4 space-y-2 border-l border-line">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm text-muted hover:border-fg hover:text-fg">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <article className="min-w-0 max-w-3xl space-y-20">
            <section aria-labelledby="sandbox">
              <H2 id="sandbox">Run the sandbox</H2>
              <div className="mt-5 flex gap-3 rounded-xl border border-exp/25 bg-exp-dim p-4 text-sm leading-6 text-fg/90">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-exp" aria-hidden />
                <p>
                  <strong className="font-medium">There is no hosted sandbox.</strong> The gateway only listens on IPv4
                  loopback and this release has no internet hosting configuration. The sandbox is two local processes:
                  the Booking Lab salon provider in split mode, and the gateway. Both source repositories are currently
                  private, so these steps assume you have been given access.
                </p>
              </div>
              <ol className="mt-8 space-y-10">
                <Step n={1} title="Create a service credential">
                  <p>
                    Generate 32 random bytes as 64 lowercase hex characters. Give the same value to both servers as{" "}
                    <Code>GATEWAY_SERVICE_TOKEN</Code>, and to nothing else. Keep it out of clients, URLs, logs and Git.
                    Use a dedicated value per environment.
                  </p>
                  <CodeBlock title="terminal" code={tokenCmd} />
                </Step>
                <Step n={2} title="Start the provider in split mode">
                  <CodeBlock title="provider · booking-lab-se" code={providerCmd} />
                </Step>
                <Step n={3} title="Start the gateway">
                  <CodeBlock title="gateway · booking-lab-gateway" code={gatewayCmd} />
                  <p>
                    The gateway refuses to start without a valid token. It only accepts an <Code>https</Code> provider
                    origin, or <Code>http</Code> on loopback.
                  </p>
                </Step>
                <Step n={4} title="Read the discovery documents">
                  <p>These need no credentials and work even if the provider is down.</p>
                  <CodeBlock title="terminal" code={discoverCmd} />
                </Step>
                <Step n={5} title="Run the cross-repository acceptance proof">
                  <p>
                    It runs a real MCP SDK client and a standalone REST client through the gateway. It then checks that
                    the salon&apos;s authenticated calendar contains the exact booking id the MCP client created.
                  </p>
                  <CodeBlock title="provider · booking-lab-se" code={proofCmd} />
                </Step>
              </ol>
            </section>

            <section aria-labelledby="architecture">
              <H2 id="architecture">Architecture</H2>
              <P>
                The gateway owns the listener, the MCP server, the native tool schemas, the USP name aliases, discovery
                and the HTTP adapter clients call. It has no database driver, no admin cookie and no service-wide booking
                credential.
              </P>
              <P>
                The provider owns its database, calendar, staff, pricing, agent-key authentication, stored mandates,
                booking ownership, idempotency and transactional scheduling. Browser sessions never cross this boundary.
                Only the configured service credential travels from gateway to provider. Inbound cookies,{" "}
                <Code>x-forwarded-for</Code> and spoofed gateway headers are dropped.
              </P>
              <P>
                The current adapter targets the Booking Lab salon v1 contract. An independent vendor would supply its
                own adapter and authorisation integration. No such adapter exists today, and no partner compatibility is
                implied.
              </P>
            </section>

            <section aria-labelledby="authorization">
              <H2 id="authorization">Authorisation & mandates</H2>
              <P>
                Agents authenticate with a provider-issued key, sent as <Code>Authorization: Bearer blk_…</Code> or{" "}
                <Code>X-API-Key</Code>. Never put it in a URL. Each key belongs to one business, a named agent and a
                responsible person. Scopes are <Code>services:read</Code>, <Code>availability:read</Code>,{" "}
                <Code>bookings:read</Code> and <Code>bookings:write</Code>.
              </P>
              <P>
                Before forwarding any operation, the gateway calls the provider&apos;s authenticated{" "}
                <Code>GET /api/v1/access</Code>. The reply must contain <Code>apiVersion: &quot;v1&quot;</Code>,{" "}
                <Code>providerMode: &quot;split&quot;</Code> and a scopes array. Otherwise the gateway returns 503{" "}
                <Code>provider_configuration_invalid</Code> before the operation is sent. The check runs again on
                every call and is never cached.
              </P>
              <P>
                Creating a booking also needs a <Code>mandateId</Code> issued by a trusted synthetic operator outside the
                API. The provider checks the client, business, service, staff member, full treatment interval, price cap,
                expiry, revocation and single use. <Code>confirmed: true</Code> on its own grants no authority. No API or
                MCP tool issues mandates. This is <strong className="font-medium text-fg">not</strong> verified consent
                from a real customer.
              </P>
            </section>

            <section aria-labelledby="discovery">
              <H2 id="discovery">Discovery</H2>
              <div className="mt-6 overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs text-faint">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Path</th>
                      <th scope="col" className="px-4 py-3 font-medium">Purpose</th>
                      <th scope="col" className="px-4 py-3 font-medium">Auth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {discoveryEndpoints.map((row) => (
                      <tr key={row.path}>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-fg">{row.path}</td>
                        <td className="px-4 py-3 text-muted">{row.summary}</td>
                        <td className="px-4 py-3 text-muted">{row.auth ? "Agent key" : "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>
                The USP profile and MCP name aliases keep Booking Lab&apos;s native v1 inputs and results. Full USP wire
                conformance is <em>not</em> implemented. <MaturityBadge maturity="experimental" className="ml-1 align-middle" />
              </P>
            </section>

            <section aria-labelledby="rest">
              <H2 id="rest">REST v1</H2>
              <div className="mt-6 overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs text-faint">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Operation</th>
                      <th scope="col" className="px-4 py-3 font-medium">Summary</th>
                      <th scope="col" className="px-4 py-3 font-medium">Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {restEndpoints.map((row) => (
                      <tr key={row.method + row.path}>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px]">
                          <span className={row.method === "GET" ? "text-ok" : "text-exp"}>{row.method}</span>{" "}
                          <span className="text-fg">{row.path}</span>
                        </td>
                        <td className="px-4 py-3 text-muted">{row.summary}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{row.scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>Rescheduling is not part of v1. Read availability first:</P>
              <div className="mt-4">
                <CodeBlock title="GET availability" code={availabilityCmd} />
              </div>
              <P>Then book one of the returned slots:</P>
              <div className="mt-4">
                <CodeBlock title="POST /api/v1/bookings" code={examples[0].code} />
              </div>
            </section>

            <section aria-labelledby="mcp">
              <H2 id="mcp">MCP tools</H2>
              <P>
                The tools are served over Streamable HTTP at <Code>POST /api/v1/mcp</Code> and use the same agent key.
                Before dispatching a tool call, the gateway checks that the key&apos;s scopes allow that tool.
              </P>
              <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
                {mcpTools.map((tool) => (
                  <li key={tool.name} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] text-fg">
                        {tool.name}
                        {tool.alias ? <span className="text-faint"> · {tool.alias}</span> : null}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{tool.summary}</p>
                    </div>
                    <MaturityBadge maturity={tool.maturity} />
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CodeBlock title="tools/call · create_booking" code={examples[1].code} />
              </div>
            </section>

            <section aria-labelledby="idempotency">
              <H2 id="idempotency">Idempotency & retries</H2>
              <P>
                <Code>POST /api/v1/bookings</Code> requires an <Code>Idempotency-Key</Code> header matching{" "}
                <Code>^[A-Za-z0-9_-]{"{1,64}"}$</Code>. Over MCP it is the <Code>idempotencyKey</Code> argument. Retrying
                with the same key and body returns the original booking with <Code>200</Code> and{" "}
                <Code>replayed: true</Code>. It doesn&apos;t consume another mandate or booking quota, even after the key
                has been rotated. Reusing the key with a different body returns <Code>idempotency_conflict</Code>.
              </P>
              <P>
                If an operation times out or returns <Code>503 provider_unavailable</Code>, the outcome is unknown. Retry
                with the <strong className="font-medium text-fg">same</strong> key. The gateway never invents a booking
                result.
              </P>
            </section>

            <section aria-labelledby="errors">
              <H2 id="errors">Errors</H2>
              <P>
                All errors use the shape <Code>{`{ "apiVersion": "v1", "error": { "code", "message" } }`}</Code>. A slot that
                is taken returns <Code>409 slot_unavailable</Code>. A booking against an outdated service version returns{" "}
                <Code>stale_service</Code>.
              </P>
              <h3 className="mt-8 text-sm font-medium text-fg">Gateway-level</h3>
              <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                {gatewayErrors.map((error) => (
                  <li key={error.code} className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr]">
                    <span className="font-mono text-[12.5px] text-fg">
                      <span className="text-faint">{error.status}</span> {error.code}
                    </span>
                    <span className="text-sm text-muted">{error.meaning}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-sm font-medium text-fg">Provider codes (OpenAPI enum)</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {errorCodes.map((code) => (
                  <li key={code} className="rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-xs text-muted">
                    {code}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="limits">
              <H2 id="limits">Sandbox limits</H2>
              <ul className="mt-5 list-disc space-y-2 pl-5 leading-7 text-muted marker:text-faint">
                <li>Synthetic data only. Customer emails must end in <Code>@example.test</Code>.</li>
                <li>Availability: at most 14 days per request, from today up to 60 days ahead.</li>
                <li>Booking limits: 5 per stable client per day, 3 per normalised customer email per day.</li>
                <li>Request bodies over 64 KiB are rejected.</li>
                <li>No holds, checkout, payment or rescheduling.</li>
                <li>Loopback only. Cross-origin browser requests are refused.</li>
              </ul>
            </section>

            <section aria-labelledby="verification">
              <H2 id="verification">Verification</H2>
              <P>
                The gateway runs <Code>npm run build</Code> and its Node test suite in CI on every push. Tests cover token
                validation, origin pinning, dropping cookies and spoofed headers, refusing cross-origin and oversized
                requests, controlled provider outages, and never following provider redirects with agent credentials.
              </P>
              <P>
                The provider&apos;s own suites, and the two-process acceptance proof above, cover mandates, idempotent
                replay, conflicts and calendar confirmation. All of this uses isolated local test databases. It does not
                verify a cloud deployment, an end user&apos;s assistant, an external booking platform or pilot operation.
                Known low and informational audit findings remain open.
              </P>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
