import "server-only";
import { getDb } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { AdminCategoryInput, AdminProductInput } from "@/lib/validations/admin";
import type { ProductSpec } from "@/types/product";

/** Produk & kategori untuk admin — termasuk yang nonaktif. */

export class CatalogError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export const ADMIN_PRODUCTS_PER_PAGE = 20;
export const LOW_STOCK = 10;

export type AdminProductFilter = { q?: string; category?: string; status?: "active" | "inactive" | "low"; page: number };

export async function listAdminProducts(f: AdminProductFilter) {
  const where: Prisma.ProductWhereInput = {
    ...(f.q ? { OR: [{ name: { contains: f.q, mode: "insensitive" } }, { slug: { contains: f.q, mode: "insensitive" } }] } : {}),
    ...(f.category ? { categoryId: f.category } : {}),
    ...(f.status === "active" ? { isActive: true } : f.status === "inactive" ? { isActive: false } : {}),
    ...(f.status === "low" ? { stock: { lte: LOW_STOCK } } : {}),
  };
  const db = getDb();
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (f.page - 1) * ADMIN_PRODUCTS_PER_PAGE,
      take: ADMIN_PRODUCTS_PER_PAGE,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        unit: true,
        image: true,
        isActive: true,
        isFeatured: true,
        category: { select: { name: true } },
      },
    }),
  ]);
  return { items, total, page: f.page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PER_PAGE)) };
}

function parseSpecs(value: Prisma.JsonValue | null): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) =>
    v && typeof v === "object" && !Array.isArray(v) && typeof v.label === "string" && typeof v.value === "string"
      ? [{ label: v.label, value: v.value }]
      : [],
  );
}

export async function getAdminProduct(id: string) {
  const p = await getDb().product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId,
    description: p.description,
    price: p.price,
    stock: p.stock,
    unit: p.unit,
    image: p.image,
    specifications: parseSpecs(p.specifications),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    orderCount: p._count.orderItems,
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

function uniqueError(error: unknown, field: string, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new CatalogError(message, field);
  throw error;
}

async function assertCategory(categoryId: string) {
  const c = await getDb().category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!c) throw new CatalogError("Kategori tidak ditemukan.", "categoryId");
}

function productData(input: AdminProductInput, image: string | null | undefined) {
  return {
    name: input.name,
    slug: input.slug,
    categoryId: input.categoryId,
    description: input.description,
    price: input.price,
    stock: input.stock,
    unit: input.unit,
    specifications: input.specifications as Prisma.InputJsonValue,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    ...(image !== undefined ? { image } : {}),
  };
}

export async function createProduct(input: AdminProductInput, image: string | null) {
  await assertCategory(input.categoryId);
  try {
    return await getDb().product.create({ data: productData(input, image), select: { id: true } });
  } catch (e) {
    uniqueError(e, "slug", "Slug sudah dipakai produk lain.");
  }
}

/** image: undefined = tidak berubah, null = hapus, string = foto baru. */
export async function updateProduct(id: string, input: AdminProductInput, image: string | null | undefined) {
  await assertCategory(input.categoryId);
  try {
    return await getDb().product.update({ where: { id }, data: productData(input, image), select: { id: true } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new CatalogError("Produk tidak ditemukan.");
    uniqueError(e, "slug", "Slug sudah dipakai produk lain.");
  }
}

/** Hapus permanen hanya bila belum pernah dipesan; bila sudah, sarankan nonaktifkan. */
export async function deleteProduct(id: string): Promise<{ image: string | null }> {
  const p = await getDb().product.findUnique({ where: { id }, select: { image: true, _count: { select: { orderItems: true } } } });
  if (!p) throw new CatalogError("Produk tidak ditemukan.");
  if (p._count.orderItems > 0) {
    throw new CatalogError("Produk ini sudah pernah dipesan sehingga tidak bisa dihapus. Nonaktifkan saja agar tidak tampil di katalog.");
  }
  await getDb().product.delete({ where: { id } });
  return { image: p.image };
}

// ------------------------------------------------------------------ kategori

export async function listAdminCategories() {
  return getDb().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, sortOrder: true, isActive: true, _count: { select: { products: true } } },
  });
}

export async function saveCategory(id: string | null, input: AdminCategoryInput) {
  try {
    if (id) {
      await getDb().category.update({ where: { id }, data: input });
    } else {
      await getDb().category.create({ data: input });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new CatalogError("Kategori tidak ditemukan.");
    uniqueError(e, "slug", "Slug sudah dipakai kategori lain.");
  }
}

export async function deleteCategory(id: string) {
  const c = await getDb().category.findUnique({ where: { id }, select: { _count: { select: { products: true } } } });
  if (!c) throw new CatalogError("Kategori tidak ditemukan.");
  if (c._count.products > 0) throw new CatalogError("Kategori masih berisi produk. Pindahkan atau hapus produknya dulu, atau nonaktifkan kategori.");
  await getDb().category.delete({ where: { id } });
}
