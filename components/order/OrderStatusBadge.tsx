import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS } from "@/lib/config/order-status";
import type { OrderStatus } from "@/types/order";

/** `onDark`: versi kontras tinggi untuk latar gelap (header halaman). */
export function OrderStatusBadge({ status, onDark = false }: { status: OrderStatus; onDark?: boolean }) {
  const s = ORDER_STATUS[status];
  if (onDark) {
    return <Badge tone="onDark">{s.label}</Badge>;
  }
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
