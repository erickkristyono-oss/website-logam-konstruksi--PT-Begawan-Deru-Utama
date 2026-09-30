"use client";

// Tombol tambah ke keranjang. Mengirim HANYA productId + jumlah; harga dihitung di server.
// Tamu (belum login) otomatis diarahkan ke halaman masuk lalu kembali ke halaman ini.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, ShoppingCart, Zap } from "lucide-react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { addToCartAction } from "@/lib/actions/cart";
import { cn } from "@/lib/utils/cn";

type AddToCartButtonProps = {
  productId: string;
  productName: string;
  quantity?: number;
  disabled?: boolean;
  /** "icon" = tombol kotak kecil (kartu produk), "full" = tombol dengan teks. */
  display?: "icon" | "full";
  /** Beli sekarang: tambah lalu langsung ke keranjang. */
  buyNow?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type Feedback = { type: "success" | "error"; message: string } | null;

export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  disabled,
  display = "full",
  buyNow = false,
  variant = "dark",
  size = "lg",
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Pesan sukses hilang otomatis.
  useEffect(() => {
    if (feedback?.type !== "success") return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  function onClick() {
    setFeedback(null);
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);
      if (result.ok) {
        if (buyNow) router.push("/cart");
        else setFeedback({ type: "success", message: result.message });
        return;
      }
      if (result.code === "UNAUTHENTICATED") {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      setFeedback({ type: "error", message: result.message });
    });
  }

  const Icon = pending ? Loader2 : feedback?.type === "success" ? Check : buyNow ? Zap : ShoppingCart;
  const label = buyNow ? "Beli Sekarang" : "Tambah ke Keranjang";

  return (
    <div className={cn("relative", display === "full" && "w-full")}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        aria-busy={pending}
        aria-label={display === "icon" ? `Tambah ${productName} ke keranjang` : undefined}
        title={display === "icon" ? "Tambah ke keranjang" : undefined}
        className={cn(
          buttonClasses({ variant, size, fullWidth: display === "full" }),
          display === "icon" && "h-[42px] w-[46px] px-0",
          className,
        )}
      >
        <Icon className={cn("h-4 w-4", pending && "animate-spin")} aria-hidden="true" />
        {display === "full" && (pending ? "Memproses..." : label)}
      </button>

      {/* Umpan balik untuk pembaca layar & pengguna */}
      <div aria-live="polite" className={cn(display === "icon" && "absolute right-0 top-full z-10 mt-2 w-[220px]")}>
        {feedback && (
          <p
            className={cn(
              "mt-2 rounded-[10px] px-3 py-2 text-[13px]",
              feedback.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700",
              display === "icon" && "mt-0 shadow-lg",
            )}
          >
            {feedback.message}
            {feedback.type === "success" && (
              <>
                {" "}
                <Link href="/cart" className="font-medium underline underline-offset-2">
                  Lihat keranjang
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
