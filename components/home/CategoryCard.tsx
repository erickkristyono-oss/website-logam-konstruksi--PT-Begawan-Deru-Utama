import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Animate } from "@/components/ui/Animate";
import type { CategorySummary } from "@/types/product";

/**
 * Kartu kaca di sisi kanan hero.
 * Referensi menampilkan grafik "Revenue Growth"; di sini diganti daftar kategori
 * karena kita tidak boleh menampilkan angka bisnis yang belum diberikan.
 * Shell kartu (radius, padding, blur, warna) mengikuti spesifikasi referensi.
 */
export function CategoryCard({ categories }: { categories: CategorySummary[] }) {
  const shown = categories.slice(0, 6);

  return (
    <Animate delay={900} direction="scale" className="mx-auto w-full max-w-[405px] lg:mx-0">
      <div className="w-full rounded-[24px] bg-[rgba(17,16,15,0.35)] p-5 pb-5 backdrop-blur-[20px] sm:rounded-[33px] sm:p-8 sm:pb-6">
        <p className="mb-3 text-[16px] font-[450] leading-[20px] text-white sm:mb-4 sm:text-[20px]">
          Kategori Material
        </p>

        <div className="mb-6 flex items-center gap-[10px] sm:mb-8">
          <span className="rounded-[6px] bg-white/20 px-[6px] py-[7px] text-[12px] font-[450] leading-[14px] text-white sm:text-[14px]">
            Katalog
          </span>
          <span className="text-[12px] font-[450] leading-[14px] text-white/80 opacity-70 sm:text-[14px]">
            Pilih kategori untuk melihat produk
          </span>
        </div>

        {shown.length > 0 && (
        <ul className="border-t border-white/10">
          {shown.map((category, i) => (
            <li
              key={category.slug}
              className="animate-fade-left border-b border-white/10 opacity-0"
              style={{ animationDelay: `${1100 + i * 60}ms` }}
            >
              <Link
                href={`/products?category=${category.slug}`}
                className="group flex items-center justify-between py-3 text-[15px] font-[450] text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent sm:text-[16px]"
              >
                {category.name}
                <ChevronRight
                  className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
        )}

        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-2 rounded-sm text-[13px] font-[450] text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent sm:text-[14px]"
        >
          Lihat semua produk
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Animate>
  );
}
