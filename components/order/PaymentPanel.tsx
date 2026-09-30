"use client";

// Tombol bayar & cek status. Nominal dan status TIDAK dikirim dari sini — hanya ID pesanan.

import { useActionState } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { refreshPaymentAction, startPaymentAction, type PaymentActionState } from "@/lib/actions/payment";

type Props = {
  orderId: string;
  deadlineLabel: string;
  canResume: boolean;
  /** Status percobaan terakhir, untuk pesan "coba lagi". */
  lastStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | null;
};

export function PaymentPanel({ orderId, deadlineLabel, canResume, lastStatus }: Props) {
  const [payState, payAction, paying] = useActionState<PaymentActionState, FormData>(
    startPaymentAction.bind(null, orderId),
    {},
  );
  const [refreshState, refreshAction, refreshing] = useActionState<PaymentActionState, FormData>(
    refreshPaymentAction.bind(null, orderId),
    {},
  );

  return (
    <div className="min-w-0">
      <p className="flex items-start gap-2 text-[14px] text-neutral-700">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Selesaikan pembayaran sebelum <strong className="font-medium text-neutral-950">{deadlineLabel}</strong>. Lewat
          dari itu pesanan dibatalkan otomatis.
        </span>
      </p>
      {(lastStatus === "FAILED" || lastStatus === "EXPIRED" || lastStatus === "CANCELLED") && (
        <p className="mt-2 text-[13px] text-amber-800">Percobaan pembayaran sebelumnya tidak berhasil. Silakan coba lagi.</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form action={payAction}>
          <Button type="submit" variant="dark" size="md" disabled={paying}>
            {paying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {paying ? "Menyiapkan pembayaran..." : canResume ? "Lanjutkan Pembayaran" : "Bayar Sekarang"}
          </Button>
        </form>
        {canResume && (
          <form action={refreshAction}>
            <Button type="submit" variant="outline" size="md" disabled={refreshing}>
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              Cek Status
            </Button>
          </form>
        )}
      </div>

      {payState.error && (
        <p role="alert" className="mt-3 text-[13px] text-red-700">
          {payState.error}
        </p>
      )}
      {refreshState.message && !refreshing && (
        <p role="status" className="mt-3 text-[13px] text-neutral-600">
          {refreshState.message}
        </p>
      )}
      <p className="mt-3 text-[12px] text-neutral-500">
        Anda akan diarahkan ke halaman pembayaran aman milik payment gateway (transfer bank/VA, QRIS, e-wallet, dll.).
      </p>
    </div>
  );
}
