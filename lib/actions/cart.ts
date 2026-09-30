"use server";

// Server Actions keranjang. Semua input divalidasi & login dicek di server.
// Harga tidak pernah dikirim dari browser — hanya productId/itemId dan jumlah.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal";
import {
  CartError,
  MAX_QTY_PER_ITEM,
  addToCart,
  removeCartItem,
  updateCartItem,
} from "@/services/cart.service";
import type { CartActionResult } from "@/types/cart";

const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9]+$/i);
const qtySchema = z.coerce.number().int().min(1).max(MAX_QTY_PER_ITEM);

const UNAUTHENTICATED: CartActionResult = {
  ok: false,
  code: "UNAUTHENTICATED",
  message: "Silakan masuk terlebih dahulu.",
};
const INVALID: CartActionResult = { ok: false, code: "INVALID", message: "Data tidak valid." };

function handleError(error: unknown, context: string): CartActionResult {
  if (error instanceof CartError) return { ok: false, code: error.code, message: error.message };
  console.error(`[cart] ${context}:`, error);
  return { ok: false, code: "ERROR", message: "Terjadi kesalahan. Silakan coba lagi." };
}

/** Header (badge) & halaman keranjang ikut diperbarui setelah perubahan. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function addToCartAction(productId: unknown, quantity: unknown): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;

  const id = idSchema.safeParse(productId);
  const qty = qtySchema.safeParse(quantity);
  if (!id.success || !qty.success) return INVALID;

  try {
    const result = await addToCart(user.id, id.data, qty.data);
    refresh();
    return {
      ok: true,
      message: result.capped
        ? `Jumlah disesuaikan dengan stok. Di keranjang: ${result.quantity}.`
        : "Ditambahkan ke keranjang.",
    };
  } catch (error) {
    return handleError(error, "add");
  }
}

export async function updateCartItemAction(itemId: unknown, quantity: unknown): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;

  const id = idSchema.safeParse(itemId);
  const qty = qtySchema.safeParse(quantity);
  if (!id.success || !qty.success) return INVALID;

  try {
    await updateCartItem(user.id, id.data, qty.data);
    refresh();
    return { ok: true, message: "Jumlah diperbarui." };
  } catch (error) {
    return handleError(error, "update");
  }
}

export async function removeCartItemAction(itemId: unknown): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHENTICATED;

  const id = idSchema.safeParse(itemId);
  if (!id.success) return INVALID;

  try {
    await removeCartItem(user.id, id.data);
    refresh();
    return { ok: true, message: "Produk dihapus dari keranjang." };
  } catch (error) {
    return handleError(error, "remove");
  }
}
