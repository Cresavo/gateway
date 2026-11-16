import Image from "next/image";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { copy, pilotHref, type Lang } from "@/lib/salon-copy";
import { HeroMoment } from "@/components/salon/hero-moment";
import { AccessPanel, BookingLog } from "@/components/salon/control";

const wrap = "mx-auto w-full max-w-[1240px] px-5 sm:px-8";
const primary =
  "inline-flex min-h-12 items-center justify-center rounded-[6px] bg-lingon px-5 text-[1rem] font-semibold text-surface hover:bg-lingon-hover";

export function SalonPage({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const other = t.otherLang;

  return (
    <div lang={lang} className="min-h-dvh bg-paper font-sans text-text [&_:focus-visible]:outline-spruce">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[6px] focus:bg-text focus:px-3 focus:py-2 focus:text-surface"
      >
        {t.skip}
      </a>

      <header className="border-b border-rule">
        <div className={`${wrap} flex min-h-[72px] items-center justify-between gap-4`}>
          <Link href={lang === "sv" ? "/" : "/en"} className="whitespace-nowrap font-display text-[1.35rem] font-bold tracking-[-0.02em] text-text">
            Booking Lab
          </Link>
          <nav aria-label={lang === "sv" ? "Huvudmeny" : "Main"} className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[0.98rem]">
              {t.nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-quiet hover:text-text">{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <nav aria-label={t.langSwitchLabel}>
              <ul className="flex items-center text-[0.95rem] font-semibold">
                <li>
                  <span aria-current="page" className="inline-flex min-h-11 items-center px-1.5 text-text underline decoration-2 underline-offset-[6px]">
                    {lang === "sv" ? "SV" : "EN"}
                  </span>
                </li>
                <li>
                  <Link href={other.href} hrefLang={other.code} lang={other.code} className="inline-flex min-h-11 items-center px-1.5 text-quiet hover:text-text">
                    <span aria-hidden>{other.short}</span>
                    <span className="sr-only">{other.label}</span>
                  </Link>
                </li>
              </ul>
            </nav>
            <a href={pilotHref} className={`${primary.replace("inline-flex ", "")} hidden min-h-11 whitespace-nowrap px-4 text-[0.95rem] sm:inline-flex`}>
              {t.cta}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section aria-labelledby="hero-title" className={`${wrap} grid gap-8 pb-16 pt-7 sm:gap-10 sm:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-20`}>
          <div className="lg:col-span-5 lg:pt-6">
            <h1 id="hero-title" className="text-balance font-display text-[clamp(2.15rem,5vw,4.25rem)] font-semibold leading-[1.04] tracking-[-0.025em]">
              {t.hero.title}
            </h1>
            <p className="mt-4 max-w-[34rem] text-pretty text-[1.06rem] sm:mt-6 sm:text-[1.13rem] leading-[1.6] text-quiet">{t.hero.support}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-8">
              <a href={pilotHref} className={primary}>{t.cta}</a>
              <Link href="/docs" className="inline-flex min-h-11 items-center text-[1rem] text-text underline decoration-rule decoration-2 underline-offset-[6px] hover:decoration-text">
                {t.hero.secondary}
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <HeroMoment m={t.moment} />
          </div>
        </section>

        {/* How a booking happens: a real sequence */}
        <section id="sa-funkar-det" aria-labelledby="journey-title" className="border-t border-rule">
          <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24`}>
            <div className="lg:col-span-4">
              <h2 id="journey-title" className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                {t.journey.heading}
              </h2>
              <p className="mt-4 max-w-[30rem] text-[1.06rem] leading-[1.6] text-quiet">{t.journey.intro}</p>
              <Image
                src="/assets/placeholder-reception.svg"
                alt=""
                width={800}
                height={1000}
                className="mt-10 hidden aspect-[4/5] w-full max-w-[15rem] rounded-[14px] object-cover lg:block"
              />
            </div>
            <ol className="lg:col-span-7 lg:col-start-6">
              {t.journey.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[4.5rem_1fr] gap-x-5 sm:grid-cols-[6rem_1fr]">
                  <div className="relative">
                    <span className="font-display text-[1.5rem] font-semibold leading-none text-text sm:text-[1.9rem]">{s.time}</span>
                    {i < t.journey.steps.length - 1 && (
                      <span aria-hidden className="absolute bottom-0 left-[1.1rem] top-10 w-px bg-rule" />
                    )}
                  </div>
                  <div className={i < t.journey.steps.length - 1 ? "pb-10" : ""}>
                    <h3 className="text-[1.2rem] font-semibold leading-snug text-text">{s.title}</h3>
                    <p className="mt-2 max-w-[34rem] text-[1.02rem] leading-[1.6] text-quiet">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Control: access, limits, log */}
        <section id="kontroll" aria-labelledby="control-title" className="border-t border-rule bg-surface/60">
          <div className={`${wrap} py-16 lg:py-24`}>
            <div className="max-w-[40rem]">
              <h2 id="control-title" className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                {t.control.heading}
              </h2>
              <p className="mt-4 text-[1.06rem] leading-[1.6] text-quiet">{t.control.intro}</p>
            </div>
            <div className="mt-10 lg:mr-[16%]">
              <AccessPanel c={t.control} />
            </div>
            <div className="mt-12 lg:ml-[16%]">
              <BookingLog c={t.control} />
            </div>
          </div>
        </section>

        {/* Money: the Swish deposit, simulated */}
        <section id="deposition" aria-labelledby="deposit-title" className="border-t border-rule">
          <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-24`}>
            <div className="order-2 lg:order-1 lg:col-span-5">
              <div className="rounded-[14px] bg-spruce-soft p-5 sm:p-8">
                <p className="text-[0.9rem] font-semibold text-spruce">{t.deposit.receiptLabel}</p>
                <div className="mt-4 rounded-[14px] border border-rule bg-surface p-5">
                  <p className="text-[0.95rem] text-quiet">{t.deposit.receiptTitle}</p>
                  <p className="mt-1 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.02em] text-text">{t.deposit.amount}</p>
                  <p className="mt-4 text-[1rem] text-text">{t.deposit.to}</p>
                  <p className="text-[1rem] text-quiet">{t.deposit.forWhat}</p>
                  <p className="mt-4 flex items-center gap-2 border-t border-rule pt-4 text-[1rem] font-semibold text-spruce">
                    <Check aria-hidden className="size-[18px]" strokeWidth={2.5} />
                    {t.deposit.paid}
                  </p>
                </div>
                <p className="mt-4 text-[0.95rem] leading-[1.5] text-text">{t.deposit.separate}</p>
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
              <h2 id="deposit-title" className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                {t.deposit.heading}
              </h2>
              <p className="mt-4 max-w-[34rem] text-[1.06rem] leading-[1.6] text-quiet">{t.deposit.text}</p>
              <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                {t.deposit.points.map((p) => (
                  <div key={p.title} className="border-t-2 border-text pt-3">
                    <dt className="text-[1.08rem] font-semibold text-text">{p.title}</dt>
                    <dd className="mt-1.5 text-[1rem] leading-[1.55] text-quiet">{p.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Honesty */}
        <section id="laget" aria-labelledby="status-title" className="bg-birch">
          <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-20`}>
            <div className="lg:col-span-4">
              <h2 id="status-title" className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                {t.status.heading}
              </h2>
              <p className="mt-4 text-[1.06rem] leading-[1.6] text-text">{t.status.intro}</p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8">
              <div>
                <h3 className="text-[1.08rem] font-semibold">{t.status.haveHeading}</h3>
                <ul className="mt-4 space-y-3">
                  {t.status.have.map((x) => (
                    <li key={x} className="flex gap-3 text-[1rem] leading-[1.5]">
                      <Check aria-hidden className="mt-0.5 size-[18px] shrink-0 text-spruce" strokeWidth={2.5} />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[1.08rem] font-semibold">{t.status.notHeading}</h3>
                <ul className="mt-4 space-y-3">
                  {t.status.not.map((x) => (
                    <li key={x} className="flex gap-3 text-[1rem] leading-[1.5]">
                      <Minus aria-hidden className="mt-0.5 size-[18px] shrink-0 text-quiet" strokeWidth={2.5} />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final call */}
        <section id="pilot" aria-labelledby="pilot-title" className="bg-spruce text-surface">
          <div className={`${wrap} grid gap-8 py-16 lg:grid-cols-12 lg:py-24`}>
            <div className="lg:col-span-7">
              <h2 id="pilot-title" className="font-display text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
                {t.final.heading}
              </h2>
              <p className="mt-5 max-w-[36rem] text-[1.1rem] leading-[1.6] text-surface/85">{t.final.text}</p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:col-start-9 lg:justify-end">
              <a href={pilotHref} className={primary}>{t.cta}</a>
              {pilotHref === "#pilot" && <p className="text-[0.9rem] text-surface/75">{t.final.noContact}</p>}
              <Link href="/docs" className="inline-flex min-h-11 items-center text-[1rem] text-surface underline decoration-surface/40 decoration-2 underline-offset-[6px] hover:decoration-surface">
                {t.final.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-4 py-8 text-[0.95rem] text-quiet`}>
          <p>{t.footer.line}</p>
          <Link href="/docs" className="hover:text-text">{t.footer.docs}</Link>
        </div>
      </footer>
    </div>
  );
}
