import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { CategoryRow } from "@/components/admin/CategoryRow";
import { requireAdmin } from "@/lib/dal";
import { listAdminCategories } from "@/services/admin/catalog";

export const metadata: Metadata = { title: "Kategori — Admin", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");
  const categories = await listAdminCategories();
  return (
    <>
      <AdminPageHeader title="Kategori" description="Kelompok produk di katalog. Urutan kecil tampil lebih dulu." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="h-fit rounded-[16px] border border-neutral-200 bg-white">
          {categories.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-neutral-500">Belum ada kategori.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {categories.map((c) => (
                <CategoryRow
                  key={`${c.id}-${c.name}-${c.slug}-${c.sortOrder}-${c.isActive}`}
                  category={{ ...c, productCount: c._count.products }}
                />
              ))}
            </ul>
          )}
        </section>
        <section className="h-fit rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-[16px] font-[450]">Tambah kategori</h2>
          <CategoryForm category={null} />
        </section>
      </div>
    </>
  );
}
