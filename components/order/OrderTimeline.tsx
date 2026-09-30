import { Check } from "lucide-react";
import { ORDER_FLOW, ORDER_STATUS } from "@/lib/config/order-status";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/order";

/** Tahapan pesanan. Pesanan dibatalkan ditampilkan sebagai status tunggal. */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return <p className="rounded-[12px] bg-red-50 p-4 text-[14px] text-red-800">{ORDER_STATUS.CANCELLED.description}</p>;
  }
  const current = ORDER_FLOW.indexOf(status);

  return (
    <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2" aria-label="Tahapan pesanan">
      {ORDER_FLOW.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium",
                done && "border-ink bg-ink text-white",
                active && "border-brand bg-brand text-white",
                !done && !active && "border-neutral-300 text-neutral-400",
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("text-[13px]", active ? "font-medium text-neutral-950" : done ? "text-neutral-700" : "text-neutral-500")}>
              {ORDER_STATUS[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
