"use server";

// Server Actions pembayaran. Browser hanya mengirim ID pesanan; nominal & status
// ditentukan server + gateway.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal";
import {
  PaymentError,
  simulateMockPayment,
  startPayment,
  syncLatestPayment,
  type MockOutcome,
} from "@/services/payment.service";

export type PaymentActionState = { error?: string; message?: string };

const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9]+$/i);
const referenceSchema = z.string().min(1).max(60).regex(/^[A-Z0-9-]+$/);

export async function startPaymentAction(orderId: string): Promise<PaymentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = idSchema.safeParse(orderId);
  if (!id.success) return { error: "Pesanan tidak valid." };

  let redirectUrl: string;
  try {
    ({ redirectUrl } = await startPayment(user.id, id.data));
  } catch (error) {
    if (error instanceof PaymentError) {
      if (error.code === "EXPIRED" || error.code === "NOT_PAYABLE") revalidatePath(`/account/orders/${id.data}`);
      return { error: error.message };
    }
    console.error("[payment] startPaymentAction:", error);
    return { error: "Pembayaran gagal disiapkan. Silakan coba lagi." };
  }
  redirect(redirectUrl); // ke halaman pembayaran gateway (atau halaman simulasi di localhost)
}

export async function refreshPaymentAction(orderId: string): Promise<PaymentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = idSchema.safeParse(orderId);
  if (!id.success) return { error: "Pesanan tidak valid." };

  await syncLatestPayment(user.id, id.data);
  revalidatePath("/", "layout");
  return { message: "Status pembayaran diperbarui." };
}

const outcomeSchema = z.enum(["PAID", "FAILED", "EXPIRED"]);

export async function simulateMockPaymentAction(reference: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ref = referenceSchema.safeParse(reference);
  const outcome = outcomeSchema.safeParse(formData.get("outcome"));
  if (!ref.success || !outcome.success) return;

  let orderId: string;
  try {
    orderId = await simulateMockPayment(user.id, ref.data, outcome.data as MockOutcome);
  } catch (error) {
    console.error("[payment] simulasi gagal:", error);
    return;
  }
  revalidatePath("/", "layout");
  redirect(`/account/orders/${orderId}?payment=return`);
}
