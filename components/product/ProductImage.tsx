import { FadeImage } from "@/components/ui/FadeImage";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProductImageProps = {
  src: string | null;
  alt: string;
  /** Ukuran tampil untuk optimasi next/image (lihat atribut `sizes`). */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Gambar produk. Bila produk belum punya foto, tampilkan placeholder netral
 * (bukan foto stok) supaya tidak menyesatkan pembeli.
 */
export function ProductImage({ src, alt, sizes, priority, className }: ProductImageProps) {
  return (
    <div className={cn("relative overflow-hidden bg-neutral-100", className)}>
      {src ? (
        <FadeImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          // SVG (ilustrasi) sudah tajam di semua ukuran; tidak perlu dioptimasi next/image.
          unoptimized={src.endsWith(".svg")}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (foto belum tersedia)`}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#eef0f3,#e3e5ea)] text-neutral-500"
        >
          <Package className="h-10 w-10" strokeWidth={1.25} aria-hidden="true" />
          <span className="text-[12px] font-medium">Foto belum tersedia</span>
        </div>
      )}
    </div>
  );
}
