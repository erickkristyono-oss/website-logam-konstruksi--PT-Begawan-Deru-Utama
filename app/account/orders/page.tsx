import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/dal";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/utils/format";
import { listOrdersForUser } from "@/services/order.service";
import { expireStaleOrders } from "@/services/payment.service";

export const metadata: Metadata = { title: "Pesanan Saya", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  await expireStaleOrders({ userId: user.id, limit: 10 });
  const orders = await listOrdersForUser(user.id);

  return (
    <>
      <PageHeader eyebrow="Akun Saya" title="Pesanan Saya" />
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Belum ada pesanan"
              description="Pesanan yang Anda buat akan tampil di sini beserta statusnya."
              action={
                <ButtonLink href="/products" variant="dark" size="md">
                  Lihat Produk
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid gap-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="group flex flex-col gap-3 rounded-[20px] border border-neutral-200 bg-white p-5 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[15px] font-medium text-neutral-950">{order.orderNumber}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-[14px] text-neutral-600">
                        {formatDateTime(order.createdAt)} · {formatNumber(order.itemCount)} produk
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-[17px] font-semibold text-neutral-950">{formatRupiah(order.total)}</span>
                      <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
