"use client";

import { Play } from "lucide-react";
import { DEMO_FOCUS_EVENT } from "./booking-demo";
import { buttonStyles } from "./ui";

/** Scrolls to the interactive demo and focuses its current action. Works as a plain anchor without JS. */
export function TryDemoButton() {
  return (
    <a
      href="#demo"
      className={buttonStyles.primary}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(new Event(DEMO_FOCUS_EVENT));
      }}
    >
      <Play className="size-4" aria-hidden /> Try the demo
    </a>
  );
}
