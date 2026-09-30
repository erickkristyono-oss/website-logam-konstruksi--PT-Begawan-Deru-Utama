/**
 * Kerangka product card (Image, Category, Name, Price, Unit, tombol).
 * Dipakai sebagai loading state; ProductCard asli dibuat di Phase 3.
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-[20px] border border-neutral-200 bg-white"
    >
      <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="h-[42px] animate-pulse rounded-[11px] bg-neutral-100" />
          <div className="h-[42px] animate-pulse rounded-[11px] bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
