export type CartLineStatus =
  | "ok"
  | "unavailable" // produk / kategori dinonaktifkan
  | "out_of_stock" // stok 0
  | "exceeds_stock"; // jumlah di keranjang > stok saat ini

export type CartLine = {
  itemId: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  categoryName: string;
  unit: string;
  /** Harga TERKINI dari database (bukan harga saat ditambahkan). */
  unitPrice: number;
  stock: number;
  quantity: number;
  lineTotal: number;
  status: CartLineStatus;
};

export type CartView = {
  lines: CartLine[];
  /** Hanya dari baris berstatus "ok". Dihitung di server. */
  subtotal: number;
  totalQuantity: number;
  hasIssues: boolean;
};

/** Hasil Server Action keranjang. */
export type CartActionResult =
  | { ok: true; message: string }
  | { ok: false; code: "UNAUTHENTICATED" | "INVALID" | "ERROR" | string; message: string };
