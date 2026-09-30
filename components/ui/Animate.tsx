import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Direction = "up" | "down" | "left" | "right" | "scale";

const directionClass: Record<Direction, string> = {
  up: "animate-fade-up",
  down: "animate-fade-down",
  left: "animate-fade-left",
  right: "animate-fade-right",
  scale: "animate-fade-scale",
};

type AnimateProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: Direction;
};

/**
 * Animasi masuk murni CSS (tanpa JS / library). Elemen mulai (hampir) transparan
 * lalu dimunculkan oleh keyframe (fill-mode "both", lihat globals.css).
 * Server Component — tidak menambah JavaScript di browser.
 */
export function Animate({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: AnimateProps) {
  return (
    <div
      className={cn(directionClass[direction], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
