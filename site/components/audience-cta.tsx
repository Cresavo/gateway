"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "./ui";
import { CopyButton } from "./code-panel";

export function AudienceCta({ origin }: { origin: string }) {
  const [mode, setMode] = useState<"people" | "agents">("people");
  const id = useId();
  const prompt = `Read ${origin}/llms.txt. It explains how to book through Booking Lab and what the customer must approve.`;

  return (
    <div>
      <div role="tablist" aria-label="Who is reading" className="inline-flex rounded-full border border-line bg-panel p-0.5 font-mono text-[11px]">
        {(["people", "agents"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            id={`${id}-${m}`}
            aria-selected={mode === m}
            aria-controls={`${id}-panel`}
            onClick={() => setMode(m)}
            className={`h-7 rounded-full px-3 uppercase tracking-[0.06em] transition-colors ${
              mode === m ? "bg-ink-2 text-fg shadow-[0_1px_2px_rgb(22_21_19/0.08)]" : "text-faint hover:text-fg"
            }`}
          >
            For {m}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${mode}`} className="mt-4 min-h-[5.5rem] sm:min-h-11">
        {mode === "people" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="#how-it-works" className={buttonStyles.primary}>
              See how it works
              <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/docs" className={buttonStyles.secondary}>
              Read the docs
            </Link>
          </div>
        ) : (
          <div className="flex max-w-xl items-center gap-2 rounded-xl border border-line bg-ink-2 py-1.5 pl-3.5 pr-1.5">
            <p className="min-w-0 flex-1 font-mono text-[12px] leading-5 text-muted">
              Read <span className="text-fg">/llms.txt</span> and follow it to book through Booking Lab.
            </p>
            <CopyButton text={prompt} label="Copy onboarding prompt for your agent" />
          </div>
        )}
      </div>
    </div>
  );
}
