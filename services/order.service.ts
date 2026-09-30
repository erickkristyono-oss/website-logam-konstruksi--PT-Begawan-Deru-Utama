import "server-only";
import { randomInt } from "node:crypto";
import { getDb } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { paymentDeadline } from "@/lib/config/payment";
import { calculateShippingCost } from "@/lib/config/shipping";
import { getPaymentProvider } from "@/lib/payment";
import type { CheckoutInput } from "@/lib/validations/checkout";
import type { OrderDetail, OrderSummary } from "@/types/order";

/**
 * Business logic pesanan.
 *
 * Alur createOrder (SATU transaksi database — semua berhasil atau semua dibatalkan):
 *  1. ambil isi keranjang user + data produk TERKINI
 *  2. validasi produk aktif & stok cukup
 *  3. hitung subtotal/ongkir/total di server
 *  4. kurangi stok secara atomik (UPDATE … WHERE stock >= qty) → aman dari rebutan stok
 *  5. simpan pesanan + salinan item
 *  6. kosongkan keranjang
 */

export type OrderErrorCode = "CART_EMPTY" | "CART_INVALID" | "STOCK_CHANGED" | "NOT_FOUND" | "NOT_CANCELLABLE";

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** BigInt → number (aman sampai ± 9 kuadriliun Rupiah). */
export function toNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Nilai uang melebihi batas aman.");
  return Number(value);
}

/** Nomor pesanan mudah dibaca: BDU-260929-7K3QXM (tanpa huruf mirip seperti O/0, I/1). */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateOrderNumber(now = new Date()): string {
  // Tanggal menurut WIB (UTC+7), bukan UTC — pesanan jam 01.00 WIB tetap bertanggal hari itu.
  const date = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(2, 10).replace(/-/g, "");
  const random = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `BDU-${date}-${random}`;
}

export async function createOrder(userId: string, input: CheckoutInput): Promise<{ id: string; orderNumber: string }> {
  // Ulangi (maks. 3x) hanya bila nomor pesanan acak kebetulan bentrok.
  for (let attempt = 1; ; attempt++) {
    try {
      return await createOrderOnce(userId, input);
    } catch (error) {
      const isNumberClash =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        String(error.meta?.target ?? "").includes("orderNumber");
      if (!isNumberClash || attempt >= 3) throw error;
    }
  }
}

async function createOrderOnce(userId: string, input: CheckoutInput) {
  return getDb().$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({
      where: { cart: { userId } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            unit: true,
            price: true,
            stock: true,
            isActive: true,
            category: { select: { isActive: true } },
          },
        },
      },
    });

    if (items.length === 0) throw new OrderError("CART_EMPTY", "Keranjang Anda kosong.");

    const problems = items.filter(
      ({ product, quantity }) => !product.isActive || !product.category.isActive || product.stock < quantity,
    );
    if (problems.length > 0) {
      throw new OrderError(
        "CART_INVALID",
        `Beberapa produk tidak tersedia atau stoknya kurang: ${problems.map((p) => p.product.name).join(", ")}. Periksa keranjang Anda.`,
      );
    }

    // Semua perhitungan uang di server, dengan BigInt agar tidak meluap.
    const lines = items.map(({ product, quantity }) => ({
      product,
      quantity,
      lineTotal: BigInt(product.price) * BigInt(quantity),
    }));
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, BigInt(0));
    const shippingCost = BigInt(calculateShippingCost({ subtotal: toNumber(subtotal), city: input.city }));
    const total = subtotal + shippingCost;

    // Kurangi stok secara atomik. Bila pembeli lain lebih dulu mengambil stok, count = 0 → batal.
    for (const { product, quantity } of lines) {
      const { count } = await tx.product.updateMany({
        where: { id: product.id, isActive: true, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (count === 0) {
        throw new OrderError("STOCK_CHANGED", `Stok ${product.name} baru saja berubah. Periksa keranjang Anda.`);
      }
    }

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: "PENDING_PAYMENT",
        subtotal,
        shippingCost,
        total,
        shippingName: input.name,
        shippingEmail: input.email,
        shippingPhone: input.phone,
        shippingAddress: input.address,
        shippingCity: input.city,
        shippingPostalCode: input.postalCode,
        notes: input.notes ?? null,
        items: {
          create: lines.map(({ product, quantity, lineTotal }) => ({
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            unit: product.unit,
            unitPrice: product.price,
            quantity,
            lineTotal,
          })),
        },
      },
      select: { id: true, orderNumber: true },
    });

    await tx.cartItem.deleteMany({ where: { cart: { userId } } });
    return order;
  });
}

export async function listOrdersForUser(userId: string, take = 50): Promise<OrderSummary[]> {
  const orders = await getDb().order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
  return orders.map(({ _count, total, ...o }) => ({ ...o, total: toNumber(total), itemCount: _count.items }));
}

/** Detail pesanan — HANYA milik user tersebut (pesanan orang lain → null → 404). */
export async function getOrderForUser(userId: string, orderId: string): Promise<OrderDetail | null> {
  const order = await getDb().order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { select: { image: true, isActive: true, category: { select: { isActive: true } } } } },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, paymentType: true, paidAt: true, redirectUrl: true, expiresAt: true },
      },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: toNumber(order.subtotal),
    shippingCost: toNumber(order.shippingCost),
    total: toNumber(order.total),
    shipping: {
      name: order.shippingName,
      email: order.shippingEmail,
      phone: order.shippingPhone,
      address: order.shippingAddress,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
    },
    notes: order.notes,
    paidAt: order.paidAt,
    cancelReason: order.cancelReason,
    trackingNumber: order.trackingNumber,
    paymentDeadline: paymentDeadline(order.createdAt),
    latestPayment: order.payments[0]
      ? {
          status: order.payments[0].status,
          paymentType: order.payments[0].paymentType,
          paidAt: order.payments[0].paidAt,
          canResume:
            order.payments[0].status === "PENDING" &&
            !!order.payments[0].redirectUrl &&
            order.payments[0].expiresAt.getTime() > Date.now() + 60_000,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productSlug: item.productSlug,
      productAvailable: !!item.product && item.product.isActive && item.product.category.isActive,
      image: item.product?.image ?? null,
      unit: item.unit,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: toNumber(item.lineTotal),
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/** Kembalikan stok semua item pesanan (dipakai saat pesanan dibatalkan / kedaluwarsa). */
export async function restoreStockTx(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const items = await tx.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });
  for (const item of items) {
    await tx.product.update({ where: { id: item.productId! }, data: { stock: { increment: item.quantity } } });
  }
}

/**
 * Customer membatalkan pesanan yang BELUM dibayar. Stok dikembalikan.
 * Update bersyarat (status masih PENDING_PAYMENT) mencegah stok dikembalikan dua kali.
 * Percobaan pembayaran yang masih terbuka ikut dibatalkan (juga di gateway, best effort).
 */
export async function cancelOrderForUser(userId: string, orderId: string): Promise<void> {
  const pendingPayments = await getDb().$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, userId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED", cancelReason: "CUSTOMER" },
    });
    if (count === 0) {
      const exists = await tx.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
      throw exists
        ? new OrderError("NOT_CANCELLABLE", "Pesanan ini tidak dapat dibatalkan.")
        : new OrderError("NOT_FOUND", "Pesanan tidak ditemukan.");
    }

    await restoreStockTx(tx, orderId);

    const pending = await tx.payment.findMany({
      where: { orderId, status: "PENDING" },
      select: { reference: true, provider: true },
    });
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    return pending;
  });

  // Di luar transaksi: minta gateway menutup transaksi agar tidak bisa dibayar lagi.
  // Bila tetap terbayar (sangat jarang), webhook mencatatnya sebagai "perlu refund".
  for (const p of pendingPayments) {
    try {
      const provider = getPaymentProvider();
      if (provider.name === p.provider) await provider.cancelTransaction(p.reference);
    } catch (error) {
      console.warn("[orders] Gagal membatalkan transaksi di gateway:", p.reference, (error as Error).message);
    }
  }
}
