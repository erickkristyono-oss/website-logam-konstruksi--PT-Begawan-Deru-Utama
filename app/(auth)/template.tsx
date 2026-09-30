import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

// Template dibuat ulang setiap pindah halaman → memicu animasi fade antar halaman.
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
