"use client";

import { useId, useState } from "react";
import type { Copy } from "@/lib/salon-copy";

function Switch({ checked, onChange, label, on, off }: { checked: boolean; onChange: () => void; label: string; on: string; off: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex min-h-12 w-full items-center justify-between gap-4 border-b border-rule py-2 text-left last:border-b-0"
    >
      <span className="text-[1rem] font-semibold text-text">{label}</span>
      <span className="flex items-center gap-3">
        <span className={`text-[0.9rem] ${checked ? "text-spruce" : "text-quiet"}`}>{checked ? on : off}</span>
        <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? "justify-end bg-spruce" : "justify-start bg-rule"}`}>
          <span className="size-5 rounded-full bg-surface" />
        </span>
      </span>
    </button>
  );
}

export function AccessPanel({ c }: { c: Copy["control"] }) {
  const [allowed, setAllowed] = useState<boolean[]>([true, true, false, false]);
  const [perDay, setPerDay] = useState("3");
  const [maxPrice, setMaxPrice] = useState("1000");
  const [sameDay, setSameDay] = useState(false);
  const perDayId = useId();
  const priceId = useId();

  return (
    <div className="rounded-[14px] border border-rule bg-surface">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="p-5 sm:p-6 md:border-r md:border-rule">
          <h3 className="text-[1.05rem] font-semibold text-text">{c.accessHeading}</h3>
          <div className="mt-2">
            {c.assistants.map((name, i) => (
              <Switch
                key={name}
                label={name}
                checked={allowed[i]}
                on={c.allowed}
                off={c.blocked}
                onChange={() => setAllowed((a) => a.map((v, j) => (j === i ? !v : v)))}
              />
            ))}
          </div>
        </div>
        <div className="border-t border-rule p-5 sm:p-6 md:border-t-0">
          <h3 className="text-[1.05rem] font-semibold text-text">{c.limitsHeading}</h3>
          <div className="mt-4 space-y-5">
            <div className="flex flex-col gap-2">
              <label htmlFor={perDayId} className="text-[0.95rem] text-text">{c.perDay}</label>
              <select
                id={perDayId}
                value={perDay}
                onChange={(e) => setPerDay(e.target.value)}
                className="min-h-12 rounded-[6px] border border-rule bg-surface px-3 text-[1rem] text-text"
              >
                {["1", "3", "5", "10"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={priceId} className="text-[0.95rem] text-text">{c.maxPrice}</label>
              <select
                id={priceId}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="min-h-12 rounded-[6px] border border-rule bg-surface px-3 text-[1rem] text-text"
              >
                <option value="500">500 kr</option>
                <option value="1000">1 000 kr</option>
                <option value="2000">2 000 kr</option>
                <option value="none">{c.noPriceLimit}</option>
              </select>
            </div>
            <Switch label={c.sameDay} checked={sameDay} on={c.allowed} off={c.blocked} onChange={() => setSameDay((v) => !v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingLog({ c }: { c: Copy["control"] }) {
  const tone: Record<string, string> = {
    ok: "font-semibold text-spruce",
    none: "text-quiet",
    stop: "font-semibold text-text",
  };
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[1.05rem] font-semibold text-text">{c.logHeading}</h3>
        <p className="text-[0.88rem] text-quiet">{c.logCaption}</p>
      </div>
      <div className="mt-3 overflow-x-auto rounded-[14px] border border-rule bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-left text-[0.95rem]">
          <caption className="sr-only">{c.logCaption}</caption>
          <thead>
            <tr className="border-b border-rule text-[0.85rem] text-quiet">
              {c.cols.map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={i} className="border-b border-rule last:border-b-0">
                <td className="whitespace-nowrap px-4 py-3 text-quiet">{r.t}</td>
                <td className="px-4 py-3 text-text">{r.a}</td>
                <td className="px-4 py-3 text-text">{r.w}</td>
                <td className="px-4 py-3 text-text">{r.c}</td>
                <td className={`px-4 py-3 ${tone[r.tone]}`}>{r.r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
