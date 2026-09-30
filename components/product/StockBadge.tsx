import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils/format";

type StockBadgeProps = { stock: number; unit: string; showCount?: boolean };

export function StockBadge({ stock, unit, showCount = false }: StockBadgeProps) {
  if (stock <= 0) return <Badge tone="danger">Stok habis</Badge>;
  return (
    <Badge tone="success">
      {showCount ? `Stok ${formatNumber(stock)} ${unit}` : "Tersedia"}
    </Badge>
  );
}
