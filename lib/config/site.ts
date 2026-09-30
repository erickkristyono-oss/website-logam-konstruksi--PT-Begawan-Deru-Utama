/**
 * Informasi bisnis terpusat (data dari pemilik perusahaan).
 * Hanya berisi data publik, aman untuk client.
 */
export const siteConfig = {
  name: "PT Begawan Deru Utama",
  shortName: "Begawan Deru Utama",
  tagline: "Perdagangan Besar Barang Logam untuk Bahan Konstruksi",
  description:
    "Menyediakan berbagai material logam untuk kebutuhan konstruksi dan industri.",
  address:
    "Jl. Gerbera Blok D12/13, Kel. Pondok Cabe Ilir, Kec. Pamulang, Kota Tangerang Selatan",
  phone: {
    display: "0815-2868-8389",
    href: "tel:+6281528688389",
  },
  email: "pt.begawanderuutama@gmail.com",
  /** Bidang usaha, sesuai brief. */
  businessField: "Perdagangan Besar Barang Logam untuk Bahan Konstruksi",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Data organisasi untuk schema.org (hanya data yang diberikan pemilik perusahaan). */
export function organizationJsonLd() {
  const base = siteConfig.url.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: base,
    logo: `${base}/images/logo.svg`,
    email: siteConfig.email,
    telephone: siteConfig.phone.href.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Gerbera Blok D12/13, Kel. Pondok Cabe Ilir, Kec. Pamulang",
      addressLocality: "Kota Tangerang Selatan",
      addressRegion: "Banten",
      addressCountry: "ID",
    },
  };
}

/** Link pencarian alamat di Google Maps (dibuka di tab baru, tanpa embed pihak ketiga). */
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${siteConfig.address}`,
)}`;

export type SiteConfig = typeof siteConfig;
