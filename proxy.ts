import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy (pengganti middleware di Next.js 16): pengecekan login CEPAT sebelum halaman dirender.
 *
 * Sengaja hanya MEMBACA token sesi (getToken) dan tidak pernah menulis cookie.
 * (Proxy bawaan Auth.js memperbarui cookie di setiap request; request yang masih berjalan saat
 * logout bisa memasang kembali cookie yang baru dihapus → pengguna tetap login.)
 *
 * Ini hanya lapisan pertama. Otorisasi sebenarnya (termasuk role ADMIN) ada di lib/dal.ts.
 */
const PROTECTED_PREFIXES = ["/account", "/admin", "/cart", "/checkout"];
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const secureCookie = (process.env.AUTH_URL ?? request.nextUrl.origin).startsWith("https://");
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie }).catch(() => null);
  const isLoggedIn = !!token;

  if (AUTH_PAGES.some((p) => pathname === p)) {
    // Sudah login → tidak perlu ke halaman masuk/daftar.
    return isLoggedIn ? NextResponse.redirect(new URL("/account", request.url)) : NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !isLoggedIn) {
    // callbackUrl berupa path relatif agar lolos pengaman open-redirect.
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/cart", "/checkout/:path*", "/login", "/register"],
};
