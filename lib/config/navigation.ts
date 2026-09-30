export type NavItem = {
  label: string;
  href: string;
};

export const mainNav: NavItem[] = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/products" },
  { label: "Tentang Kami", href: "/about" },
  { label: "Kontak", href: "/contact" },
];
