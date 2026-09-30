/**
 * Membuat akun ADMIN (atau menaikkan akun yang sudah ada menjadi ADMIN).
 * Pendaftaran lewat website SELALU membuat CUSTOMER — admin hanya bisa dibuat dari server.
 *
 * Pemakaian:
 *   npm run admin:create -- --email admin@contoh.com --name "Nama Admin"
 *   → password diminta secara interaktif (tidak tampil di layar / riwayat terminal).
 *
 * Non-interaktif (mis. server): set ADMIN_PASSWORD di environment sebelum menjalankan.
 */
import { config } from "dotenv";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/password";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" } },
});

const emailArg = values.email?.trim().toLowerCase() ?? "";
if (!emailArg || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailArg)) {
  console.error('Pemakaian: npm run admin:create -- --email admin@contoh.com --name "Nama Admin"');
  process.exit(1);
}
const email: string = emailArg;

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    output._writeToOutput = (s: string) => {
      if (!muted) output.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum di-set (.env.local).");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });

    let password = process.env.ADMIN_PASSWORD ?? "";
    if (!password) {
      const prompt = existing ? "Password baru (kosongkan untuk tidak mengubah): " : "Password admin (min. 12 karakter): ";
      password = await askHidden(prompt);
      if (password && (await askHidden("Ulangi password: ")) !== password) throw new Error("Password tidak sama.");
    }
    if (!existing && !password) throw new Error("Password wajib diisi untuk akun baru.");
    if (password && (password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password))) {
      throw new Error("Password admin minimal 12 karakter dan berisi huruf serta angka.");
    }

    if (existing) {
      await db.user.update({
        where: { email },
        data: { role: "ADMIN", ...(password ? { passwordHash: await hashPassword(password) } : {}) },
      });
      console.log(`✓ ${email} sekarang ADMIN${password ? " (password diperbarui)" : ""}.`);
    } else {
      await db.user.create({
        data: { email, name: values.name?.trim() || "Admin", role: "ADMIN", passwordHash: await hashPassword(password) },
      });
      console.log(`✓ Akun admin dibuat: ${email}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
