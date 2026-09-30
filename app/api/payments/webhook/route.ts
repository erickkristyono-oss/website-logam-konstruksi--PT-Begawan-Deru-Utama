import { getPaymentProvider } from "@/lib/payment";
import { applyProviderUpdate } from "@/services/payment.service";

/**
 * POST /api/payments/webhook — notifikasi dari payment gateway (URL ini didaftarkan di dashboard gateway).
 *
 * - Signature diverifikasi dengan server key; notifikasi palsu → 401 dan tidak diproses.
 * - Respon 200 = diterima (termasuk duplikat). Respon 5xx membuat gateway mengirim ulang.
 */
const MAX_BODY = 64 * 1024;

export async function POST(request: Request) {
  let provider;
  try {
    provider = getPaymentProvider();
  } catch (error) {
    console.error("[webhook] Konfigurasi pembayaran salah:", (error as Error).message);
    return Response.json({ ok: false }, { status: 503 });
  }
  if (provider.name === "mock") return Response.json({ ok: false }, { status: 404 });

  const text = await request.text();
  if (text.length > MAX_BODY) return Response.json({ ok: false }, { status: 413 });

  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    // Sebagian gateway mengirim form-urlencoded; provider bisa membaca rawBody sendiri.
  }

  const update = provider.verifyNotification({ rawBody: text, body, headers: request.headers });
  if (!update) {
    console.warn("[webhook] Notifikasi ditolak: signature tidak valid.");
    return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  try {
    const result = await applyProviderUpdate(update, "webhook");
    return Response.json({ ok: true, result });
  } catch (error) {
    console.error("[webhook] Gagal memproses notifikasi:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
