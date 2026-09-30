import { getCurrentUser } from "@/lib/dal";
import { listOrdersForUser } from "@/services/order.service";
import { expireStaleOrders } from "@/services/payment.service";

/** GET /api/orders — daftar pesanan milik user yang login. Pembuatan pesanan lewat halaman checkout. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  try {
    await expireStaleOrders({ userId: user.id, limit: 10 });
    return Response.json({ ok: true, data: await listOrdersForUser(user.id) });
  } catch (error) {
    console.error("[api/orders] Gagal memuat pesanan:", error);
    return Response.json({ ok: false, error: "Gagal memuat pesanan." }, { status: 500 });
  }
}
