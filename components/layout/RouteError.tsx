"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ErrorState } from "@/components/ui/ErrorState";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  /** true = beri ruang untuk header gelap transparan di atas (halaman publik/toko). */
  darkHeaderSpace?: boolean;
};

/**
 * Tampilan error untuk error.tsx. Detail teknis TIDAK ditampilkan ke pengunjung;
 * kode `digest` membantu mencari log di server bila pengunjung melapor.
 */
export function RouteError({ error, retry, title = "Terjadi gangguan", darkHeaderSpace = true }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      {darkHeaderSpace && <div className="bg-ink pt-[132px] sm:pt-[160px]" />}
      <section className="flex-1 bg-surface py-16">
        <Container>
          <ErrorState
            title={title}
            description={`Halaman ini gagal dimuat. Silakan coba lagi beberapa saat lagi.${
              error.digest ? ` (Kode: ${error.digest})` : ""
            }`}
            onRetry={retry}
          />
        </Container>
      </section>
    </>
  );
}
