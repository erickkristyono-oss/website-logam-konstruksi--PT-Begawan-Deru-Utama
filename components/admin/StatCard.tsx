import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-neutral-600">{label}</span>
        <Icon className={cn("h-4 w-4", highlight ? "text-brand" : "text-neutral-400")} aria-hidden="true" />
      </div>
      <p className="mt-2 text-[24px] font-semibold leading-none text-neutral-950 sm:text-[28px]">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-neutral-500">{hint}</p>}
    </>
  );
  const cls = cn(
    "block rounded-[16px] border bg-white p-4 sm:p-5",
    highlight ? "border-brand/40 ring-1 ring-brand/15" : "border-neutral-200",
    href && "transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
