import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { categoryImages, type SiteImage } from "@/lib/config/images";

/**
 * Mengembalikan foto yang siap ditampilkan, atau null bila belum diatur.
 * Saat development, alamat yang salah (file tidak ada) diberi peringatan di terminal
 * dan dianggap kosong — supaya tidak muncul gambar rusak.
 */
export function usableImage(image: SiteImage | undefined | null): (SiteImage & { src: string }) | null {
  if (!image?.src) return null;
  if (!image.src.startsWith("/")) {
    console.warn(`[images] src harus diawali "/" (mis. "/images/site/foto.jpg"): ${image.src}`);
    return null;
  }
  if (process.env.NODE_ENV === "development") {
    const file = path.join(process.cwd(), "public", decodeURIComponent(image.src.split("?")[0]));
    if (!existsSync(file)) {
      console.warn(`[images] File tidak ditemukan: public${image.src} — cek nama file di lib/config/images.ts`);
      return null;
    }
  }
  return { ...image, src: image.src };
}

export function usableVideo(src: string | null): string | null {
  if (!src) return null;
  if (process.env.NODE_ENV === "development" && !existsSync(path.join(process.cwd(), "public", src))) {
    console.warn(`[images] Video tidak ditemukan: public${src}`);
    return null;
  }
  return src;
}

export function categoryImage(slug: string) {
  return usableImage(categoryImages[slug]);
}
