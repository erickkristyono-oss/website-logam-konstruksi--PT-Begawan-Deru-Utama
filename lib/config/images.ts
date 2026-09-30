/**
 * ============================================================================
 *  PENGATURAN FOTO WEBSITE — cukup ubah file ini untuk mengganti foto.
 * ============================================================================
 *
 *  Cara mengganti / menambah foto:
 *    1. Simpan foto di folder  public/images/site/   (foto kategori: public/images/categories/)
 *    2. Isi `src` di bawah dengan alamatnya, diawali "/images/...".
 *         contoh:  src: "/images/site/hero.jpg",
 *    3. Tulis `alt` = deskripsi singkat isi foto (untuk tunanetra & Google).
 *    4. Simpan file. Selama `src: null`, tampilan memakai latar bawaan (tetap rapi).
 *
 *  Format: .jpg / .jpeg / .png / .webp / .avif. Next.js otomatis memperkecil & mengompres,
 *  jadi cukup pakai foto berkualitas baik (±2000 px sisi terpanjang, < 5 MB).
 *
 *  `position` (opsional) = bagian foto yang diutamakan saat dipotong, mis. "center",
 *  "top", "bottom", "30% 50%". Berguna kalau objek penting terpotong di layar HP.
 *
 *  Tips:
 *   - Foto di latar gelap (hero & header halaman) otomatis diberi lapisan gelap
 *     agar teks putih tetap terbaca.
 *   - Kalau mengganti foto dengan NAMA FILE YANG SAMA dan foto lama masih muncul,
 *     pakai nama file baru (mis. hero-2.jpg) atau hapus folder .next/cache/images.
 *   - Gunakan foto milik perusahaan atau foto berlisensi (mis. Unsplash/Pexels).
 */

export type SiteImage = {
  /** Alamat foto di folder public, mis. "/images/site/hero.jpg". null = belum ada foto. */
  src: string | null;
  /** Deskripsi isi foto. */
  alt: string;
  /** Titik fokus saat foto dipotong (CSS object-position). Default "center". */
  position?: string;
};

export const siteImages = {
  // ---------------------------------------------------------------- BERANDA
  /** Latar besar paling atas Beranda. Landscape, min. 1920×1080. */
  hero: { src: null, alt: "Material besi dan baja untuk konstruksi", position: "center" },

  /**
   * (Opsional) Video latar Beranda — bila diisi, video dipakai MENGGANTIKAN foto hero.
   * Simpan di public/videos/, mis. "/videos/hero.mp4" (MP4, tanpa suara, < 10 MB).
   */
  heroVideo: null as string | null,

  /** Latar kotak ajakan "Membutuhkan material…" di bagian bawah Beranda. Landscape, min. 1600×700. */
  homeCta: { src: null, alt: "Gudang material logam", position: "center" },

  // ---------------------------------------------------- HEADER TIAP HALAMAN
  /** Latar judul halaman Produk. Landscape lebar, min. 1920×700. */
  productsHeader: { src: null, alt: "Tumpukan pipa dan besi", position: "center" },
  /** Latar judul halaman Tentang Kami. Landscape lebar, min. 1920×700. */
  aboutHeader: { src: null, alt: "Area penyimpanan material", position: "center" },
  /** Latar judul halaman Kontak. Landscape lebar, min. 1920×700. */
  contactHeader: { src: null, alt: "Kantor dan area pelayanan", position: "center" },

  // ------------------------------------------------------------ TENTANG KAMI
  /** Foto di samping "Profil Perusahaan". Landscape 4:3, min. 1200×900. */
  aboutProfile: { src: null, alt: "Tim dan kegiatan perusahaan", position: "center" },
  /** Foto lebar di antara Profil dan Data Perusahaan. Sangat lebar 21:9, min. 1920×820. */
  aboutBanner: { src: null, alt: "Gudang dan stok material", position: "center" },

  // ------------------------------------------------------------------ KONTAK
  /** Foto di atas kotak "Informasi Kontak". Landscape 4:3, min. 1200×900. */
  contactOffice: { src: null, alt: "Kantor PT Begawan Deru Utama", position: "center" },
} satisfies Record<string, SiteImage | string | null>;

/**
 * Foto kotak kategori di Beranda ("Kategori Produk"). Kunci = slug kategori
 * (terlihat di URL /products?category=<slug>). Portrait/persegi, min. 800×800.
 * Simpan di public/images/categories/, mis. "/images/categories/besi.jpg".
 */
export const categoryImages: Record<string, SiteImage> = {
  besi: { src: null, alt: "Besi beton" },
  "baja-ringan": { src: null, alt: "Rangka baja ringan" },
  "pipa-galvanis": { src: null, alt: "Pipa galvanis" },
  "stainless-steel": { src: null, alt: "Pipa dan plat stainless steel" },
  plat: { src: null, alt: "Plat besi" },
  wire: { src: null, alt: "Gulungan kawat" },
};
