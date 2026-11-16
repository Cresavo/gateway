import { ImageResponse } from "next/og";

export const alt = "Booking Lab: one gateway, every booking opportunity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f6f4ef",
          color: "#161513",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 600 }}>
          <div style={{ display: "flex", width: 44, height: 44, borderRadius: 11, background: "#161513", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#a5472a" }} />
          </div>
          Booking Lab
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>
          <div style={{ display: "flex" }}>One gateway.</div>
          <div style={{ display: "flex" }}>Every booking opportunity.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#57544d" }}>
          <div style={{ display: "flex" }}>The customer approves every booking. The salon stays in control.</div>
          <div style={{ display: "flex", color: "#77736a" }}>local POC</div>
        </div>
      </div>
    ),
    size,
  );
}
