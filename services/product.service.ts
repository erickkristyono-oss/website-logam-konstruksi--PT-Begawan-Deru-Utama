import "server-only";
import { getDb } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { specificationsSchema, type ProductQuery } from "@/lib/validations/product";
import type { Paginated, ProductDetail, ProductListItem, ProductSpec } from "@/types/product";

/**
 * Semua query produk untuk publik HANYA mengembalikan produk aktif
 * di kategori yang aktif. Produk nonaktif tidak bisa dilihat / dibeli.
 */
const publicWhere: Prisma.ProductWhereInput = {
  isActive: true,
  category: { isActive: true },
};

const listSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  stock: true,
  unit: true,
  image: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export async function listProducts(query: ProductQuery): Promise<Paginated<ProductListItem>> {
  const { q, category, page, limit } = query;

  const where: Prisma.ProductWhereInput = {
    ...publicWhere,
    ...(category ? { category: { isActive: true, slug: category } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const db = getDb();
  const [items, total] = await db.$transaction([
    db.product.findMany({
      where,
      select: listSelect,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await getDb().product.findFirst({
    where: { ...publicWhere, slug },
    select: { ...listSelect, description: true, specifications: true, categoryId: true },
  });
  if (!product) return null;

  return { ...product, specifications: parseSpecifications(product.specifications) };
}

/** Produk unggulan untuk homepage; bila belum ada yang ditandai unggulan, tampilkan produk terbaru. */
export async function getFeaturedProducts(limit = 4): Promise<ProductListItem[]> {
  const db = getDb();
  const featured = await db.product.findMany({
    where: { ...publicWhere, isFeatured: true },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  if (featured.length > 0) return featured;

  return db.product.findMany({
    where: publicWhere,
    select: listSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4): Promise<ProductListItem[]> {
  return getDb().product.findMany({
    where: { ...publicWhere, categoryId, id: { not: excludeId } },
    select: listSelect,
    orderBy: { name: "asc" },
    take: limit,
  });
}

function parseSpecifications(value: Prisma.JsonValue | null): ProductSpec[] {
  const parsed = specificationsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
