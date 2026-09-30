"use server";

// Server Actions admin. SETIAP aksi memeriksa ulang role ADMIN dari database
// (jangan mengandalkan halaman/menu yang tersembunyi).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin } from "@/lib/dal";
import { deleteUploadedImage, saveProductImage, UploadError } from "@/lib/storage";
import { adminCategorySchema, adminProductSchema, idSchema } from "@/lib/validations/admin";
import {
  CatalogError,
  createProduct,
  deleteCategory,
  deleteProduct,
  getAdminProduct,
  saveCategory,
  updateProduct,
} from "@/services/admin/catalog";
import { setMessageRead } from "@/services/admin/dashboard";
import {
  AdminOrderError,
  advanceOrderStatus,
  cancelOrderByAdmin,
  markOrderPaidManually,
  markPaymentRefunded,
  updateOrderAdminFields,
} from "@/services/admin/order";
import type { OrderStatus } from "@/types/order";

export type AdminActionState = { error?: string; message?: string; fieldErrors?: Record<string, string> };

const DENIED: AdminActionState = { error: "Anda tidak memiliki akses admin." };
const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

function refreshAdmin(orderId?: string) {
  revalidatePath("/admin", "layout");
  if (orderId) revalidatePath(`/account/orders/${orderId}`);
}

function fail(error: unknown, known: (new (...a: never[]) => Error)[], context: string): AdminActionState {
  if (known.some((K) => error instanceof K)) return { error: (error as Error).message };
  console.error(`[admin] ${context}:`, error);
  return { error: "Terjadi kesalahan. Silakan coba lagi." };
}

// ------------------------------------------------------------------ pesanan

const STATUSES = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export async function advanceOrderAction(orderId: string, from: OrderStatus, _prev: AdminActionState, fd: FormData) {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(orderId).success || !z.enum(STATUSES).safeParse(from).success) return { error: "Data tidak valid." };
  const tracking = text(fd, "trackingNumber").slice(0, 60);
  try {
    await advanceOrderStatus(admin.id, orderId, from, tracking || undefined);
  } catch (e) {
    return fail(e, [AdminOrderError], "advanceOrder");
  }
  refreshAdmin(orderId);
  return { message: "Status pesanan diperbarui." };
}

export async function cancelOrderAdminAction(orderId: string, _prev: AdminActionState, fd: FormData) {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(orderId).success) return { error: "Data tidak valid." };
  const reason = text(fd, "reason").slice(0, 300);
  if (reason.length < 3) return { fieldErrors: { reason: "Tulis alasan pembatalan." } };
  try {
    await cancelOrderByAdmin(admin.id, orderId, reason);
  } catch (e) {
    return fail(e, [AdminOrderError], "cancelOrder");
  }
  refreshAdmin(orderId);
  return { message: "Pesanan dibatalkan dan stok dikembalikan." };
}

export async function markPaidManualAction(orderId: string, _prev: AdminActionState, fd: FormData) {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(orderId).success) return { error: "Data tidak valid." };
  const note = text(fd, "note").slice(0, 300);
  if (note.length < 3) return { fieldErrors: { note: "Tulis keterangan, mis. bank & tanggal transfer." } };
  try {
    await markOrderPaidManually(admin.id, orderId, note);
  } catch (e) {
    return fail(e, [AdminOrderError], "markPaidManual");
  }
  refreshAdmin(orderId);
  return { message: "Pesanan ditandai sudah dibayar." };
}

export async function saveOrderFieldsAction(orderId: string, _prev: AdminActionState, fd: FormData) {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(orderId).success) return { error: "Data tidak valid." };
  const trackingNumber = text(fd, "trackingNumber").slice(0, 60) || null;
  const adminNote = text(fd, "adminNote").slice(0, 2000) || null;
  try {
    await updateOrderAdminFields(admin.id, orderId, { trackingNumber, adminNote });
  } catch (e) {
    return fail(e, [AdminOrderError], "saveOrderFields");
  }
  refreshAdmin(orderId);
  return { message: "Tersimpan." };
}

export async function markRefundedAction(paymentId: string, orderId: string, _prev: AdminActionState, _fd: FormData) {
  void _fd;
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(paymentId).success) return { error: "Data tidak valid." };
  try {
    await markPaymentRefunded(admin.id, paymentId);
  } catch (e) {
    return fail(e, [AdminOrderError], "markRefunded");
  }
  refreshAdmin(orderId);
  return { message: "Ditandai sudah direfund." };
}

// ------------------------------------------------------------------ produk

export async function saveProductAction(productId: string | null, _prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (productId && !idSchema.safeParse(productId).success) return { error: "Data tidak valid." };

  const labels = fd.getAll("specLabel").map(String);
  const values = fd.getAll("specValue").map(String);
  const specifications = labels
    .map((label, i) => ({ label: label.trim(), value: (values[i] ?? "").trim() }))
    .filter((s) => s.label || s.value);

  const parsed = adminProductSchema.safeParse({
    name: text(fd, "name"),
    slug: text(fd, "slug"),
    categoryId: text(fd, "categoryId"),
    description: text(fd, "description"),
    price: text(fd, "price").replace(/[.\s]/g, ""),
    stock: text(fd, "stock").replace(/[.\s]/g, ""),
    unit: text(fd, "unit"),
    specifications,
    isActive: fd.get("isActive"),
    isFeatured: fd.get("isFeatured"),
    removeImage: fd.get("removeImage"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] === "specifications" ? "specifications" : String(issue.path[0]);
      fieldErrors[key] ??= key === "specifications" ? "Setiap spesifikasi perlu label dan nilai (maks. 30 baris)." : issue.message;
    }
    return { fieldErrors, error: "Periksa kembali isian yang ditandai." };
  }
  const input = parsed.data;

  const existing = productId ? await getAdminProduct(productId) : null;
  if (productId && !existing) return { error: "Produk tidak ditemukan." };

  // Foto: undefined = tidak berubah, null = dihapus, string = foto baru.
  let image: string | null | undefined = undefined;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      image = await saveProductImage(file, input.slug);
    } catch (e) {
      if (e instanceof UploadError) return { fieldErrors: { image: e.message }, error: "Foto gagal diunggah." };
      throw e;
    }
  } else if (input.removeImage) {
    image = null;
  }

  let id: string;
  try {
    if (existing) {
      await updateProduct(existing.id, input, image);
      id = existing.id;
    } else {
      id = (await createProduct(input, image ?? null))!.id;
    }
  } catch (e) {
    if (typeof image === "string") await deleteUploadedImage(image); // jangan tinggalkan file yatim
    if (e instanceof CatalogError) return { error: e.message, ...(e.field ? { fieldErrors: { [e.field]: e.message } } : {}) };
    console.error("[admin] saveProduct:", e);
    return { error: "Produk gagal disimpan. Silakan coba lagi." };
  }

  // Foto lama yang diganti/dihapus dibersihkan (hanya file upload, bukan ilustrasi bawaan).
  if (existing && image !== undefined && existing.image !== image) await deleteUploadedImage(existing.image);

  revalidatePath("/", "layout");
  redirect(`/admin/products/${id}?saved=1`);
}

export async function deleteProductAction(productId: string, _prev: AdminActionState, _fd: FormData): Promise<AdminActionState> {
  void _fd;
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(productId).success) return { error: "Data tidak valid." };
  try {
    const { image } = await deleteProduct(productId);
    await deleteUploadedImage(image);
  } catch (e) {
    return fail(e, [CatalogError], "deleteProduct");
  }
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}

// ------------------------------------------------------------------ kategori

export async function saveCategoryAction(categoryId: string | null, _prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (categoryId && !idSchema.safeParse(categoryId).success) return { error: "Data tidak valid." };
  const parsed = adminCategorySchema.safeParse({
    name: text(fd, "name"),
    slug: text(fd, "slug"),
    description: text(fd, "description"),
    sortOrder: text(fd, "sortOrder") || "0",
    isActive: fd.get("isActive"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  try {
    await saveCategory(categoryId, parsed.data);
  } catch (e) {
    if (e instanceof CatalogError) return { error: e.message, ...(e.field ? { fieldErrors: { [e.field]: e.message } } : {}) };
    console.error("[admin] saveCategory:", e);
    return { error: "Kategori gagal disimpan." };
  }
  revalidatePath("/", "layout");
  return { message: categoryId ? "Kategori diperbarui." : "Kategori ditambahkan." };
}

export async function deleteCategoryAction(categoryId: string, _prev: AdminActionState, _fd: FormData): Promise<AdminActionState> {
  void _fd;
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (!idSchema.safeParse(categoryId).success) return { error: "Data tidak valid." };
  try {
    await deleteCategory(categoryId);
  } catch (e) {
    return fail(e, [CatalogError], "deleteCategory");
  }
  revalidatePath("/", "layout");
  return { message: "Kategori dihapus." };
}

// ------------------------------------------------------------------ pesan

export async function setMessageReadAction(messageId: string, isRead: boolean): Promise<void> {
  const admin = await getAdmin();
  if (!admin || !idSchema.safeParse(messageId).success) return;
  await setMessageRead(messageId, isRead);
  revalidatePath("/admin", "layout");
}
