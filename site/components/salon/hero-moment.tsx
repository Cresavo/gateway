"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Clock, RotateCcw, ShieldCheck } from "lucide-react";
import type { Copy } from "@/lib/salon-copy";

const FIRST_HOUR = 12;
const LAST_HOUR = 17;
const HOUR_PX = 76;

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function blockStyle(start: string, end: string) {
  const top = ((toMinutes(start) - FIRST_HOUR * 60) / 60) * HOUR_PX;
  const height = ((toMinutes(end) - toMinutes(start)) / 60) * HOUR_PX;
  return { top: top + 2, height: height - 4 };
}

/** The one orchestrated moment on the page: request, the customer's yes, the booking lands. */
export function HeroMoment({ m }: { m: Copy["moment"] }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(2);
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (reduce) return;
    timers.current.forEach(clearTimeout);
    timers.current = [
      window.setTimeout(() => { setPlayed(true); setStage(0); }, 0),
      window.setTimeout(() => setStage(1), 1100),
      window.setTimeout(() => setStage(2), 2000),
    ];
    return () => timers.current.forEach(clearTimeout);
  }, [reduce, run]);

  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
  const nb = m.newBooking;

  return (
    <figure className="m-0 rounded-[14px] border border-rule bg-surface">
      <figcaption className="sr-only">{m.frameLabel}</figcaption>
      <div className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-4">
        <div>
          <p className="font-display text-[1.3rem] font-semibold leading-tight text-text">{m.day}</p>
          <p className="text-[0.9rem] text-quiet">{m.salon}</p>
        </div>
        <p className="text-[0.85rem] text-quiet">{m.example}</p>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-start">
        {/* Calendar column */}
        <div className="order-2 md:order-1">
          <p className="mb-2 pl-12 text-[0.9rem] font-semibold text-text">{m.staff}</p>
          <div className="relative flex">
            <div className="w-12 shrink-0">
              {hours.map((h) => (
                <div key={h} className="text-[0.8rem] text-quiet" style={{ height: HOUR_PX }}>
                  {h}:00
                </div>
              ))}
            </div>
            <div
              className="relative flex-1 border-l border-rule"
              style={{
                height: hours.length * HOUR_PX,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${HOUR_PX - 1}px, var(--color-rule) ${HOUR_PX - 1}px ${HOUR_PX}px)`,
              }}
            >
              {m.existing.map((b) => (
                <div
                  key={b.start}
                  className="absolute inset-x-2 rounded-[6px] border border-rule bg-paper px-2.5 py-1.5"
                  style={blockStyle(b.start, b.end)}
                >
                  <p className="text-[0.8rem] text-quiet">{b.start}–{b.end}</p>
                  <p className="text-[0.88rem] font-semibold leading-tight text-text">{b.who}, {b.what.toLowerCase()}</p>
                </div>
              ))}
              <AnimatePresence>
                {stage === 2 && (
                  <motion.div
                    key={`new-${run}`}
                    initial={reduce || !played ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="absolute inset-x-2 rounded-[6px] bg-spruce px-2.5 py-1.5 text-surface"
                    style={blockStyle(nb.start, nb.end)}
                  >
                    <p className="text-[0.8rem]">{nb.start}–{nb.end} <span className="font-semibold">{m.newTag}</span></p>
                    <p className="text-[0.95rem] font-semibold leading-tight">{nb.who}, {nb.what.toLowerCase()}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* The request, with the customer's yes */}
        <div className="order-1 md:order-2 md:pt-8">
          <div className="rounded-[14px] border border-rule bg-surface p-4 shadow-[var(--shadow-overlay)] sm:p-5" aria-live="polite">
            <p className="text-[0.9rem] text-quiet">{m.request.heading}</p>
            <p className="mt-1 font-display text-[1.45rem] font-semibold leading-tight text-text">{m.request.what}</p>
            <p className="mt-1 text-[1rem] text-text">{m.request.when}</p>
            <p className="text-[1rem] text-text">{m.request.price}</p>

            <ol className="mt-4 space-y-2.5 border-t border-rule pt-4 text-[0.95rem]">
              <li className="flex items-center gap-2.5 text-text">
                <ShieldCheck aria-hidden className="size-[18px] shrink-0 text-spruce" />
                {m.request.rules}
              </li>
              <li className="flex items-center gap-2.5">
                {stage === 0 ? (
                  <>
                    <Clock aria-hidden className="size-[18px] shrink-0 text-quiet" />
                    <span className="text-quiet">{m.request.waiting}</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-spruce">
                      <Check aria-hidden className="size-3 text-surface" strokeWidth={3} />
                    </span>
                    <span className="font-semibold text-text">{m.request.yes}</span>
                  </>
                )}
              </li>
              <li className={`flex items-center gap-2.5 transition-opacity ${stage === 2 ? "opacity-100" : "opacity-0"}`} aria-hidden={stage !== 2}>
                <Check aria-hidden className="size-[18px] shrink-0 text-spruce" strokeWidth={2.5} />
                <span className="text-text">{m.request.booked}</span>
              </li>
            </ol>
          </div>
          {!reduce && (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[6px] px-2 text-[0.9rem] text-quiet underline-offset-4 hover:text-text hover:underline"
            >
              <RotateCcw aria-hidden className="size-4" />
              {m.replay}
            </button>
          )}
        </div>
      </div>
    </figure>
  );
}
