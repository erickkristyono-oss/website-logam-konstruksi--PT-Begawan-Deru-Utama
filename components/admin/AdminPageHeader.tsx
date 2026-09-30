import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } };

export function AdminPageHeader({ title, description, actions, back }: Props) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[14px] text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-normal leading-tight text-neutral-950 sm:text-[32px]">{title}</h1>
          {description && <p className="mt-1.5 text-[14px] text-neutral-600 sm:text-[15px]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
