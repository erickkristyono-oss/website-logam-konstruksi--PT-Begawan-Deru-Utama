/**
 * ============================================================================
 *  PENGATURAN ANIMASI — ubah di sini untuk menyesuaikan gerakan seluruh website.
 * ============================================================================
 *  Pengunjung yang mengaktifkan "Kurangi gerakan" (Reduce motion) di perangkatnya
 *  otomatis tidak mendapat animasi gerak (hanya tampil langsung).
 */
export const motion = {
  /**
   * true  = konten fade-in sekali saja saat pertama terlihat.
   * false = konten fade-out saat keluar layar dan fade-in lagi saat kembali terlihat.
   */
  revealOnce: false,
  /** Lama fade-in konten saat di-scroll (milidetik). */
  revealDuration: 700,
  /** Jarak konten naik saat muncul (piksel). 0 = hanya fade tanpa bergerak. */
  revealDistance: 24,
  /** Jeda antar kartu yang muncul berurutan (milidetik). */
  stagger: 80,
  /** Fade-out halaman lama & fade-in halaman baru saat pindah halaman. */
  pageTransition: true,
} as const;

/** Jeda berurutan untuk item ke-i dalam grid (per baris, agar item jauh tidak menunggu lama). */
export function staggerDelay(index: number, perRow = 4): number {
  return (index % perRow) * motion.stagger;
}
