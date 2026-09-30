import { z } from "zod";

/**
 * Validasi formulir kontak.
 * Dipakai DUA kali: di browser (umpan balik cepat) dan di server (wajib — data dari
 * browser tidak boleh dipercaya karena bisa dikirim langsung tanpa melewati form).
 */

// Nomor Indonesia: 08xx / +628xx / 628xx, boleh berisi spasi atau tanda hubung.
const phoneRegex = /^(\+62|62|0)[\s-]?8[0-9\s-]{7,14}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email wajib diisi.")
    .max(254, "Email terlalu panjang.")
    .pipe(z.email("Format email tidak valid.")),
  phone: z
    .string()
    .trim()
    .max(20, "Nomor telepon terlalu panjang.")
    .refine((v) => v === "" || phoneRegex.test(v), "Format nomor telepon tidak valid (contoh: 0812-3456-7890).")
    .optional()
    .transform((v) => (v ? v : undefined)),
  subject: z
    .string()
    .trim()
    .min(1, "Subjek wajib diisi.")
    .min(3, "Subjek minimal 3 karakter.")
    .max(150, "Subjek maksimal 150 karakter."),
  message: z
    .string()
    .trim()
    .min(1, "Pesan wajib diisi.")
    .min(10, "Pesan minimal 10 karakter.")
    .max(2000, "Pesan maksimal 2000 karakter."),
  /** Honeypot anti-spam: field tersembunyi yang harus kosong. Bot biasanya mengisinya. */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
export type ContactField = keyof ContactInput;
export type ContactFieldErrors = Partial<Record<ContactField, string>>;

/** Ubah error Zod menjadi { field: "pesan pertama" } agar mudah ditampilkan di form. */
export function toFieldErrors(error: z.ZodError): ContactFieldErrors {
  const result: ContactFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in result)) {
      result[field as ContactField] = issue.message;
    }
  }
  return result;
}
