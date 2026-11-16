"use client";

import Image from "next/image";
import { Check, UserRound } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { demo } from "@/lib/demo";
import phone from "@/public/assets/customer-phone.webp";

/*
  The one dark section: the moment the decision moves to the customer.
  The phone is a generated photograph (labelled as an illustration); everything on
  its screen is real UI in code, positioned over the measured screen area
  (34.47% / 17.64% / 36.43% × 52.54% of the image). Text sizes use cqw so the
  card scales with the screen.
*/

const points = [
  "Approve, and the provider books it and returns the result to the agent.",
  "Decline, or don't answer, and nothing is booked.",
  "Approving a time never moves money.",
];

export function CustomerMoment() {
  return (
    <MotionConfig reducedMotion="user">
      <section aria-labelledby="customer-moment" className="bg-fg text-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-20 lg:py-24 [&>*]:min-w-0">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.88rem] font-medium text-ink/70">
              <span
                aria-hidden
                className="inline-block size-2 rounded-full border border-[#e2a58f] bg-[linear-gradient(90deg,#e2a58f_50%,transparent_50%)]"
              />
              The customer&apos;s side · Experimental
            </p>
            <h2
              id="customer-moment"
              className="mt-4 text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[2.8rem]"
            >
              The agent proposes. The customer decides.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-[1.05rem] leading-7 text-ink/75">
              The approval is a separate step that the agent can&apos;t take for the customer. Until they answer, nothing
              is booked and the business&apos;s calendar stays the same.
            </p>
            <ul className="mt-8 space-y-3.5">
              {points.map((p) => (
                <li key={p} className="flex gap-3 text-[0.98rem] leading-6 text-ink/90">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e2a58f] text-fg">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-xl border-t border-ink/15 pt-5 text-[0.88rem] leading-6 text-ink/65">
              Today this runs in the lab: the request goes to a synthetic test customer. Verifying a real
              customer&apos;s identity isn&apos;t built yet.
            </p>
          </div>

          <figure className="mx-auto w-full max-w-[22rem] lg:max-w-none">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-ink">
              <Image
                src={phone}
                alt="A hand holding a phone that shows the booking approval request."
                sizes="(min-width: 1024px) 24rem, 22rem"
                className="h-auto w-full"
                placeholder="blur"
              />
              <div aria-hidden className="absolute left-[34.47%] top-[17.64%] h-[52.54%] w-[36.43%] overflow-hidden rounded-[9%/4.2%] bg-ink-2 text-fg [container-type:inline-size]">
                <PhoneScreen />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-[0.8rem] text-ink/55">
              Illustration. The screen is the demo&apos;s approval card, with synthetic data.
            </figcaption>
          </figure>
        </div>
      </section>
    </MotionConfig>
  );
}

function PhoneScreen() {
  return (
    <div className="flex h-full flex-col px-[6cqw] pb-[7cqw] pt-[11cqw]">
      <p className="text-[5.2cqw] text-muted">{demo.business}</p>
      <p className="text-[7.4cqw] font-semibold leading-tight tracking-[-0.01em]">Booking request</p>

      <motion.div
        initial={{ opacity: 0, y: "18%" }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.15 }}
        className="mt-[6cqw] overflow-hidden rounded-[5cqw] border-[0.8cqw] border-ok"
      >
        <div className="flex items-center justify-between gap-[2cqw] bg-ok px-[4cqw] py-[2.4cqw] text-[4.4cqw] font-medium text-ink-2">
          <span className="inline-flex items-center gap-[1.5cqw]">
            <UserRound className="size-[4.6cqw]" aria-hidden /> You
          </span>
          <span>Not booked yet</span>
        </div>
        <div className="px-[4cqw] py-[3.6cqw]">
          <p className="text-[6cqw] font-semibold leading-tight">
            {demo.service} at {demo.business}
          </p>
          <p className="mt-[1.6cqw] text-[4.8cqw] leading-snug text-muted">
            {demo.dayShort}, {demo.start}–{demo.end}
            <br />
            {demo.staff.name} · {demo.price}
          </p>
        </div>
      </motion.div>

      <div className="mt-[5cqw] space-y-[2.4cqw] text-[4.4cqw] leading-snug text-muted">
        <p className="flex justify-between gap-[2cqw] border-b-[0.4cqw] border-line pb-[2.4cqw]">
          <span>Proposed by</span>
          <span className="text-fg">Your AI assistant</span>
        </p>
        <p className="flex justify-between gap-[2cqw] border-b-[0.4cqw] border-line pb-[2.4cqw]">
          <span>Payment</span>
          <span className="text-fg">At the salon</span>
        </p>
        <p>Nothing is booked until you answer.</p>
      </div>

      <div className="mt-auto space-y-[2.6cqw]">
        <motion.div
          initial={{ scale: 1 }}
          whileInView={{ scale: [1, 1.04, 1] }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 1.1, duration: 0.6, ease: "easeInOut" }}
          className="flex h-[12cqw] items-center justify-center gap-[1.6cqw] rounded-full bg-ok text-[5cqw] font-medium text-ink-2"
        >
          <Check className="size-[5cqw]" /> Approve booking
        </motion.div>
        <div className="flex h-[12cqw] items-center justify-center rounded-full border-[0.5cqw] border-line-strong text-[5cqw]">
          Decline
        </div>
      </div>
    </div>
  );
}
