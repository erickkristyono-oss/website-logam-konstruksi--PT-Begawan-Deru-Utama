import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Penyimpanan file upload (foto produk).
 *
 * Driver saat ini: LOKAL — file disimpan di folder storage/uploads/ (di luar public/, tidak
 * di-commit) dan disajikan oleh app/uploads/products/[file]/route.ts di alamat /uploads/products/...
 * (Next.js tidak menyajikan file yang ditambahkan ke public/ setelah build.)
 * Cocok untuk development & server biasa (VPS) — folder storage/ harus ikut di-backup.
 * ⚠️ Hosting serverless (mis. Vercel) tidak menyimpan file secara permanen: ganti driver
 * ini dengan object storage (Vercel Blob / S3 / Cloudflare R2) di Phase 11 — cukup ubah file ini.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const UPLOAD_ROOT = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(process.cwd(), "storage", "uploads");

/** Nama file upload yang sah (dibuat oleh saveProductImage). */
export const UPLOAD_NAME_REGEX = /^[a-z0-9-]+\.(jpg|png|webp)$/;

/** Lokasi file di disk untuk nama file yang sah, atau null. */
export function productImagePath(name: string): string | null {
  return UPLOAD_NAME_REGEX.test(name) ? path.join(UPLOAD_ROOT, "products", name) : null;
}

export class UploadError extends Error {}

/** Deteksi jenis gambar dari isi file (magic bytes), bukan dari nama/ekstensi yang bisa dipalsukan. */
function detectImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

/** Simpan foto produk. Mengembalikan URL publik, mis. "/uploads/products/besi-beton-a1b2c3d4.jpg". */
export async function saveProductImage(file: File, slug: string): Promise<string> {
  if (file.size === 0) throw new UploadError("File kosong.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Ukuran foto maksimal 5 MB.");

  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buf);
  if (!type) throw new UploadError("Format foto harus JPG, PNG, atau WEBP.");

  const safeSlug =
    slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "produk";
  const name = `${safeSlug}-${randomBytes(4).toString("hex")}.${type}`;
  const dir = path.join(UPLOAD_ROOT, "products");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf, { flag: "wx" });
  } catch (e) {
    // Mis. UPLOAD_DIR salah / tidak bisa ditulis — tampilkan pesan jelas di form, detail di log server.
    console.error(`[storage] Gagal menulis foto ke ${dir}:`, e);
    throw new UploadError("Foto tidak bisa disimpan di server. Periksa pengaturan UPLOAD_DIR di hosting.");
  }
  return `/uploads/products/${name}`;
}

/** Hapus foto upload lama (hanya file di /uploads/, bukan ilustrasi bawaan). Gagal hapus diabaikan. */
export async function deleteUploadedImage(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/uploads/products/")) return;
  const file = productImagePath(path.basename(url));
  if (file) await unlink(file).catch(() => {});
}
