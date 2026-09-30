import "server-only";

/**
 * Rate limiter sederhana di memori (per proses server).
 * Cukup untuk mencegah spam dasar saat development / satu server.
 * Catatan: di hosting serverless dengan banyak instance, batas ini tidak dibagi
 * antar-instance — ganti dengan penyimpanan bersama (mis. Redis) di Phase 11 bila perlu.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Bersihkan entri kedaluwarsa agar Map tidak tumbuh tanpa batas.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Pembatas berbasis KEGAGALAN (mis. login): hanya percobaan yang gagal yang dihitung.
 * - isBlocked(): cek tanpa menambah hitungan
 * - recordFailure(): tambah hitungan saat gagal
 * - clearFailures(): reset saat berhasil
 */
export function isBlocked(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit;
}

export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
  else bucket.count += 1;
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}

/** Ambil IP klien dari header proxy (Vercel/NGINX); "unknown" bila tidak tersedia. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
