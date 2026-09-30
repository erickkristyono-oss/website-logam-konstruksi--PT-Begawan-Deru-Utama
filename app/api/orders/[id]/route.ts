import { getCurrentUser } from "@/lib/dal";
import { getOrderForUser } from "@/services/order.service";
import { expireStaleOrders } from "@/services/payment.service";

type Context = { params: Promise<{ id: string }> };

/** GET /api/orders/:id — detail pesanan; hanya pemiliknya (lainnya 404). */
export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const { id } = await params;
  if (!/^[a-z0-9]{1,64}$/i.test(id)) return Response.json({ ok: false, error: "Pesanan tidak ditemukan." }, { status: 404 });

  try {
    await expireStaleOrders({ userId: user.id, limit: 5 });
    const order = await getOrderForUser(user.id, id);
    if (!order) return Response.json({ ok: false, error: "Pesanan tidak ditemukan." }, { status: 404 });
    return Response.json({ ok: true, data: order });
  } catch (error) {
    console.error("[api/orders/:id] Gagal memuat pesanan:", error);
    return Response.json({ ok: false, error: "Gagal memuat pesanan." }, { status: 500 });
  }
}
