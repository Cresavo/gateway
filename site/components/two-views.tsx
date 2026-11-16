"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { demo, demoJson } from "@/lib/demo";
import { CopyButton } from "./code-panel";

const views = [
  { id: "customer", label: "Customer sees" },
  { id: "agent", label: "Agent receives" },
] as const;

const [jsonBefore, jsonAfter] = demoJson.split(demo.bookingId);
const idMark = "rounded-[4px] bg-ok-dim px-1 py-0.5 font-mono text-fg";

/** Side by side on wide screens, tabs on narrow ones. Both show the demo's booking. */
export function TwoViews() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("customer");
  const base = useId();

  return (
    <div id="two-views" className="scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-ink-2">
      <div className="border-b border-line px-3 py-2.5 lg:hidden">
        <div role="tablist" aria-label="Booking view" className="inline-flex rounded-full bg-panel p-0.5">
          {views.map((v, i) => (
            <button
              key={v.id}
              role="tab"
              type="button"
              id={`${base}-${v.id}`}
              aria-selected={view === v.id}
              aria-controls={`${base}-panel-${v.id}`}
              tabIndex={view === v.id ? 0 : -1}
              onClick={() => setView(v.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const next = views[(i + 1) % views.length];
                  setView(next.id);
                  document.getElementById(`${base}-${next.id}`)?.focus();
                }
              }}
              className={`hit h-9 rounded-full px-3.5 text-[0.86rem] transition-colors ${
                view === v.id ? "bg-ink-2 font-medium text-fg shadow-[0_1px_2px_rgb(22_21_19/0.08)]" : "text-muted hover:text-fg"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[0.9fr_1.1fr] [&>*]:min-w-0">
        <div
          role="tabpanel"
          id={`${base}-panel-customer`}
          aria-labelledby={`${base}-customer`}
          className={`bg-ink ${view === "customer" ? "" : "hidden lg:block"}`}
        >
          <p className="hidden h-12 items-center border-b border-line px-5 text-[0.9rem] font-medium text-fg lg:flex">Customer sees</p>
          <div className="flex items-center justify-center p-5 sm:p-8 lg:py-10">
            <div className="w-full max-w-sm rounded-2xl border border-line bg-ink-2 p-5">
              <p className="inline-flex items-center gap-2 text-[0.88rem] font-medium text-ok">
                <span className="flex size-5 items-center justify-center rounded-full bg-ok text-ink-2">
                  <Check className="size-3" aria-hidden />
                </span>
                Booking confirmed
              </p>
              <p className="mt-4 text-[1.35rem] font-semibold tracking-[-0.02em] text-fg">{demo.service}</p>
              <p className="text-[0.92rem] text-muted">
                {demo.business} · with {demo.staff.name}
              </p>
              <dl className="mt-5 divide-y divide-line border-y border-line text-[0.9rem]">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-muted">{demo.dayLong}</dt>
                  <dd className="whitespace-nowrap text-fg">
                    {demo.start}–{demo.end}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-muted">Price</dt>
                  <dd className="text-fg">{demo.price} at the salon</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted">Booking id</dt>
                  <dd>
                    <span className={`${idMark} text-[0.82rem]`}>{demo.bookingId}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${base}-panel-agent`}
          aria-labelledby={`${base}-agent`}
          className={`border-line lg:border-l ${view === "agent" ? "" : "hidden lg:block"}`}
        >
          <div className="flex h-12 items-center justify-between gap-3 border-b border-line px-5">
            <p className="text-[0.9rem] font-medium text-fg">
              <span className="hidden lg:inline">Agent receives</span>
              <span className="font-normal text-muted lg:ml-2">201 Created</span>
            </p>
            <CopyButton text={demoJson} label="Copy JSON response" />
          </div>
          <pre
            tabIndex={0}
            aria-label="JSON booking response"
            className="code-scroll overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-fg"
          >
            <code>
              {jsonBefore}
              <span className={idMark}>{demo.bookingId}</span>
              {jsonAfter}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
