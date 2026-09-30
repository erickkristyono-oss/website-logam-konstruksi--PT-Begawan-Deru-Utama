"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActionForm } from "@/components/admin/ActionForm";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Badge } from "@/components/ui/Badge";
import { deleteCategoryAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils/cn";

type Category = { id: string; name: string; slug: string; description: string | null; sortOrder: number; isActive: boolean; productCount: number };

export function CategoryRow({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-neutral-950">{category.name}</span>
            {!category.isActive && <Badge>Nonaktif</Badge>}
          </span>
          <span className="block text-[12px] text-neutral-500">
            /{category.slug} · {category.productCount} produk · urutan {category.sortOrder}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="mt-4 grid gap-4 border-t border-neutral-100 pt-4">
          <CategoryForm category={category} />
          {category.productCount === 0 ? (
            <ActionForm
              action={deleteCategoryAction.bind(null, category.id)}
              label="Hapus Kategori"
              tone="danger"
              confirm={`Hapus kategori "${category.name}"?`}
            />
          ) : (
            <p className="text-[12px] text-neutral-500">Kategori berisi produk tidak bisa dihapus — nonaktifkan bila tidak dipakai.</p>
          )}
        </div>
      )}
    </li>
  );
}
