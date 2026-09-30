import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  PaymentGatewayError,
  type CreateTransactionInput,
  type IncomingNotification,
  type NormalizedPaymentStatus,
  type PaymentProvider,
  type ProviderPaymentUpdate,
} from "./types";

/**
 * ⚠️ DRAFT / CONTOH — belum dipakai. Gateway final perusahaan BUKAN Midtrans.
 * File ini disimpan sebagai contoh lengkap cara menulis provider (buat transaksi,
 * verifikasi signature webhook, cek status, batalkan). Untuk gateway lain, buat file
 * baru dengan pola yang sama lalu daftarkan di lib/payment/index.ts.
 * Aktif hanya bila PAYMENT_PROVIDER=midtrans.
 *
 * Midtrans Snap (mode redirect — tanpa script pihak ketiga di website kita).
 *  - Buat transaksi : POST {snap}/snap/v1/transactions  → redirect_url
 *  - Notifikasi     : POST ke /api/payments/webhook, diverifikasi dengan
 *                     signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
 *  - Cek status     : GET {api}/v2/{order_id}/status
 *  - Batalkan       : POST {api}/v2/{order_id}/cancel
 * Docs: https://docs.midtrans.com
 */

type MidtransConfig = { serverKey: string; isProduction: boolean };

const TIMEOUT_MS = 10_000;

/** Petakan transaction_status + fraud_status Midtrans ke status internal. */
export function mapMidtransStatus(transactionStatus: string, fraudStatus?: string): NormalizedPaymentStatus {
  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "accept") return "PAID";
      if (fraudStatus === "challenge") return "PENDING";
      return "FAILED";
    case "settlement":
      return fraudStatus === "deny" ? "FAILED" : "PAID";
    case "pending":
    case "authorize":
      return "PENDING";
    case "deny":
    case "failure":
      return "FAILED";
    case "cancel":
      return "CANCELLED";
    case "expire":
      return "EXPIRED";
    default:
      // refund, partial_refund, chargeback, ... → dicatat saja; ditangani admin (Phase 8).
      return "IGNORED";
  }
}

/** "150000.00" → 150000n. Nilai berpecahan (bukan .00) dianggap tidak valid. */
export function parseGrossAmount(value: unknown): bigint | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const match = /^(\d{1,15})(?:\.0+)?$/.exec(String(value));
  return match ? BigInt(match[1]) : null;
}

export function midtransSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash("sha512").update(orderId + statusCode + grossAmount + serverKey).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 200 ? value : null;
}

/** Ubah payload Midtrans (notifikasi / status API) menjadi update ternormalisasi. */
function toUpdate(body: Record<string, unknown>): ProviderPaymentUpdate | null {
  const reference = str(body.order_id);
  const transactionStatus = str(body.transaction_status);
  if (!reference || !transactionStatus) return null;

  // Simpan payload untuk audit, tanpa signature.
  const raw = Object.fromEntries(Object.entries(body).filter(([k]) => k !== "signature_key"));

  return {
    reference,
    status: mapMidtransStatus(transactionStatus, str(body.fraud_status) ?? undefined),
    amount: parseGrossAmount(body.gross_amount),
    providerStatus: transactionStatus,
    transactionId: str(body.transaction_id),
    paymentType: str(body.payment_type),
    raw,
  };
}

/** Format waktu Midtrans: "yyyy-MM-dd HH:mm:ss +0700" (WIB). */
function formatWib(date: Date): string {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${wib.toISOString().slice(0, 19).replace("T", " ")} +0700`;
}

export function createMidtransProvider(config: MidtransConfig): PaymentProvider {
  const snapBase = config.isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
  const apiBase = config.isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
  const authHeader = `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`;

  async function call(url: string, init: RequestInit): Promise<{ status: number; body: Record<string, unknown> }> {
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: authHeader },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      throw new PaymentGatewayError(`Midtrans tidak dapat dihubungi: ${(error as Error).message}`);
    }
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, body };
  }

  return {
    name: "midtrans",

    async createTransaction(input: CreateTransactionInput) {
      const minutes = Math.max(1, Math.floor((input.expiresAt.getTime() - Date.now()) / 60_000));
      const items = input.items.map((i) => ({
        id: i.id.slice(0, 50),
        name: i.name.slice(0, 50),
        price: i.price,
        quantity: i.quantity,
      }));
      // Midtrans mewajibkan jumlah item_details = gross_amount; bila tidak sama, kirim tanpa rincian.
      const itemsTotal = items.reduce((sum, i) => sum + BigInt(i.price) * BigInt(i.quantity), BigInt(0));

      const payload = {
        transaction_details: { order_id: input.reference, gross_amount: Number(input.amount) },
        ...(itemsTotal === input.amount ? { item_details: items } : {}),
        customer_details: {
          first_name: input.customer.name.slice(0, 50),
          email: input.customer.email,
          phone: input.customer.phone,
        },
        callbacks: { finish: input.finishUrl },
        expiry: { start_time: formatWib(new Date()), unit: "minute", duration: Math.min(minutes, 7 * 24 * 60) },
      };

      const { status, body } = await call(`${snapBase}/snap/v1/transactions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const redirectUrl = typeof body.redirect_url === "string" ? body.redirect_url : null;
      if (status !== 201 || !redirectUrl || !redirectUrl.startsWith("https://")) {
        const messages = Array.isArray(body.error_messages) ? body.error_messages.join("; ") : "";
        throw new PaymentGatewayError(`Midtrans menolak transaksi (HTTP ${status}) ${messages}`.trim());
      }
      return { redirectUrl };
    },

    verifyNotification({ body }: IncomingNotification) {
      if (!body || typeof body !== "object") return null;
      const b = body as Record<string, unknown>;
      const orderId = str(b.order_id);
      const statusCode = str(b.status_code);
      const grossAmount = str(b.gross_amount);
      const signature = str(b.signature_key);
      if (!orderId || !statusCode || !grossAmount || !signature) return null;

      const expected = midtransSignature(orderId, statusCode, grossAmount, config.serverKey);
      if (!safeEqualHex(expected, signature.toLowerCase())) return null;
      return toUpdate(b);
    },

    async getStatus(reference: string) {
      const { status, body } = await call(`${apiBase}/v2/${encodeURIComponent(reference)}/status`, { method: "GET" });
      if (status === 404 || body.status_code === "404") return null;
      if (status >= 400) throw new PaymentGatewayError(`Gagal cek status Midtrans (HTTP ${status}).`);
      return toUpdate(body);
    },

    async cancelTransaction(reference: string) {
      // 404 = belum ada transaksi di Midtrans (pembeli belum memilih metode) → tidak masalah.
      await call(`${apiBase}/v2/${encodeURIComponent(reference)}/cancel`, { method: "POST" });
    },
  };
}
