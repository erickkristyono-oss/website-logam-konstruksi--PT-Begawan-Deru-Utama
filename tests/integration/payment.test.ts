import { beforeEach, describe, expect, it } from "vitest";
import { createProduct, createUser, db, hasTestDb, putInCart, resetDb, shipping, stockOf } from "./helpers";
import { cancelOrderForUser, createOrder } from "@/services/order.service";
import { applyProviderUpdate, expireStaleOrders, startPayment } from "@/services/payment.service";
import type { ProviderPaymentUpdate } from "@/lib/payment";

async function newOrder(stock = 10, qty = 2, price = 100_000) {
  const user = await createUser();
  const p = await createProduct({ stock, price });
  await putInCart(user.id, p.id, qty);
  const order = await createOrder(user.id, shipping);
  return { user, product: p, order };
}

const paid = (reference: string, amount: number): ProviderPaymentUpdate => ({
  reference,
  status: "PAID",
  amount: BigInt(amount),
  providerStatus: "settlement",
  paymentType: "bank_transfer",
  raw: {},
});

describe.skipIf(!hasTestDb)("pembayaran (database)", () => {
  beforeEach(resetDb);

  it("klik Bayar berkali-kali/bersamaan hanya membuat satu tagihan", async () => {
    const { user, order } = await newOrder();
    const urls = await Promise.all(Array.from({ length: 5 }, () => startPayment(user.id, order.id)));
    expect(new Set(urls.map((u) => u.redirectUrl)).size).toBe(1);
    expect(await db().payment.count({ where: { orderId: order.id, status: "PENDING" } })).toBe(1);
  });

  it("notifikasi lunas diproses sekali walau datang berulang/bersamaan", async () => {
    const { user, order } = await newOrder();
    await startPayment(user.id, order.id);
    const pay = await db().payment.findFirstOrThrow({ where: { orderId: order.id } });

    const results = await Promise.all(Array.from({ length: 6 }, () => applyProviderUpdate(paid(pay.reference, 200_000), "webhook")));
    expect(results.filter((r) => r === "APPLIED")).toHaveLength(1);
    expect(results.filter((r) => r === "DUPLICATE")).toHaveLength(5);
    const o = await db().order.findUniqueOrThrow({ where: { id: order.id } });
    expect(o.status).toBe("PAID");
    expect(o.paidAt).not.toBeNull();
  });

  it("nominal tidak cocok & referensi tak dikenal tidak mengubah pesanan", async () => {
    const { user, order } = await newOrder();
    await startPayment(user.id, order.id);
    const pay = await db().payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(await applyProviderUpdate(paid(pay.reference, 1), "webhook")).toBe("AMOUNT_MISMATCH");
    expect(await applyProviderUpdate(paid("TIDAK-ADA-1", 200_000), "webhook")).toBe("UNKNOWN_REFERENCE");
    expect((await db().order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
    expect(await db().paymentEvent.count({ where: { applied: false } })).toBe(2);
  });

  it("gagal bayar → pesanan tetap menunggu & bisa dicoba lagi dengan tagihan baru", async () => {
    const { user, order } = await newOrder();
    const first = await startPayment(user.id, order.id);
    const pay = await db().payment.findFirstOrThrow({ where: { orderId: order.id } });
    await applyProviderUpdate({ ...paid(pay.reference, 200_000), status: "FAILED", providerStatus: "deny" }, "webhook");
    const second = await startPayment(user.id, order.id);
    expect(second.redirectUrl).not.toBe(first.redirectUrl);
    expect((await db().order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("pembayaran yang masuk setelah pesanan dibatalkan dicatat sebagai perlu refund", async () => {
    const { user, order } = await newOrder();
    await startPayment(user.id, order.id);
    const pay = await db().payment.findFirstOrThrow({ where: { orderId: order.id } });
    await cancelOrderForUser(user.id, order.id);
    expect(await applyProviderUpdate(paid(pay.reference, 200_000), "webhook")).toBe("APPLIED");
    expect((await db().order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect((await db().paymentEvent.findFirstOrThrow({ where: { reference: pay.reference, applied: true } })).note).toBe(
      "PAID_AFTER_CANCEL_NEEDS_REFUND",
    );
  });

  it("pesanan lewat 24 jam dibatalkan otomatis & stok kembali (sekali saja)", async () => {
    const { user, product, order } = await newOrder(10, 4);
    await startPayment(user.id, order.id);
    await db().order.update({ where: { id: order.id }, data: { createdAt: new Date(Date.now() - 25 * 3600_000) } });
    expect(await stockOf(product.id)).toBe(6);

    expect(await expireStaleOrders()).toBe(1);
    expect(await expireStaleOrders()).toBe(0);
    const o = await db().order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(o).toMatchObject({ status: "CANCELLED", cancelReason: "PAYMENT_EXPIRED" });
    expect(o.payments.every((p) => p.status === "EXPIRED")).toBe(true);
    expect(await stockOf(product.id)).toBe(10);
  });

  it("pesanan yang lewat batas tidak bisa dibayar lagi", async () => {
    const { user, order } = await newOrder();
    await db().order.update({ where: { id: order.id }, data: { createdAt: new Date(Date.now() - 25 * 3600_000) } });
    await expect(startPayment(user.id, order.id)).rejects.toMatchObject({ code: "EXPIRED" });
  });
});
