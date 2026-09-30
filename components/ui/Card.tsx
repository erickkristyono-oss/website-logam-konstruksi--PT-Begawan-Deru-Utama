import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-8",
        className,
      )}
      {...props}
    />
  );
}
