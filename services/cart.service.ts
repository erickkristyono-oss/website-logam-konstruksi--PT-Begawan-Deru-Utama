import "server-only";
import { getDb } from "@/lib/db";
import type { CartLine, CartView } from "@/types/cart";

/**
 * Business logic keranjang.
 *
 * Aturan keamanan:
 * - Keranjang tidak menyimpan harga. Harga & stok SELALU dibaca dari tabel Product saat dibutuhkan.
 * - Setiap operasi memeriksa kepemilikan: item hanya bisa diubah/dihapus oleh pemilik keranjang.
 * - Jumlah dibatasi 1 … stok (dan maks. MAX_QTY_PER_ITEM).
 */
export const MAX_QTY_PER_ITEM = 9999;

export type CartErrorCode = "PRODUCT_UNAVAILABLE" | "OUT_OF_STOCK" | "ITEM_NOT_FOUND" | "EXCEEDS_STOCK";

export class CartError extends Error {
  constructor(
    public code: CartErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Produk boleh dibeli bila aktif dan kategorinya aktif. */
async function getPurchasableProduct(productId: string) {
  return getDb().product.findFirst({
    where: { id: productId, isActive: true, category: { isActive: true } },
    select: { id: true, name: true, stock: true, unit: true },
  });
}

export type AddResult = { quantity: number; capped: boolean; productName: string };

export async function addToCart(userId: string, productId: string, quantity: number): Promise<AddResult> {
  const product = await getPurchasableProduct(productId);
  if (!product) throw new CartError("PRODUCT_UNAVAILABLE", "Produk tidak tersedia.");
  if (product.stock <= 0) throw new CartError("OUT_OF_STOCK", "Stok produk habis.");

  const maxQty = Math.min(product.stock, MAX_QTY_PER_ITEM);

  return getDb().$transaction(async (tx) => {
    const cart = await tx.cart.upsert({ where: { userId }, update: {}, create: { userId }, select: { id: true } });
    const existing = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      select: { quantity: true },
    });

    const current = existing?.quantity ?? 0;
    const target = Math.min(current + quantity, maxQty);
    const capped = current + quantity > maxQty;

    if (existing && target === current) {
      throw new CartError(
        "EXCEEDS_STOCK",
        `Jumlah di keranjang sudah mencapai stok tersedia (${maxQty} ${product.unit}).`,
      );
    }

    await tx.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: target },
      create: { cartId: cart.id, productId, quantity: target },
    });

    return { quantity: target, capped, productName: product.name };
  });
}

export async function updateCartItem(userId: string, itemId: string, quantity: number): Promise<void> {
  // Kepemilikan: item harus berada di keranjang milik user ini.
  const item = await getDb().cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    select: { id: true, productId: true },
  });
  if (!item) throw new CartError("ITEM_NOT_FOUND", "Item keranjang tidak ditemukan.");

  const product = await getPurchasableProduct(item.productId);
  if (!product) throw new CartError("PRODUCT_UNAVAILABLE", "Produk sudah tidak tersedia. Silakan hapus dari keranjang.");
  if (product.stock <= 0) throw new CartError("OUT_OF_STOCK", "Stok produk habis. Silakan hapus dari keranjang.");

  const maxQty = Math.min(product.stock, MAX_QTY_PER_ITEM);
  if (quantity > maxQty) {
    throw new CartError("EXCEEDS_STOCK", `Stok tersedia hanya ${maxQty} ${product.unit}.`);
  }

  await getDb().cartItem.update({ where: { id: item.id }, data: { quantity } });
}

export async function removeCartItem(userId: string, itemId: string): Promise<void> {
  const { count } = await getDb().cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
  if (count === 0) throw new CartError("ITEM_NOT_FOUND", "Item keranjang tidak ditemukan.");
}

/** Jumlah baris produk di keranjang (untuk badge di header). */
export async function getCartItemCount(userId: string): Promise<number> {
  return getDb().cartItem.count({ where: { cart: { userId } } });
}

/**
 * Isi keranjang dengan harga & stok TERKINI dari database.
 * Subtotal dihitung di server hanya dari baris yang valid.
 */
export async function getCartView(userId: string): Promise<CartView> {
  const items = await getDb().cartItem.findMany({
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
          price: true,
          stock: true,
          unit: true,
          image: true,
          isActive: true,
          category: { select: { name: true, isActive: true } },
        },
      },
    },
  });

  const lines: CartLine[] = items.map(({ id, quantity, product }) => {
    const available = product.isActive && product.category.isActive;
    const status: CartLine["status"] = !available
      ? "unavailable"
      : product.stock <= 0
        ? "out_of_stock"
        : quantity > product.stock
          ? "exceeds_stock"
          : "ok";

    return {
      itemId: id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      categoryName: product.category.name,
      unit: product.unit,
      unitPrice: product.price,
      stock: product.stock,
      quantity,
      lineTotal: product.price * quantity,
      status,
    };
  });

  const validLines = lines.filter((l) => l.status === "ok");
  return {
    lines,
    subtotal: validLines.reduce((sum, l) => sum + l.lineTotal, 0),
    totalQuantity: validLines.reduce((sum, l) => sum + l.quantity, 0),
    hasIssues: lines.some((l) => l.status !== "ok"),
  };
}
