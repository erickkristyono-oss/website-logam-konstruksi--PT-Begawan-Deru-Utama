import { slugSchema } from "@/lib/validations/product";
import { getProductBySlug } from "@/services/product.service";

type Context = { params: Promise<{ slug: string }> };

/** GET /api/products/:slug — detail satu produk aktif. */
export async function GET(_request: Request, { params }: Context) {
  const parsed = slugSchema.safeParse((await params).slug);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    const product = await getProductBySlug(parsed.data);
    if (!product) {
      return Response.json({ ok: false, error: "Produk tidak ditemukan." }, { status: 404 });
    }
    return Response.json({ ok: true, data: product });
  } catch (error) {
    console.error("[api/products/:slug] Gagal memuat produk:", error);
    return Response.json({ ok: false, error: "Gagal memuat produk." }, { status: 500 });
  }
}
