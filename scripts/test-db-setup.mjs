// Menyiapkan database KHUSUS TES: menerapkan semua migrasi ke TEST_DATABASE_URL.
// Pemakaian: npm run test:db:setup   (buat database-nya dulu, mis. `createdb begawan_test`)
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("TEST_DATABASE_URL belum di-set di .env.local (contoh: postgresql://user@localhost:5432/begawan_test?schema=public).");
  process.exit(1);
}
if (url === process.env.DATABASE_URL || !/test/i.test(new URL(url).pathname)) {
  console.error("Demi keamanan: TEST_DATABASE_URL harus berbeda dari DATABASE_URL dan nama database-nya mengandung 'test'.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
