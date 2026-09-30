import { timingSafeEqual } from "node:crypto";
import { expireStaleOrders } from "@/services/payment.service";

/**
 * GET /api/cron/expire-orders — membatalkan pesanan yang lewat batas waktu bayar & mengembalikan stok.
 * Dipanggil oleh penjadwal (mis. Vercel Cron, diatur di Phase 11) dengan header:
 *   Authorization: Bearer <CRON_SECRET>
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ ok: false, error: "CRON_SECRET belum di-set." }, { status: 503 });
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });

  try {
    const expired = await expireStaleOrders({ limit: 100 });
    return Response.json({ ok: true, expired });
  } catch (error) {
    console.error("[cron] expire-orders gagal:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
