import { beforeEach, describe, expect, it } from "vitest";
import { createCategory, createProduct, createUser, db, hasTestDb, putInCart, resetDb, shipping, stockOf } from "./helpers";
import { cancelOrderForUser, createOrder, getOrderForUser, OrderError } from "@/services/order.service";
import { addToCart, CartError, getCartView } from "@/services/cart.service";

describe.skipIf(!hasTestDb)("keranjang & pesanan (database)", () => {
  beforeEach(resetDb);

  it("keranjang membatasi jumlah sesuai stok & menolak produk nonaktif", async () => {
    const user = await createUser();
    const p = await createProduct({ stock: 5 });
    const r = await addToCart(user.id, p.id, 99);
    expect(r).toMatchObject({ quantity: 5, capped: true });
    const off = await createProduct({ isActive: false });
    await expect(addToCart(user.id, off.id, 1)).rejects.toBeInstanceOf(CartError);
  });

  it("keranjang tidak menyimpan harga: perubahan harga langsung terlihat", async () => {
    const user = await createUser();
    const p = await createProduct({ price: 100_000 });
    await putInCart(user.id, p.id, 2);
    await db().product.update({ where: { id: p.id }, data: { price: 120_000 } });
    expect((await getCartView(user.id)).subtotal).toBe(240_000);
  });

  it("membuat pesanan: total dari server, stok berkurang, keranjang kosong, harga disalin", async () => {
    const user = await createUser();
    const a = await createProduct({ price: 350_000, stock: 45 });
    const b = await createProduct({ price: 25_000, stock: 300 });
    await putInCart(user.id, a.id, 3);
    await putInCart(user.id, b.id, 20);

    const order = await createOrder(user.id, shipping);
    expect(order.orderNumber).toMatch(/^BDU-\d{6}-[A-HJ-NP-Z2-9]{6}$/);

    const saved = await db().order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    expect(saved.total).toBe(BigInt(1_550_000));
    expect(saved.status).toBe("PENDING_PAYMENT");
    expect(await stockOf(a.id)).toBe(42);
    expect(await stockOf(b.id)).toBe(280);
    expect(await db().cartItem.count()).toBe(0);

    await db().product.update({ where: { id: a.id }, data: { price: 999_999 } });
    const detail = await getOrderForUser(user.id, order.id);
    expect(detail!.items.find((i) => i.productName === a.name)!.unitPrice).toBe(350_000);
  });

  it("menolak keranjang kosong, produk nonaktif, dan stok kurang", async () => {
    const user = await createUser();
    await expect(createOrder(user.id, shipping)).rejects.toMatchObject({ code: "CART_EMPTY" });

    const p = await createProduct({ stock: 2 });
    await putInCart(user.id, p.id, 2);
    await db().product.update({ where: { id: p.id }, data: { isActive: false } });
    await expect(createOrder(user.id, shipping)).rejects.toMatchObject({ code: "CART_INVALID" });
    expect(await db().order.count()).toBe(0);
    expect(await stockOf(p.id)).toBe(2);
  });

  it("produk di kategori nonaktif tidak bisa dipesan", async () => {
    const user = await createUser();
    const cat = await createCategory(false);
    const p = await createProduct({ categoryId: cat.id });
    await putInCart(user.id, p.id, 1);
    await expect(createOrder(user.id, shipping)).rejects.toBeInstanceOf(OrderError);
  });

  it("rebutan stok terakhir: dari 3 pembeli hanya 1 yang berhasil", async () => {
    const p = await createProduct({ stock: 5 });
    const buyers = await Promise.all([createUser(), createUser(), createUser()]);
    for (const u of buyers) await putInCart(u.id, p.id, 5);

    const results = await Promise.allSettled(buyers.map((u) => createOrder(u.id, shipping)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(p.id)).toBe(0);
    expect(await db().order.count()).toBe(1);
  });

  it("nilai pesanan besar (> Rp 2,1 miliar) tersimpan tepat", async () => {
    const user = await createUser();
    const p = await createProduct({ price: 1_250_000_000, stock: 5 });
    await putInCart(user.id, p.id, 2);
    const order = await createOrder(user.id, shipping);
    expect((await getOrderForUser(user.id, order.id))!.total).toBe(2_500_000_000);
  });

  it("pesanan orang lain tidak bisa dilihat atau dibatalkan", async () => {
    const [owner, other] = await Promise.all([createUser(), createUser()]);
    const p = await createProduct();
    await putInCart(owner.id, p.id, 1);
    const order = await createOrder(owner.id, shipping);
    expect(await getOrderForUser(other.id, order.id)).toBeNull();
    await expect(cancelOrderForUser(other.id, order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("pembatalan mengembalikan stok tepat sekali walau diklik bersamaan", async () => {
    const user = await createUser();
    const p = await createProduct({ stock: 5 });
    await putInCart(user.id, p.id, 5);
    const order = await createOrder(user.id, shipping);
    expect(await stockOf(p.id)).toBe(0);

    const results = await Promise.allSettled([cancelOrderForUser(user.id, order.id), cancelOrderForUser(user.id, order.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(p.id)).toBe(5);
    expect((await db().order.findUniqueOrThrow({ where: { id: order.id } })).cancelReason).toBe("CUSTOMER");
  });
});
