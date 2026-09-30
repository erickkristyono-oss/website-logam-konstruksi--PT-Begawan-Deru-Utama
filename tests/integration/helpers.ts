/**
 * Utilitas tes integrasi. Tes ini MENGHAPUS SEMUA DATA di database tes, jadi hanya berjalan bila:
 *  - TEST_DATABASE_URL di-set,
 *  - berbeda dari DATABASE_URL (database development),
 *  - nama databasenya mengandung "test" (mis. begawan_test).
 */
import { getDb } from "@/lib/db";

const testUrl = process.env.TEST_DATABASE_URL;

function isSafe(url: string): boolean {
  try {
    return url !== process.env.DATABASE_URL && /test/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

if (testUrl && !isSafe(testUrl)) {
  throw new Error("TEST_DATABASE_URL harus berbeda dari DATABASE_URL dan nama database-nya mengandung 'test'.");
}

export const hasTestDb = Boolean(testUrl);
// getDb() membaca DATABASE_URL saat pertama dipanggil → arahkan ke database tes.
if (testUrl) process.env.DATABASE_URL = testUrl;

export const db = () => getDb();

export async function resetDb() {
  const tables = await db().$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) {
    await db().$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  }
}

let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

export async function createCategory(isActive = true) {
  const id = uid();
  return db().category.create({ data: { name: `Kategori ${id}`, slug: `kategori-${id}`, isActive } });
}

export async function createProduct(opts: { stock?: number; price?: number; isActive?: boolean; categoryId?: string } = {}) {
  const categoryId = opts.categoryId ?? (await createCategory()).id;
  const id = uid();
  return db().product.create({
    data: {
      categoryId,
      name: `Produk ${id}`,
      slug: `produk-${id}`,
      description: "Produk untuk pengujian otomatis.",
      price: opts.price ?? 100_000,
      stock: opts.stock ?? 10,
      unit: "batang",
      isActive: opts.isActive ?? true,
    },
  });
}

export async function createUser(role: "CUSTOMER" | "ADMIN" = "CUSTOMER") {
  const id = uid();
  return db().user.create({ data: { name: `User ${id}`, email: `user-${id}@test.local`, passwordHash: "x", role } });
}

export async function putInCart(userId: string, productId: string, quantity: number) {
  const cart = await db().cart.upsert({ where: { userId }, update: {}, create: { userId } });
  await db().cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity },
    create: { cartId: cart.id, productId, quantity },
  });
}

export const shipping = {
  name: "Budi Tester",
  email: "budi@test.local",
  phone: "081234567890",
  address: "Jl. Pengujian No. 1, Pamulang",
  city: "Tangerang Selatan",
  postalCode: "15417",
  notes: undefined,
};

export const stockOf = async (id: string) => (await db().product.findUniqueOrThrow({ where: { id } })).stock;
