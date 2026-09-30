import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/dal";
import { simulateMockPaymentAction } from "@/lib/actions/payment";
import { getPaymentProvider } from "@/lib/payment";
import { formatDateTime, formatRupiah } from "@/lib/utils/format";
import { getMockPaymentForUser } from "@/services/payment.service";

/**
 * Halaman SIMULASI payment gateway — hanya ada bila PAYMENT_PROVIDER=mock (yang hanya
 * diizinkan di localhost). Menggantikan halaman gateway asli selama development.
 */

export const metadata: Metadata = { title: "Simulasi Pembayaran", robots: { index: false } };

type Props = { params: Promise<{ reference: string }> };

function mockEnabled(): boolean {
  try {
    return getPaymentProvider().name === "mock";
  } catch {
    return false;
  }
}

export default async function MockPaymentPage({ params }: Props) {
  if (!mockEnabled()) notFound();

  const { reference } = await params;
  const ref = decodeURIComponent(reference);
  const user = await requireUser(`/payment/mock/${encodeURIComponent(ref)}`);
  if (!/^[A-Z0-9-]{1,60}$/.test(ref)) notFound();

  const payment = await getMockPaymentForUser(user.id, ref);
  if (!payment) notFound();

  const open = payment.status === "PENDING" && payment.order.status === "PENDING_PAYMENT";
  const action = simulateMockPaymentAction.bind(null, ref);

  return (
    <>
      <div className="bg-ink pb-8 pt-[100px] sm:pt-[118px]">
        <Container>
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-[12px] font-semibold text-ink">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> MODE SIMULASI — bukan pembayaran sungguhan
          </p>
          <h1 className="mt-4 text-[26px] font-medium text-white sm:text-[32px]">Simulasi Payment Gateway</h1>
        </Container>
      </div>

      <section className="bg-surface py-10 sm:py-14">
        <Container className="max-w-[640px]">
          <Card>
            <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-[13px] text-neutral-500">Pesanan</dt>
                <dd className="font-mono text-neutral-900">{payment.order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-neutral-500">Referensi pembayaran</dt>
                <dd className="break-all font-mono text-neutral-900">{payment.reference}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-neutral-500">Total tagihan</dt>
                <dd className="text-[20px] font-semibold text-neutral-950">{formatRupiah(Number(payment.amount))}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-neutral-500">Berlaku sampai</dt>
                <dd className="text-neutral-900">{formatDateTime(payment.expiresAt)} WIB</dd>
              </div>
            </dl>

            {open ? (
              <form action={action} className="mt-6 grid gap-2 border-t border-neutral-200 pt-6 sm:grid-cols-3">
                <button
                  name="outcome"
                  value="PAID"
                  className="h-[46px] rounded-[11px] bg-green-700 px-4 text-[14px] font-medium text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                >
                  Bayar (berhasil)
                </button>
                <button
                  name="outcome"
                  value="FAILED"
                  className="h-[46px] rounded-[11px] border border-neutral-300 px-4 text-[14px] font-medium text-neutral-900 hover:bg-neutral-100"
                >
                  Gagal
                </button>
                <button
                  name="outcome"
                  value="EXPIRED"
                  className="h-[46px] rounded-[11px] border border-neutral-300 px-4 text-[14px] font-medium text-neutral-900 hover:bg-neutral-100"
                >
                  Kedaluwarsa
                </button>
              </form>
            ) : (
              <p className="mt-6 border-t border-neutral-200 pt-6 text-[14px] text-neutral-600">
                Tagihan ini sudah tidak aktif (status: {payment.status}).
              </p>
            )}
          </Card>
        </Container>
      </section>
    </>
  );
}
