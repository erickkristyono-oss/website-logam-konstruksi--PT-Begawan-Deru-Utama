import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyAgainstDummy, verifyPassword } from "@/lib/password";
import { clearFailures, getClientIp, isBlocked, recordFailure } from "@/lib/utils/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { findUserForLogin } from "@/services/user.service";

/** Terlalu banyak percobaan login → kode error khusus agar UI bisa menampilkan pesan yang tepat. */
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

/**
 * Konfigurasi Auth.js: sesi JWT (cookie httpOnly) + login email/password.
 * Pengecekan rute ada di proxy.ts; otorisasi server (termasuk role) di lib/dal.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 hari sejak login
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Anti brute-force: maks. 10 percobaan GAGAL / 15 menit per email, 50 per IP.
        // IP hanya dipakai bila diketahui (di belakang reverse proxy); tanpa itu semua pengunjung
        // akan berbagi satu "IP" dan saling memblokir.
        const WINDOW = 15 * 60 * 1000;
        const ip = getClientIp(request.headers);
        const emailKey = `login-fail:email:${email}`;
        const ipKey = ip !== "unknown" ? `login-fail:ip:${ip}` : null;
        if (isBlocked(emailKey, 10) || (ipKey && isBlocked(ipKey, 50))) throw new TooManyAttempts();

        const user = await findUserForLogin(email);
        const valid = user
          ? await verifyPassword(password, user.passwordHash)
          : (await verifyAgainstDummy(password), false); // waktu respons sama dengan email terdaftar

        if (!user || !valid) {
          recordFailure(emailKey, WINDOW);
          if (ipKey) recordFailure(ipKey, WINDOW);
          return null;
        }

        clearFailures(emailKey);
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
