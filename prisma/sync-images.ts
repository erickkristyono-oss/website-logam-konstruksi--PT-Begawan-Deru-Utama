/**
 * Pasang foto produk asli secara otomatis.
 *
 * Cara pakai:
 *   1. Simpan foto di  public/images/products/<slug-produk>.jpg   (atau .jpeg / .png / .webp)
 *      contoh: public/images/products/pipa-galvanis-2-inch.jpg
 *   2. Jalankan:  npm run images:sync
 *
 * Foto asli selalu diutamakan daripada ilustrasi .svg dengan nama yang sama.
 * Slug produk bisa dilihat di URL halaman produk: /products/<slug>
 */
import { config } from "dotenv";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL belum di-set (.env.local).");
  process.exit(1);
}

const DIR = path.join(process.cwd(), "public", "images", "products");
const PHOTO_EXT = [".webp", ".jpg", ".jpeg", ".png"];

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  if (!existsSync(DIR)) {
    console.error(`Folder tidak ditemukan: ${DIR}`);
    process.exit(1);
  }

  const files = new Set(readdirSync(DIR));
  const products = await db.product.findMany({ select: { id: true, slug: true, name: true, image: true } });
  const slugs = new Set(products.map((p) => p.slug));

  let updated = 0;
  for (const product of products) {
    const photo = PHOTO_EXT.map((ext) => `${product.slug}${ext}`).find((f) => files.has(f));
    const svg = files.has(`${product.slug}.svg`) ? `${product.slug}.svg` : undefined;
    const chosen = photo ?? svg;
    if (!chosen) continue;

    const url = `/images/products/${chosen}`;
    if (product.image !== url) {
      await db.product.update({ where: { id: product.id }, data: { image: url } });
      console.log(`✓ ${product.name} → ${url}`);
      updated++;
    }
  }

  // Beri tahu file yang namanya tidak cocok dengan produk mana pun (kemungkinan salah ketik).
  const unmatched = [...files].filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [...PHOTO_EXT, ".svg"].includes(ext) && !slugs.has(path.basename(f, path.extname(f)));
  });
  if (unmatched.length) {
    console.warn(`\n⚠ File tanpa produk yang cocok (cek nama file = slug produk):\n  ${unmatched.join("\n  ")}`);
  }

  console.log(`\nSelesai: ${updated} produk diperbarui.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
