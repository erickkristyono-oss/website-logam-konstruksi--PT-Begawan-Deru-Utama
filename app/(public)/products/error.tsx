"use client";

// Error boundary untuk /products dan /products/[slug].
import { RouteError } from "@/components/layout/RouteError";

export default function ProductsError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} title="Gagal memuat produk" />;
}
