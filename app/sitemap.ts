import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { siteConfig } from "@/lib/config/site";

/** /sitemap.xml — halaman publik + semua produk & kategori aktif (dibaca dari database). */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/+$/, "");
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const db = getDb();
    const [products, categories] = await Promise.all([
      db.product.findMany({
        where: { isActive: true, category: { isActive: true } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticPages,
      ...categories.map((c) => ({
        url: `${base}/products?category=${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // Database bermasalah → tetap sajikan halaman statis.
    console.error("[sitemap] Gagal memuat produk:", error);
    return staticPages;
  }
}
