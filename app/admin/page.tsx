import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Banknote, Clock, Mail, PackageCheck, Truck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/utils/format";
import { getDashboardData } from "@/services/admin/dashboard";

export const metadata: Metadata = { title: "Dashboard Admin", robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const d = await getDashboardData();

  return (
    <>
      <AdminPageHeader title="Dashboard" description={`Halo, ${admin.name}. Ringkasan toko hari ini.`} />

      {(d.refunds.length > 0 || d.byStatus.PAID > 0) && (
        <section aria-labelledby="todo-heading" className="mb-6 rounded-[16px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h2 id="todo-heading" className="flex items-center gap-2 text-[15px] font-medium text-amber-900">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Perlu tindakan
          </h2>
          <ul className="mt-2 space-y-1.5 text-[14px] text-amber-900">
            {d.byStatus.PAID > 0 && (
              <li>
                <Link href="/admin/orders?status=PAID" className="underline underline-offset-4">
                  {formatNumber(d.byStatus.PAID)} pesanan sudah dibayar dan menunggu diproses
                </Link>
              </li>
            )}
            {d.refunds.map((r) => (
              <li key={r.id}>
                Refund {formatRupiah(r.amount)} untuk{" "}
                <Link href={`/admin/orders/${r.orderId}`} className="font-mono underline underline-offset-4">
                  {r.orderNumber}
                </Link>{" "}
                (pembayaran masuk untuk pesanan batal / ganda)
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Pendapatan bulan ini"
          value={formatRupiah(d.monthRevenue)}
          hint={`${formatNumber(d.monthPaidCount)} pesanan dibayar`}
        />
        <StatCard
          icon={PackageCheck}
          label="Perlu diproses"
          value={formatNumber(d.byStatus.PAID)}
          href="/admin/orders?status=PAID"
          highlight={d.byStatus.PAID > 0}
        />
        <StatCard icon={Truck} label="Sedang diproses / dikirim" value={formatNumber(d.byStatus.PROCESSING + d.byStatus.SHIPPED)} href="/admin/orders?status=PROCESSING" />
        <StatCard icon={Clock} label="Menunggu pembayaran" value={formatNumber(d.byStatus.PENDING_PAYMENT)} href="/admin/orders?status=PENDING_PAYMENT" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="recent-heading" className="rounded-[16px] border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
            <h2 id="recent-heading" className="text-[16px] font-[450] text-neutral-950">Pesanan terbaru</h2>
            <Link href="/admin/orders" className="text-[13px] text-brand hover:underline">Semua pesanan</Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-neutral-500">Belum ada pesanan.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {d.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-neutral-50 sm:px-5">
                    <span className="min-w-0">
                      <span className="block font-mono text-[14px] text-neutral-950">{o.orderNumber}</span>
                      <span className="block truncate text-[13px] text-neutral-500">
                        {o.shippingName} · {formatDateTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="text-[14px] font-medium text-neutral-900">{formatRupiah(o.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid h-fit gap-6">
          <section aria-labelledby="stock-heading" className="rounded-[16px] border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
              <h2 id="stock-heading" className="text-[16px] font-[450] text-neutral-950">Stok menipis</h2>
              <Link href="/admin/products?status=low" className="text-[13px] text-brand hover:underline">Lihat</Link>
            </div>
            {d.lowStock.length === 0 ? (
              <p className="px-5 py-6 text-[14px] text-neutral-500">Semua stok aman.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {d.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px] hover:bg-neutral-50 sm:px-5">
                      <span className="min-w-0 truncate text-neutral-900">{p.name}</span>
                      <span className={p.stock === 0 ? "shrink-0 font-medium text-red-700" : "shrink-0 text-amber-700"}>
                        {p.stock === 0 ? "Habis" : `${formatNumber(p.stock)} ${p.unit}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <StatCard icon={Mail} label="Pesan belum dibaca" value={formatNumber(d.unreadMessages)} href="/admin/messages?filter=unread" highlight={d.unreadMessages > 0} />
        </div>
      </div>
    </>
  );
}
