import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/dal";
import { getAdminNavCounts } from "@/services/admin/dashboard";

export const dynamic = "force-dynamic";

// Setiap halaman & aksi admin tetap memeriksa role sendiri; pengecekan di layout
// hanya untuk menampilkan nama admin & badge menu.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const counts = await getAdminNavCounts().catch(() => ({ toProcess: 0, unread: 0 }));
  return (
    <AdminShell adminName={admin.name} counts={counts}>
      {children}
    </AdminShell>
  );
}
