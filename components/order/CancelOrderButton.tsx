"use client";

// Batalkan pesanan (hanya yang belum dibayar). Konfirmasi 2 langkah tanpa dialog browser.

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cancelOrderAction, type CancelOrderState } from "@/lib/actions/order";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<CancelOrderState, FormData>(
    cancelOrderAction.bind(null, orderId),
    {},
  );

  if (!confirming) {
    return (
      <Button variant="outline" size="md" onClick={() => setConfirming(true)}>
        Batalkan Pesanan
      </Button>
    );
  }

  return (
    <form action={formAction} className="rounded-[14px] border border-red-200 bg-red-50 p-4">
      <p className="text-[14px] text-red-900">Batalkan pesanan ini? Stok akan dikembalikan dan tindakan ini tidak bisa diurungkan.</p>
      {state.error && (
        <p role="alert" className="mt-2 text-[13px] text-red-700">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-[40px] items-center rounded-[10px] bg-red-700 px-4 text-[14px] font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
        >
          {pending ? "Membatalkan..." : "Ya, batalkan"}
        </button>
        <Button variant="outline" size="md" className="h-[40px]" onClick={() => setConfirming(false)} disabled={pending}>
          Tidak
        </Button>
      </div>
    </form>
  );
}
