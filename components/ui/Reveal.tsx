"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "@/lib/config/motion";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: ReactNode;
  /** Jeda sebelum mulai (ms) — dipakai untuk kartu yang muncul berurutan. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
};

/**
 * Fade-in (+ sedikit naik) saat elemen masuk layar; fade-out saat keluar layar bila
 * motion.revealOnce = false. Tanpa library — memakai IntersectionObserver bawaan browser.
 *
 * Aman: bila JavaScript mati atau pengguna memilih "kurangi gerakan", konten langsung
 * tampil (aturan CSS .reveal hanya aktif saat keduanya memungkinkan — lihat globals.css).
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // undefined = belum diketahui → TAMPIL (konten di layar awal tidak menunggu JavaScript,
  // penting untuk kecepatan tampil/LCP). Elemen di bawah layar disembunyikan setelah dicek,
  // lalu fade-in saat di-scroll.
  const [visible, setVisible] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    // IntersectionObserver didukung semua browser modern.
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible((v) => (v === undefined ? undefined : true));
          if (motion.revealOnce) observer.disconnect();
        } else if (entry.intersectionRatio === 0) {
          // Di luar layar: sembunyikan (siap fade-in). Untuk revealOnce, hanya sebelum pernah tampil.
          // Fade-out hanya saat benar-benar keluar layar, supaya teks yang masih terbaca tidak memudar.
          setVisible((v) => (motion.revealOnce && v === true ? true : false));
        }
      },
      { threshold: [0, 0.12] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--reveal-delay": `${delay}ms`,
    "--reveal-duration": `${motion.revealDuration}ms`,
    "--reveal-distance": `${motion.revealDistance}px`,
  } as CSSProperties;

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      data-visible={visible === undefined ? undefined : visible ? "true" : "false"}
      className={cn("reveal", className)}
      style={style}
    >
      {children}
    </Tag>
  );
}
