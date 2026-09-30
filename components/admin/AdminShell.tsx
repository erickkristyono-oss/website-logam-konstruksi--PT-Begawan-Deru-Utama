import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/layout/Logo";
import { logoutAction } from "@/lib/actions/auth";

type Props = { children: ReactNode; adminName: string; counts: { toProcess: number; unread: number } };

/** Kerangka area admin: bilah atas gelap + menu samping + konten. */
export function AdminShell({ children, adminName, counts }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm"
      >
        Lewati ke konten
      </a>
      <header className="bg-ink">
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="[&_img]:h-[30px] sm:[&_img]:h-[34px]" />
            <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="hidden h-[38px] items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Lihat website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <span className="hidden max-w-[160px] truncate text-[13px] text-white/60 md:inline">{adminName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Keluar</span>
                <span className="sr-only sm:hidden">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:h-fit">
          <AdminNav counts={counts} />
        </aside>
        <main id="admin-main" className="min-w-0 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
