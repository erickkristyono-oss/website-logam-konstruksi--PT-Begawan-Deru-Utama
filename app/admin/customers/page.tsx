import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SearchBar } from "@/components/admin/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/utils/format";
import { adminListQuerySchema } from "@/lib/validations/admin";
import { listCustomers } from "@/services/admin/dashboard";

export const metadata: Metadata = { title: "Pelanggan — Admin", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireAdmin("/admin/customers");
  const sp = await searchParams;
  const { q, page } = adminListQuerySchema.parse({ q: sp.q, page: sp.page });
  const data = await listCustomers({ q, page });
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/customers${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader title="Pelanggan" description={`${formatNumber(data.total)} akun pelanggan terdaftar.`} />
      <SearchBar action="/admin/customers" q={q} placeholder="Cari nama atau email" />
      <div className="relative overflow-x-auto rounded-[16px] border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[12px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Pelanggan</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Pesanan</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Total belanja</th>
              <th scope="col" className="px-4 py-3 font-medium">Terdaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">Tidak ada pelanggan.</td>
              </tr>
            ) : (
              data.items.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-neutral-950">{u.name}</span>
                    <span className="block text-[12px] text-neutral-500">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.orderCount > 0 ? (
                      <Link href={`/admin/orders?q=${encodeURIComponent(u.email)}`} className="text-brand hover:underline">
                        {formatNumber(u.orderCount)}
                      </Link>
                    ) : (
                      <span className="text-neutral-500">0</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-neutral-900">{formatRupiah(u.totalSpent)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatDateTime(u.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-neutral-500">Total belanja = pesanan yang sudah dibayar (tidak termasuk yang dibatalkan).</p>
      <div className="mt-6">
        <Pagination page={data.page} totalPages={data.totalPages} hrefFor={href} />
      </div>
    </>
  );
}
