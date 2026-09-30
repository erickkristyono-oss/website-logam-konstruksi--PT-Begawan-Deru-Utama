import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header, type HeaderUser } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/services/cart.service";

/**
 * Data header: nama & role dari cookie sesi, jumlah item keranjang dari database.
 * Bila database bermasalah, header tetap tampil (badge disembunyikan).
 */
async function getHeaderData(): Promise<{ user: HeaderUser; cartCount: number }> {
  let user: HeaderUser = null;
  try {
    const session = await auth();
    if (!session?.user?.id) return { user: null, cartCount: 0 };
    user = { name: session.user.name ?? "Akun", role: session.user.role };
    return { user, cartCount: await getCartItemCount(session.user.id) };
  } catch {
    return { user, cartCount: 0 };
  }
}

/** Kerangka halaman publik: skip link + header + konten + footer. */
export async function SiteShell({ children }: { children: ReactNode }) {
  const { user, cartCount } = await getHeaderData();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-neutral-900"
      >
        Lewati ke konten
      </a>
      <Header user={user} cartCount={cartCount} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
