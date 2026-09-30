import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { LinkPendingIndicator } from "@/components/ui/LinkPendingIndicator";
import { cn } from "@/lib/utils/cn";
import type { CategorySummary } from "@/types/product";

type ProductFilterProps = {
  categories: CategorySummary[];
  activeCategory?: string;
  query?: string;
};

/** Bangun URL katalog dengan filter yang dipertahankan (halaman selalu kembali ke 1). */
export function productsHref({ q, category }: { q?: string; category?: string }): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

/**
 * Pencarian + filter kategori.
 * Memakai form GET dan link biasa → bekerja tanpa JavaScript, URL bisa dibagikan,
 * dan tombol Back browser tetap berfungsi.
 */
export function ProductFilter({ categories, activeCategory, query }: ProductFilterProps) {
  const chip =
    "inline-flex h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14px] font-[450] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  return (
    <div className="flex flex-col gap-4">
      <form action="/products" method="get" role="search" className="relative w-full sm:max-w-[420px]">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <label htmlFor="product-search" className="sr-only">
          Cari produk
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <Input
          id="product-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Cari produk, mis. pipa galvanis"
          maxLength={100}
          className="pl-11 pr-24"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 h-[36px] -translate-y-1/2 rounded-[9px] bg-ink px-4 text-[13px] font-[450] text-white transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Cari
        </button>
      </form>

      <nav aria-label="Filter kategori" className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        <ul className="flex gap-2 sm:flex-wrap">
          <li>
            <Link
              href={productsHref({ q: query })}
              aria-current={!activeCategory ? "page" : undefined}
              className={cn(
                chip,
                !activeCategory ? "bg-ink text-white" : "border border-neutral-300 bg-white text-neutral-700 hover:border-ink",
              )}
            >
              Semua
              <LinkPendingIndicator />
            </Link>
          </li>
          {categories.map((c) => {
            const active = c.slug === activeCategory;
            return (
              <li key={c.slug}>
                <Link
                  href={productsHref({ q: query, category: c.slug })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    chip,
                    active ? "bg-ink text-white" : "border border-neutral-300 bg-white text-neutral-700 hover:border-ink",
                  )}
                >
                  {c.name}
                  <span className={cn("text-[12px]", active ? "text-white/70" : "text-neutral-500")}>
                    {c.productCount}
                  </span>
                  <LinkPendingIndicator />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
