/**
 * Kontrak payment gateway. Kode lain (service, route) hanya mengenal interface ini,
 * jadi mengganti Midtrans dengan gateway lain cukup dengan menulis provider baru.
 */

export type ProviderName = "midtrans" | "mock";

/** Status yang sudah dinormalisasi dari istilah masing-masing gateway. */
export type NormalizedPaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | "IGNORED";

/** Kabar status dari gateway yang SUDAH terverifikasi (signature valid / hasil panggilan server-ke-server). */
export type ProviderPaymentUpdate = {
  reference: string;
  status: NormalizedPaymentStatus;
  /** Nominal menurut gateway (Rupiah utuh); dibandingkan dengan nominal di database. */
  amount: bigint | null;
  providerStatus: string;
  transactionId?: string | null;
  paymentType?: string | null;
  /** Payload untuk log audit (tanpa signature/secret). */
  raw: Record<string, unknown>;
};

export type CreateTransactionInput = {
  reference: string;
  amount: bigint;
  expiresAt: Date;
  finishUrl: string;
  customer: { name: string; email: string; phone: string };
  items: { id: string; name: string; price: number; quantity: number }[];
};

/** Notifikasi mentah dari gateway. Tiap gateway memverifikasi dengan caranya sendiri:
 *  field signature di body (Midtrans), token di header (mis. Xendit), atau HMAC atas rawBody (mis. DOKU). */
export type IncomingNotification = { rawBody: string; body: unknown; headers: Headers };

export interface PaymentProvider {
  readonly name: ProviderName;
  /** Membuat transaksi di gateway, mengembalikan URL halaman pembayaran. */
  createTransaction(input: CreateTransactionInput): Promise<{ redirectUrl: string }>;
  /** Memverifikasi notifikasi webhook. null = signature/format tidak valid → tolak. */
  verifyNotification(notification: IncomingNotification): ProviderPaymentUpdate | null;
  /** Menanyakan status langsung ke gateway (server-ke-server). null = transaksi belum ada di gateway. */
  getStatus(reference: string): Promise<ProviderPaymentUpdate | null>;
  /** Membatalkan transaksi yang belum dibayar (best effort). */
  cancelTransaction(reference: string): Promise<void>;
}

export class PaymentGatewayError extends Error {}
