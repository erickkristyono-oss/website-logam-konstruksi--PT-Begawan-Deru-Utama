import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserById, type SafeUser } from "@/services/user.service";

/**
 * Data Access Layer — satu-satunya tempat pengecekan login & role di server.
 * Selalu membaca user terbaru dari database, sehingga perubahan role / akun yang dihapus
 * langsung berlaku walaupun token sesi masih berlaku.
 * cache(): dipanggil berkali-kali dalam satu request tetap hanya 1 query.
 */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getUserById(session.user.id);
});

/** Wajib login. Bila belum, alihkan ke /login lalu kembali ke halaman asal setelah login. */
export async function requireUser(callbackUrl: string): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/**
 * Wajib ADMIN. Customer yang mencoba masuk mendapat 404 (bukan 403),
 * supaya keberadaan halaman admin tidak terungkap.
 */
export async function requireAdmin(callbackUrl = "/admin"): Promise<SafeUser> {
  const user = await requireUser(callbackUrl);
  if (user.role !== "ADMIN") notFound();
  return user;
}

/**
 * Untuk Server Action / Route Handler admin: kembalikan admin, atau null bila bukan admin
 * (pemanggil membalas error — bukan redirect/404, supaya aksi tidak diam-diam gagal).
 */
export async function getAdmin(): Promise<SafeUser | null> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}
