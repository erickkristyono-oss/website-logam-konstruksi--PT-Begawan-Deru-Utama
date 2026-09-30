import { ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { TAX_NOTE } from "@/lib/config/pricing";
import { formatNumber, formatRupiah } from "@/lib/utils/format";
import type { CartView } from "@/types/cart";

/** Ringkasan keranjang. Semua angka berasal dari server (getCartView). */
export function CartSummary({ cart }: { cart: CartView }) {
  const canCheckout = !cart.hasIssues && cart.lines.length > 0;

  return (
    <aside aria-labelledby="summary-heading" className="h-fit rounded-[20px] border border-neutral-200 bg-white p-6 lg:sticky lg:top-8">
      <h2 id="summary-heading" className="text-[18px] font-[450] text-neutral-950">
        Ringkasan
      </h2>
      <dl className="mt-5 space-y-3 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Jumlah barang</dt>
          <dd className="text-neutral-900">{formatNumber(cart.totalQuantity)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Ongkos kirim</dt>
          <dd className="text-neutral-500">Dihitung saat checkout</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-[17px]">
          <dt className="font-medium text-neutral-950">Subtotal</dt>
          <dd className="font-semibold text-neutral-950">{formatRupiah(cart.subtotal)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        {canCheckout ? (
          <ButtonLink href="/checkout" variant="dark" size="lg" fullWidth>
            Lanjut ke Checkout
          </ButtonLink>
        ) : (
          <p role="status" className="rounded-[12px] bg-amber-50 p-3 text-[13px] text-amber-800">
            Perbaiki item yang ditandai sebelum melanjutkan ke checkout.
          </p>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-[12px] text-neutral-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {TAX_NOTE} Harga mengikuti harga terbaru dan dihitung ulang saat checkout.
      </p>
    </aside>
  );
}
