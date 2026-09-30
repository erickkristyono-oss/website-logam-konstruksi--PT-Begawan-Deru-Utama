import { z } from "zod";

const phoneRegex = /^(\+62|62|0)[\s-]?8[0-9\s-]{7,14}$/;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi.")
  .max(254, "Email terlalu panjang.")
  .pipe(z.email("Format email tidak valid."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password wajib diisi.").max(128, "Password terlalu panjang."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi.").min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
    email,
    phone: z
      .string()
      .trim()
      .max(20, "Nomor telepon terlalu panjang.")
      .refine((v) => v === "" || phoneRegex.test(v), "Format nomor telepon tidak valid (contoh: 0812-3456-7890).")
      .optional()
      .transform((v) => (v ? v : undefined)),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(128, "Password maksimal 128 karakter.")
      .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), "Password harus berisi huruf dan angka."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.output<typeof registerSchema>;

/**
 * Hanya izinkan redirect ke path internal (mis. "/account").
 * Mencegah open-redirect seperti "https://situs-jahat.com" atau "//situs-jahat.com".
 */
export function safeCallbackUrl(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}
