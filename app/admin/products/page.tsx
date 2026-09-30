import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SearchBar } from "@/components/admin/SearchBar";
import { ProductImage } from "@/components/product/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdmin } from "@/lib/dal";
import { formatNumber, formatRupiah } from "@/lib/utils/format";
import { adminListQuerySchema } from "@/lib/validations/admin";
import { LOW_STOCK, listAdminCategories, listAdminProducts } from "@/services/admin/catalog";

export const metadata: Metadata = { title: "Produk — Admin", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUS = { active: "Aktif", inactive: "Nonaktif", low: `Stok ≤ ${LOW_STOCK}` } as const;
type StatusKey = keyof typeof STATUS;

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin("/admin/products");
  const sp = await searchParams;
  const { q, page } = adminListQuerySchema.parse({ q: sp.q, page: sp.page });
  const status = typeof sp.status === "string" && sp.status in STATUS ? (sp.status as StatusKey) : undefined;
  const categories = await listAdminCategories();
  const category = typeof sp.category === "string" && categories.some((c) => c.id === sp.category) ? sp.category : undefined;
  const data = await listAdminProducts({ q, category, status, page });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Produk"
        description={`${formatNumber(data.total)} produk${q || status || category ? " cocok dengan filter" : ""}.`}
        actions={
          <Link href="/admin/products/new" className="inline-flex h-[42px] items-center gap-1.5 rounded-[10px] bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-soft">
            <Plus className="h-4 w-4" aria-hidden="true" /> Tambah Produk
          </Link>
        }
      />
      {sp.deleted === "1" && (
        <p role="status" className="mb-4 rounded-[12px] bg-green-50 px-4 py-3 text-[14px] text-green-800">Produk dihapus.</p>
      )}

      <SearchBar action="/admin/products" q={q} placeholder="Cari nama atau slug produk">
        <select name="category" defaultValue={category ?? ""} aria-label="Kategori" className="h-[44px] rounded-[12px] border border-neutral-300 bg-white px-3 text-[14px]">
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-[44px] rounded-[12px] border border-neutral-300 bg-white px-3 text-[14px]">
          <option value="">Semua status</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </SearchBar>

      <div className="relative overflow-x-auto rounded-[16px] border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[12px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Produk</th>
              <th scope="col" className="px-4 py-3 font-medium">Kategori</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Harga</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Stok</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">Tidak ada produk.</td>
              </tr>
            ) : (
              data.items.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <ProductImage src={p.image} alt={p.name} sizes="48px" className="h-12 w-12 shrink-0 rounded-[8px]" />
                      <span className="min-w-0">
                        <span className="block font-medium text-neutral-950 hover:text-brand hover:underline">{p.name}</span>
                        <span className="block truncate text-[12px] text-neutral-500">/{p.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{p.category.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-neutral-900">{formatRupiah(p.price)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right ${p.stock === 0 ? "font-medium text-red-700" : p.stock <= LOW_STOCK ? "text-amber-700" : "text-neutral-900"}`}>
                    {formatNumber(p.stock)} {p.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      {p.isFeatured && <Badge tone="accent">Unggulan</Badge>}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <Pagination page={data.page} totalPages={data.totalPages} hrefFor={href} />
      </div>
    </>
  );
}
