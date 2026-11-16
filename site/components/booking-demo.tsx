"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, Hourglass, RotateCcw, UserRound, X } from "lucide-react";
import { LayoutGroup, MotionConfig, motion } from "motion/react";
import { demo } from "@/lib/demo";

/*
  Interactive simulation with synthetic data. No model, booking or network call.
  The flow pauses at the customer's approval: only the visitor can approve.

  One booking travels through the demo: the proposal card, the approval card and
  the calendar block share a layoutId, so Motion morphs one into the next.
  MotionConfig reducedMotion="user" turns those morphs into instant swaps.
*/

const TRAVEL = { type: "spring", stiffness: 210, damping: 28, mass: 0.9 } as const;

const STEPS = [
  { long: "Request", short: "Request" },
  { long: "Proposal", short: "Proposal" },
  { long: "Customer approval", short: "Approval" },
  { long: "Confirmed", short: "Booked" },
] as const;
type Outcome = "pending" | "approved" | "declined";

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export const DEMO_FOCUS_EVENT = "booking-demo:focus";

export function BookingDemo() {
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("pending");
  const [touched, setTouched] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCE).matches, () => true);
  const root = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  // Gentle autoplay up to the approval step only, never past it.
  useEffect(() => {
    if (reduced || touched || step >= 2) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2600);
    return () => clearTimeout(t);
  }, [step, reduced, touched]);

  // Keep keyboard users on the primary action after they move the demo forward.
  useEffect(() => {
    if (moveFocus.current) {
      moveFocus.current = false;
      action.current?.focus({ preventScroll: true });
    }
  }, [step, outcome]);

  const go = useCallback((next: number) => {
    setTouched(true);
    moveFocus.current = true;
    setStep(next);
  }, []);

  const answer = (value: Outcome) => {
    setTouched(true);
    moveFocus.current = true;
    setOutcome(value);
    setStep(3);
  };

  const replay = () => {
    setTouched(true);
    setOutcome("pending");
    moveFocus.current = true;
    setStep(0);
  };

  // "Try the demo" in the hero scrolls here and focuses the current action.
  useEffect(() => {
    const onFocus = () => {
      setTouched(true);
      root.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      window.setTimeout(() => action.current?.focus({ preventScroll: true }), reduced ? 0 : 350);
    };
    window.addEventListener(DEMO_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(DEMO_FOCUS_EVENT, onFocus);
  }, [reduced]);

  const booked = step === 3 && outcome === "approved";
  const proposed = (step === 1 || step === 2) && outcome === "pending";

  return (
    <MotionConfig reducedMotion="user" transition={TRAVEL}>
    <LayoutGroup>
    <div ref={root} id="demo" className="scroll-mt-24">
      <div className="overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-[0_1px_0_rgb(22_21_19/0.03),0_18px_40px_-24px_rgb(22_21_19/0.25)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <p className="text-[0.82rem] text-muted">
            <span className="font-medium text-fg">Interactive demo</span> · Synthetic data
          </p>
          <button
            type="button"
            onClick={replay}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.82rem] text-muted transition-colors hover:bg-panel hover:text-fg"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Replay
          </button>
        </div>

        <ol className="grid grid-cols-4 border-b border-line px-1 pb-2.5 pt-3.5" aria-label="Demo progress">
          {STEPS.map((label, i) => {
            const done = i < step || (i === 3 && step === 3);
            const current = i === step;
            const declined = i === 3 && step === 3 && outcome === "declined";
            const reached = done || current;
            return (
              <li
                key={label.long}
                aria-current={current ? "step" : undefined}
                className={`relative flex flex-col items-center gap-1.5 text-center text-[0.72rem] leading-4 sm:text-[0.78rem] ${
                  current ? "font-medium text-fg" : done ? "text-muted" : "text-faint"
                }`}
              >
                {/* Rail: the part already travelled is solid clay. */}
                {i > 0 ? (
                  <span aria-hidden className={`absolute left-0 right-1/2 top-[9px] h-0.5 ${reached ? "bg-ok" : "bg-line-strong"}`} />
                ) : null}
                {i < 3 ? (
                  <span aria-hidden className={`absolute left-1/2 right-0 top-[9px] h-0.5 ${i < step ? "bg-ok" : "bg-line-strong"}`} />
                ) : null}
                <span
                  aria-hidden
                  className={`relative flex size-5 items-center justify-center border-2 ${i === 2 ? "rounded-md" : "rounded-full"} ${
                    declined
                      ? "border-fg bg-ink-2 text-fg"
                      : done
                        ? "border-ok bg-ok text-ink-2"
                        : current
                          ? "border-ok bg-ink-2 text-ok"
                          : "border-line-strong bg-ink-2 text-faint"
                  }`}
                >
                  {declined ? (
                    <X className="size-3" strokeWidth={3} />
                  ) : i === 2 ? (
                    <UserRound className="size-3" strokeWidth={2.5} />
                  ) : done ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : current ? (
                    <span className="size-1.5 rounded-full bg-ok" />
                  ) : null}
                </span>
                <span>
                  {declined ? (
                    "Declined"
                  ) : (
                    <>
                      <span className="sm:hidden" aria-hidden>{label.short}</span>
                      <span className="sr-only sm:not-sr-only">{label.long}</span>
                    </>
                  )}
                  <span className="sr-only">{current ? " (current step)" : done ? " (done)" : ""}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="min-h-[20.5rem] p-4 sm:min-h-[21.75rem] sm:p-5" aria-live="polite">
          {step === 0 ? <RequestStep onNext={() => go(1)} actionRef={action} /> : null}
          {step === 1 ? <ProposalStep onNext={() => go(2)} actionRef={action} /> : null}
          {step === 2 ? <ApprovalStep onAnswer={answer} actionRef={action} /> : null}
          {step === 3 ? <ResultStep outcome={outcome} onReplay={replay} actionRef={action} /> : null}
        </div>

        <MiniCalendar booked={booked} proposed={proposed} />
      </div>
    </div>
    </LayoutGroup>
    </MotionConfig>
  );
}

type ActionRef = React.RefObject<HTMLButtonElement | null>;

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-panel px-3.5 py-2 text-[0.92rem] leading-6 text-fg">{children}</p>
    </div>
  );
}

function AgentLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.92rem] leading-6 text-fg">
      <span className="mr-1.5 text-[0.78rem] font-medium text-muted">Agent</span>
      {children}
    </p>
  );
}

function NextButton({ actionRef, onClick, children }: { actionRef: ActionRef; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      ref={actionRef}
      type="button"
      onClick={onClick}
      className="group inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-ink-2 px-4 text-[0.88rem] font-medium text-fg transition-colors hover:border-fg/40"
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

function RequestStep({ onNext, actionRef }: { onNext: () => void; actionRef: ActionRef }) {
  return (
    <div className="animate-rise space-y-3.5">
      <p className="text-[0.78rem] text-faint">The customer writes to their AI assistant</p>
      <Bubble>{demo.request}</Bubble>
      <AgentLine>Three salons have times. {demo.business} is first on Friday afternoon:</AgentLine>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {demo.options.map((o) => (
          <li key={o.name} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-[0.88rem] ${o.chosen ? "bg-ok-dim" : ""}`}>
            <span className={`inline-flex items-center gap-1.5 ${o.chosen ? "font-medium text-fg" : "text-muted"}`}>
              {o.chosen ? <Check className="size-3.5 text-ok" aria-hidden /> : null}
              {o.name}
              {o.chosen ? <span className="sr-only"> (chosen)</span> : null}
            </span>
            <span className="whitespace-nowrap text-muted">
              {o.price} · {o.next}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[0.78rem] leading-5 text-muted">Fictional businesses, not live listings. Comparing businesses isn&apos;t built yet.</p>
      <NextButton actionRef={actionRef} onClick={onNext}>
        See the proposal
      </NextButton>
    </div>
  );
}

function ProposalStep({ onNext, actionRef }: { onNext: () => void; actionRef: ActionRef }) {
  return (
    <div className="animate-rise space-y-3.5">
      <AgentLine>Here is a proposal. Nothing is booked yet.</AgentLine>
      <motion.div layoutId="booking" className="rounded-xl border border-line bg-ink p-4" style={{ borderRadius: 12 }}>
        <motion.div layout="position" className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-fg">
            {demo.service} · {demo.business}
          </p>
          <p className="text-fg">{demo.price}</p>
        </motion.div>
        <motion.p layout="position" className="mt-0.5 text-[0.84rem] text-muted">
          {demo.durationMinutes} min with {demo.staff.name} · {demo.dayShort}
        </motion.p>
        <motion.div layout="position" className="mt-3 grid grid-cols-3 gap-2" role="list" aria-label="Available times">
          {demo.times.map((t) => (
            <span
              key={t}
              role="listitem"
              className={`flex h-9 items-center justify-center rounded-lg border text-[0.88rem] ${
                t === demo.start ? "border-ok bg-ok font-medium text-ink-2" : "border-line-strong bg-ink-2 text-fg"
              }`}
            >
              {t}
              {t === demo.start ? <span className="sr-only"> (proposed)</span> : null}
            </span>
          ))}
        </motion.div>
      </motion.div>
      <NextButton actionRef={actionRef} onClick={onNext}>
        Send to the customer for approval
      </NextButton>
    </div>
  );
}

function ApprovalStep({ onAnswer, actionRef }: { onAnswer: (o: Outcome) => void; actionRef: ActionRef }) {
  return (
    <div className="animate-rise">
      {/* The agent's side: stopped and waiting. */}
      <div className="flex items-start justify-between gap-3">
        <AgentLine>{demo.business} has sent you this request. I can&apos;t approve it for you.</AgentLine>
        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-panel px-2 py-0.5 text-[0.75rem] text-muted">
          <Hourglass className="size-3" aria-hidden /> Waiting
        </span>
      </div>

      {/* The customer's side: a separate surface the agent cannot act on. */}
      <motion.section
        layoutId="booking"
        aria-label="Customer approval"
        style={{ borderRadius: 16 }}
        className="mt-3 overflow-hidden border-2 border-ok bg-ink-2 shadow-[0_10px_24px_-16px_rgb(165_71_42/0.55)]"
      >
        <motion.div layout="position" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-ok px-4 py-2 text-ink-2">
          <p className="inline-flex items-center gap-2 text-[0.84rem] font-medium">
            <UserRound className="size-4" aria-hidden />
            You, the customer
          </p>
          <p className="text-[0.78rem] font-medium">Not booked yet</p>
        </motion.div>
        <motion.div layout="position" className="p-4 sm:px-5">
          <p className="text-[1.08rem] font-semibold tracking-[-0.015em] text-fg">
            {demo.service} at {demo.business}
          </p>
          <dl className="mt-2.5 grid grid-cols-[4rem_1fr] gap-y-1 text-[0.9rem]">
            <dt className="text-muted">When</dt>
            <dd className="text-fg">
              {demo.dayLong}, <span className="whitespace-nowrap">{demo.start}–{demo.end}</span>
            </dd>
            <dt className="text-muted">With</dt>
            <dd className="text-fg">
              {demo.staff.name}, {demo.durationMinutes} min
            </dd>
            <dt className="text-muted">Price</dt>
            <dd className="text-fg">{demo.price}, paid at the salon</dd>
          </dl>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <motion.button
              ref={actionRef}
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 520, damping: 26 }}
              onClick={() => onAnswer("approved")}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ok px-5 text-[0.95rem] font-medium text-ink-2 transition-colors hover:bg-[#8f3c22] sm:flex-1"
            >
              <Check className="size-4" aria-hidden /> Approve booking
            </motion.button>
            <button
              type="button"
              onClick={() => onAnswer("declined")}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-ink-2 px-5 text-[0.95rem] text-fg transition-colors hover:border-fg/40"
            >
              Decline
            </button>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}

function ResultStep({ outcome, onReplay, actionRef }: { outcome: Outcome; onReplay: () => void; actionRef: ActionRef }) {
  if (outcome === "declined") {
    return (
      <div className="animate-rise space-y-4">
        <AgentLine>Understood. You declined, so nothing was booked and {demo.business}&apos;s calendar is unchanged.</AgentLine>
        <NextButton actionRef={actionRef} onClick={onReplay}>
          Try again
        </NextButton>
      </div>
    );
  }
  return (
    <div className="animate-rise space-y-4">
      <div className="rounded-xl border-l-4 border-ok bg-ok-dim p-4 sm:p-5">
        <p className="inline-flex items-center gap-2 text-[0.88rem] font-medium text-ok">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.25 }}
            className="flex size-5 items-center justify-center rounded-full bg-ok text-ink-2"
          >
            <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
              <motion.path
                d="M2.5 6.3 5 8.6 9.5 3.6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.45 }}
              />
            </svg>
          </motion.span>
          Booking confirmed
        </p>
        <p className="mt-3 text-[1.15rem] font-semibold tracking-[-0.015em] text-fg">
          {demo.service} at {demo.business}
        </p>
        <p className="text-[0.9rem] text-muted">
          {demo.dayLong}, {demo.start}–{demo.end} · {demo.staff.name} · {demo.price}
        </p>
        <p className="mt-3 text-[0.84rem] text-muted">
          Booking id <code className="font-mono text-[0.8rem] text-fg">{demo.bookingId}</code>
        </p>
      </div>
      <p className="text-[0.88rem] leading-6 text-muted">
        You approved it, {demo.business}&apos;s system booked it, and the same booking is now in its calendar below.
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <NextButton actionRef={actionRef} onClick={onReplay}>
          Replay the demo
        </NextButton>
        <a href="#two-views" className="text-[0.88rem] text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
          See what the agent receives
        </a>
      </div>
    </div>
  );
}

const HOURS = [12, 13, 14, 15, 16];
const ROW = 20; // px per half hour
const y = (h: number, m: number) => ((h - 12) * 2 + m / 30) * ROW;

function MiniCalendar({ booked, proposed }: { booked: boolean; proposed: boolean }) {
  return (
    <div className="border-t border-line bg-ink px-4 pb-4 pt-3" aria-label={`${demo.business} calendar, ${demo.dayLong}`}>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <p className="text-[0.82rem] font-medium text-fg">
          {demo.business}&apos;s calendar <span className="font-normal text-muted">· {demo.staff.name} · {demo.dayShort}</span>
        </p>
        <p className="text-[0.75rem] text-muted" aria-live="polite">
          {booked ? "1 new booking" : proposed ? "Proposal only, not reserved" : "No change"}
        </p>
      </div>
      <div className="relative ml-11 mt-3" style={{ height: ROW * 9 + 4 }}>
        {HOURS.map((h) => (
          <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: y(h, 0) }}>
            <span className="absolute -left-11 -top-2 font-mono text-[10.5px] tabular-nums text-faint">{h}:00</span>
          </div>
        ))}
        <div
          className="absolute inset-x-0 rounded-md border-l-[3px] border-line-strong bg-panel px-2.5 py-[3px]"
          style={{ top: y(12, 0) + 1, height: 2 * ROW - 2 }}
        >
          <p className="text-[0.75rem] leading-4 text-muted">Massage · booked at the desk</p>
        </div>
        <div
          className="absolute inset-x-0 rounded-md border-l-[3px] border-line-strong bg-panel px-2.5 py-[3px]"
          style={{ top: y(14, 30) + 1, height: 2 * ROW - 2 }}
        >
          <p className="text-[0.75rem] leading-4 text-muted">Fotvård · booked online</p>
        </div>
        {proposed ? (
          <div
            className="absolute inset-x-0 rounded-md border border-dashed border-ok/70 px-2.5 py-[3px]"
            style={{ top: y(13, 30) + 1, height: 1.5 * ROW - 2 }}
          >
            <p className="text-[0.75rem] leading-4 text-ok">Proposed {demo.start} · not reserved</p>
          </div>
        ) : null}
        {booked ? (
          <motion.div
            layoutId="booking"
            className="absolute inset-x-0 z-10 flex items-center justify-between gap-2 border-l-[3px] border-ok bg-ok-dim px-2.5"
            style={{ top: y(13, 30) + 1, height: 1.5 * ROW - 2, borderRadius: 6 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.25 }}
              className="truncate text-[0.75rem] font-medium leading-4 text-fg"
            >
              {demo.service} {demo.start}–{demo.end} · approved by customer
            </motion.p>
            <motion.code
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.25 }}
              className="hidden font-mono text-[10.5px] text-ok sm:inline"
            >
              {demo.bookingId}
            </motion.code>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
