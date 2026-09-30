import { listCategories } from "@/services/category.service";

// Selalu ambil data terbaru dari database (bukan hasil build).
export const dynamic = "force-dynamic";

/** GET /api/categories — kategori aktif beserta jumlah produk aktif. */
export async function GET() {
  try {
    const categories = await listCategories();
    return Response.json({ ok: true, data: categories });
  } catch (error) {
    console.error("[api/categories] Gagal memuat kategori:", error);
    return Response.json({ ok: false, error: "Gagal memuat kategori." }, { status: 500 });
  }
}
