"use client";

import { useActionState } from "react";
import { saveOrderFieldsAction, type AdminActionState } from "@/lib/actions/admin";

/** Nomor resi + catatan internal admin. */
export function OrderAdminFields({ orderId, trackingNumber, adminNote }: { orderId: string; trackingNumber: string | null; adminNote: string | null }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveOrderFieldsAction.bind(null, orderId), {});
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="trackingNumber" className="text-[13px] font-medium text-neutral-800">Nomor resi</label>
        <input
          id="trackingNumber"
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          maxLength={60}
          placeholder="Mis. JNE 0123456789"
          className="h-[42px] rounded-[10px] border border-neutral-300 px-3 text-[14px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <p className="text-[12px] text-neutral-500">Ditampilkan kepada pelanggan di halaman pesanannya.</p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="adminNote" className="text-[13px] font-medium text-neutral-800">Catatan internal</label>
        <textarea
          id="adminNote"
          name="adminNote"
          defaultValue={adminNote ?? ""}
          maxLength={2000}
          rows={3}
          placeholder="Hanya terlihat oleh admin."
          className="rounded-[10px] border border-neutral-300 px-3 py-2 text-[14px] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-[40px] rounded-[10px] border border-neutral-300 px-4 text-[14px] font-medium hover:bg-neutral-100 disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        {state.error && <p role="alert" className="text-[13px] text-red-700">{state.error}</p>}
        {state.message && !pending && <p role="status" className="text-[13px] text-green-700">{state.message}</p>}
      </div>
    </form>
  );
}
