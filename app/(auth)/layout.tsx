import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { siteConfig } from "@/lib/config/site";

/** Layout halaman masuk/daftar: panel brand gelap (desktop) + formulir. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh flex-1 lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_10%,rgba(168,42,178,0.25),transparent_70%),radial-gradient(50%_60%_at_0%_100%,rgba(70,110,170,0.25),transparent_70%)]"
        />
        <Logo className="relative" />
        <div className="relative">
          <p className="max-w-[420px] text-[40px] font-normal leading-[1.05] text-white">
            Material logam untuk kebutuhan konstruksi Anda.
          </p>
          <p className="mt-5 max-w-[380px] text-white/70">{siteConfig.businessField}</p>
        </div>
        <p className="relative text-[13px] text-white/50">© {new Date().getFullYear()} {siteConfig.name}</p>
      </aside>

      <main id="main" className="flex flex-col bg-white">
        <div className="flex items-center justify-between bg-ink px-5 py-4 sm:px-8 lg:bg-transparent lg:px-12 lg:pt-10">
          <Logo className="lg:hidden" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-sm text-[14px] text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-accent lg:text-neutral-600 lg:hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Beranda
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
