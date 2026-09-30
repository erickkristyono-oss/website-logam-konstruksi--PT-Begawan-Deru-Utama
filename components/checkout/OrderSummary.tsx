import { TAX_NOTE } from "@/lib/config/pricing";
import { SHIPPING_NOTE } from "@/lib/config/shipping";
import { formatNumber, formatRupiah } from "@/lib/utils/format";

type SummaryLine = { key: string; name: string; unit: string; quantity: number; unitPrice: number; lineTotal: number };

type OrderSummaryProps = {
  lines: SummaryLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
  title?: string;
};

/** Ringkasan pesanan (checkout & detail pesanan). Semua angka dari server. */
export function OrderSummary({ lines, subtotal, shippingCost, total, title = "Ringkasan Pesanan" }: OrderSummaryProps) {
  return (
    <section aria-labelledby="order-summary-heading" className="h-fit rounded-[20px] border border-neutral-200 bg-white p-6">
      <h2 id="order-summary-heading" className="text-[18px] font-[450] text-neutral-950">
        {title}
      </h2>

      <ul className="mt-4 divide-y divide-neutral-100">
        {lines.map((l) => (
          <li key={l.key} className="flex items-start justify-between gap-4 py-3 text-[14px]">
            <div className="min-w-0">
              <p className="text-neutral-900">{l.name}</p>
              <p className="text-neutral-500">
                {formatNumber(l.quantity)} {l.unit} × {formatRupiah(l.unitPrice)}
              </p>
            </div>
            <p className="whitespace-nowrap font-medium text-neutral-900">{formatRupiah(l.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-2 space-y-2 border-t border-neutral-200 pt-4 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Subtotal</dt>
          <dd className="text-neutral-900">{formatRupiah(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-600">Ongkos kirim</dt>
          <dd className="text-right text-neutral-900">{shippingCost > 0 ? formatRupiah(shippingCost) : "Dikonfirmasi"}</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-[17px]">
          <dt className="font-medium text-neutral-950">Total</dt>
          <dd className="font-semibold text-neutral-950">{formatRupiah(total)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] text-neutral-500">
        {TAX_NOTE}
        {shippingCost === 0 && <> {SHIPPING_NOTE}</>}
      </p>
    </section>
  );
}
