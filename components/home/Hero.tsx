import { Animate } from "@/components/ui/Animate";
import { ButtonLink } from "@/components/ui/Button";
import { containerClasses } from "@/components/layout/Container";
import { HeroBackground } from "@/components/home/HeroBackground";
import { CategoryCard } from "@/components/home/CategoryCard";
import { cn } from "@/lib/utils/cn";
import type { CategorySummary } from "@/types/product";

/**
 * Hero homepage — layout, spacing, dan urutan animasi diadaptasi dari referensi "Apogee".
 * Konten diganti untuk bisnis material logam (tanpa klaim/angka yang belum diberikan).
 */
export function Hero({ categories }: { categories: CategorySummary[] }) {
  return (
    <section className="relative w-full min-h-[100svh] overflow-hidden bg-ink lg:h-screen lg:min-h-[640px]">
      <HeroBackground />

      <div className="relative z-10 flex h-full min-h-[100svh] flex-col pt-[72px] sm:pt-[82px] lg:min-h-0">
        <div className="flex flex-1 items-center py-8">
          <div
            className={cn(
              containerClasses,
              "flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12",
            )}
          >
            <div className="max-w-[593px]">
              <Animate delay={300} direction="up">
                <h1 className="mb-5 text-[36px] font-normal leading-[0.95] text-white sm:mb-8 sm:text-[52px] md:text-[64px] lg:text-[72px]">
                  Solusi Material Logam untuk Kebutuhan Konstruksi
                </h1>
              </Animate>

              <Animate delay={500} direction="up">
                <p className="mb-7 max-w-[370px] text-[16px] font-[450] leading-[1.3] text-white/80 sm:mb-10 sm:text-[18px] md:text-[20px]">
                  Menyediakan berbagai material logam untuk kebutuhan konstruksi dan industri.
                </p>
              </Animate>

              <Animate delay={700} direction="up">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <ButtonLink href="/products" variant="light" size="lg">
                    Lihat Produk
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="outline-light" size="lg">
                    Hubungi Kami
                  </ButtonLink>
                </div>
              </Animate>
            </div>

            <CategoryCard categories={categories} />
          </div>
        </div>
      </div>
    </section>
  );
}
