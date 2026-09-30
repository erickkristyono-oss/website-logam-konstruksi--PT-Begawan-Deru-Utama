import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderAdminFields } from "@/components/admin/OrderAdminFields";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { Badge } from "@/components/ui/Badge";
import {
  advanceOrderAction,
  cancelOrderAdminAction,
  markPaidManualAction,
  markRefundedAction,
} from "@/lib/actions/admin";
import { paymentTypeLabel } from "@/lib/config/payment";
import { ADMIN_CANCELLABLE, ADMIN_NEXT_STATUS, CANCEL_REASON_LABEL } from "@/lib/config/order-status";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/utils/format";
import { getAdminOrder } from "@/services/admin/order";

export const metadata: Metadata = { title: "Detail Pesanan — Admin", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

const PAYMENT_STATUS: Record<string, { label: string; tone: "neutral" | "success" | "danger" | "accent" }> = {
  PENDING: { label: "Menunggu", tone: "accent" },
  PAID: { label: "Lunas", tone: "success" },
  FAILED: { label: "Gagal", tone: "danger" },
  EXPIRED: { label: "Kedaluwarsa", tone: "neutral" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
};

const LOG_LABEL: Record<string, string> = {
  "STATUS:PROCESSING": "Pesanan diproses",
  "STATUS:SHIPPED": "Pesanan dikirim",
  "STATUS:COMPLETED": "Pesanan selesai",
  CANCEL: "Dibatalkan admin",
  MANUAL_PAYMENT: "Ditandai lunas (pembayaran manual)",
  TRACKING: "Nomor resi diubah",
  NOTE: "Catatan internal diubah",
  REFUNDED: "Refund dicatat",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border border-neutral-200 bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-[16px] font-[450] text-neutral-950">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin(`/admin/orders/${encodeURIComponent(id)}`);
  const order = /^[a-z0-9]{1,64}$/i.test(id) ? await getAdminOrder(id) : null;
  if (!order) notFound();

  const next = ADMIN_NEXT_STATUS[order.status];
  const canCancel = ADMIN_CANCELLABLE.includes(order.status);
  const isPaid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  const refundDue = order.payments.filter((p) => p.needsRefund);

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/orders", label: "Semua pesanan" }}
        title={order.orderNumber}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} /> Dibuat {formatDateTime(order.createdAt)}
          </span>
        }
      />

      {refundDue.length > 0 && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-[14px]">
            Ada pembayaran yang perlu dikembalikan ({refundDue.map((p) => formatRupiah(p.amount)).join(", ")}). Lakukan refund
            lewat dashboard payment gateway / transfer balik, lalu tandai &quot;Sudah direfund&quot; di bagian Pembayaran.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid h-fit gap-6">
          <Section title="Status & tindakan">
            <OrderTimeline status={order.status} />
            {order.status === "CANCELLED" && (
              <p className="mt-4 text-[14px] text-neutral-700">
                {CANCEL_REASON_LABEL[order.cancelReason ?? ""] ?? "Dibatalkan"}.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200 pt-5">
              {next && (
                <ActionForm action={advanceOrderAction.bind(null, order.id, order.status)} label={next.label} pendingLabel="Menyimpan...">
                  {next.to === "SHIPPED" && (
                    <label className="grid gap-1.5 text-[13px] font-medium text-neutral-800">
                      Nomor resi (opsional)
                      <input
                        name="trackingNumber"
                        defaultValue={order.trackingNumber ?? ""}
                        maxLength={60}
                        className="h-[42px] rounded-[10px] border border-neutral-300 px-3 text-[14px] font-normal focus:border-ink focus:outline-none"
                      />
                    </label>
                  )}
                </ActionForm>
              )}
              {order.status === "PENDING_PAYMENT" && (
                <ActionForm
                  action={markPaidManualAction.bind(null, order.id)}
                  label="Tandai Sudah Dibayar"
                  tone="outline"
                  confirm={`Pastikan dana ${formatRupiah(order.total)} sudah benar-benar masuk ke rekening perusahaan.`}
                >
                  <label className="grid gap-1.5 text-[13px] font-medium text-neutral-800">
                    Keterangan pembayaran
                    <input
                      name="note"
                      required
                      maxLength={300}
                      placeholder="Mis. Transfer BCA a.n. Budi, 30/09"
                      className="h-[42px] rounded-[10px] border border-neutral-300 bg-white px-3 text-[14px] font-normal focus:border-ink focus:outline-none"
                    />
                  </label>
                </ActionForm>
              )}
              {canCancel && (
                <ActionForm
                  action={cancelOrderAdminAction.bind(null, order.id)}
                  label="Batalkan Pesanan"
                  tone="danger"
                  confirm={
                    isPaid
                      ? "Pesanan ini SUDAH DIBAYAR. Stok akan dikembalikan dan dana wajib direfund ke pelanggan."
                      : "Stok akan dikembalikan dan pesanan tidak bisa dibayar lagi."
                  }
                >
                  <label className="grid gap-1.5 text-[13px] font-medium text-neutral-800">
                    Alasan pembatalan
                    <input
                      name="reason"
                      required
                      maxLength={300}
                      placeholder="Mis. stok fisik tidak tersedia"
                      className="h-[42px] rounded-[10px] border border-neutral-300 bg-white px-3 text-[14px] font-normal focus:border-ink focus:outline-none"
                    />
                  </label>
                </ActionForm>
              )}
              {!next && !canCancel && order.status !== "PENDING_PAYMENT" && (
                <p className="text-[14px] text-neutral-500">Tidak ada tindakan lanjutan untuk status ini.</p>
              )}
            </div>
          </Section>

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

          <Section title="Pembayaran">
            {order.payments.length === 0 ? (
              <p className="text-[14px] text-neutral-500">Belum ada percobaan pembayaran.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 text-[14px]">
                      <p className="break-all font-mono text-neutral-900">{p.reference}</p>
                      <p className="text-[13px] text-neutral-500">
                        {p.provider} · {paymentTypeLabel(p.paymentType) ?? "metode belum dipilih"} · {formatDateTime(p.createdAt)}
                      </p>
                      {p.paidAt && <p className="text-[13px] text-neutral-600">Lunas {formatDateTime(p.paidAt)}</p>}
                      {p.refundedAt && <p className="text-[13px] text-neutral-600">Direfund {formatDateTime(p.refundedAt)}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <div className="flex items-center gap-2">
                        <Badge tone={PAYMENT_STATUS[p.status]?.tone ?? "neutral"}>{PAYMENT_STATUS[p.status]?.label ?? p.status}</Badge>
                        <span className="text-[14px] font-medium">{formatRupiah(p.amount)}</span>
                      </div>
                      {p.needsRefund && (
                        <ActionForm
                          action={markRefundedAction.bind(null, p.id, order.id)}
                          label="Sudah Direfund"
                          tone="outline"
                          confirm="Tandai hanya setelah dana benar-benar dikembalikan ke pelanggan."
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="grid h-fit gap-6">
          <Section title="Pelanggan">
            <dl className="grid gap-3 text-[14px]">
              <div>
                <dt className="text-[12px] text-neutral-500">Akun</dt>
                <dd className="text-neutral-900">{order.customer.name}</dd>
                <dd className="break-words text-neutral-600">{order.customer.email}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-neutral-500">Penerima</dt>
                <dd className="text-neutral-900">{order.shipping.name}</dd>
                <dd className="text-neutral-600">
                  <a href={`tel:${order.shipping.phone}`} className="hover:underline">{order.shipping.phone}</a>
                </dd>
                <dd className="break-words text-neutral-600">{order.shipping.email}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-neutral-500">Alamat kirim</dt>
                <dd className="whitespace-pre-line text-neutral-900">
                  {order.shipping.address}
                  {"\n"}
                  {order.shipping.city} {order.shipping.postalCode}
                </dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="text-[12px] text-neutral-500">Catatan pelanggan</dt>
                  <dd className="whitespace-pre-line text-neutral-900">{order.notes}</dd>
                </div>
              )}
            </dl>
            <Link
              href={`/admin/orders?q=${encodeURIComponent(order.customer.email)}`}
              className="mt-4 inline-block text-[13px] text-brand hover:underline"
            >
              Pesanan lain dari pelanggan ini
            </Link>
          </Section>

          <Section title="Pengiriman & catatan">
            <OrderAdminFields orderId={order.id} trackingNumber={order.trackingNumber} adminNote={order.adminNote} />
          </Section>

          <Section title="Riwayat admin">
            {order.logs.length === 0 ? (
              <p className="text-[14px] text-neutral-500">Belum ada tindakan admin.</p>
            ) : (
              <ol className="grid gap-3">
                {order.logs.map((l) => (
                  <li key={l.id} className="text-[13px]">
                    <p className="text-neutral-900">{LOG_LABEL[l.action] ?? l.action}</p>
                    {l.detail && <p className="break-words text-neutral-600">{l.detail}</p>}
                    <p className="text-neutral-500">
                      {l.actor} · {formatDateTime(l.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
