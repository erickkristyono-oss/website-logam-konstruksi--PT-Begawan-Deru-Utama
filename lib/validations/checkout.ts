import { z } from "zod";

const phoneRegex = /^(\+62|62|0)[\s-]?8[0-9\s-]{7,14}$/;

/**
 * Data checkout dari form. Sengaja HANYA data pengiriman —
 * daftar barang, harga, dan total tidak pernah diterima dari browser.
 */
export const checkoutSchema = z.object({
  name: z.string().trim().min(1, "Nama penerima wajib diisi.").min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
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
    .min(1, "Nomor telepon wajib diisi.")
    .max(20, "Nomor telepon terlalu panjang.")
    .regex(phoneRegex, "Format nomor telepon tidak valid (contoh: 0812-3456-7890)."),
  address: z.string().trim().min(1, "Alamat wajib diisi.").min(10, "Alamat terlalu singkat — sertakan nama jalan & nomor.").max(500, "Alamat maksimal 500 karakter."),
  city: z.string().trim().min(1, "Kota wajib diisi.").min(2, "Nama kota terlalu singkat.").max(100, "Nama kota terlalu panjang."),
  postalCode: z.string().trim().min(1, "Kode pos wajib diisi.").regex(/^\d{5}$/, "Kode pos harus 5 digit angka."),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter.")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type CheckoutInput = z.output<typeof checkoutSchema>;
