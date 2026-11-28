import Image from "next/image";
import Link from "next/link";
import stillLife from "@/public/assets/still-life.webp";
import { ArrowUpRight, Download, FileText } from "lucide-react";
import { status, type Maturity } from "@/lib/content";
import { site } from "@/lib/site";
import { CopyButton } from "./code-panel";
import { TwoViews } from "./two-views";
import { Logo, MaturityDot, buttonStyles } from "./ui";

const interfaces = [
  {
    name: "MCP",
    who: "For AI assistants",
    body: "Booking operations as tools over Streamable HTTP, with the same agent key as REST.",
    code: "POST /api/v1/mcp",
    href: "/docs#mcp",
  },
  {
    name: "REST v1",
    who: "For your own agents and backends",
    body: "Services, availability, booking, status and cancellation, described by an OpenAPI 3.1 contract.",
    code: "POST /api/v1/bookings",
    href: "/docs#rest",
  },
  {
    name: "Technical discovery",
    who: "For agents finding the API",
    body: "Machine-readable descriptions of the endpoints and schemas. This is API discovery, not a search for businesses.",
    code: "GET /.well-known/usp",
    href: "/docs#discovery",
  },
];

export function Developers() {
  const prompt = `Read ${site.url}/llms.txt. It explains how to book through Booking Lab and what the customer must approve.`;
  return (
    <section aria-labelledby="developers" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h2 id="developers" className="text-balance text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-fg sm:text-[2.5rem]">
            One booking. Two views.
          </h2>
          <p className="mt-4 text-pretty text-[1.05rem] leading-7 text-muted">
            The customer sees a booking they can understand. The agent gets a strict JSON object it can check. Both
            show the booking from the demo above, with the same id.
          </p>
        </div>
        <div className="mt-10">
          <TwoViews />
          <p className="mt-4 max-w-3xl text-[0.92rem] leading-6 text-muted">
            Illustrative values in the shape of the real contract. Retry with the same idempotency key and you get the
            same booking back, marked <code className="font-mono text-[0.88em] text-fg">&quot;replayed&quot;: true</code>.
          </p>
        </div>

        <div className="mt-14 divide-y divide-line border-y border-line">
          {interfaces.map((i) => (
            <div key={i.name} className="grid gap-2 py-6 md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-8">
              <div>
                <h3 className="font-medium text-fg">{i.name}</h3>
                <p className="text-[0.88rem] text-muted">{i.who}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[0.95rem] leading-7 text-muted">{i.body}</p>
                <code className="mt-1 inline-block font-mono text-[0.82rem] text-fg">{i.code}</code>
              </div>
              <Link
                href={i.href}
                className="inline-flex items-center gap-1 self-start text-[0.9rem] text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg md:self-auto"
              >
                Reference <ArrowUpRight className="size-3.5" aria-hidden />
                <span className="sr-only">: {i.name}</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="font-medium text-fg">Point your agent at the machine-readable summary</h3>
              <p className="mt-1 text-[0.92rem] leading-6 text-muted">
                <a href="/llms.txt" className="font-mono text-[0.86rem] text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
                  /llms.txt
                </a>{" "}
                lists the docs, the contract and the rules an agent must follow, including waiting for the
                customer&apos;s approval.
              </p>
            </div>
            <CopyButton text={prompt} label="Copy a prompt for your agent" />
          </div>
        </div>
      </div>
    </section>
  );
}

const statusOrder: Maturity[] = ["verified", "experimental", "planned"];

export function Status() {
  return (
    <section aria-labelledby="status" className="border-b border-line bg-panel/50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h2 id="status" className="text-balance text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-fg sm:text-[2.5rem]">
            What works today, and what doesn&apos;t.
          </h2>
          <p className="mt-4 text-pretty text-[1.05rem] leading-7 text-muted">
            Booking Lab is a local proof of concept with synthetic data. It isn&apos;t hosted, has no real customers and
            isn&apos;t ready for a pilot. “Verified locally” means automated tests and a two-process acceptance proof on
            isolated test databases, not cloud hosting or a real customer&apos;s assistant.
          </p>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
          {statusOrder.map((key) => {
            const col = status[key];
            return (
              <div key={key}>
                <h3 className="flex items-center gap-2 font-medium text-fg">
                  <MaturityDot maturity={key} />
                  {col.heading}
                </h3>
                <p className="mt-1 text-[0.9rem] text-muted">{col.intro}</p>
                <ul className="mt-5 space-y-3 border-t border-line pt-5">
                  {col.items.map((item) => (
                    <li key={item} className="text-[0.95rem] leading-6 text-fg/85">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-10 text-[0.92rem] text-muted">
          <Link href="/docs#verification" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
            How this is verified
          </Link>
        </p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="get-started" className="relative overflow-hidden">
      {/* Generated still life (decorative). Empty table on the left holds the text on wide screens. */}
      <Image
        src={stillLife}
        alt=""
        sizes="58vw"
        placeholder="blur"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-[60%_55%] lg:block"
      />
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[58%] bg-[linear-gradient(90deg,var(--color-ink),rgb(246_244_239/0)_40%)] lg:block" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-32">
        <div className="max-w-xl">
          <h2
            id="get-started"
            className="text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-fg sm:text-[2.8rem]"
          >
            Start with the contract.
          </h2>
          <p className="mt-4 text-[1.05rem] leading-7 text-muted">
            The documentation covers the full interface, the approval rules and how the local sandbox is set up.
            There&apos;s no hosted sandbox or sign-up yet, and the source repositories are private for now.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/docs" className={buttonStyles.primary}>
              <FileText className="size-4" aria-hidden /> Read the documentation
            </Link>
            <a href="/openapi.yaml" download className={buttonStyles.secondary}>
              <Download className="size-4" aria-hidden /> OpenAPI contract
            </a>
          </div>
        </div>
      </div>
      <Image
        src={stillLife}
        alt=""
        sizes="100vw"
        placeholder="blur"
        className="aspect-[16/9] h-auto w-full object-cover object-[80%_50%] lg:hidden"
      />
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
            <span className="text-[0.95rem] font-semibold text-fg">Booking Lab</span>
          </div>
          <p className="mt-3 text-[0.88rem] leading-6 text-muted">
            Local proof of concept with synthetic data. Product names belong to their owners and don&apos;t imply a
            partnership. AGPL-3.0-only.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-[0.92rem]">
            <li><Link className="text-muted hover:text-fg" href="/#how-it-works">How it works</Link></li>
            <li><Link className="text-muted hover:text-fg" href="/docs">Documentation</Link></li>
            <li><Link className="text-muted hover:text-fg" href="/#developers">Developers</Link></li>
            <li><a className="text-muted hover:text-fg" href="/openapi.yaml">OpenAPI</a></li>
            <li><Link className="text-muted hover:text-fg" href="/#status">Status</Link></li>
            <li><a className="text-muted hover:text-fg" href="/llms.txt">llms.txt</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
