"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
};

/** Tampilan error yang ramah pengguna, dengan tombol coba lagi. */
export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[20px] border border-red-200 bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-[18px] font-[450] text-neutral-950">{title}</p>
      {description && <p className="mt-2 max-w-[420px] text-[15px] text-neutral-600">{description}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <Button variant="dark" size="md" onClick={onRetry}>
            Coba Lagi
          </Button>
        )}
        <ButtonLink href="/" variant="outline" size="md">
          Ke Beranda
        </ButtonLink>
      </div>
    </div>
  );
}
