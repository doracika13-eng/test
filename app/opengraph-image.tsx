export const dynamic = "force-static";
import { ImageResponse } from "next/og";

export const alt = "DAMI — Aix-en-Provence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111111", color: "#F5F1E9" }}>
        <div style={{ fontSize: 210, letterSpacing: 40, fontFamily: "serif", lineHeight: 1 }}>DAMI</div>
        <div style={{ width: 80, height: 1, background: "#D8C7A8", margin: "40px 0" }} />
        <div style={{ fontSize: 26, letterSpacing: 12, color: "#D8C7A8" }}>BEYOND THE ORDINARY</div>
      </div>
    ),
    size,
  );
}
