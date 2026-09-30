/** Menggabungkan className secara kondisional (pengganti ringan untuk library clsx). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
