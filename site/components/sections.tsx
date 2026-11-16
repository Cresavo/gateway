import Link from "next/link";
import {
  ArrowUpRight,
  Blocks,
  BookOpenText,
  CalendarClock,
  FileCode2,
  KeyRound,
  Layers,
  Radar,
  RefreshCcw,
  Repeat2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Workflow,
} from "lucide-react";
import { devFeatures, problems, status, useCases, type Maturity } from "@/lib/content";
import { examples } from "@/lib/examples";
import { CodeTabs } from "./code-panel";
import { ButtonLink, Code, Logo, MaturityBadge, SectionHeading } from "./ui";

const problemIcons = [Layers, Repeat2, CalendarClock, RefreshCcw, ShieldCheck, Workflow];
const devIcons = [FileCode2, Blocks, Radar, ScrollText, KeyRound, RefreshCcw];
const useCaseIcons = [Store, UserRound, Blocks];

export function Why() {
  return (
    <section aria-labelledby="why" className="border-t border-line bg-ink-2/40">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <SectionHeading
          id="why"
          eyebrow="Why Booking Lab"
          title="Booking is easy to demo and hard to get right."
          lead="Letting an agent hold a conversation is the easy part. The hard parts are approvals, retries, conflicts and stale data. The gateway is built around those."
        />
        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((item, index) => {
            const Icon = problemIcons[index];
            return (
              <li key={item.title} className="card group flex flex-col p-6 transition-colors hover:border-line-strong">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
                    <Icon className="size-[18px] text-fg" aria-hidden />
                  </span>
                  <MaturityBadge maturity={item.maturity} />
                </div>
                <h3 className="mt-5 font-medium text-fg">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-faint">{item.problem}</p>
                <p className="mt-4 flex-1 border-t border-line pt-4 text-sm leading-6 text-muted">{item.answer}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-1 self-start text-sm text-fg/80 transition-colors hover:text-ok"
                >
                  Technical details
                  <ArrowUpRight className="size-3.5" aria-hidden />
                  <span className="sr-only">: {item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Developers() {
  return (
    <section aria-labelledby="developers" className="border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:py-32 [&>*]:min-w-0">
        <div>
          <SectionHeading
            id="developers"
            eyebrow="Built for developers"
            title="A small, strict contract that agents can rely on."
            lead={
              <>
                Five REST operations and matching MCP tools, described by an OpenAPI 3.1 document. The examples on this
                page use the contract&apos;s own fields and synthetic values. Nothing is invented.
              </>
            }
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {devFeatures.map((feature, index) => {
              const Icon = devIcons[index];
              return (
                <li key={feature.title} className="flex gap-3">
                  <Icon className="mt-0.5 size-[18px] shrink-0 text-ok" aria-hidden />
                  <div>
                    <h3 className="text-sm font-medium text-fg">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{feature.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/docs">Read the docs</ButtonLink>
            <ButtonLink href="/openapi.yaml" variant="secondary">
              OpenAPI contract
            </ButtonLink>
          </div>
        </div>
        <div className="lg:pt-10">
          <CodeTabs examples={examples} />
          <p className="mt-4 text-xs leading-5 text-faint">
            <Code>mandateId</Code> is issued by a trusted synthetic operator outside the API. No API or MCP tool can
            issue one. Only <Code>@example.test</Code> customer emails are accepted.
          </p>
        </div>
      </div>
    </section>
  );
}

export function UseCases() {
  return (
    <section aria-labelledby="use-cases" className="border-t border-line bg-ink-2/40">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <SectionHeading
          id="use-cases"
          eyebrow="Real-world applications"
          title="Who it's for, and how far each path has got."
          lead="Each scenario says which parts have actually been run."
        />
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {useCases.map((useCase, index) => {
            const Icon = useCaseIcons[index];
            return (
              <li
                key={useCase.title}
                className={`card flex flex-col p-6 ${useCase.maturity === "planned" ? "border-dashed" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon className="size-5 text-fg" aria-hidden />
                  <MaturityBadge maturity={useCase.maturity} />
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-faint">{useCase.who}</p>
                <h3 className="mt-2 text-lg font-medium text-fg">{useCase.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted">{useCase.body}</p>
                <div className="mt-6 rounded-xl border border-line bg-ink/60 p-4">
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Status today</p>
                  <p className="mt-1.5 text-sm leading-6 text-fg/85">{useCase.today}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const statusOrder: Maturity[] = ["verified", "experimental", "planned"];
const statusAccent: Record<Maturity, string> = {
  verified: "before:bg-ok",
  experimental: "before:bg-exp",
  planned: "before:bg-plan/50",
};

export function Status() {
  return (
    <section aria-labelledby="status" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <SectionHeading
          id="status"
          eyebrow="Working today vs roadmap"
          title="An honest map of maturity."
          lead={
            <>
              Booking Lab is a <span className="text-fg">local proof of concept</span> with synthetic data. It is not
              hosted, has no real customers, and is <span className="text-fg">not pilot-ready</span>.
            </>
          }
        />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {statusOrder.map((key) => {
            const column = status[key];
            return (
              <div
                key={key}
                className={`card relative overflow-hidden p-6 before:absolute before:inset-x-0 before:top-0 before:h-px ${statusAccent[key]} ${
                  key === "planned" ? "border-dashed" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-fg">{column.heading}</h3>
                  <MaturityBadge maturity={key} />
                </div>
                <p className="mt-2 text-sm leading-6 text-faint">{column.intro}</p>
                <ul className="mt-6 space-y-3">
                  {column.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-muted">
                      <span
                        aria-hidden
                        className={`mt-2 size-1.5 shrink-0 rounded-full ${
                          key === "verified" ? "bg-ok" : key === "experimental" ? "bg-exp" : "border border-plan"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm leading-6 text-faint">
          “Verified locally” means automated tests and a two-process acceptance proof against an isolated test
          database. It does not cover cloud hosting, a real assistant used by an end user, or any external booking
          platform. <Link href="/docs#verification" className="text-fg/80 underline decoration-line-strong underline-offset-4 hover:text-ok">How this is verified</Link>.
        </p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="get-started" className="relative overflow-hidden border-t border-line">
      <div aria-hidden className="glow-top pointer-events-none absolute inset-0 rotate-180 opacity-80" />
      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 lg:py-32">
        <Sparkles className="mx-auto size-6 text-ok" aria-hidden />
        <h2 id="get-started" className="mt-6 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
          Start with the contract.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted">
          Read the docs, wire an agent to the OpenAPI document or MCP tools, and see how the local sandbox is put
          together. The interface is small on purpose, so you can understand all of it in an afternoon.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/docs">Read the documentation</ButtonLink>
          <ButtonLink href="/docs#sandbox" variant="secondary">
            Run the sandbox locally
          </ButtonLink>
        </div>
        <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-sm text-faint">
          <BookOpenText className="size-4 shrink-0" aria-hidden />
          The source repositories are private while the proof of concept matures.
        </p>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo className="size-6" />
            <span className="text-sm font-semibold text-fg">Booking Lab Gateway</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-faint">
            Local proof of concept. Synthetic data only: no real customers, holds, checkout or payment.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            <li><Link className="text-muted hover:text-fg" href="/#how-it-works">How it works</Link></li>
            <li><Link className="text-muted hover:text-fg" href="/docs">Documentation</Link></li>
            <li><Link className="text-muted hover:text-fg" href="/#status">Status</Link></li>
            <li><a className="text-muted hover:text-fg" href="/openapi.yaml">OpenAPI (YAML)</a></li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <p className="font-mono text-[11px] text-faint">AGPL-3.0-only · No partner compatibility or assistant certification implied.</p>
      </div>
    </footer>
  );
}
