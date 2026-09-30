"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { AdminActionState } from "@/lib/actions/admin";
import { cn } from "@/lib/utils/cn";

type Props = {
  action: (prev: AdminActionState, fd: FormData) => Promise<AdminActionState>;
  label: string;
  pendingLabel?: string;
  /** Bila diisi, tombol pertama membuka konfirmasi dulu. */
  confirm?: string;
  tone?: "dark" | "danger" | "outline";
  /** Isian tambahan (mis. alasan, nomor resi). Ditampilkan di dalam form. */
  children?: ReactNode;
  className?: string;
};

const tones = {
  dark: "bg-ink text-white hover:bg-ink-soft",
  danger: "bg-red-700 text-white hover:bg-red-800",
  outline: "border border-neutral-300 text-neutral-900 hover:bg-neutral-100",
};

/** Form aksi admin kecil dengan konfirmasi 2 langkah (tanpa dialog browser) + pesan hasil. */
export function ActionForm({ action, label, pendingLabel, confirm, tone = "dark", children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);
  const btn = cn(
    "inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60",
    tones[tone],
  );

  if (confirm && !confirming) {
    return (
      <div className={className}>
        <button type="button" className={btn} onClick={() => setConfirming(true)}>
          {label}
        </button>
        {state.message && <p role="status" className="mt-2 text-[13px] text-green-700">{state.message}</p>}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className={cn(confirm && "rounded-[14px] border border-neutral-200 bg-neutral-50 p-4", className)}
    >
      {confirm && <p className="mb-3 text-[14px] text-neutral-800">{confirm}</p>}
      {children && <div className="mb-3 grid gap-3">{children}</div>}
      {state.fieldErrors && (
        <ul className="mb-2 text-[13px] text-red-700">
          {Object.values(state.fieldErrors).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {pending ? (pendingLabel ?? "Memproses...") : confirm ? `Ya, ${label.toLowerCase()}` : label}
        </button>
        {confirm && (
          <button type="button" className={cn(btn, tones.outline)} onClick={() => setConfirming(false)} disabled={pending}>
            Batal
          </button>
        )}
      </div>
      {state.error && <p role="alert" className="mt-2 text-[13px] text-red-700">{state.error}</p>}
      {state.message && <p role="status" className="mt-2 text-[13px] text-green-700">{state.message}</p>}
    </form>
  );
}
