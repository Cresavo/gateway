import { principles } from "@/lib/content";
import { site } from "@/lib/site";
import { AudienceCta } from "./audience-cta";
import { ChatDemo } from "./chat-demo";
import { MaturityDot } from "./ui";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16 lg:pb-24 lg:pt-20 [&>*]:min-w-0">
        <div>
          <p className="eyebrow">Booking infrastructure for AI agents</p>
          <h1
            id="hero-title"
            className="mt-5 text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-fg sm:text-[3.6rem] lg:text-[4rem]"
          >
            One gateway. Every booking opportunity.
          </h1>
          <p className="mt-6 max-w-[34rem] text-pretty text-[1.1rem] leading-[1.65] text-muted">
            Booking Lab is the layer between AI assistants and the systems salons already book with. The customer approves
            every booking, and the salon stays in control.
          </p>
          <div className="mt-8">
            <AudienceCta origin={site.url} />
          </div>

          <ol className="mt-12 border-t border-line" aria-label="What Booking Lab commits to">
            {principles.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[1.5rem_1fr] gap-x-3 border-b border-line py-3.5">
                <span className="pt-px font-mono text-[11px] text-faint">0{i + 1}</span>
                <div>
                  <p className="text-[0.98rem] font-medium leading-6 text-fg">{p.title}</p>
                  <p className="mt-0.5 flex items-start gap-2 text-[0.84rem] leading-5 text-muted">
                    <MaturityDot maturity={p.maturity} className="mt-1.5" />
                    <span>
                      <span className="sr-only">{p.maturity === "verified" ? "Verified locally: " : p.maturity === "experimental" ? "Experimental: " : "Planned: "}</span>
                      {p.state}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-faint" aria-hidden>
            <span className="inline-flex items-center gap-1.5"><MaturityDot maturity="verified" /> verified locally</span>
            <span className="inline-flex items-center gap-1.5"><MaturityDot maturity="experimental" /> experimental</span>
            <span className="inline-flex items-center gap-1.5"><MaturityDot maturity="planned" /> planned</span>
          </p>
        </div>

        <div className="lg:pt-2">
          <ChatDemo />
        </div>
      </div>
    </section>
  );
}
