"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, LayoutDashboard, Mail, Package, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag, badge: "toProcess" as const },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: FolderTree },
  { href: "/admin/customers", label: "Pelanggan", icon: Users },
  { href: "/admin/messages", label: "Pesan", icon: Mail, badge: "unread" as const },
];

type Counts = { toProcess: number; unread: number };

/** Menu admin: vertikal di desktop, strip geser horizontal di HP. */
export function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu admin" className="relative -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const count = badge ? counts[badge] : 0;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[42px] items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[14px] font-[450] transition-colors focus-visible:outline-2 focus-visible:outline-ink",
                  active ? "bg-ink text-white" : "text-neutral-700 hover:bg-neutral-200/70",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                      active ? "bg-white text-ink" : "bg-brand text-white",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                    <span className="sr-only"> perlu perhatian</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
