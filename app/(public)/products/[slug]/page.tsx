import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImage } from "@/components/product/ProductImage";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { StockBadge } from "@/components/product/StockBadge";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config/site";
import { formatRupiah } from "@/lib/utils/format";
import { slugSchema } from "@/lib/validations/product";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";

type ProductPageProps = { params: Promise<{ slug: string }> };

/** cache(): generateMetadata dan halaman memakai hasil query yang sama (1x query per request). */
const loadProduct = cache(async (rawSlug: string) => {
  const slug = slugSchema.safeParse(rawSlug);
  return slug.success ? getProductBySlug(slug.data) : null;
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProduct((await params).slug);
  if (!product) return { title: "Produk tidak ditemukan", robots: { index: false } };

  const description = `${product.name} — ${formatRupiah(product.price)} per ${product.unit}. ${product.category.name} dari ${siteConfig.name}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      ...(product.image ? { images: [{ url: product.image, alt: product.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await loadProduct((await params).slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);

  const base = siteConfig.url.replace(/\/+$/, "");
  const url = `${base}/products/${product.slug}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            category: product.category.name,
            url,
            ...(product.image ? { image: product.image.startsWith("http") ? product.image : `${base}${product.image}` } : {}),
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "IDR",
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url,
              seller: { "@type": "Organization", name: siteConfig.name },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Beranda", item: `${base}/` },
              { "@type": "ListItem", position: 2, name: "Produk", item: `${base}/products` },
              { "@type": "ListItem", position: 3, name: product.category.name, item: `${base}/products?category=${product.category.slug}` },
              { "@type": "ListItem", position: 4, name: product.name, item: url },
            ],
          },
        ]}
      />
      {/* Pita gelap di bawah header kaca + breadcrumb */}
      <div className="bg-ink pb-6 pt-[100px] sm:pt-[118px]">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/60">
              {[
                { label: "Beranda", href: "/" },
                { label: "Produk", href: "/products" },
                { label: product.category.name, href: `/products?category=${product.category.slug}` },
              ].map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link href={crumb.href} className="rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-accent">
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </li>
              ))}
              <li aria-current="page" className="text-white/90">
                {product.name}
              </li>
            </ol>
          </nav>
        </Container>
      </div>

      <section className="bg-white py-10 sm:py-14">
        <Container className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductImage
            src={product.image}
            alt={product.name}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="aspect-[4/3] rounded-[24px] lg:sticky lg:top-8 lg:self-start"
          />

          <div>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-[13px] font-medium uppercase tracking-[0.1em] text-accent-strong hover:underline"
            >
              {product.category.name}
            </Link>
            <h1 className="mt-2 text-[30px] font-normal leading-[1.1] text-neutral-950 sm:text-[40px]">{product.name}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-[26px] font-semibold text-neutral-950 sm:text-[30px]">
                {formatRupiah(product.price)}
                <span className="ml-1 text-[16px] font-normal text-neutral-500">/ {product.unit}</span>
              </p>
              <StockBadge stock={product.stock} unit={product.unit} showCount />
            </div>

            <p className="mt-6 whitespace-pre-line text-[16px] leading-[1.7] text-neutral-700">{product.description}</p>

            <div className="mt-8">
              <PurchasePanel
                productId={product.id}
                productName={product.name}
                price={product.price}
                stock={product.stock}
                unit={product.unit}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px] text-neutral-600">
              <span>Butuh jumlah besar atau penawaran khusus?</span>
              <ButtonLink href="/contact" variant="outline" size="md" className="h-[40px] px-4">
                <Phone className="h-4 w-4" aria-hidden="true" /> Hubungi Kami
              </ButtonLink>
            </div>

            {product.specifications.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[20px] font-[450] text-neutral-950">Spesifikasi</h2>
                <dl className="mt-4 divide-y divide-neutral-200 rounded-[16px] border border-neutral-200">
                  {product.specifications.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3.5 text-[15px] sm:grid-cols-[180px_1fr]">
                      <dt className="text-neutral-500">{spec.label}</dt>
                      <dd className="text-neutral-900">{spec.value}</dd>
                    </div>
                  ))}
                  <div className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3.5 text-[15px] sm:grid-cols-[180px_1fr]">
                    <dt className="text-neutral-500">Satuan</dt>
                    <dd className="text-neutral-900">{product.unit}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="bg-surface py-14 sm:py-20">
          <Container>
            <h2 id="related-heading" className="text-[24px] font-normal text-neutral-950 sm:text-[30px]">
              Produk {product.category.name} lainnya
            </h2>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
