import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SearchBar } from "@/components/admin/SearchBar";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { ORDER_STATUS } from "@/lib/config/order-status";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/utils/format";
import { adminListQuerySchema } from "@/lib/validations/admin";
import { countOrdersByStatus, listAdminOrders } from "@/services/admin/order";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Pesanan — Admin", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS: (OrderStatus | "ALL")[] = ["ALL", "PAID", "PROCESSING", "SHIPPED", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"];

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin("/admin/orders");
  const sp = await searchParams;
  const { q, page } = adminListQuerySchema.parse({ q: sp.q, page: sp.page });
  const rawStatus = typeof sp.status === "string" ? sp.status : "";
  const status = rawStatus in ORDER_STATUS ? (rawStatus as OrderStatus) : undefined;

  const [data, counts] = await Promise.all([listAdminOrders({ status, q, page }), countOrdersByStatus()]);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);

  const href = (p: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (p.status) params.set("status", p.status);
    if (q) params.set("q", q);
    if (p.page && p.page > 1) params.set("page", String(p.page));
    const s = params.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader title="Pesanan" description={`${formatNumber(all)} pesanan total.`} />

      <div className="relative -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5">
          {TABS.map((t) => {
            const active = (t === "ALL" && !status) || t === status;
            const n = t === "ALL" ? all : counts[t];
            return (
              <Link
                key={t}
                href={href({ status: t === "ALL" ? undefined : t })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium",
                  active ? "border-ink bg-ink text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-ink",
                )}
              >
                {t === "ALL" ? "Semua" : ORDER_STATUS[t].label}
                <span className={active ? "text-white/70" : "text-neutral-500"}>{formatNumber(n)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <SearchBar action="/admin/orders" q={q} placeholder="Cari nomor pesanan, nama, atau email">
        {status && <input type="hidden" name="status" value={status} />}
      </SearchBar>

      <div className="relative overflow-x-auto rounded-[16px] border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[12px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Pesanan</th>
              <th scope="col" className="px-4 py-3 font-medium">Pelanggan</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
              <th scope="col" className="px-4 py-3 font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">Tidak ada pesanan yang cocok.</td>
              </tr>
            ) : (
              data.items.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium text-neutral-950 hover:text-brand hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="block text-[12px] text-neutral-500">{formatNumber(o.itemCount)} produk</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-neutral-900">{o.customerName}</span>
                    <span className="block text-[12px] text-neutral-500">{o.customerEmail}</span>
                  </td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-neutral-900">{formatRupiah(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination page={data.page} totalPages={data.totalPages} hrefFor={(p) => href({ status, page: p })} />
      </div>
    </>
  );
}
