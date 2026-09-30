import { FadeImage } from "@/components/ui/FadeImage";
import type { SiteImage } from "@/lib/config/images";
import { cn } from "@/lib/utils/cn";

type ReadyImage = SiteImage & { src: string };

/**
 * Foto sebagai LATAR (hero, header halaman, kotak CTA) dengan lapisan gelap
 * agar teks putih di atasnya tetap terbaca. Parent harus `relative overflow-hidden`.
 */
export function BackgroundPhoto({
  image,
  priority = false,
  sizes = "100vw",
  /** "strong" untuk teks panjang (hero), "soft" untuk judul pendek. */
  overlay = "strong",
}: {
  image: ReadyImage;
  priority?: boolean;
  sizes?: string;
  overlay?: "strong" | "soft";
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <FadeImage
        src={image.src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={image.src.endsWith(".svg")}
        className="object-cover"
        style={{ objectPosition: image.position ?? "center" }}
      />
      <div
        className={cn(
          "absolute inset-0",
          overlay === "strong"
            ? "bg-[linear-gradient(90deg,rgba(8,10,25,0.92)_0%,rgba(8,10,25,0.75)_45%,rgba(8,10,25,0.45)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(8,10,25,0.55)_0%,rgba(8,10,25,0.85)_100%)]",
        )}
      />
    </div>
  );
}

/** Foto biasa di dalam konten (sudut membulat). Tinggi mengikuti `className` (mis. aspect-[4/3]). */
export function Photo({
  image,
  sizes,
  className,
  priority = false,
}: {
  image: ReadyImage;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-[20px] bg-neutral-200", className)}>
      <FadeImage
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={image.src.endsWith(".svg")}
        className="object-cover"
        style={{ objectPosition: image.position ?? "center" }}
      />
    </div>
  );
}
