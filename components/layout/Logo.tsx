import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

type LogoProps = {
  /** "light" = logo putih untuk background gelap, "dark" = logo ungu brand untuk background terang */
  tone?: "light" | "dark";
  className?: string;
};

/**
 * Logo PT Begawan Deru Utama: ikon hexagon (SVG hasil vektorisasi logo asli)
 * + wordmark dua baris seperti pada logo.
 */
export function Logo({ tone = "light", className }: LogoProps) {
  const isLight = tone === "light";

  return (
    <Link
      href="/"
      aria-label={`${siteConfig.shortName} — Beranda`}
      className={cn(
        "flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-3",
        isLight ? "text-white" : "text-brand",
        className,
      )}
    >
      <Image
        src={isLight ? "/images/logo-mark-white.svg" : "/images/logo-mark.svg"}
        alt=""
        width={120}
        height={146}
        unoptimized
        priority
        className="h-[36px] w-auto sm:h-[42px]"
      />
      <span className="flex flex-col font-bold uppercase leading-none" aria-hidden="true">
        <span className="text-[13px] tracking-[0.42em] sm:text-[15px]">Begawan</span>{" "}
        <span className="mt-[5px] text-[13px] tracking-[0.08em] sm:text-[15px]">Deru Utama</span>
      </span>
    </Link>
  );
}
