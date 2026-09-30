import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductImage } from "@/components/product/ProductImage";
import { StockBadge } from "@/components/product/StockBadge";
import { buttonClasses } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ProductListItem } from "@/types/product";

type ProductCardProps = { product: ProductListItem; priority?: boolean };

export function ProductCard({ product, priority }: ProductCardProps) {
  const href = `/products/${product.slug}`;

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-[20px] border border-neutral-200 bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(8,10,25,0.08)]">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.image}
          alt={product.name}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 420px) 50vw, 100vw"
          priority={priority}
          className="aspect-[4/3]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-accent-strong">{product.category.name}</p>
          <StockBadge stock={product.stock} unit={product.unit} />
        </div>

        <h3 className="mt-2 text-[17px] font-[450] leading-snug text-neutral-950">
          <Link
            href={href}
            className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-3 text-[18px] font-semibold text-neutral-950">
          {formatRupiah(product.price)}
          <span className="ml-1 text-[14px] font-normal text-neutral-500">/ {product.unit}</span>
        </p>

        <div className={cn("mt-auto grid gap-2 pt-5", product.stock > 0 && "grid-cols-[1fr_auto]")}>
          <Link href={href} className={cn(buttonClasses({ variant: "outline", size: "md", fullWidth: true }), "h-[42px]")}>
            Lihat Detail
          </Link>
          {product.stock > 0 && (
            <AddToCartButton productId={product.id} productName={product.name} display="icon" size="md" />
          )}
        </div>
      </div>
    </article>
  );
}
