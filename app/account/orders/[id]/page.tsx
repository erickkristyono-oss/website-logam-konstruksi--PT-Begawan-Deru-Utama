import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Container } from "@/components/layout/Container";
import { CancelOrderButton } from "@/components/order/CancelOrderButton";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { PaymentPanel } from "@/components/order/PaymentPanel";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { Card } from "@/components/ui/Card";
import { paymentTypeLabel } from "@/lib/config/payment";
import { requireUser } from "@/lib/dal";
import { formatDateTime } from "@/lib/utils/format";
import { getOrderForUser } from "@/services/order.service";
import { expireStaleOrders, syncLatestPayment } from "@/services/payment.service";

export const metadata: Metadata = { title: "Detail Pesanan", robots: { index: false } };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${encodeURIComponent(id)}`);

  if (!/^[a-z0-9]{1,64}$/i.test(id)) notFound();
  const query = await searchParams;
  const justPlaced = query.placed === "1";
  // Kembali dari halaman gateway. Parameter dari gateway di URL DIABAIKAN —
  // status ditanyakan langsung ke gateway (server-ke-server).
  const returned = query.payment === "return";

  if (returned) await syncLatestPayment(user.id, id);
  await expireStaleOrders({ userId: user.id, limit: 5 });

  // Hanya pesanan milik user ini. Milik orang lain / tidak ada → 404.
  const order = await getOrderForUser(user.id, id);
  if (!order) notFound();

  const payment = order.latestPayment;
  const paidVia = paymentTypeLabel(payment?.status === "PAID" ? payment.paymentType : null);

  return (
    <>
      <div className="bg-ink pb-8 pt-[100px] sm:pt-[118px]">
        <Container>
          <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-[14px] text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Pesanan Saya
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-[24px] font-medium text-white sm:text-[30px]">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} onDark />
          </div>
          <p className="mt-2 text-[14px] text-white/60">Dibuat {formatDateTime(order.createdAt)}</p>
        </Container>
      </div>

      <section className="bg-surface py-10 sm:py-14">
        <Container className="grid gap-6">
          {returned && order.status === "PAID" && (
            <div role="status" className="flex items-start gap-3 rounded-[16px] bg-green-50 p-5 text-green-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
              <div>
                <p className="font-medium">Pembayaran berhasil</p>
                <p className="mt-1 text-[14px] text-green-800">Terima kasih. Pesanan Anda akan segera kami proses.</p>
              </div>
            </div>
          )}
          {returned && order.status === "PENDING_PAYMENT" && payment?.status === "PENDING" && (
            <div role="status" className="flex items-start gap-3 rounded-[16px] bg-amber-50 p-5 text-amber-900">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <p className="font-medium">Menunggu konfirmasi pembayaran</p>
                <p className="mt-1 text-[14px] text-amber-800">
                  Bila Anda sudah membayar, status akan berubah otomatis setelah dikonfirmasi payment gateway (biasanya
                  beberapa menit). Tekan &quot;Cek Status&quot; untuk memperbarui.
                </p>
              </div>
            </div>
          )}
          {returned && order.status === "PENDING_PAYMENT" && payment && payment.status !== "PENDING" && payment.status !== "PAID" && (
            <div role="alert" className="flex items-start gap-3 rounded-[16px] bg-red-50 p-5 text-red-900">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
              <div>
                <p className="font-medium">Pembayaran belum berhasil</p>
                <p className="mt-1 text-[14px] text-red-800">Tidak ada dana yang ditagih. Silakan coba bayar lagi.</p>
              </div>
            </div>
          )}
          {justPlaced && !returned && (
            <div role="status" className="flex items-start gap-3 rounded-[16px] bg-green-50 p-5 text-green-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
              <div>
                <p className="font-medium">Pesanan berhasil dibuat</p>
                <p className="mt-1 text-[14px] text-green-800">
                  Nomor pesanan Anda <strong className="font-mono">{order.orderNumber}</strong>. Stok sudah disiapkan —
                  silakan selesaikan pembayaran di bawah.
                </p>
              </div>
            </div>
          )}

          <Card>
            <h2 className="mb-5 text-[18px] font-[450] text-neutral-950">Status</h2>
            <OrderTimeline status={order.status} />

            {order.status === "PENDING_PAYMENT" && (
              <div className="mt-6 flex flex-col gap-5 border-t border-neutral-200 pt-6 lg:flex-row lg:items-start lg:justify-between">
                <PaymentPanel
                  orderId={order.id}
                  deadlineLabel={`${formatDateTime(order.paymentDeadline)} WIB`}
                  canResume={payment?.canResume ?? false}
                  lastStatus={payment?.status ?? null}
                />
                <div className="shrink-0">
                  <CancelOrderButton orderId={order.id} />
                </div>
              </div>
            )}

            {order.trackingNumber && (
              <p className="mt-6 flex items-start gap-2 border-t border-neutral-200 pt-6 text-[14px] text-neutral-700">
                <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Nomor resi: <strong className="font-mono font-medium text-neutral-950">{order.trackingNumber}</strong>
                </span>
              </p>
            )}

            {order.paidAt && (
              <p className="mt-6 flex items-start gap-2 border-t border-neutral-200 pt-6 text-[14px] text-neutral-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                Dibayar {formatDateTime(order.paidAt)} WIB{paidVia ? ` · ${paidVia}` : ""}
              </p>
            )}

            {order.status === "CANCELLED" && (
              <p className="mt-6 flex items-start gap-2 border-t border-neutral-200 pt-6 text-[14px] text-neutral-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
                {order.cancelReason === "PAYMENT_EXPIRED"
                  ? "Dibatalkan otomatis karena pembayaran tidak diterima sampai batas waktu."
                  : order.cancelReason === "ADMIN"
                    ? "Pesanan dibatalkan oleh tim kami. Bila Anda sudah membayar, dana akan dikembalikan — hubungi kami untuk informasi lebih lanjut."
                    : "Pesanan dibatalkan."}
              </p>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
            <Card className="h-fit">
              <h2 className="text-[18px] font-[450] text-neutral-950">Pengiriman</h2>
              <dl className="mt-5 grid gap-4 text-[15px] sm:grid-cols-2">
                <div>
                  <dt className="text-[13px] text-neutral-500">Penerima</dt>
                  <dd className="text-neutral-900">{order.shipping.name}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-neutral-500">Telepon</dt>
                  <dd className="text-neutral-900">{order.shipping.phone}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[13px] text-neutral-500">Email</dt>
                  <dd className="break-words text-neutral-900">{order.shipping.email}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[13px] text-neutral-500">Alamat</dt>
                  <dd className="whitespace-pre-line text-neutral-900">
                    {order.shipping.address}
                    {"\n"}
                    {order.shipping.city} {order.shipping.postalCode}
                  </dd>
                </div>
                {order.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-[13px] text-neutral-500">Catatan</dt>
                    <dd className="whitespace-pre-line text-neutral-900">{order.notes}</dd>
                  </div>
                )}
              </dl>
            </Card>

            <OrderSummary
              title="Rincian Pesanan"
              lines={order.items.map((i) => ({
                key: i.id,
                name: i.productName,
                unit: i.unit,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal,
              }))}
              subtotal={order.subtotal}
              shippingCost={order.shippingCost}
              total={order.total}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
