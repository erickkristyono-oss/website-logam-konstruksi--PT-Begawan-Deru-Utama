/**
 * SEED DATA CONTOH (DEMO) — untuk development & pengujian.
 *
 * ⚠️  Nama produk hanya jenis material umum; HARGA, STOK, dan DESKRIPSI adalah DUMMY,
 *     bukan data PT Begawan Deru Utama. Ganti dengan data asli melalui admin (Phase 8).
 *     Gambar = ILUSTRASI vektor (public/images/products/<slug>.svg), bukan foto produk.
 *
 * Aman dijalankan berulang (upsert berdasarkan slug).
 * Jalankan: npm run db:seed
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("Seed demo ditolak di production. Set ALLOW_DEMO_SEED=true bila benar-benar diperlukan.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL belum di-set (.env.local).");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEMO_NOTE = "Data contoh — harga, stok, dan deskripsi belum mencerminkan data perusahaan.";

const categories = [
  { name: "Besi", slug: "besi", description: "Besi beton, besi siku, dan besi hollow untuk struktur bangunan." },
  { name: "Baja Ringan", slug: "baja-ringan", description: "Rangka atap dan plafon baja ringan." },
  { name: "Pipa Galvanis", slug: "pipa-galvanis", description: "Pipa besi berlapis seng untuk instalasi dan struktur." },
  { name: "Stainless Steel", slug: "stainless-steel", description: "Pipa dan plat stainless steel." },
  { name: "Plat", slug: "plat", description: "Plat besi dan plat bordes." },
  { name: "Wire", slug: "wire", description: "Kawat bendrat, wiremesh, dan kawat lainnya." },
];

type SeedProduct = {
  category: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  unit: string;
  specs: Array<[string, string]>;
  featured?: boolean;
  active?: boolean;
};

const products: SeedProduct[] = [
  { category: "besi", name: "Besi Beton Polos 10 mm", slug: "besi-beton-polos-10mm", price: 75000, stock: 250, unit: "batang", featured: true,
    specs: [["Diameter", "10 mm"], ["Panjang", "12 m"], ["Jenis", "Polos"]] },
  { category: "besi", name: "Besi Beton Ulir 13 mm", slug: "besi-beton-ulir-13mm", price: 125000, stock: 180, unit: "batang",
    specs: [["Diameter", "13 mm"], ["Panjang", "12 m"], ["Jenis", "Ulir"]] },
  { category: "besi", name: "Besi Siku 40 x 40 mm", slug: "besi-siku-40x40", price: 150000, stock: 90, unit: "batang",
    specs: [["Ukuran", "40 x 40 mm"], ["Tebal", "3 mm"], ["Panjang", "6 m"]] },
  { category: "besi", name: "Besi Hollow 40 x 40 mm", slug: "besi-hollow-40x40", price: 95000, stock: 0, unit: "batang",
    specs: [["Ukuran", "40 x 40 mm"], ["Tebal", "1,2 mm"], ["Panjang", "6 m"]] },
  { category: "baja-ringan", name: "Baja Ringan Kanal C75", slug: "baja-ringan-kanal-c75", price: 85000, stock: 400, unit: "batang", featured: true,
    specs: [["Profil", "C75"], ["Tebal", "0,75 mm"], ["Panjang", "6 m"]] },
  { category: "baja-ringan", name: "Reng Baja Ringan", slug: "reng-baja-ringan", price: 45000, stock: 600, unit: "batang",
    specs: [["Profil", "Reng"], ["Tebal", "0,45 mm"], ["Panjang", "6 m"]] },
  { category: "pipa-galvanis", name: "Pipa Galvanis 1/2 inch", slug: "pipa-galvanis-half-inch", price: 110000, stock: 120, unit: "batang", featured: true,
    specs: [["Diameter", "1/2 inch"], ["Panjang", "6 m"], ["Lapisan", "Galvanis"]] },
  { category: "pipa-galvanis", name: "Pipa Galvanis 2 inch", slug: "pipa-galvanis-2-inch", price: 350000, stock: 45, unit: "batang",
    specs: [["Diameter", "2 inch"], ["Panjang", "6 m"], ["Lapisan", "Galvanis"]] },
  { category: "stainless-steel", name: "Pipa Stainless Steel 304 1 inch", slug: "pipa-stainless-304-1-inch", price: 420000, stock: 30, unit: "batang",
    specs: [["Material", "SS 304"], ["Diameter", "1 inch"], ["Panjang", "6 m"]] },
  { category: "stainless-steel", name: "Plat Stainless Steel 304 1 mm", slug: "plat-stainless-304-1mm", price: 1250000, stock: 12, unit: "lembar",
    specs: [["Material", "SS 304"], ["Tebal", "1 mm"], ["Ukuran", "1,2 x 2,4 m"]] },
  { category: "plat", name: "Plat Besi 2 mm", slug: "plat-besi-2mm", price: 650000, stock: 25, unit: "lembar", featured: true,
    specs: [["Tebal", "2 mm"], ["Ukuran", "1,2 x 2,4 m"]] },
  { category: "plat", name: "Plat Bordes 2,5 mm", slug: "plat-bordes-2-5mm", price: 780000, stock: 18, unit: "lembar",
    specs: [["Tebal", "2,5 mm"], ["Ukuran", "1,2 x 2,4 m"], ["Motif", "Bordes"]] },
  { category: "wire", name: "Kawat Bendrat", slug: "kawat-bendrat", price: 25000, stock: 300, unit: "kg",
    specs: [["Kemasan", "Per kg"], ["Kegunaan", "Pengikat besi beton"]] },
  { category: "wire", name: "Wiremesh M8", slug: "wiremesh-m8", price: 550000, stock: 40, unit: "lembar",
    specs: [["Diameter kawat", "8 mm"], ["Ukuran", "2,1 x 5,4 m"]] },
  // Produk nonaktif — untuk menguji bahwa produk nonaktif tidak tampil di publik.
  { category: "wire", name: "Kawat Duri (Nonaktif)", slug: "kawat-duri-nonaktif", price: 200000, stock: 10, unit: "roll", active: false,
    specs: [["Panjang", "50 m"]] },
];

async function main() {
  const categoryIds = new Map<string, string>();

  for (const [index, c] of categories.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: index },
      create: { ...c, sortOrder: index },
    });
    categoryIds.set(c.slug, row.id);
  }

  for (const p of products) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Kategori tidak ditemukan: ${p.category}`);

    const data = {
      categoryId,
      name: p.name,
      description: `${p.name} untuk kebutuhan konstruksi. ${DEMO_NOTE}`,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      specifications: p.specs.map(([label, value]) => ({ label, value })),
      isFeatured: p.featured ?? false,
      isActive: p.active ?? true,
    };

    const image = `/images/products/${p.slug}.svg`; // ILUSTRASI, bukan foto produk
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { ...data, slug: p.slug, image } });
    // Isi gambar ilustrasi hanya bila produk belum punya gambar — foto asli yang sudah dipasang tidak ditimpa.
    await db.product.updateMany({ where: { slug: p.slug, image: null }, data: { image } });
  }

  console.log(`Seed selesai: ${categories.length} kategori, ${products.length} produk (DATA CONTOH).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
