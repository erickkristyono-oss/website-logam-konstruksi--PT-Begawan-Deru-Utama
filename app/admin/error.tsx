"use client";

import { RouteError } from "@/components/layout/RouteError";

export default function AdminError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} title="Halaman admin gagal dimuat" darkHeaderSpace={false} />;
}
