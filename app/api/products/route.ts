import type { NextRequest } from "next/server";
import { parseProductQuery } from "@/lib/validations/product";
import { listProducts } from "@/services/product.service";

/**
 * GET /api/products?q=&category=&page=&limit=
 * Daftar produk aktif (paginated). Parameter tidak valid dikembalikan ke default.
 */
export async function GET(request: NextRequest) {
  const query = parseProductQuery(Object.fromEntries(request.nextUrl.searchParams));

  try {
    const result = await listProducts(query);
    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("[api/products] Gagal memuat produk:", error);
    return Response.json({ ok: false, error: "Gagal memuat produk." }, { status: 500 });
  }
}
