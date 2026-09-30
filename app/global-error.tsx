"use client";

import { useEffect } from "react";

// Cadangan terakhir bila layout utama pun gagal. Wajib punya <html> & <body> sendiri,
// dan tidak bisa memakai CSS/komponen situs (sengaja dibuat mandiri).
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#080a19", color: "#fff" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <p style={{ color: "#d99be0", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>Terjadi gangguan</p>
            <h1 style={{ fontSize: 32, fontWeight: 400, margin: "12px 0" }}>Website sedang bermasalah</h1>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              Silakan coba lagi beberapa saat lagi.{error.digest ? ` (Kode: ${error.digest})` : ""}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
              <button
                onClick={() => retry()}
                style={{ height: 46, padding: "0 22px", borderRadius: 12, border: 0, background: "#e9e9e9", color: "#0a0707", fontSize: 15, cursor: "pointer" }}
              >
                Coba Lagi
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- router mungkin rusak; muat ulang penuh */}
              <a href="/" style={{ height: 46, padding: "0 22px", borderRadius: 12, border: "1px solid #fff", color: "#fff", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                Ke Beranda
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
