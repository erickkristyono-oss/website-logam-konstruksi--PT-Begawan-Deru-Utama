import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { staggerDelay } from "@/lib/config/motion";
import type { ProductListItem } from "@/types/product";

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <Reveal as="li" key={product.id} delay={staggerDelay(i)} className="flex">
          <ProductCard product={product} priority={i < 4} />
        </Reveal>
      ))}
    </ul>
  );
}
