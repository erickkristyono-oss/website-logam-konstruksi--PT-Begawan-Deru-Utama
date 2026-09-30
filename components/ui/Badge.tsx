import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "accent" | "dark" | "success" | "danger" | "onDark";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  accent: "bg-accent/15 text-accent-strong",
  dark: "bg-ink text-white",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-700",
  onDark: "bg-white text-ink", // untuk latar gelap
};

type BadgeProps = ComponentProps<"span"> & { tone?: BadgeTone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] px-2 py-1 text-[12px] font-medium leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
