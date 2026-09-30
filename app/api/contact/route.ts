import { contactSchema, toFieldErrors } from "@/lib/validations/contact";
import { getClientIp, rateLimit } from "@/lib/utils/rate-limit";
import { createContactMessage } from "@/services/contact.service";

/**
 * POST /api/contact
 * Body JSON: { name, email, phone?, subject, message, website? }
 *
 * Respons:
 *  201 { ok: true }                                  — tersimpan
 *  400 { ok: false, error, fieldErrors? }            — input tidak valid
 *  415 { ok: false, error }                          — bukan JSON
 *  429 { ok: false, error }                          — terlalu banyak permintaan
 *  500 { ok: false, error }                          — kesalahan server
 */
export async function POST(request: Request) {
  // 1. Batasi 5 pesan / 10 menit per IP (anti-spam dasar).
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "Terlalu banyak pesan terkirim. Silakan coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  // 2. Hanya terima JSON.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false, error: "Content-Type harus application/json." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Format data tidak valid." }, { status: 400 });
  }

  // 3. Validasi di server (jangan percaya data dari browser).
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    // Honeypot terisi → kemungkinan bot. Balas "sukses" agar bot tidak belajar, tapi jangan simpan.
    if (fieldErrors.website) {
      return Response.json({ ok: true }, { status: 201 });
    }
    return Response.json(
      { ok: false, error: "Mohon periksa kembali isian formulir.", fieldErrors },
      { status: 400 },
    );
  }

  // 4. Simpan ke database.
  try {
    await createContactMessage(parsed.data);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    // Detail error hanya di log server, tidak dikirim ke browser.
    console.error("[api/contact] Gagal menyimpan pesan:", error);
    return Response.json(
      { ok: false, error: "Pesan gagal dikirim. Silakan coba lagi beberapa saat lagi." },
      { status: 500 },
    );
  }
}
