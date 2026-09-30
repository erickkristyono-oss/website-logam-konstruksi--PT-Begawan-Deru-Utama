import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Variabel dari .env.local (mis. TEST_DATABASE_URL). File .env.test (opsional) didahulukan.
config({ path: ".env.test", quiet: true });
config({ path: ".env.local", quiet: true });

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // Paket "server-only" sengaja melempar error di luar server Next.js; di tes diganti modul kosong.
      "server-only": path.join(root, "tests/setup/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Tes integrasi memakai satu database tes bersama → jalankan berurutan.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
