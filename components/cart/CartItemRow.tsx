"use client";

// Satu baris keranjang: ubah jumlah & hapus lewat Server Action.
// Server memvalidasi ulang kepemilikan item, status produk, dan stok.

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { removeCartItemAction, updateCartItemAction } from "@/lib/actions/cart";
import { formatNumber, formatRupiah } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CartLine } from "@/types/cart";

const STATUS_MESSAGE: Record<Exclude<CartLine["status"], "ok">, (l: CartLine) => string> = {
  unavailable: () => "Produk ini sudah tidak tersedia. Hapus dari keranjang untuk melanjutkan.",
  out_of_stock: () => "Stok habis. Hapus dari keranjang untuk melanjutkan.",
  exceeds_stock: (l) => `Stok tersisa ${formatNumber(l.stock)} ${l.unit}. Kurangi jumlah untuk melanjutkan.`,
};

export function CartItemRow({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(line.quantity);
  const [error, setError] = useState<string | null>(null);

  const editable = line.status === "ok" || line.status === "exceeds_stock";
  const maxQty = Math.max(1, line.stock);

  function commit(next: number) {
    const value = Math.floor(next);
    if (!Number.isFinite(value) || value < 1 || value === line.quantity) {
      setQty(line.quantity);
      return;
    }
    setError(null);
    setQty(value);
    startTransition(async () => {
      const result = await updateCartItemAction(line.itemId, value);
      if (!result.ok) {
        setError(result.message);
        setQty(line.quantity);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction(line.itemId);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <li className={cn("flex gap-4 py-5 sm:gap-5", pending && "opacity-60")} aria-busy={pending}>
      <Link href={`/products/${line.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <ProductImage src={line.image} alt={line.name} sizes="120px" className="h-[84px] w-[84px] rounded-[14px] sm:h-[104px] sm:w-[104px]" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-accent-strong">{line.categoryName}</p>
          <Link href={`/products/${line.slug}`} className="mt-1 block text-[16px] font-[450] text-neutral-950 hover:underline">
            {line.name}
          </Link>
          <p className="mt-1 text-[14px] text-neutral-600">
            {formatRupiah(line.unitPrice)} / {line.unit}
          </p>

          {line.status !== "ok" && (
            <p className="mt-2 flex items-start gap-1.5 text-[13px] text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {STATUS_MESSAGE[line.status](line)}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 sm:flex-col sm:flex-nowrap sm:items-end">
          {editable ? (
            <div className="flex items-center" role="group" aria-label={`Jumlah ${line.name}`}>
              <button
                type="button"
                onClick={() => commit(qty - 1)}
                disabled={pending || qty <= 1}
                aria-label="Kurangi jumlah"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-l-[10px] border border-neutral-300 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={maxQty}
                value={qty}
                aria-label={`Jumlah ${line.name}`}
                disabled={pending}
                onChange={(e) => setQty(Number(e.target.value))}
                onBlur={() => commit(qty)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(qty);
                }}
                className="h-[38px] w-[64px] border-y border-neutral-300 text-center text-[15px] [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-ink/10 [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => commit(qty + 1)}
                disabled={pending || qty >= maxQty}
                aria-label="Tambah jumlah"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-r-[10px] border border-neutral-300 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <span className="text-[14px] text-neutral-500">Jumlah: {line.quantity}</span>
          )}

          <div className="flex flex-col items-end gap-1 sm:gap-2">
            <p className={cn("whitespace-nowrap text-[16px] font-semibold", line.status === "ok" ? "text-neutral-950" : "text-neutral-500 line-through")}>
              {formatRupiah(line.lineTotal)}
            </p>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-sm text-[13px] text-neutral-500 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-ink"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
              Hapus
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
