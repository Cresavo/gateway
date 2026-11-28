import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { maturityLabel, type Maturity } from "@/lib/content";

/** Maturity is encoded by shape (filled / half / ring) so it never relies on colour alone. */
export function MaturityDot({ maturity, className = "" }: { maturity: Maturity; className?: string }) {
  if (maturity === "verified") return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full bg-ok ${className}`} />;
  if (maturity === "experimental")
    return (
      <span
        aria-hidden
        className={`inline-block size-2 shrink-0 rounded-full border border-ok bg-[linear-gradient(90deg,var(--color-ok)_50%,transparent_50%)] ${className}`}
      />
    );
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full border border-faint ${className}`} />;
}

export function MaturityBadge({ maturity, className = "" }: { maturity: Maturity; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] leading-5 text-muted ${className}`}
    >
      <MaturityDot maturity={maturity} />
      {maturityLabel[maturity]}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="#161513" />
      <path d="M8 11.5h16M8 20.5h16" stroke="#f6f4ef" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="11.5" r="3" fill="#a5472a" stroke="#161513" strokeWidth="1.5" />
    </svg>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-4 text-balance text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-fg sm:text-[2.6rem]">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-pretty text-[1.05rem] leading-7 text-muted">{lead}</p> : null}
    </div>
  );
}

const buttonBase =
  "group inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-medium transition-colors duration-150";
export const buttonStyles = {
  primary: `${buttonBase} bg-fg text-ink-2 hover:bg-black`,
  secondary: `${buttonBase} border border-line-strong bg-ink-2 text-fg hover:border-fg/40`,
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  arrow = variant === "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  arrow?: boolean;
}) {
  const content = (
    <>
      {children}
      {arrow ? <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" /> : null}
    </>
  );
  return href.startsWith("http") || href.endsWith(".yaml") || href.endsWith(".txt") ? (
    <a href={href} className={buttonStyles[variant]}>
      {content}
    </a>
  ) : (
    <Link href={href} className={buttonStyles[variant]}>
      {content}
    </Link>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.84em] text-fg">
      {children}
    </code>
  );
}
