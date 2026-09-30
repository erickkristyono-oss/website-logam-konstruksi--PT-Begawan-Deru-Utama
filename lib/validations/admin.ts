import { z } from "zod";
import { SLUG_REGEX } from "@/lib/validations/product";

/** "Besi Beton 10 mm" → "besi-beton-10-mm" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const bool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : null));

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(80, "Slug maksimal 80 karakter.")
  .refine((v) => v === "" || SLUG_REGEX.test(v), "Slug hanya huruf kecil, angka, dan tanda hubung (mis. besi-beton-10mm).");

export const specSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export const adminProductSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(150),
    slug: slugField,
    categoryId: z.string().min(1, "Pilih kategori."),
    description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(5000),
    price: z.coerce
      .number({ error: "Harga harus angka." })
      .int("Harga tanpa desimal (Rupiah utuh).")
      .min(1, "Harga minimal Rp 1.")
      .max(2_000_000_000, "Harga terlalu besar."),
    stock: z.coerce.number({ error: "Stok harus angka." }).int("Stok harus bilangan bulat.").min(0, "Stok tidak boleh negatif.").max(10_000_000),
    unit: z.string().trim().min(1, "Isi satuan (mis. batang, lembar, kg).").max(30),
    specifications: z.array(specSchema).max(30, "Maksimal 30 spesifikasi."),
    isActive: bool,
    isFeatured: bool,
    removeImage: bool,
  })
  .transform((v) => ({ ...v, slug: v.slug || slugify(v.name) }));

export type AdminProductInput = z.output<typeof adminProductSchema>;

export const adminCategorySchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80),
    slug: slugField,
    description: optionalText(300),
    sortOrder: z.coerce.number().int().min(0).max(9999).catch(0),
    isActive: bool,
  })
  .transform((v) => ({ ...v, slug: v.slug || slugify(v.name) }));

export type AdminCategoryInput = z.output<typeof adminCategorySchema>;

export const adminListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined).transform((v) => v || undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9]+$/i);
