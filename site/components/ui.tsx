import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { maturityLabel, type Maturity } from "@/lib/content";

const tone: Record<Maturity, string> = {
  verified: "text-ok bg-ok-dim border-ok/25",
  experimental: "text-exp bg-exp-dim border-exp/25",
  planned: "text-plan bg-plan-dim border-line-strong border-dashed",
};

const dot: Record<Maturity, string> = {
  verified: "bg-ok",
  experimental: "bg-exp",
  planned: "border border-plan bg-transparent",
};

export function MaturityBadge({ maturity, className = "" }: { maturity: Maturity; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] leading-5 tracking-wide ${tone[maturity]} ${className}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${dot[maturity]}`} />
      {maturityLabel[maturity]}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="#0f1012" stroke="currentColor" strokeOpacity="0.18" />
      <circle cx="8" cy="16" r="2.5" fill="#edebe6" />
      <circle cx="24" cy="16" r="2.5" fill="#edebe6" />
      <rect x="12.5" y="10" width="7" height="12" rx="2" fill="#6ee7b7" />
      <path d="M10.5 16h2M19.5 16h2" stroke="#edebe6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-pretty text-base leading-7 text-muted sm:text-lg">{lead}</p> : null}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "group inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200";
  const styles =
    variant === "primary"
      ? "bg-fg text-ink hover:bg-white"
      : "border border-line-strong bg-white/[0.02] text-fg hover:border-white/25 hover:bg-white/[0.05]";
  const external = href.startsWith("http");
  const content = (
    <>
      {children}
      {variant === "primary" ? (
        <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      ) : null}
    </>
  );
  return external ? (
    <a href={href} className={`${base} ${styles}`}>
      {content}
    </a>
  ) : (
    <Link href={href} className={`${base} ${styles}`}>
      {content}
    </Link>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.85em] text-fg">
      {children}
    </code>
  );
}
