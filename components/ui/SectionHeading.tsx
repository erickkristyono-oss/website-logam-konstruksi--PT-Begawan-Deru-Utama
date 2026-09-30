import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  id?: string;
  className?: string;
};

/** Pola tipografi judul section yang konsisten di seluruh halaman. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-[640px]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-accent-strong">
          {eyebrow}
        </p>
      )}
      <Tag id={id} className="text-[28px] font-normal leading-[1.1] tracking-[-0.01em] text-neutral-950 sm:text-[36px] md:text-[42px]">
        {title}
      </Tag>
      {description && (
        <p className="mt-4 text-[16px] leading-[1.5] text-neutral-600 sm:text-[17px]">
          {description}
        </p>
      )}
    </div>
  );
}
