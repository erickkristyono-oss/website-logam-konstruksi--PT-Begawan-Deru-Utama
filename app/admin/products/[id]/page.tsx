import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { deleteProductAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/dal";
import { formatNumber } from "@/lib/utils/format";
import { getAdminProduct, listAdminCategories } from "@/services/admin/catalog";

export const metadata: Metadata = { title: "Edit Produk — Admin", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  await requireAdmin(`/admin/products/${encodeURIComponent(id)}`);
  const product = /^[a-z0-9]{1,64}$/i.test(id) ? await getAdminProduct(id) : null;
  if (!product) notFound();
  const categories = await listAdminCategories();
  const saved = (await searchParams).saved === "1";

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/products", label: "Semua produk" }}
        title={product.name}
        actions={
          product.isActive ? (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="inline-flex h-[42px] items-center gap-1.5 rounded-[10px] border border-neutral-300 bg-white px-4 text-[14px] hover:bg-neutral-100"
            >
              Lihat di katalog <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />
      {saved && <p role="status" className="mb-4 rounded-[12px] bg-green-50 px-4 py-3 text-[14px] text-green-800">Perubahan tersimpan.</p>}

      <ProductForm
        key={`${product.id}-${product.slug}-${product.image}`}
        product={product}
        categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))}
      />

      <section className="mt-10 rounded-[16px] border border-red-200 bg-white p-4 sm:p-6">
        <h2 className="text-[16px] font-[450] text-red-800">Hapus produk</h2>
        {product.orderCount > 0 ? (
          <p className="mt-2 text-[14px] text-neutral-600">
            Produk ini sudah muncul di {formatNumber(product.orderCount)} baris pesanan, jadi tidak bisa dihapus agar riwayat
            tetap utuh. Hilangkan centang &quot;Aktif&quot; untuk menyembunyikannya dari katalog.
          </p>
        ) : (
          <>
            <p className="mt-2 mb-4 text-[14px] text-neutral-600">Produk yang belum pernah dipesan bisa dihapus permanen.</p>
            <ActionForm
              action={deleteProductAction.bind(null, product.id)}
              label="Hapus Produk"
              tone="danger"
              confirm="Produk dan fotonya akan dihapus permanen. Tindakan ini tidak bisa diurungkan."
            />
          </>
        )}
      </section>
    </>
  );
}
