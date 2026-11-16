import { ImageResponse } from "next/og";

export const alt = "Booking Lab Gateway: one gateway, every booking opportunity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const node = (label: string, accent = false) => (
    <div
      style={{
        display: "flex",
        padding: "18px 26px",
        borderRadius: 16,
        border: accent ? "1px solid rgba(110,231,183,0.45)" : "1px solid rgba(255,255,255,0.14)",
        background: accent ? "rgba(110,231,183,0.10)" : "rgba(255,255,255,0.03)",
        color: accent ? "#6ee7b7" : "#edebe6",
        fontSize: 26,
      }}
    >
      {label}
    </div>
  );
  const line = <div style={{ display: "flex", width: 70, height: 2, background: "rgba(255,255,255,0.2)" }} />;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 50% -20%, rgba(110,231,183,0.18), #09090b 60%)",
          color: "#edebe6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: "#a3a3a8", letterSpacing: 2 }}>
          BOOKING INFRASTRUCTURE FOR AI AGENTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
          <div style={{ display: "flex" }}>One gateway.</div>
          <div style={{ display: "flex", color: "#6ee7b7" }}>Every booking opportunity.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {node("AI assistant")}
          {line}
          {node("Booking Lab Gateway", true)}
          {line}
          {node("Booking provider")}
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 20, color: "#7c7d84" }}>REST · MCP · local POC</div>
        </div>
      </div>
    ),
    size,
  );
}
