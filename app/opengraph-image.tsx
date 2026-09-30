import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config/site";

// Gambar pratinjau saat link website dibagikan (WhatsApp, Facebook, LinkedIn, dll).
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const svg = await readFile(path.join(process.cwd(), "public", "images", "logo-mark-white.svg"));
  const logo = `data:image/svg+xml;base64,${svg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #080a19 0%, #1a0b24 60%, #3a0a42 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={logo} width={86} height={105} alt="" />
          <div style={{ display: "flex", flexDirection: "column", fontWeight: 700, letterSpacing: 6, fontSize: 30 }}>
            <span style={{ letterSpacing: 14 }}>BEGAWAN</span>
            <span>DERU UTAMA</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, lineHeight: 1.05, maxWidth: 900 }}>{siteConfig.tagline}</div>
          <div style={{ marginTop: 24, fontSize: 28, color: "#d99be0" }}>{siteConfig.name}</div>
        </div>
      </div>
    ),
    size,
  );
}
