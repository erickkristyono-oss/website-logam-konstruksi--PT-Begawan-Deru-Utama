import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "light" // #E9E9E9 — untuk background gelap (hero, header)
  | "outline-light" // border putih — untuk background gelap
  | "dark" // ink — untuk background terang
  | "outline"; // border abu — untuk background terang

export type ButtonSize =
  | "lg" // tombol CTA hero: 46/51px, padding 20/27px
  | "md"; // tombol nav/pill: 46px, padding 24px

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-[450] transition-[opacity,background-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  light: "bg-light text-on-light hover:opacity-90",
  "outline-light": "border border-white text-white hover:opacity-80",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "border border-neutral-300 text-neutral-900 hover:bg-neutral-100",
};

const sizes: Record<ButtonSize, string> = {
  lg: "h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] text-[14px] sm:text-[15.5px] leading-[15.5px]",
  md: "h-[46px] px-6 rounded-[11px] text-[14px] leading-[14px]",
};

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function buttonClasses({
  variant = "dark",
  size = "lg",
  fullWidth = false,
}: StyleProps = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}

type ButtonProps = ComponentProps<"button"> & StyleProps;

/** Gunakan <Button> untuk aksi (submit, klik). */
export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

/** Gunakan <ButtonLink> untuk navigasi yang tampil seperti tombol. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
