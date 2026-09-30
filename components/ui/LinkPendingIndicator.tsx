"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Indikator loading kecil di dalam <Link>: muncul selama navigasi ke halaman tujuan berlangsung.
 * Harus diletakkan sebagai turunan dari <Link>.
 */
export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <>
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Memuat...</span>
    </>
  );
}
