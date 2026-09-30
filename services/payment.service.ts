import "server-only";
import { getDb } from "@/lib/db";
import { PAYMENT_WINDOW_HOURS, paymentDeadline } from "@/lib/config/payment";
import { Prisma } from "@/lib/generated/prisma/client";
import { PaymentGatewayError, appBaseUrl, getPaymentProvider, type ProviderPaymentUpdate } from "@/lib/payment";
import { restoreStockTx, toNumber } from "@/services/order.service";

/**
 * Business logic pembayaran.
 *
 * Prinsip keamanan:
 *  - Status LUNAS hanya berasal dari gateway: webhook bertanda tangan valid, atau
 *    pengecekan status server-ke-server. TIDAK PERNAH dari query string / browser.
 *  - Nominal dari gateway dibandingkan dengan nominal di database.
 *  - Semua perubahan status memakai update bersyarat → notifikasi yang datang berkali-kali
 *    (Midtrans memang mengirim ulang) hanya diproses sekali (idempotent).
 */

export type PaymentErrorCode = "NOT_FOUND" | "NOT_PAYABLE" | "EXPIRED" | "BUSY" | "GATEWAY";

export class PaymentError extends Error {
  constructor(
    public code: PaymentErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Percobaan tanpa URL (gateway sedang dihubungi) dianggap macet setelah ini. */
const CREATING_TIMEOUT_MS = 30_000;
/** Jangan melanjutkan halaman pembayaran yang akan habis dalam < 1 menit. */
const RESUME_MARGIN_MS = 60_000;

// ---------------------------------------------------------------------------
// Memulai pembayaran
// ---------------------------------------------------------------------------

export async function startPayment(userId: string, orderId: string): Promise<{ redirectUrl: string }> {
  const provider = getPaymentProvider();
  const db = getDb();

  // Langkah 1 (transaksi singkat, baris Order dikunci): pakai ulang percobaan yang masih aktif,
  // atau buat percobaan baru. Kunci mencegah dua klik bersamaan membuat dua tagihan.
  const prepared = await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "userId" = ${userId} FOR UPDATE`;
    if (locked.length === 0) throw new PaymentError("NOT_FOUND", "Pesanan tidak ditemukan.");

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: { orderBy: { createdAt: "asc" } },
        payments: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" } },
        _count: { select: { payments: true } },
      },
    });
    if (order.status !== "PENDING_PAYMENT") {
      throw new PaymentError("NOT_PAYABLE", "Pesanan ini tidak menunggu pembayaran.");
    }

    const now = Date.now();
    const deadline = paymentDeadline(order.createdAt);
    if (deadline.getTime() - now < RESUME_MARGIN_MS) {
      return { kind: "expired" as const };
    }

    for (const p of order.payments) {
      if (p.redirectUrl && p.expiresAt.getTime() - now > RESUME_MARGIN_MS && p.provider === provider.name) {
        return { kind: "reuse" as const, redirectUrl: p.redirectUrl };
      }
      if (!p.redirectUrl && now - p.createdAt.getTime() < CREATING_TIMEOUT_MS) {
        throw new PaymentError("BUSY", "Pembayaran sedang disiapkan. Tunggu sebentar lalu coba lagi.");
      }
      // Percobaan lama yang sudah habis / macet / provider lain → tutup.
      await tx.payment.updateMany({
        where: { id: p.id, status: "PENDING" },
        data: { status: p.redirectUrl ? "EXPIRED" : "FAILED" },
      });
    }

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        reference: `${order.orderNumber}-${order._count.payments + 1}`,
        amount: order.total,
        // Tagihan tidak boleh melewati batas waktu pesanan.
        expiresAt: deadline,
      },
    });

    return {
      kind: "new" as const,
      payment,
      input: {
        reference: payment.reference,
        amount: order.total,
        expiresAt: deadline,
        finishUrl: `${appBaseUrl()}/account/orders/${order.id}?payment=return`,
        customer: { name: order.shippingName, email: order.shippingEmail, phone: order.shippingPhone },
        items: [
          ...order.items.map((i) => ({
            id: i.productSlug,
            name: i.productName,
            price: i.unitPrice,
            quantity: i.quantity,
          })),
          ...(order.shippingCost > BigInt(0)
            ? [{ id: "ongkir", name: "Ongkos kirim", price: toNumber(order.shippingCost), quantity: 1 }]
            : []),
        ],
      },
    };
  });

  if (prepared.kind === "expired") {
    await expireStaleOrders({ userId });
    throw new PaymentError("EXPIRED", "Batas waktu pembayaran sudah lewat. Pesanan dibatalkan otomatis.");
  }
  if (prepared.kind === "reuse") return { redirectUrl: prepared.redirectUrl };

  // Langkah 2 (di luar transaksi — jangan menahan kunci database saat memanggil internet).
  const { payment, input } = prepared;
  try {
    const { redirectUrl } = await provider.createTransaction(input);
    await db.payment.update({ where: { id: payment.id }, data: { redirectUrl } });
    return { redirectUrl };
  } catch (error) {
    await db.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
    await logEvent({
      paymentId: payment.id,
      provider: provider.name,
      reference: payment.reference,
      source: "create",
      status: "error",
      applied: false,
      note: (error as Error).message.slice(0, 500),
      payload: {},
    });
    console.error("[payment] Gagal membuat transaksi:", error);
    throw new PaymentError(
      "GATEWAY",
      error instanceof PaymentGatewayError
        ? "Layanan pembayaran sedang bermasalah. Silakan coba beberapa saat lagi."
        : "Pembayaran gagal disiapkan. Silakan coba lagi.",
    );
  }
}

// ---------------------------------------------------------------------------
// Menerapkan kabar status dari gateway (webhook / sync / simulasi)
// ---------------------------------------------------------------------------

export type ApplyResult = "APPLIED" | "DUPLICATE" | "UNKNOWN_REFERENCE" | "AMOUNT_MISMATCH" | "IGNORED";

type EventSource = "webhook" | "sync" | "mock";

export async function applyProviderUpdate(update: ProviderPaymentUpdate, source: EventSource): Promise<ApplyResult> {
  return getDb().$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { reference: update.reference },
      select: { id: true, orderId: true, amount: true, provider: true, status: true },
    });

    const base = {
      provider: payment?.provider ?? "unknown",
      reference: update.reference,
      source,
      status: update.providerStatus,
      payload: update.raw as Prisma.InputJsonValue,
    };

    if (!payment) {
      // Mis. "test notification" dari dashboard Midtrans. Dicatat, tidak diproses.
      await logEvent({ ...base, paymentId: null, applied: false, note: "UNKNOWN_REFERENCE" }, tx);
      return "UNKNOWN_REFERENCE";
    }

    if (update.amount !== null && update.amount !== payment.amount) {
      console.error("[payment] Nominal tidak cocok:", update.reference, String(update.amount), String(payment.amount));
      await logEvent({ ...base, paymentId: payment.id, applied: false, note: "AMOUNT_MISMATCH" }, tx);
      return "AMOUNT_MISMATCH";
    }

    const details = {
      providerStatus: update.providerStatus,
      ...(update.transactionId ? { providerTransactionId: update.transactionId } : {}),
      ...(update.paymentType ? { paymentType: update.paymentType } : {}),
    };

    let result: ApplyResult = "DUPLICATE";
    let note: string | null = null;

    switch (update.status) {
      case "PAID": {
        // Uang sudah diterima gateway → percobaan ditandai lunas walau sebelumnya
        // dianggap kedaluwarsa/batal secara lokal.
        const now = new Date();
        const { count } = await tx.payment.updateMany({
          where: { id: payment.id, status: { not: "PAID" } },
          data: { ...details, status: "PAID", paidAt: now },
        });
        if (count === 0) break;
        result = "APPLIED";

        const order = await tx.order.updateMany({
          where: { id: payment.orderId, status: "PENDING_PAYMENT" },
          data: { status: "PAID", paidAt: now },
        });
        if (order.count > 0) {
          // Percobaan lain yang masih terbuka untuk pesanan ini tidak diperlukan lagi.
          await tx.payment.updateMany({
            where: { orderId: payment.orderId, status: "PENDING", id: { not: payment.id } },
            data: { status: "CANCELLED" },
          });
        } else {
          // Pesanan sudah dibayar lewat percobaan lain, atau sudah dibatalkan → perlu refund manual.
          const current = await tx.order.findUnique({ where: { id: payment.orderId }, select: { status: true } });
          note = current?.status === "CANCELLED" ? "PAID_AFTER_CANCEL_NEEDS_REFUND" : "DUPLICATE_PAYMENT_NEEDS_REFUND";
          console.error(`[payment] ${note}:`, update.reference);
        }
        break;
      }
      case "FAILED":
      case "EXPIRED":
      case "CANCELLED": {
        const { count } = await tx.payment.updateMany({
          where: { id: payment.id, status: "PENDING" },
          data: { ...details, status: update.status },
        });
        if (count > 0) result = "APPLIED";
        // Pesanan tetap "Menunggu Pembayaran" → pembeli bisa mencoba lagi sampai batas waktu.
        break;
      }
      case "PENDING": {
        const { count } = await tx.payment.updateMany({
          where: { id: payment.id, status: "PENDING" },
          data: details,
        });
        if (count > 0) result = "APPLIED";
        break;
      }
      case "IGNORED":
        result = "IGNORED";
        note = "NOT_HANDLED_STATUS";
        break;
    }

    await logEvent({ ...base, paymentId: payment.id, applied: result === "APPLIED", note }, tx);
    return result;
  });
}

// ---------------------------------------------------------------------------
// Cek status langsung ke gateway (saat pembeli kembali dari halaman pembayaran)
// ---------------------------------------------------------------------------

/** Menyinkronkan percobaan pembayaran terakhir yang masih PENDING milik user ini. */
export async function syncLatestPayment(userId: string, orderId: string): Promise<void> {
  const payment = await getDb().payment.findFirst({
    where: { orderId, order: { userId }, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { reference: true, provider: true },
  });
  if (!payment) return;
  await syncReference(payment.reference, payment.provider);
}

async function syncReference(reference: string, providerName: string): Promise<void> {
  const provider = getPaymentProvider();
  if (provider.name !== providerName || provider.name === "mock") return;
  try {
    const update = await provider.getStatus(reference);
    if (update && update.reference === reference) await applyProviderUpdate(update, "sync");
  } catch (error) {
    console.warn("[payment] Gagal cek status:", reference, (error as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Pesanan yang tidak dibayar sampai batas waktu → dibatalkan, stok kembali
// ---------------------------------------------------------------------------

/**
 * Dipanggil saat user membuka daftar/detail pesanan (hanya pesanannya sendiri) dan oleh
 * /api/cron/expire-orders (semua pesanan). Aman dipanggil berkali-kali.
 */
export async function expireStaleOrders({ userId, limit = 20 }: { userId?: string; limit?: number } = {}): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_HOURS * 60 * 60 * 1000);

  const stale = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lte: cutoff }, ...(userId ? { userId } : {}) },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, payments: { where: { status: "PENDING" }, select: { reference: true, provider: true } } },
  });

  let expired = 0;
  for (const order of stale) {
    // Pastikan dulu ke gateway: jangan batalkan pesanan yang ternyata baru saja dibayar.
    for (const p of order.payments) await syncReference(p.reference, p.provider);

    const done = await db.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT", createdAt: { lte: cutoff } },
        data: { status: "CANCELLED", cancelReason: "PAYMENT_EXPIRED" },
      });
      if (count === 0) return false;
      await restoreStockTx(tx, order.id);
      await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "EXPIRED" } });
      return true;
    });
    if (done) expired++;
  }
  return expired;
}

// ---------------------------------------------------------------------------
// Simulasi (provider mock, hanya localhost)
// ---------------------------------------------------------------------------

export type MockOutcome = "PAID" | "FAILED" | "EXPIRED";

export async function getMockPaymentForUser(userId: string, reference: string) {
  return getDb().payment.findFirst({
    where: { reference, provider: "mock", order: { userId } },
    select: {
      reference: true,
      amount: true,
      status: true,
      expiresAt: true,
      order: { select: { id: true, orderNumber: true, status: true } },
    },
  });
}

export async function simulateMockPayment(userId: string, reference: string, outcome: MockOutcome): Promise<string> {
  if (getPaymentProvider().name !== "mock") throw new PaymentError("NOT_FOUND", "Simulasi tidak tersedia.");
  const payment = await getMockPaymentForUser(userId, reference);
  if (!payment) throw new PaymentError("NOT_FOUND", "Pembayaran tidak ditemukan.");

  await applyProviderUpdate(
    {
      reference,
      status: outcome,
      amount: payment.amount,
      providerStatus: `mock_${outcome.toLowerCase()}`,
      paymentType: "mock",
      transactionId: `mock-${Date.now()}`,
      raw: { simulated: true, outcome },
    },
    "mock",
  );
  return payment.order.id;
}

// ---------------------------------------------------------------------------

type EventInput = {
  paymentId: string | null;
  provider: string;
  reference: string;
  source: string;
  status: string;
  applied: boolean;
  note: string | null;
  payload: Prisma.InputJsonValue;
};

async function logEvent(data: EventInput, tx?: Prisma.TransactionClient): Promise<void> {
  await (tx ?? getDb()).paymentEvent.create({
    data: { ...data, reference: data.reference.slice(0, 100), status: data.status.slice(0, 50) },
  });
}
