import "server-only";
import { getDb } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { toNumber } from "@/services/order.service";
import { LOW_STOCK } from "@/services/admin/catalog";
import { countOrdersByStatus, listPaymentsNeedingRefund } from "@/services/admin/order";

/** Awal bulan ini dalam WIB (UTC+7), dikonversi ke UTC. */
function startOfMonthWib(now = new Date()): Date {
  const wib = new Date(now.getTime() + 7 * 3600_000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - 7 * 3600_000);
}

export async function getDashboardData() {
  const db = getDb();
  const monthStart = startOfMonthWib();
  const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

  const [byStatus, revenue, paidCount, lowStock, unreadMessages, refunds, recent] = await Promise.all([
    countOrdersByStatus(),
    db.order.aggregate({ where: { status: { in: [...paidStatuses] }, paidAt: { gte: monthStart } }, _sum: { total: true } }),
    db.order.count({ where: { status: { in: [...paidStatuses] }, paidAt: { gte: monthStart } } }),
    db.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, stock: true, unit: true },
    }),
    db.contactMessage.count({ where: { isRead: false } }),
    listPaymentsNeedingRefund(),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true, shippingName: true },
    }),
  ]);

  return {
    byStatus,
    monthRevenue: toNumber(revenue._sum.total ?? BigInt(0)),
    monthPaidCount: paidCount,
    lowStock,
    unreadMessages,
    refunds,
    recent: recent.map((o) => ({ ...o, total: toNumber(o.total) })),
  };
}

/** Angka kecil untuk badge di menu admin. */
export async function getAdminNavCounts() {
  const db = getDb();
  const [toProcess, unread] = await Promise.all([
    db.order.count({ where: { status: "PAID" } }),
    db.contactMessage.count({ where: { isRead: false } }),
  ]);
  return { toProcess, unread };
}

// ------------------------------------------------------------------ pelanggan

export const ADMIN_CUSTOMERS_PER_PAGE = 20;

export async function listCustomers(opts: { q?: string; page: number }) {
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(opts.q
      ? { OR: [{ name: { contains: opts.q, mode: "insensitive" } }, { email: { contains: opts.q, mode: "insensitive" } }] }
      : {}),
  };
  const db = getDb();
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * ADMIN_CUSTOMERS_PER_PAGE,
      take: ADMIN_CUSTOMERS_PER_PAGE,
      select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
    }),
  ]);
  // Total belanja (pesanan yang sudah dibayar) untuk user di halaman ini saja.
  const spent = users.length
    ? await db.order.groupBy({
        by: ["userId"],
        where: { userId: { in: users.map((u) => u.id) }, status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
        _sum: { total: true },
      })
    : [];
  const spentBy = new Map(spent.map((s) => [s.userId, toNumber(s._sum.total ?? BigInt(0))]));
  return {
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
      orderCount: u._count.orders,
      totalSpent: spentBy.get(u.id) ?? 0,
    })),
    total,
    page: opts.page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_CUSTOMERS_PER_PAGE)),
  };
}

// ------------------------------------------------------------------ pesan kontak

export const ADMIN_MESSAGES_PER_PAGE = 20;

export async function listMessages(opts: { filter?: "unread"; page: number }) {
  const where: Prisma.ContactMessageWhereInput = opts.filter === "unread" ? { isRead: false } : {};
  const db = getDb();
  const [total, items] = await Promise.all([
    db.contactMessage.count({ where }),
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * ADMIN_MESSAGES_PER_PAGE,
      take: ADMIN_MESSAGES_PER_PAGE,
    }),
  ]);
  return { items, total, page: opts.page, totalPages: Math.max(1, Math.ceil(total / ADMIN_MESSAGES_PER_PAGE)) };
}

export async function setMessageRead(id: string, isRead: boolean) {
  await getDb().contactMessage.updateMany({ where: { id }, data: { isRead } });
}
