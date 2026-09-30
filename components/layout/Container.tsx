import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Lebar & padding horizontal yang sama dengan header, sehingga logo,
 * judul, dan konten selalu sejajar: 20px → 32px (sm) → 82px (md), max 1800px.
 */
export const containerClasses = "w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px]";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(containerClasses, className)} {...props} />;
}
