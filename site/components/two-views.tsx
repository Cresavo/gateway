"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { CopyButton } from "./code-panel";

// Same booking as the hero illustration, shaped exactly like openapi.yaml BookingResponse.
const json = `{
  "apiVersion": "v1",
  "replayed": false,
  "booking": {
    "id": "<booking-id>",
    "status": "confirmed",
    "start": "2026-11-20T13:30:00+01:00",
    "end": "2026-11-20T14:15:00+01:00",
    "durationMinutes": 45,
    "serviceId": "haircut",
    "serviceName": "Haircut",
    "staff": { "id": "staff-demo", "name": "Anna" },
    "version": 1,
    "createdAt": "<timestamp>"
  }
}`;

const views = [
  { id: "customer", label: "Customer sees" },
  { id: "agent", label: "Agent receives" },
] as const;

export function TwoViews() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("customer");
  const base = useId();

  return (
    <div className="card surface-shadow overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5">
        <div role="tablist" aria-label="Booking view" className="inline-flex rounded-full bg-panel p-0.5">
          {views.map((v, i) => (
            <button
              key={v.id}
              role="tab"
              type="button"
              id={`${base}-${v.id}`}
              aria-selected={view === v.id}
              aria-controls={`${base}-panel`}
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
              className={`h-8 rounded-full px-3.5 text-[0.84rem] transition-colors ${
                view === v.id ? "bg-ink-2 text-fg shadow-[0_1px_2px_rgb(22_21_19/0.08)]" : "text-muted hover:text-fg"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view === "agent" ? <CopyButton text={json} label="Copy JSON response" /> : <span className="font-mono text-[10.5px] text-faint">201 Created</span>}
      </div>

      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${view}`} className="h-[23rem] sm:h-[22rem]">
        {view === "customer" ? (
          <div className="flex h-full items-center justify-center bg-ink p-5 sm:p-8">
            <div className="w-full max-w-sm rounded-2xl border border-line bg-ink-2 p-5 shadow-[0_1px_2px_rgb(22_21_19/0.05)]">
              <div className="flex items-center gap-2 text-[0.84rem] text-ok">
                <span className="flex size-5 items-center justify-center rounded-full bg-ok text-ink-2">
                  <Check className="size-3" aria-hidden />
                </span>
                Booked
              </div>
              <p className="mt-4 text-[1.35rem] font-semibold tracking-[-0.02em] text-fg">Haircut</p>
              <p className="text-[0.9rem] text-muted">Salong Eko · with Anna</p>
              <dl className="mt-5 divide-y divide-line border-y border-line text-[0.88rem]">
                <div className="flex justify-between py-2.5"><dt className="text-faint">Friday 20 Nov</dt><dd className="tabular-nums text-fg">13:30–14:15</dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-faint">Duration</dt><dd className="text-fg">45 min</dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-faint">Price</dt><dd className="text-fg">450 kr at the salon</dd></div>
              </dl>
              <p className="mt-4 text-[0.8rem] leading-5 text-faint">You approved this booking. Ask your assistant to cancel it at any time.</p>
            </div>
          </div>
        ) : (
          <pre tabIndex={0} aria-label="JSON booking response" className="code-scroll h-full overflow-auto bg-ink-2 p-5 font-mono text-[12px] leading-[1.75] text-fg">
            <code>{json}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
