"use client";

// Client Component: jumlah yang dipilih disimpan di state browser.
// Harga final SELALU dihitung ulang di server; yang dikirim hanya productId + jumlah.

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatNumber, formatRupiah } from "@/lib/utils/format";

type PurchasePanelProps = {
  productId: string;
  productName: string;
  price: number;
  stock: number;
  unit: string;
};

export function PurchasePanel({ productId, productName, price, stock, unit }: PurchasePanelProps) {
  const outOfStock = stock <= 0;
  const [qty, setQty] = useState(1);

  const clamp = (n: number) => Math.min(Math.max(1, Math.floor(n) || 1), Math.max(1, stock));

  if (outOfStock) {
    return (
      <div className="rounded-[16px] border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-800">Stok habis</p>
        <p className="mt-1 text-[14px] text-red-700">
          Produk ini sedang tidak tersedia. Hubungi kami untuk informasi ketersediaan berikutnya.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <label htmlFor="qty" className="text-[14px] font-medium text-neutral-800">
            Jumlah ({unit})
          </label>
          <div className="mt-2 flex items-center">
            <button
              type="button"
              onClick={() => setQty((q) => clamp(q - 1))}
              disabled={qty <= 1}
              aria-label="Kurangi jumlah"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-l-[12px] border border-neutral-300 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              id="qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={stock}
              value={qty}
              onChange={(e) => setQty(clamp(Number(e.target.value)))}
              className="h-[44px] w-[72px] border-y border-neutral-300 text-center text-[16px] [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-ink/10 [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQty((q) => clamp(q + 1))}
              disabled={qty >= stock}
              aria-label="Tambah jumlah"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-r-[12px] border border-neutral-300 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-[13px] text-neutral-500">Maks. {formatNumber(stock)} {unit}</p>
        </div>

        <div className="text-right">
          <p className="text-[13px] text-neutral-500">Subtotal</p>
          <p className="text-[22px] font-semibold text-neutral-950" aria-live="polite">
            {formatRupiah(price * qty)}
          </p>
          <p className="text-[12px] text-neutral-500">Termasuk PPN</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AddToCartButton productId={productId} productName={productName} quantity={qty} />
        <AddToCartButton productId={productId} productName={productName} quantity={qty} buyNow variant="outline" />
      </div>
    </div>
  );
}
