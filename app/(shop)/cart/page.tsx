import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/dal";
import { getCartView } from "@/services/cart.service";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };

export default async function CartPage() {
  const user = await requireUser("/cart");
  const cart = await getCartView(user.id);

  return (
    <>
      <PageHeader eyebrow="Belanja" title="Keranjang" />

      <section className="bg-surface py-10 sm:py-14">
        <Container>
          {cart.lines.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Keranjang masih kosong"
              description="Tambahkan material yang Anda butuhkan dari katalog produk."
              action={
                <ButtonLink href="/products" variant="dark" size="md">
                  Lihat Produk
                </ButtonLink>
              }
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
              <div className="min-w-0 rounded-[20px] border border-neutral-200 bg-white px-4 sm:px-6">
                <div className="flex items-center justify-between border-b border-neutral-200 py-4">
                  <h2 className="text-[16px] font-[450] text-neutral-950">{cart.lines.length} produk</h2>
                  <Link href="/products" className="inline-flex items-center gap-1.5 text-[14px] text-neutral-600 hover:text-neutral-950">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Lanjut belanja
                  </Link>
                </div>
                <ul className="divide-y divide-neutral-200">
                  {cart.lines.map((line) => (
                    // key menyertakan quantity agar state input ter-reset saat data server berubah
                    <CartItemRow key={`${line.itemId}-${line.quantity}-${line.status}`} line={line} />
                  ))}
                </ul>
              </div>
              <CartSummary cart={cart} />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
