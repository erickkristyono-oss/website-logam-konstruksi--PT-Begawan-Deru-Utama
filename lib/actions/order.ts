"use server";

// Server Actions checkout & pesanan. Browser hanya mengirim data pengiriman;
// barang, harga, dan total dihitung di server dari keranjang & database.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal";
import { checkoutSchema } from "@/lib/validations/checkout";
import { OrderError, cancelOrderForUser, createOrder } from "@/services/order.service";

export type CheckoutFormState = {
  error?: string;
  /** true → error berasal dari isi keranjang; tampilkan link ke keranjang. */
  cartProblem?: boolean;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const FIELDS = ["name", "email", "phone", "address", "city", "postalCode", "notes"] as const;

export async function placeOrderAction(_prev: CheckoutFormState, formData: FormData): Promise<CheckoutFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Fcheckout");

  const values = Object.fromEntries(
    FIELDS.map((f) => {
      const v = formData.get(f);
      return [f, typeof v === "string" ? v : ""];
    }),
  ) as Record<(typeof FIELDS)[number], string>;

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }

  let order: { id: string; orderNumber: string };
  try {
    order = await createOrder(user.id, parsed.data);
  } catch (error) {
    if (error instanceof OrderError) {
      return { error: error.message, cartProblem: error.code !== "NOT_FOUND", values };
    }
    console.error("[checkout] Gagal membuat pesanan:", error);
    return { error: "Pesanan gagal dibuat. Silakan coba lagi.", values };
  }

  revalidatePath("/", "layout");
  redirect(`/account/orders/${order.id}?placed=1`);
}

export type CancelOrderState = { error?: string };

const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9]+$/i);

// Argumen ke-2 (state sebelumnya) dari useActionState tidak dipakai.
export async function cancelOrderAction(orderId: string): Promise<CancelOrderState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = idSchema.safeParse(orderId);
  if (!id.success) return { error: "Pesanan tidak valid." };

  try {
    await cancelOrderForUser(user.id, id.data);
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    console.error("[orders] Gagal membatalkan:", error);
    return { error: "Gagal membatalkan pesanan. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  return {};
}
