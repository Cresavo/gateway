"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp, Check, RotateCcw } from "lucide-react";

/*
  Illustrative product moment. Salong Eko is Booking Lab's synthetic demo salon;
  service, price and times here are illustrative, not seeded data.
  Steps: 0 ask · 1 searching · 2 times · 3 picked · 4 approval · 5 yes/no · 6 done
*/
const TIMES = ["11:30", "13:30", "15:30"];
const PICK = "13:30";
const LAST = 6;

function Tool({ name, status }: { name: string; status: string }) {
  return (
    <div className="animate-rise flex items-center gap-2 font-mono text-[11px] text-faint">
      <span className="flex size-4 items-center justify-center rounded-full border border-line-strong">
        <Check className="size-2.5" aria-hidden />
      </span>
      <span>{name}</span>
      <span className="text-line-strong">·</span>
      <span>{status}</span>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-rise flex justify-end">
      <p className="max-w-[80%] rounded-2xl rounded-br-md bg-panel px-3.5 py-2 text-[0.92rem] leading-6 text-fg">{children}</p>
    </div>
  );
}

function AgentText({ children }: { children: React.ReactNode }) {
  return <p className="animate-rise text-[0.92rem] leading-6 text-fg">{children}</p>;
}

function Typing() {
  return (
    <div className="flex gap-1 py-2" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-blink rounded-full bg-faint" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  );
}

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function ChatDemo() {
  const [rawStep, setStep] = useState(0);
  const [declined, setDeclined] = useState(false);
  const [auto, setAuto] = useState(true);
  const [touched, setTouched] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCE).matches, () => false);

  // Reduced motion: show the finished conversation until the visitor interacts.
  const still = reduced && !touched;
  const step = still ? LAST : rawStep;

  // Auto-advance; pause at the approval step so a visitor can tap Yes themselves.
  useEffect(() => {
    if (still || !auto || step >= LAST) return;
    const delay = step === 4 ? 3200 : step === 0 ? 900 : 1100;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, auto, still]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [step, declined]);

  function answer(yes: boolean) {
    setTouched(true);
    setDeclined(!yes);
    setStep(5);
    setAuto(true);
  }

  function replay() {
    setTouched(true);
    setDeclined(false);
    setAuto(true);
    setStep(0);
  }

  const booked = step >= 6 && !declined;

  return (
    <figure className="relative" aria-label="Example: a customer books a haircut through their assistant">
      <div className="card surface-shadow overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="size-6 rounded-full bg-fg" />
            <div className="leading-tight">
              <p className="text-[0.85rem] font-medium text-fg">Your assistant</p>
              <p className="font-mono text-[10.5px] text-faint">booking via Booking Lab</p>
            </div>
          </div>
          <button
            type="button"
            onClick={replay}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] text-faint transition-colors hover:bg-panel hover:text-fg"
          >
            <RotateCcw className="size-3" aria-hidden /> Replay
          </button>
        </div>

        <div
          ref={scroller}
          className="code-scroll flex h-[25rem] flex-col gap-3.5 overflow-y-auto px-4 py-5 sm:h-[24rem]"
          aria-live="polite"
        >
          <UserBubble>Book a haircut Friday</UserBubble>

          {step === 1 ? <Typing /> : null}
          {step >= 2 ? (
            <>
              <Tool name="get_availability · Salong Eko" status="200" />
              <AgentText>Salong Eko has a few times on Friday 20 Nov. Which works for you?</AgentText>
              <div className="animate-rise rounded-xl border border-line bg-ink p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-fg">Haircut</p>
                  <p className="text-[0.92rem] text-fg">450 kr</p>
                </div>
                <p className="mt-0.5 text-[0.8rem] text-muted">45 min · with Anna · Salong Eko</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {TIMES.map((t) => (
                    <span
                      key={t}
                      className={`flex h-9 items-center justify-center rounded-lg border text-[0.88rem] tabular-nums transition-colors ${
                        step >= 3 && t === PICK ? "border-fg bg-fg text-ink-2" : "border-line-strong bg-ink-2 text-fg"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {step >= 3 ? <UserBubble>13:30, please</UserBubble> : null}

          {step >= 4 ? (
            <div className="animate-rise rounded-xl border border-fg/80 bg-ink-2 p-3.5">
              <p className="eyebrow !text-[10px]">Needs your approval</p>
              <p className="mt-1.5 font-medium text-fg">Book this haircut?</p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[0.82rem]">
                <dt className="text-faint">When</dt><dd className="text-fg">Fri 20 Nov, 13:30–14:15</dd>
                <dt className="text-faint">Where</dt><dd className="text-fg">Salong Eko, with Anna</dd>
                <dt className="text-faint">Price</dt><dd className="text-fg">450 kr, paid at the salon</dd>
              </dl>
              {step === 4 ? (
                <div className="mt-3.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => answer(true)}
                    className="h-10 flex-1 rounded-lg bg-ok text-[0.9rem] font-medium text-ink-2 transition-colors hover:bg-[#8f3c22]"
                  >
                    Yes, book it
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(false)}
                    className="h-10 rounded-lg border border-line-strong px-4 text-[0.9rem] text-fg transition-colors hover:border-fg/40"
                  >
                    No
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-[0.8rem] text-faint">Only the customer can answer this. The agent can&apos;t.</p>
              )}
            </div>
          ) : null}

          {step >= 5 ? <UserBubble>{declined ? "No" : "Yes"}</UserBubble> : null}
          {step === 5 ? <Typing /> : null}
          {step >= 6 && declined ? <AgentText>Okay. Nothing was booked, and Salong Eko&apos;s calendar is unchanged.</AgentText> : null}
          {booked ? (
            <>
              <Tool name="create_booking · Salong Eko" status="201" />
              <AgentText>Done. You&apos;re booked at Salong Eko on Friday at 13:30.</AgentText>
            </>
          ) : null}
        </div>

        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-2 rounded-full border border-line bg-ink py-1.5 pl-4 pr-1.5">
            <span className="flex-1 truncate text-[0.88rem] text-faint">
              {step === 4 ? "Tap Yes or No above" : "Message your assistant"}
            </span>
            <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-fg text-ink-2">
              <ArrowUp className="size-3.5" />
            </span>
          </div>
        </div>
      </div>

      <SalonCalendar booked={booked} />

      <figcaption className="mt-4 text-[0.78rem] leading-5 text-faint">
        Illustration of the flow. Salong Eko is Booking Lab&apos;s synthetic demo salon. The assistant is generic, not a
        specific product.
      </figcaption>
    </figure>
  );
}

const HOURS = [10, 11, 12, 13, 14, 15, 16];
const ROW = 26; // px per half hour
const top = (h: number, m: number) => ((h - 10) * 2 + m / 30) * ROW;

function SalonCalendar({ booked }: { booked: boolean }) {
  return (
    <div className="card surface-shadow mt-3 overflow-hidden sm:ml-10" aria-label="Salong Eko's calendar">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-[0.82rem] font-medium text-fg">
          Salong Eko <span className="font-normal text-faint">· Anna · Fri 20 Nov</span>
        </p>
        <p className="font-mono text-[10.5px] text-faint">salon calendar</p>
      </div>
      <div className="relative ml-14 mr-3 my-3" style={{ height: ROW * 12 + 8 }}>
        {HOURS.map((h) => (
          <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: top(h, 0) }}>
            <span className="absolute -left-12 -top-2 font-mono text-[10px] tabular-nums text-faint">{h}:00</span>
          </div>
        ))}
        <Block start={[10, 15]} end={[11, 15]} title="Fotvård" meta="booked at the desk" />
        <Block start={[14, 30]} end={[15, 30]} title="Massage" meta="booked online" />
        {booked ? (
          <div
            className="animate-rise absolute inset-x-0 rounded-md border-l-[3px] border-ok bg-ok-dim px-2.5 py-[3px]"
            style={{ top: top(13, 30) + 1, height: (45 / 30) * ROW - 2 }}
          >
            <p className="text-[0.78rem] font-medium leading-4 text-fg">Haircut · 13:30</p>
            <p className="font-mono text-[10px] leading-4 text-ok">via agent · approved by customer</p>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 font-mono text-[10.5px] text-faint">
        <span className="truncate">{booked ? "consent.approved → mandate.consumed → booking.created" : "audit log · waiting"}</span>
        <span className={`whitespace-nowrap ${booked ? "text-ok" : ""}`}>{booked ? "13:30 booked" : "—"}</span>
      </div>
    </div>
  );
}

function Block({ start, end, title, meta }: { start: [number, number]; end: [number, number]; title: string; meta: string }) {
  const y = top(...start);
  return (
    <div
      className="absolute inset-x-0 rounded-md border-l-[3px] border-line-strong bg-panel px-2.5 py-[3px]"
      style={{ top: y + 1, height: top(...end) - y - 2 }}
    >
      <p className="text-[0.78rem] leading-4 text-muted">{title}</p>
      <p className="font-mono text-[10px] leading-4 text-faint">{meta}</p>
    </div>
  );
}
