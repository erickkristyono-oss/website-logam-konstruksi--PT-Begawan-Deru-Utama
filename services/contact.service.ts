import "server-only";
import { getDb } from "@/lib/db";
import type { ContactData } from "@/lib/validations/contact";

/**
 * Business logic untuk pesan kontak.
 * Route handler hanya mengurus HTTP; penyimpanan data ada di sini
 * supaya bisa dipakai ulang (mis. oleh halaman admin di Phase 8).
 */
export async function createContactMessage(data: ContactData) {
  return getDb().contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject,
      message: data.message,
    },
    select: { id: true, createdAt: true },
  });
}
