import { beforeEach, describe, expect, it } from "vitest";
import { createProduct, createUser, db, hasTestDb, putInCart, resetDb, shipping, stockOf } from "./helpers";
import { createOrder } from "@/services/order.service";
import { applyProviderUpdate, startPayment } from "@/services/payment.service";
import {
  advanceOrderStatus,
  cancelOrderByAdmin,
  listPaymentsNeedingRefund,
  markOrderPaidManually,
  markPaymentRefunded,
} from "@/services/admin/order";
import { createProduct as adminCreateProduct, deleteCategory, deleteProduct } from "@/services/admin/catalog";
import { CatalogError } from "@/services/admin/catalog";

async function paidOrder() {
  const [admin, user] = await Promise.all([createUser("ADMIN"), createUser()]);
  const p = await createProduct({ stock: 10, price: 50_000 });
  await putInCart(user.id, p.id, 2);
  const order = await createOrder(user.id, shipping);
  await markOrderPaidManually(admin.id, order.id, "Transfer BCA");
  return { admin, user, product: p, order };
}

describe.skipIf(!hasTestDb)("admin (database)", () => {
  beforeEach(resetDb);

  it("tandai lunas manual membuat catatan pembayaran & log", async () => {
    const { order } = await paidOrder();
    const o = await db().order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true, logs: true } });
    expect(o.status).toBe("PAID");
    expect(o.payments).toMatchObject([{ provider: "manual", status: "PAID", amount: BigInt(100_000) }]);
    expect(o.logs.map((l) => l.action)).toEqual(["MANUAL_PAYMENT"]);
  });

  it("status berjalan berurutan; status lama yang basi ditolak", async () => {
    const { admin, order } = await paidOrder();
    await advanceOrderStatus(admin.id, order.id, "PAID");
    await advanceOrderStatus(admin.id, order.id, "PROCESSING", "JNE 123");
    await expect(advanceOrderStatus(admin.id, order.id, "PROCESSING")).rejects.toThrow(/sudah berubah/);
    await advanceOrderStatus(admin.id, order.id, "SHIPPED");
    const o = await db().order.findUniqueOrThrow({ where: { id: order.id } });
    expect(o).toMatchObject({ status: "COMPLETED", trackingNumber: "JNE 123" });
    await expect(advanceOrderStatus(admin.id, order.id, "COMPLETED")).rejects.toThrow();
  });

  it("batal oleh admin setelah dibayar: stok kembali, masuk daftar refund, lalu ditandai", async () => {
    const { admin, product, order } = await paidOrder();
    expect(await stockOf(product.id)).toBe(8);
    await cancelOrderByAdmin(admin.id, order.id, "Stok fisik rusak");
    expect(await stockOf(product.id)).toBe(10);

    const due = await listPaymentsNeedingRefund();
    expect(due).toHaveLength(1);
    await markPaymentRefunded(admin.id, due[0]!.id);
    expect(await listPaymentsNeedingRefund()).toHaveLength(0);
    await expect(markPaymentRefunded(admin.id, due[0]!.id)).rejects.toThrow();
  });

  it("pembayaran ganda terdeteksi sebagai perlu refund", async () => {
    const user = await createUser();
    const p = await createProduct();
    await putInCart(user.id, p.id, 1);
    const order = await createOrder(user.id, shipping);
    await startPayment(user.id, order.id);
    const first = await db().payment.findFirstOrThrow({ where: { orderId: order.id } });
    await applyProviderUpdate({ reference: first.reference, status: "PAID", amount: first.amount, providerStatus: "settlement", raw: {} }, "webhook");
    const dup = await db().payment.create({
      data: { orderId: order.id, provider: "mock", reference: `${order.orderNumber}-X`, amount: first.amount, expiresAt: new Date() },
    });
    await applyProviderUpdate({ reference: dup.reference, status: "PAID", amount: dup.amount, providerStatus: "settlement", raw: {} }, "webhook");
    expect((await listPaymentsNeedingRefund()).map((r) => r.reference)).toEqual([dup.reference]);
  });

  it("produk yang pernah dipesan & kategori berisi produk tidak bisa dihapus", async () => {
    const { product } = await paidOrder();
    await expect(deleteProduct(product.id)).rejects.toBeInstanceOf(CatalogError);
    await expect(deleteCategory(product.categoryId)).rejects.toBeInstanceOf(CatalogError);
    const lonely = await createProduct();
    await expect(deleteProduct(lonely.id)).resolves.toMatchObject({ image: null });
  });

  it("slug produk yang sudah dipakai ditolak", async () => {
    const existing = await createProduct();
    const input = {
      name: "Lain",
      slug: existing.slug,
      categoryId: existing.categoryId,
      description: "Deskripsi produk yang cukup panjang.",
      price: 1000,
      stock: 1,
      unit: "kg",
      specifications: [],
      isActive: true,
      isFeatured: false,
      removeImage: false,
    };
    await expect(adminCreateProduct(input, null)).rejects.toMatchObject({ field: "slug" });
  });
});
