"use client";

import { useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Example } from "@/lib/examples";

export function CopyButton({ text, label = "Copy code" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-ink-2 px-3 font-mono text-[11px] text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {copied ? <Check className="size-3.5 text-ok" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span>{copied ? "Copied" : "Copy"}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : label}
      </span>
    </button>
  );
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-2">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <span className="truncate font-mono text-xs text-faint">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="code-scroll overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CodeTabs({ examples }: { examples: Example[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = examples[active];

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = examples.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2 surface-shadow">
      <div className="flex items-center justify-between gap-3 border-b border-line px-2 py-2 sm:px-3">
        <div role="tablist" aria-label="Code examples" className="flex gap-1">
          {examples.map((example, index) => (
            <button
              key={example.id}
              ref={(el) => {
                tabs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${example.id}`}
              aria-selected={index === active}
              aria-controls={`${base}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`h-8 rounded-md px-3 font-mono text-xs transition-colors ${
                index === active ? "bg-panel text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>
        <CopyButton text={current.code} label={`Copy ${current.label} example`} />
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${current.id}`}>
        <pre
          tabIndex={0}
          aria-label={`${current.label} example`}
          className="code-scroll h-[22rem] overflow-auto p-4 font-mono text-[12.5px] leading-6 text-fg sm:p-5"
        >
          <code>{current.code}</code>
        </pre>
        <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted sm:px-5">{current.caption}</p>
      </div>
    </div>
  );
}
