import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { siteImages } from "@/lib/config/images";
import { usableImage } from "@/lib/site-images";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { staggerDelay } from "@/lib/config/motion";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listCategories } from "@/services/category.service";
import type { CategorySummary } from "@/types/product";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "Tentang Kami",
  description: `Profil ${siteConfig.name} — ${siteConfig.businessField}.`,
};

const companyInfo: Array<{ label: string; value: string; href?: string }> = [
  { label: "Nama Perusahaan", value: siteConfig.name },
  { label: "Bidang Usaha", value: siteConfig.businessField },
  { label: "Alamat", value: siteConfig.address },
  { label: "Telepon", value: siteConfig.phone.display, href: siteConfig.phone.href },
  { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
];

// Daftar material diambil dari database (selalu terbaru).
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const categories: CategorySummary[] = await listCategories().catch((error: unknown) => {
    console.error("[about] Gagal memuat kategori:", error);
    return [];
  });

  const profilePhoto = usableImage(siteImages.aboutProfile);
  const bannerPhoto = usableImage(siteImages.aboutBanner);

  return (
    <>
      <PageHeader
        image={siteImages.aboutHeader}
        eyebrow="Tentang Kami"
        title={siteConfig.name}
        description={siteConfig.businessField}
      />

      {/* Profil — teks masih placeholder sampai data dari perusahaan tersedia */}
      <section aria-labelledby="profil-heading" className="bg-white py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="flex flex-col gap-10">
            <SectionHeading id="profil-heading" eyebrow="Profil" title="Profil Perusahaan" />
            {profilePhoto && (
              <Photo image={profilePhoto} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3]" />
            )}
          </Reveal>
          <Reveal delay={120} className="space-y-5 text-[16px] leading-[1.7] text-neutral-700 sm:text-[17px]">
            <p>
              {siteConfig.name} bergerak di bidang {siteConfig.businessField.toLowerCase()}, melayani
              kebutuhan material logam untuk konstruksi dan industri.
            </p>
            <p className="text-neutral-500">COMPANY_PROFILE — deskripsi lengkap perusahaan akan ditambahkan.</p>
          </Reveal>
        </Container>
      </section>

      {/* Foto lebar (opsional) */}
      {bannerPhoto && (
        <section aria-label="Foto perusahaan" className="bg-white pb-20 sm:pb-28">
          <Container>
            <Reveal>
              <Photo
                image={bannerPhoto}
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="aspect-[4/3] sm:aspect-[21/9] sm:rounded-[28px]"
              />
            </Reveal>
          </Container>
        </section>
      )}

      {/* Informasi perusahaan */}
      <section aria-labelledby="info-heading" className="bg-surface py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal>
            <SectionHeading
              id="info-heading"
              eyebrow="Informasi"
              title="Data Perusahaan"
              description="Hubungi kami melalui kontak berikut untuk pertanyaan dan permintaan penawaran."
            />
          </Reveal>
          <Reveal delay={120} className="rounded-[20px] border border-neutral-200 bg-white">
            <dl className="divide-y divide-neutral-200">
              {companyInfo.map((item) => (
                <div key={item.label} className="grid gap-1 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6 sm:px-8">
                  <dt className="text-[14px] text-neutral-500">{item.label}</dt>
                  <dd className="break-words text-[15px] text-neutral-900 sm:text-[16px]">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="rounded-sm underline-offset-4 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      {/* Material yang disediakan (disembunyikan bila data kategori tidak tersedia) */}
      {categories.length > 0 && (
      <section aria-labelledby="material-heading" className="bg-white py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading id="material-heading" eyebrow="Produk" title="Material yang Kami Sediakan" />
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={staggerDelay(i, 3)}>
                <Link
                  href={`/products?category=${c.slug}`}
                  className="group flex items-center justify-between rounded-[16px] border border-neutral-200 px-5 py-4 text-[15px] font-[450] text-neutral-900 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:text-[16px]"
                >
                  {c.name}
                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900" aria-hidden="true" />
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
      )}

      {/* Visi & misi — placeholder */}
      <section className="bg-surface py-20 sm:py-28">
        <Container className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <Card className="h-full">
              <h2 className="text-[22px] font-[450] text-neutral-950">Visi</h2>
              <p className="mt-3 text-neutral-500">COMPANY_VISION</p>
            </Card>
          </Reveal>
          <Reveal delay={120}>
            <Card className="h-full">
              <h2 className="text-[22px] font-[450] text-neutral-950">Misi</h2>
              <p className="mt-3 text-neutral-500">COMPANY_MISSION</p>
            </Card>
          </Reveal>
        </Container>
      </section>

      <section className="bg-white py-20 text-center sm:py-24">
        <Container>
          <Reveal>
            <h2 className="text-[26px] font-normal text-neutral-950 sm:text-[34px]">Ada pertanyaan tentang material?</h2>
            <ButtonLink href="/contact" variant="dark" size="lg" className="mt-8">
              Hubungi Kami
            </ButtonLink>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
