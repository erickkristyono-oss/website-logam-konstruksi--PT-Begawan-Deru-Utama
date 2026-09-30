"use client";

// Client Component karena butuh state (menu mobile) dan pathname (link aktif).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { Animate } from "@/components/ui/Animate";
import { buttonClasses } from "@/components/ui/Button";
import { containerClasses } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { mainNav } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export type HeaderUser = { name: string; role: "CUSTOMER" | "ADMIN" } | null;

/** Nama depan saja agar muat di header. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Badge jumlah item keranjang. */
function CartBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-none text-ink",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Header({ user, cartCount = 0 }: { user: HeaderUser; cartCount?: number }) {
  const cartLabel = cartCount > 0 ? `Keranjang (${cartCount} produk)` : "Keranjang";
  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? firstName(user.name) : "Masuk";

  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Kunci scroll body saat menu mobile terbuka, tutup dengan tombol Escape.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav
        aria-label="Navigasi utama"
        className={cn(
          containerClasses,
          "relative z-50 flex items-center justify-between pt-[20px] sm:pt-[30px]",
        )}
      >
        {/* Logo */}
        <Animate delay={0} direction="down">
          <Logo />
        </Animate>

        {/* Pill navigasi tengah (desktop) */}
        <Animate delay={100} direction="down" className="hidden xl:block">
          <ul className="flex h-[52px] items-center gap-[30px] rounded-[11px] bg-[rgba(10,7,7,0.35)] px-6 backdrop-blur-[17px]">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-sm text-[14px] font-[450] leading-[14px] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                      active ? "text-white" : "text-white/80",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Animate>

        {/* Pill kanan: keranjang + masuk (desktop) */}
        <Animate delay={200} direction="down" className="hidden xl:block">
          <div className="flex h-[52px] items-center gap-[5px] rounded-[13px] bg-[rgba(0,0,0,0.35)] p-[3px] backdrop-blur-[17px]">
            <Link
              href="/cart"
              aria-label={cartLabel}
              className="inline-flex h-[46px] items-center gap-2 rounded-[11px] px-6 text-[14px] font-[450] leading-[14px] text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Keranjang
              <CartBadge count={cartCount} />
            </Link>
            <Link
              href={accountHref}
              aria-label={user ? `Akun saya (${user.name})` : undefined}
              className={cn(buttonClasses({ variant: "light", size: "md" }), "max-w-[180px] hover:bg-white hover:opacity-100")}
            >
              {user && <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />}
              <span className="truncate">{accountLabel}</span>
            </Link>
          </div>
        </Animate>

        {/* Mobile/tablet: ikon keranjang + tombol hamburger */}
        <Animate delay={100} direction="down" className="flex items-center gap-2 xl:hidden">
          <Link
            href="/cart"
            aria-label={cartLabel}
            className="relative flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-[rgba(10,7,7,0.35)] text-white backdrop-blur-[17px] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            <CartBadge count={cartCount} className="absolute -right-1.5 -top-1.5" />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="relative h-5 w-5">
              <Menu
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 h-5 w-5 text-white transition-all duration-300 ease-out",
                  isOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                )}
              />
              <X
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 h-5 w-5 text-white transition-all duration-300 ease-out",
                  isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
                )}
              />
            </span>
          </button>
        </Animate>
      </nav>

      {/* Overlay menu mobile — selalu di-render, hanya visibility yang berubah
          supaya animasi buka & tutup sama-sama berjalan. */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] xl:hidden",
          isOpen ? "visible" : "invisible",
        )}
      >
        <div
          aria-hidden="true"
          onClick={close}
          className={cn(
            "absolute inset-0 bg-ink/90 backdrop-blur-[24px] transition-opacity duration-500",
            isOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute left-4 right-4 top-[76px] origin-top rounded-[20px] border border-white/[0.06] bg-[rgba(17,16,15,0.6)] p-6 backdrop-blur-[30px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:left-6 sm:right-6 sm:top-[86px] sm:p-8",
            isOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.97] opacity-0",
          )}
        >
          <ul className="flex flex-col gap-1">
            {mainNav.map((item, i) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-[12px] px-4 py-4 text-[18px] font-[450] transition-all duration-300 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-accent",
                      active ? "text-white" : "text-white/90",
                      isOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
                    )}
                    style={{ transitionDelay: isOpen ? `${100 + i * 50}ms` : "0ms" }}
                  >
                    {item.label}
                    <ChevronRight className="h-4 w-4 opacity-50" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-5 h-px bg-white/10" />

          <div
            className={cn(
              "flex flex-col gap-3 transition-all duration-300",
              isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
            style={{ transitionDelay: isOpen ? "350ms" : "0ms" }}
          >
            <Link
              href={accountHref}
              onClick={close}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-light text-[15px] font-[450] text-on-light transition-colors hover:bg-white"
            >
              {user && <UserRound className="h-4 w-4" aria-hidden="true" />}
              {user ? "Akun Saya" : "Masuk"}
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] border border-white/30 text-[15px] font-[450] text-white transition-colors hover:bg-white/5"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Keranjang
              <CartBadge count={cartCount} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
