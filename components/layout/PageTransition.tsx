import { ViewTransition, type ReactNode } from "react";
import { motion } from "@/lib/config/motion";

/**
 * Fade-out halaman lama → fade-in halaman baru saat navigasi (View Transitions API).
 * Dipakai di template.tsx tiap grup halaman; template dibuat ulang setiap pindah halaman
 * sehingga animasi keluar/masuk berjalan. Browser yang belum mendukung: pindah halaman biasa.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  if (!motion.pageTransition) return <>{children}</>;
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      {children}
    </ViewTransition>
  );
}
