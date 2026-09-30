import "server-only";
import { getDb } from "@/lib/db";
import type { CategorySummary } from "@/types/product";

/** Kategori aktif, diurutkan sesuai sortOrder, beserta jumlah produk aktif di dalamnya. */
export async function listCategories(): Promise<CategorySummary[]> {
  const categories = await getDb().category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
}

export async function getCategoryBySlug(slug: string) {
  return getDb().category.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, description: true },
  });
}
