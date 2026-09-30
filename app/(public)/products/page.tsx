import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, X } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { siteImages } from "@/lib/config/images";
import { ProductFilter, productsHref } from "@/components/product/ProductFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatNumber } from "@/lib/utils/format";
import { parseProductQuery } from "@/lib/validations/product";
import { listCategories } from "@/services/category.service";
import { listProducts } from "@/services/product.service";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { category, q } = parseProductQuery(await searchParams);
  const categories = category ? await listCategories().catch(() => []) : [];
  const categoryName = categories.find((c) => c.slug === category)?.name;

  return {
    title: categoryName ? `Produk ${categoryName}` : "Produk",
    description: categoryName
      ? `Katalog ${categoryName} untuk kebutuhan konstruksi.`
      : "Katalog material logam untuk kebutuhan konstruksi dan industri.",
    // Halaman hasil pencarian tidak perlu diindeks mesin pencari.
    robots: q ? { index: false, follow: true } : undefined,
    alternates: { canonical: category ? `/products?category=${category}` : "/products" },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = parseProductQuery(await searchParams);

  const [categories, result] = await Promise.all([listCategories(), listProducts(query)]);
  const activeCategory = categories.find((c) => c.slug === query.category);

  const hrefFor = (page: number) => {
    const base = productsHref({ q: query.q, category: query.category });
    if (page === 1) return base;
    return `${base}${base.includes("?") ? "&" : "?"}page=${page}`;
  };

  return (
    <>
      <PageHeader
        image={siteImages.productsHeader}
        eyebrow="Katalog"
        title={activeCategory ? activeCategory.name : "Produk"}
        description={activeCategory?.description ?? "Material logam untuk kebutuhan konstruksi dan industri."}
      />

      <section aria-labelledby="daftar-produk-heading" className="bg-surface py-12 sm:py-16">
        <Container>
          <h2 id="daftar-produk-heading" className="sr-only">
            Daftar produk
          </h2>
          <ProductFilter categories={categories} activeCategory={activeCategory?.slug} query={query.q} />

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-neutral-600" role="status">
            <span>
              {formatNumber(result.total)} produk
              {query.q && (
                <>
                  {" "}untuk <strong className="font-medium text-neutral-900">&ldquo;{query.q}&rdquo;</strong>
                </>
              )}
            </span>
            {query.q && (
              <Link
                href={productsHref({ category: activeCategory?.slug })}
                className="inline-flex items-center gap-1 rounded-sm text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline focus-visible:outline-2 focus-visible:outline-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Hapus pencarian
              </Link>
            )}
          </div>

          <div className="mt-4">
            {result.items.length > 0 ? (
              <ProductGrid products={result.items} />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Produk tidak ditemukan"
                description={
                  query.q
                    ? "Coba kata kunci lain atau lihat semua kategori."
                    : "Belum ada produk di kategori ini. Hubungi kami untuk menanyakan ketersediaan."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/products" variant="dark" size="md">
                      Lihat Semua Produk
                    </ButtonLink>
                    <ButtonLink href="/contact" variant="outline" size="md">
                      Hubungi Kami
                    </ButtonLink>
                  </div>
                }
              />
            )}
          </div>

          {result.page <= result.totalPages && (
            <div className="mt-10">
              <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
