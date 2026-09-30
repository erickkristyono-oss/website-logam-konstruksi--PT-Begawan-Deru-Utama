/**
 * Bentuk data produk yang dikirim ke UI / API.
 * Sengaja dipisah dari model Prisma supaya field internal tidak ikut terekspos
 * dan data selalu bisa diserialisasi (JSON-safe).
 */

export type ProductSpec = {
  label: string;
  value: string;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  unit: string;
  image: string | null;
  category: { name: string; slug: string };
};

export type ProductDetail = ProductListItem & {
  description: string;
  specifications: ProductSpec[];
  categoryId: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
