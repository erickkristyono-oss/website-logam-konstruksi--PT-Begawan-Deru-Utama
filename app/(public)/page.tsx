import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, ChevronRight, Headset, Package, ShieldCheck, Truck } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, siteConfig } from "@/lib/config/site";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeImage } from "@/components/ui/FadeImage";
import { Reveal } from "@/components/ui/Reveal";
import { staggerDelay } from "@/lib/config/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import { BackgroundPhoto } from "@/components/ui/Photo";
import { siteImages } from "@/lib/config/images";
import { categoryImage, usableImage } from "@/lib/site-images";
import { listCategories } from "@/services/category.service";
import { getFeaturedProducts } from "@/services/product.service";
import type { CategorySummary, ProductListItem } from "@/types/product";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Data produk & kategori selalu diambil terbaru dari database (bukan hasil build).
export const dynamic = "force-dynamic";

/** Homepage tetap tampil walau database bermasalah — section terkait menampilkan empty state. */
async function loadHomeData(): Promise<{ categories: CategorySummary[]; featured: ProductListItem[] }> {
  try {
    const [categories, featured] = await Promise.all([listCategories(), getFeaturedProducts(4)]);
    return { categories, featured };
  } catch (error) {
    console.error("[home] Gagal memuat data:", error);
    return { categories: [], featured: [] };
  }
}

// Value proposition generik (tanpa klaim sertifikasi/angka), sesuai brief.
const values = [
  {
    icon: ShieldCheck,
    title: "Kualitas Produk",
    text: "Material dipilih untuk kebutuhan pekerjaan konstruksi.",
  },
  {
    icon: BadgePercent,
    title: "Harga Kompetitif",
    text: "Harga transparan untuk kebutuhan proyek maupun eceran.",
  },
  {
    icon: Truck,
    title: "Pasokan Andal",
    text: "Membantu menjaga ketersediaan material untuk proyek Anda.",
  },
  {
    icon: Headset,
    title: "Layanan Profesional",
    text: "Tim kami siap membantu memilih material yang sesuai.",
  },
];

export default async function HomePage() {
  const { categories, featured } = await loadHomeData();
  const ctaPhoto = usableImage(siteImages.homeCta);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          { "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
        ]}
      />
      <Hero categories={categories} />

      {/* Kategori produk */}
      <section aria-labelledby="kategori-heading" className="bg-white py-20 sm:py-28">
        <Container>
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Kategori"
              id="kategori-heading"
              title="Kategori Produk"
              description="Temukan material logam sesuai kebutuhan proyek Anda."
            />
            <ButtonLink href="/products" variant="outline" size="md" className="self-start sm:self-auto">
              Semua Produk
            </ButtonLink>
          </Reveal>

          {categories.length > 0 && (
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
            {categories.map((c, i) => {
              const photo = categoryImage(c.slug);
              return (
                <Reveal as="li" key={c.slug} delay={staggerDelay(i, 6)}>
                  <Link
                    href={`/products?category=${c.slug}`}
                    className={
                      photo
                        ? "group relative flex h-full min-h-[160px] flex-col justify-between overflow-hidden rounded-[20px] bg-ink p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:min-h-[200px]"
                        : "group flex h-full min-h-[120px] flex-col justify-between rounded-[20px] border border-neutral-200 bg-surface p-5 transition-colors hover:border-ink hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:min-h-[150px]"
                    }
                  >
                    {photo && (
                      <>
                        <FadeImage
                          src={photo.src}
                          alt=""
                          fill
                          sizes="(min-width: 1280px) 200px, (min-width: 768px) 33vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ objectPosition: photo.position ?? "center" }}
                        />
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,25,0.75)_0%,rgba(8,10,25,0.25)_60%,rgba(8,10,25,0.6)_100%)]"
                        />
                      </>
                    )}
                    <span className="relative">
                      <span className={`block text-[16px] font-[450] sm:text-[18px] ${photo ? "text-white" : "text-neutral-900"}`}>
                        {c.name}
                      </span>
                      <span className={`mt-1 block text-[13px] ${photo ? "text-white/75" : "text-neutral-500"}`}>
                        {c.productCount} produk
                      </span>
                    </span>
                    <ChevronRight
                      className={`relative h-5 w-5 self-end transition-transform group-hover:translate-x-0.5 ${photo ? "text-white" : "text-neutral-400 group-hover:text-neutral-900"}`}
                      aria-hidden="true"
                    />
                  </Link>
                </Reveal>
              );
            })}
          </ul>
          )}
        </Container>
      </section>

      {/* Produk unggulan */}
      <section aria-labelledby="unggulan-heading" className="bg-surface py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Produk"
              id="unggulan-heading"
              title="Produk Unggulan"
              description="Pilihan material yang sering dibutuhkan untuk proyek konstruksi."
            />
          </Reveal>
          {featured.length > 0 ? (
            <div className="mt-12">
              <ProductGrid products={featured} />
            </div>
          ) : (
            <EmptyState
              className="mt-12"
              icon={Package}
              title="Katalog produk sedang disiapkan"
              description="Untuk informasi ketersediaan dan harga material, silakan hubungi tim kami."
              action={
                <ButtonLink href="/contact" variant="dark" size="md">
                  Hubungi Kami
                </ButtonLink>
              }
            />
          )}
        </Container>
      </section>

      {/* Mengapa memilih kami */}
      <section aria-labelledby="why-heading" className="bg-white py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading id="why-heading" eyebrow="Keunggulan" title="Mengapa Memilih Kami" align="center" />
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={staggerDelay(i)}
                className="rounded-[20px] border border-neutral-200 p-6 transition-[border-color,box-shadow] duration-300 hover:border-neutral-300 hover:shadow-[0_12px_32px_-16px_rgba(8,10,25,0.25)] sm:p-8"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-ink text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-[18px] font-[450] text-neutral-950">{title}</h3>
                <p className="mt-2 text-[15px] leading-[1.5] text-neutral-600">{text}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-white pb-20 sm:pb-28">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[24px] bg-ink px-6 py-14 sm:rounded-[33px] sm:px-12 sm:py-20">
            {ctaPhoto ? (
              <BackgroundPhoto image={ctaPhoto} sizes="(min-width: 1280px) 1200px, 100vw" />
            ) : (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_90%_at_100%_0%,rgba(168,42,178,0.22),transparent_70%)]"
              />
            )}
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="max-w-[620px] text-[28px] font-normal leading-[1.05] text-white sm:text-[40px]">
                Membutuhkan material untuk kebutuhan konstruksi?
              </h2>
              <ButtonLink href="/contact" variant="light" size="lg" className="self-start lg:self-auto">
                Hubungi Kami
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
