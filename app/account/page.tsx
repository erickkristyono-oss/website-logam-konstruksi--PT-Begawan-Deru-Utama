import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Akun Saya", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

export default async function AccountPage() {
  // Pemeriksaan di server — proxy hanya lapisan pertama.
  const user = await requireUser("/account");

  const links = [
    { href: "/account/orders", icon: Package, title: "Pesanan Saya", text: "Lihat riwayat dan status pesanan." },
    { href: "/products", icon: ShoppingBag, title: "Belanja Produk", text: "Lihat katalog material." },
    ...(user.role === "ADMIN"
      ? [{ href: "/admin", icon: LayoutDashboard, title: "Dashboard Admin", text: "Kelola produk, pesanan, dan pesan." }]
      : []),
  ];

  return (
    <>
      <PageHeader eyebrow="Akun Saya" title={`Halo, ${user.name}`} description="Kelola akun dan pantau pesanan Anda." />

      <section className="bg-surface py-12 sm:py-16">
        <Container className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Card className="h-fit">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[20px] font-[450] text-neutral-950">Profil</h2>
              {user.role === "ADMIN" && (
                <span className="rounded-[6px] bg-ink px-2 py-1 text-[12px] font-medium text-white">Admin</span>
              )}
            </div>
            <dl className="mt-5 space-y-4 text-[15px]">
              <div>
                <dt className="text-[13px] text-neutral-500">Nama</dt>
                <dd className="text-neutral-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-neutral-500">Email</dt>
                <dd className="break-words text-neutral-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-neutral-500">Telepon</dt>
                <dd className="text-neutral-900">{user.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-neutral-500">Terdaftar sejak</dt>
                <dd className="text-neutral-900">{dateFormat.format(user.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <LogoutButton />
            </div>
          </Card>

          <ul className="grid h-fit gap-3">
            {links.map(({ href, icon: Icon, title, text }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-4 rounded-[20px] border border-neutral-200 bg-white p-5 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:p-6"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-ink text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[16px] font-[450] text-neutral-950">{title}</span>
                    <span className="block text-[14px] text-neutral-600">{text}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
