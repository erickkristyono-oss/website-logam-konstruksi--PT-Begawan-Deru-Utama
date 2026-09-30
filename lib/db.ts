import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Satu instance PrismaClient untuk seluruh aplikasi, dibuat saat pertama kali dipakai
 * (bukan saat file di-import) — jadi `npm run build` tetap jalan walau DATABASE_URL belum di-set.
 *
 * Saat development, hot-reload Next.js akan membuat instance baru setiap kali file berubah;
 * menyimpannya di globalThis mencegah koneksi database menumpuk.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum di-set. Isi di .env.local (lihat .env.example).");
  }

  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForPrisma.prisma = client;
  return client;
}
