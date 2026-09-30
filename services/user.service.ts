import "server-only";
import { getDb } from "@/lib/db";
import { Prisma, type Role } from "@/lib/generated/prisma/client";
import { hashPassword } from "@/lib/password";
import type { RegisterInput } from "@/lib/validations/auth";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
};

/** Field yang aman dikirim ke UI — passwordHash TIDAK PERNAH ikut. */
const safeSelect = { id: true, name: true, email: true, phone: true, role: true, createdAt: true } satisfies Prisma.UserSelect;

export class EmailTakenError extends Error {
  constructor() {
    super("Email sudah terdaftar.");
  }
}

/** Registrasi selalu sebagai CUSTOMER. Role ADMIN hanya bisa dibuat lewat script server (admin:create). */
export async function createCustomer(input: RegisterInput): Promise<SafeUser> {
  try {
    return await getDb().user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        passwordHash: await hashPassword(input.password),
        role: "CUSTOMER",
      },
      select: safeSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailTakenError();
    }
    throw error;
  }
}

/** Khusus proses login: mengembalikan passwordHash. Jangan dipakai untuk menampilkan data. */
export async function findUserForLogin(email: string) {
  return getDb().user.findUnique({
    where: { email },
    select: { ...safeSelect, passwordHash: true },
  });
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  return getDb().user.findUnique({ where: { id }, select: safeSelect });
}
