import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkPendingIndicator } from "@/components/ui/LinkPendingIndicator";
import { cn } from "@/lib/utils/cn";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Membuat URL untuk nomor halaman tertentu. */
  hrefFor: (page: number) => string;
};

/** Nomor halaman yang ditampilkan: 1 … (p-1) p (p+1) … N */
function pageList(page: number, total: number): Array<number | "gap"> {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const base =
    "inline-flex h-[40px] min-w-[40px] items-center justify-center rounded-[10px] px-3 text-[14px] font-[450] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  return (
    <nav aria-label="Navigasi halaman" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(base, "border border-neutral-300 hover:border-ink")}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Halaman sebelumnya</span>
        </Link>
      ) : null}

      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-neutral-400" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(base, p === page ? "bg-ink text-white" : "border border-neutral-300 hover:border-ink")}
          >
            <span className="sr-only">Halaman </span>
            {p}
            <LinkPendingIndicator />
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(base, "border border-neutral-300 hover:border-ink")}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Halaman berikutnya</span>
        </Link>
      ) : null}
    </nav>
  );
}
