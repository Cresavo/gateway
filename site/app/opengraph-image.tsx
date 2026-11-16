import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { demo } from "@/lib/demo";

export const alt = "Booking Lab: turn AI requests into confirmed bookings, with customer approval built into the flow";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ink = "#161513";
const paper = "#f6f4ef";
const white = "#ffffff";
const clay = "#a5472a";
const clayDim = "#f3e5de";
const muted = "#57544d";
const faint = "#77736a";
const line = "#e3dfd5";
const lineStrong = "#d3cec2";
const panel = "#efece5";

// Static OFL font files (the site's own typeface), read at build time.
const font = (file: string) => readFile(path.join(process.cwd(), "assets/og", file));

export default async function OpengraphImage() {
  const [regular, semibold, backdrop] = await Promise.all([
    font("schibsted-grotesk-latin-400-normal.woff"),
    font("schibsted-grotesk-latin-600-normal.woff"),
    font("backdrop.jpg"), // generated paper texture, no text
  ]);
  const backdropSrc = `data:image/jpeg;base64,${backdrop.toString("base64")}`;

  const stop = (label: string, kind: "plain" | "dark" | "gate" = "plain") => (
    <div
      style={{
        display: "flex",
        padding: "12px 18px",
        borderRadius: 12,
        border: `2px solid ${kind === "dark" ? ink : kind === "gate" ? clay : lineStrong}`,
        background: kind === "dark" ? ink : white,
        color: kind === "dark" ? paper : ink,
        fontSize: 22,
      }}
    >
      {label}
    </div>
  );
  const rail = (grow = false) => <div style={{ display: "flex", height: 3, background: clay, ...(grow ? { flexGrow: 1 } : { width: 30 }) }} />;
  const hour = (label: string, top: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", width: 62, fontSize: 16, color: faint }}>{label}</div>
      <div style={{ display: "flex", flexGrow: 1, height: 1, background: line }} />
    </div>
  );
  const other = (label: string, top: number, height: number) => (
    <div
      style={{
        position: "absolute",
        left: 62,
        right: 0,
        top,
        height,
        display: "flex",
        padding: "8px 12px",
        borderRadius: 8,
        borderLeft: `4px solid ${lineStrong}`,
        background: panel,
        color: muted,
        fontSize: 17,
      }}
    >
      {label}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: paper, color: ink, fontFamily: "Schibsted Grotesk" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={backdropSrc} width={1200} height={630} style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630 }} />
        <div style={{ display: "flex", flexDirection: "column", width: 770, padding: "64px 0 64px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 600 }}>
            <div style={{ display: "flex", position: "relative", width: 44, height: 44, borderRadius: 11, background: ink }}>
              <div style={{ position: "absolute", left: 11, right: 11, top: 14, height: 3, borderRadius: 2, background: paper }} />
              <div style={{ position: "absolute", left: 11, right: 11, top: 27, height: 3, borderRadius: 2, background: paper }} />
              <div style={{ position: "absolute", left: 16, top: 9, width: 12, height: 12, borderRadius: 6, background: clay, border: `2px solid ${ink}` }} />
            </div>
            Booking Lab
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 54, fontSize: 68, fontWeight: 600, letterSpacing: -2.6, lineHeight: 1.04 }}>
            <div style={{ display: "flex" }}>Turn AI requests into</div>
            <div style={{ display: "flex" }}>confirmed bookings.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24, fontSize: 27, lineHeight: 1.4, color: muted }}>
            <div style={{ display: "flex" }}>A REST and MCP gateway for AI agents,</div>
            <div style={{ display: "flex" }}>with customer approval built into the flow.</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
            {stop("AI agent")}
            {rail()}
            {stop("Booking Lab", "dark")}
            {rail()}
            {stop("Customer approves", "gate")}
            {rail(true)}
          </div>
        </div>

        {/* The same calendar motif as the site's demo: the request ends as a time block. */}
        <div style={{ display: "flex", flexDirection: "column", width: 430, padding: "64px 72px 64px 0" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              borderRadius: 20,
              border: `2px solid ${line}`,
              background: white,
              padding: "22px 22px 0 22px",
            }}
          >
            <div style={{ display: "flex", fontSize: 20, fontWeight: 600 }}>{`${demo.business}'s calendar`}</div>
            <div style={{ display: "flex", fontSize: 17, color: muted, marginTop: 2 }}>{`${demo.staff.name} · ${demo.dayShort} · demo data`}</div>
            <div style={{ display: "flex", position: "relative", flexGrow: 1, marginTop: 20 }}>
              {hour("12:00", 0)}
              {hour("13:00", 88)}
              {hour("14:00", 176)}
              {hour("15:00", 264)}
              {hour("16:00", 352)}
              {other("Massage", 14, 82)}
              {other("Fotvård", 234, 82)}
              <div
                style={{
                  position: "absolute",
                  left: 62,
                  right: 0,
                  top: 146,
                  height: 64,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "0 12px",
                  borderRadius: 8,
                  borderLeft: `5px solid ${clay}`,
                  background: clayDim,
                }}
              >
                <div style={{ display: "flex", fontSize: 20, fontWeight: 600 }}>{`${demo.service} ${demo.start}–${demo.end}`}</div>
                <div style={{ display: "flex", fontSize: 16, color: clay }}>Confirmed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Schibsted Grotesk", data: regular, weight: 400, style: "normal" },
        { name: "Schibsted Grotesk", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
