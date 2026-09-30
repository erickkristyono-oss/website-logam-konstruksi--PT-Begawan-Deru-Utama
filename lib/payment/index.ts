import "server-only";
import { siteConfig } from "@/lib/config/site";
import { createMidtransProvider } from "./midtrans";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

/**
 * Memilih payment provider dari environment variable (hanya dibaca di server):
 *   PAYMENT_PROVIDER=mock        (default) simulasi, hanya di localhost
 *   PAYMENT_PROVIDER=midtrans    DRAFT/contoh — butuh MIDTRANS_SERVER_KEY (SECRET)
 *
 * Menambah gateway baru (mis. gateway pilihan perusahaan):
 *   1. buat lib/payment/<nama>.ts yang mengimplementasikan PaymentProvider (lihat types.ts,
 *      contoh lengkap di midtrans.ts),
 *   2. tambahkan cabang di getPaymentProvider() + nama di ProviderName,
 *   3. isi env di .env.local dan arahkan webhook gateway ke /api/payments/webhook.
 * Service, halaman, database, dan webhook route tidak perlu diubah.
 */

/** Alamat publik website (untuk URL kembali setelah bayar). */
export function appBaseUrl(): string {
  return (process.env.AUTH_URL ?? siteConfig.url).replace(/\/+$/, "");
}

function isLocalhost(): boolean {
  try {
    const host = new URL(appBaseUrl()).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const name = (process.env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();

  if (name === "midtrans") {
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum di-set (lihat .env.example).");
    cached = createMidtransProvider({ serverKey, isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true" });
  } else if (name === "mock") {
    // Simulasi hanya boleh di komputer lokal — tidak pernah di website publik.
    if (!isLocalhost()) throw new Error("PAYMENT_PROVIDER=mock hanya boleh dipakai di localhost.");
    cached = mockProvider;
  } else {
    throw new Error(`PAYMENT_PROVIDER tidak dikenal: ${name}`);
  }
  return cached;
}

export type { PaymentProvider, ProviderPaymentUpdate, ProviderName } from "./types";
export { PaymentGatewayError } from "./types";
