"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

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
