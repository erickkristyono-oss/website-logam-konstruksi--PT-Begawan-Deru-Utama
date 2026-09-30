/**
 * Aturan pembayaran yang aman dipakai di client maupun server (tidak berisi secret).
 * Secret & pilihan provider ada di lib/payment/index.ts (server-only).
 */

/** Batas waktu membayar sejak pesanan dibuat. Lewat dari ini pesanan dibatalkan & stok dikembalikan. */
export const PAYMENT_WINDOW_HOURS = 24;

export function paymentDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000);
}

/** Label metode pembayaran dari gateway (payment_type Midtrans). */
const PAYMENT_TYPE_LABELS: Record<string, string> = {
  bank_transfer: "Transfer Bank (Virtual Account)",
  echannel: "Mandiri Bill Payment",
  permata: "Permata Virtual Account",
  qris: "QRIS",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  credit_card: "Kartu Kredit/Debit",
  cstore: "Gerai Retail",
  akulaku: "Akulaku",
  kredivo: "Kredivo",
  mock: "Simulasi (development)",
  manual: "Transfer manual (dikonfirmasi admin)",
};

export function paymentTypeLabel(type: string | null | undefined): string | null {
  if (!type) return null;
  return PAYMENT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}
