import "server-only";
import { getDb } from "@/lib/db";
import { ADMIN_CANCELLABLE, ADMIN_NEXT_STATUS } from "@/lib/config/order-status";
import type { OrderStatus as DbOrderStatus, Prisma } from "@/lib/generated/prisma/client";
import { getPaymentProvider } from "@/lib/payment";
import { restoreStockTx, toNumber } from "@/services/order.service";
import type { OrderStatus } from "@/types/order";

/**
 * Pengelolaan pesanan oleh admin. Setiap perubahan:
 *  - memakai update bersyarat (status lama harus cocok) → aman dari klik ganda / dua admin sekaligus,
 *  - dicatat di OrderLog (siapa & apa).
 */

export class AdminOrderError extends Error {}

export const ADMIN_ORDERS_PER_PAGE = 20;

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  createdAt: Date;
};

export async function listAdminOrders(opts: { status?: OrderStatus; q?: string; page: number }) {
  const where: Prisma.OrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q
      ? {
          OR: [
            { orderNumber: { contains: opts.q, mode: "insensitive" } },
            { shippingName: { contains: opts.q, mode: "insensitive" } },
            { shippingEmail: { contains: opts.q, mode: "insensitive" } },
            { user: { email: { contains: opts.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const db = getDb();
  const [total, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * ADMIN_ORDERS_PER_PAGE,
      take: ADMIN_ORDERS_PER_PAGE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        shippingName: true,
        user: { select: { email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);
  const items: AdminOrderListItem[] = rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: toNumber(o.total),
    itemCount: o._count.items,
    customerName: o.shippingName,
    customerEmail: o.user.email,
    createdAt: o.createdAt,
  }));
  return { items, total, page: opts.page, totalPages: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PER_PAGE)) };
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const rows = await getDb().order.groupBy({ by: ["status"], _count: { _all: true } });
  const out = { PENDING_PAYMENT: 0, PAID: 0, PROCESSING: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const r of rows) out[r.status] = r._count._all;
  return out;
}

/** Pembayaran lunas yang harus dikembalikan: pesanannya batal, atau pembayaran ganda. */
function needsRefund(
  p: { id: string; status: string; refundedAt: Date | null },
  orderStatus: DbOrderStatus,
  firstPaidId: string | undefined,
): boolean {
  if (p.status !== "PAID" || p.refundedAt) return false;
  return orderStatus === "CANCELLED" || p.id !== firstPaidId;
}

export async function getAdminOrder(id: string) {
  const o = await getDb().order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
      logs: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!o) return null;

  const firstPaid = o.payments.filter((p) => p.status === "PAID").sort((a, b) => +a.paidAt! - +b.paidAt!)[0];

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    subtotal: toNumber(o.subtotal),
    shippingCost: toNumber(o.shippingCost),
    total: toNumber(o.total),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    paidAt: o.paidAt,
    cancelReason: o.cancelReason,
    trackingNumber: o.trackingNumber,
    adminNote: o.adminNote,
    notes: o.notes,
    customer: o.user,
    shipping: {
      name: o.shippingName,
      email: o.shippingEmail,
      phone: o.shippingPhone,
      address: o.shippingAddress,
      city: o.shippingCity,
      postalCode: o.shippingPostalCode,
    },
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      unit: i.unit,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: toNumber(i.lineTotal),
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      provider: p.provider,
      reference: p.reference,
      amount: toNumber(p.amount),
      status: p.status,
      paymentType: p.paymentType,
      providerStatus: p.providerStatus,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      refundedAt: p.refundedAt,
      needsRefund: needsRefund(p, o.status, firstPaid?.id),
    })),
    logs: o.logs.map((l) => ({ id: l.id, action: l.action, detail: l.detail, createdAt: l.createdAt, actor: l.actor?.name ?? "—" })),
  };
}

export type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

// ------------------------------------------------------------------ tindakan

export async function advanceOrderStatus(adminId: string, orderId: string, from: OrderStatus, trackingNumber?: string) {
  const next = ADMIN_NEXT_STATUS[from];
  if (!next) throw new AdminOrderError("Status ini tidak bisa dilanjutkan.");

  await getDb().$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: from },
      data: { status: next.to, ...(next.to === "SHIPPED" && trackingNumber ? { trackingNumber } : {}) },
    });
    if (count === 0) throw new AdminOrderError("Status pesanan sudah berubah. Muat ulang halaman.");
    await tx.orderLog.create({
      data: {
        orderId,
        actorId: adminId,
        action: `STATUS:${next.to}`,
        detail: next.to === "SHIPPED" && trackingNumber ? `Resi: ${trackingNumber}` : null,
      },
    });
  });
}

export async function cancelOrderByAdmin(adminId: string, orderId: string, reason: string) {
  const pending = await getDb().$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!current) throw new AdminOrderError("Pesanan tidak ditemukan.");
    if (!ADMIN_CANCELLABLE.includes(current.status)) throw new AdminOrderError("Pesanan ini tidak dapat dibatalkan.");

    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: current.status },
      data: { status: "CANCELLED", cancelReason: "ADMIN" },
    });
    if (count === 0) throw new AdminOrderError("Status pesanan sudah berubah. Muat ulang halaman.");

    await restoreStockTx(tx, orderId);
    const pendingPayments = await tx.payment.findMany({
      where: { orderId, status: "PENDING" },
      select: { reference: true, provider: true },
    });
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    await tx.orderLog.create({
      data: {
        orderId,
        actorId: adminId,
        action: "CANCEL",
        detail: `${reason}${current.status !== "PENDING_PAYMENT" ? " — pesanan sudah dibayar: lakukan refund." : ""}`,
      },
    });
    return pendingPayments;
  });
  await cancelAtGateway(pending);
}

/** Pembayaran di luar gateway (mis. transfer bank langsung) yang sudah dicek admin. */
export async function markOrderPaidManually(adminId: string, orderId: string, note: string) {
  const pending = await getDb().$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, total: true, orderNumber: true, _count: { select: { payments: true } } },
    });
    if (!order) throw new AdminOrderError("Pesanan tidak ditemukan.");
    const now = new Date();
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: { status: "PAID", paidAt: now },
    });
    if (count === 0) throw new AdminOrderError("Pesanan tidak sedang menunggu pembayaran.");

    const pendingPayments = await tx.payment.findMany({
      where: { orderId, status: "PENDING" },
      select: { reference: true, provider: true },
    });
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    await tx.payment.create({
      data: {
        orderId,
        provider: "manual",
        reference: `${order.orderNumber}-M${order._count.payments + 1}`,
        amount: order.total,
        status: "PAID",
        paymentType: "manual",
        providerStatus: "manual",
        expiresAt: now,
        paidAt: now,
      },
    });
    await tx.orderLog.create({ data: { orderId, actorId: adminId, action: "MANUAL_PAYMENT", detail: note || null } });
    return pendingPayments;
  });
  await cancelAtGateway(pending);
}

export async function updateOrderAdminFields(
  adminId: string,
  orderId: string,
  fields: { trackingNumber: string | null; adminNote: string | null },
) {
  await getDb().$transaction(async (tx) => {
    const before = await tx.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true, adminNote: true } });
    if (!before) throw new AdminOrderError("Pesanan tidak ditemukan.");
    await tx.order.update({ where: { id: orderId }, data: fields });
    if (before.trackingNumber !== fields.trackingNumber) {
      await tx.orderLog.create({
        data: { orderId, actorId: adminId, action: "TRACKING", detail: fields.trackingNumber ?? "(dihapus)" },
      });
    }
    if (before.adminNote !== fields.adminNote) {
      await tx.orderLog.create({ data: { orderId, actorId: adminId, action: "NOTE", detail: null } });
    }
  });
}

export async function markPaymentRefunded(adminId: string, paymentId: string) {
  await getDb().$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId }, select: { orderId: true, reference: true } });
    if (!p) throw new AdminOrderError("Pembayaran tidak ditemukan.");
    const { count } = await tx.payment.updateMany({
      where: { id: paymentId, status: "PAID", refundedAt: null },
      data: { refundedAt: new Date() },
    });
    if (count === 0) throw new AdminOrderError("Pembayaran ini tidak perlu / sudah direfund.");
    await tx.orderLog.create({ data: { orderId: p.orderId, actorId: adminId, action: "REFUNDED", detail: p.reference } });
  });
}

/** Daftar pembayaran yang perlu direfund (untuk dashboard). */
export async function listPaymentsNeedingRefund() {
  const paid = await getDb().payment.findMany({
    where: { status: "PAID", refundedAt: null },
    select: {
      id: true,
      reference: true,
      amount: true,
      paidAt: true,
      orderId: true,
      order: { select: { orderNumber: true, status: true } },
    },
    orderBy: { paidAt: "asc" },
    take: 500,
  });
  const firstByOrder = new Map<string, string>();
  for (const p of paid) if (!firstByOrder.has(p.orderId)) firstByOrder.set(p.orderId, p.id);
  return paid
    .filter((p) => p.order.status === "CANCELLED" || firstByOrder.get(p.orderId) !== p.id)
    .map((p) => ({ id: p.id, reference: p.reference, amount: toNumber(p.amount), orderId: p.orderId, orderNumber: p.order.orderNumber }));
}

async function cancelAtGateway(payments: { reference: string; provider: string }[]) {
  for (const p of payments) {
    try {
      const provider = getPaymentProvider();
      if (provider.name === p.provider) await provider.cancelTransaction(p.reference);
    } catch (error) {
      console.warn("[admin] Gagal membatalkan transaksi di gateway:", p.reference, (error as Error).message);
    }
  }
}
