import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { calculateShippingCost } from "@/lib/config/shipping";
import { requireUser } from "@/lib/dal";
import { getCartView } from "@/services/cart.service";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCartView(user.id);

  // Keranjang kosong atau bermasalah → kembali ke keranjang untuk diperbaiki.
  if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");

  // Pratinjau saja. Angka final dihitung ulang di server saat pesanan dibuat.
  const shippingCost = calculateShippingCost({ subtotal: cart.subtotal, city: "" });

  return (
    <>
      <PageHeader eyebrow="Belanja" title="Checkout" description="Lengkapi data pengiriman untuk membuat pesanan." />
      <section className="bg-surface py-10 sm:py-14">
        <Container className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
          <div className="min-w-0 rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-8">
            <h2 className="mb-6 text-[18px] font-[450] text-neutral-950">Data Pengiriman</h2>
            <CheckoutForm defaults={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <OrderSummary
              lines={cart.lines.map((l) => ({
                key: l.itemId,
                name: l.name,
                unit: l.unit,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                lineTotal: l.lineTotal,
              }))}
              subtotal={cart.subtotal}
              shippingCost={shippingCost}
              total={cart.subtotal + shippingCost}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
