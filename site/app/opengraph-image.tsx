import { ImageResponse } from "next/og";
import { demo } from "@/lib/demo";

export const alt = "Booking Lab: turn AI requests into confirmed bookings, with customer approval built into the flow";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ink = "#161513";
const paper = "#f6f4ef";
const clay = "#a5472a";
const clayDim = "#f3e5de";
const muted = "#57544d";
const line = "#d3cec2";

export default function OpengraphImage() {
  const stop = (label: string, dark = false) => (
    <div
      style={{
        display: "flex",
        padding: "14px 20px",
        borderRadius: 14,
        border: `2px solid ${dark ? ink : line}`,
        background: dark ? ink : "#ffffff",
        color: dark ? paper : ink,
        fontSize: 24,
      }}
    >
      {label}
    </div>
  );
  const rail = <div style={{ display: "flex", width: 44, height: 3, background: clay, opacity: 0.6 }} />;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 72, background: paper, color: ink, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 600 }}>
          <div style={{ display: "flex", width: 42, height: 42, borderRadius: 10, background: ink, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 13, height: 13, borderRadius: 7, background: clay }} />
          </div>
          Booking Lab
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 56, fontSize: 70, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.04 }}>
          <div style={{ display: "flex" }}>Turn AI requests into</div>
          <div style={{ display: "flex" }}>confirmed bookings.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
          {stop("AI agent")}
          {rail}
          {stop("Booking Lab", true)}
          {rail}
          <div style={{ display: "flex", padding: "12px 18px", borderRadius: 14, border: `3px solid ${clay}`, background: "#ffffff", fontSize: 24 }}>
            Customer approves
          </div>
          {rail}
          <div style={{ display: "flex", flexDirection: "column", padding: "10px 18px", borderLeft: `6px solid ${clay}`, borderRadius: 8, background: clayDim }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 600 }}>{`${demo.service} ${demo.start}–${demo.end}`}</div>
            <div style={{ display: "flex", fontSize: 18, color: muted }}>Confirmed</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
