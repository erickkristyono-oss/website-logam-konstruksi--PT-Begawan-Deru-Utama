import { Search } from "lucide-react";
import type { ReactNode } from "react";

/** Pencarian/filter lewat URL (?q=...) — form GET biasa, bekerja tanpa JavaScript. */
export function SearchBar({
  action,
  q,
  placeholder,
  children,
}: {
  action: string;
  q?: string;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} method="get" role="search" className="mb-4 flex flex-col gap-2 sm:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Cari</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          maxLength={100}
          className="h-[44px] w-full rounded-[12px] border border-neutral-300 bg-white pl-10 pr-3 text-[15px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </label>
      {children}
      <button type="submit" className="h-[44px] rounded-[12px] bg-ink px-5 text-[14px] font-medium text-white hover:bg-ink-soft">
        Cari
      </button>
    </form>
  );
}
