import { readFile } from "node:fs/promises";
import { productImagePath } from "@/lib/storage";

/**
 * GET /uploads/products/<nama-file> — menyajikan foto produk hasil upload admin.
 * Nama file divalidasi ketat (tidak bisa ../ untuk membaca file lain). Nama file acak & tidak
 * pernah ditimpa, jadi aman di-cache browser/CDN selamanya.
 */
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const location = productImagePath(file);
  if (!location) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(location);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[file.split(".").pop()!]!,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
