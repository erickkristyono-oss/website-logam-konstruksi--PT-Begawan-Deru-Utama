import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PRODUCTS_PER_PAGE = 12;
export const MAX_PRODUCTS_PER_PAGE = 48;

/**
 * Query katalog produk (dari URL ?q=&category=&page=&limit=).
 * Nilai yang tidak valid TIDAK memunculkan error — cukup dikembalikan ke default,
 * supaya URL yang diketik/diubah pengguna tetap menampilkan halaman yang wajar.
 */
export const productQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined)
    .transform((v) => (v ? v : undefined)),
  category: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_REGEX)
    .max(80)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PRODUCTS_PER_PAGE).catch(PRODUCTS_PER_PAGE).default(PRODUCTS_PER_PAGE),
});

export type ProductQuery = z.output<typeof productQuerySchema>;

/** Ambil nilai pertama bila parameter URL muncul lebih dari sekali (?q=a&q=b). */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProductQuery(params: Record<string, string | string[] | undefined>): ProductQuery {
  return productQuerySchema.parse({
    q: first(params.q),
    category: first(params.category),
    page: first(params.page),
    limit: first(params.limit),
  });
}

export const slugSchema = z.string().trim().toLowerCase().max(120).regex(SLUG_REGEX);

/** Spesifikasi produk di kolom JSON — divalidasi saat dibaca agar data rusak tidak membuat halaman error. */
export const specificationsSchema = z
  .array(z.object({ label: z.string().min(1).max(60), value: z.string().min(1).max(200) }))
  .max(30);
