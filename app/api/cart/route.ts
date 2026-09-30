import { getCurrentUser } from "@/lib/dal";
import { getCartView } from "@/services/cart.service";

/**
 * GET /api/cart — isi keranjang user yang sedang login, dengan harga & subtotal dari server.
 * Perubahan keranjang dilakukan lewat Server Actions (lib/actions/cart.ts).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    return Response.json({ ok: true, data: await getCartView(user.id) });
  } catch (error) {
    console.error("[api/cart] Gagal memuat keranjang:", error);
    return Response.json({ ok: false, error: "Gagal memuat keranjang." }, { status: 500 });
  }
}
