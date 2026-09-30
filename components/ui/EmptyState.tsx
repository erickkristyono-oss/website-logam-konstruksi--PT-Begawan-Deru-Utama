import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Tampilan ketika data kosong (mis. "No products found"). Dipakai ulang di seluruh aplikasi. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[20px] border border-dashed border-neutral-300 bg-white px-6 py-14 text-center sm:py-16",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-ink text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-[18px] font-[450] text-neutral-950">{title}</p>
      {description && <p className="mt-2 max-w-[420px] text-[15px] leading-[1.5] text-neutral-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
