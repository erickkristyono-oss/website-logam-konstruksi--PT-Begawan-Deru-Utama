import type { OrderStatus } from "@/types/order";

type BadgeTone = "neutral" | "accent" | "dark" | "success" | "danger";

/** Label & warna status pesanan untuk UI. */
export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone; description: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", tone: "accent", description: "Pesanan dibuat dan menunggu pembayaran." },
  PAID: { label: "Dibayar", tone: "success", description: "Pembayaran diterima." },
  PROCESSING: { label: "Diproses", tone: "dark", description: "Pesanan sedang disiapkan." },
  SHIPPED: { label: "Dikirim", tone: "dark", description: "Pesanan dalam pengiriman." },
  COMPLETED: { label: "Selesai", tone: "success", description: "Pesanan telah diterima." },
  CANCELLED: { label: "Dibatalkan", tone: "danger", description: "Pesanan dibatalkan." },
};

/** Urutan tahapan normal (untuk timeline). */
export const ORDER_FLOW: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"];

/** Alasan pembatalan untuk ditampilkan. */
export const CANCEL_REASON_LABEL: Record<string, string> = {
  CUSTOMER: "Dibatalkan pelanggan",
  PAYMENT_EXPIRED: "Batas waktu pembayaran terlewat",
  ADMIN: "Dibatalkan admin",
};

/** Langkah berikutnya yang boleh dilakukan admin dari tiap status. */
export const ADMIN_NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PAID: { to: "PROCESSING", label: "Proses Pesanan" },
  PROCESSING: { to: "SHIPPED", label: "Tandai Dikirim" },
  SHIPPED: { to: "COMPLETED", label: "Tandai Selesai" },
};

/** Status yang masih boleh dibatalkan admin. */
export const ADMIN_CANCELLABLE: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING"];
