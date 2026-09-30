import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/dal";
import { listAdminCategories } from "@/services/admin/catalog";

export const metadata: Metadata = { title: "Tambah Produk — Admin", robots: { index: false, follow: false } };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  const categories = await listAdminCategories();
  return (
    <>
      <AdminPageHeader back={{ href: "/admin/products", label: "Semua produk" }} title="Tambah Produk" />
      <ProductForm product={null} categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))} />
    </>
  );
}
