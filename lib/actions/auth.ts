"use server";

// Server Actions untuk autentikasi. Dijalankan HANYA di server;
// Next.js otomatis memeriksa Origin request (proteksi CSRF untuk Server Actions).

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema, registerSchema, safeCallbackUrl } from "@/lib/validations/auth";
import { EmailTakenError, createCustomer } from "@/services/user.service";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Nilai yang dikembalikan ke form agar tidak perlu diketik ulang (TANPA password). */
  values?: Record<string, string>;
};

function firstErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

async function signInWithCredentials(email: string, password: string, redirectTo: string): Promise<AuthFormState> {
  try {
    // Bila berhasil, signIn melempar "redirect" yang ditangani Next.js (bukan error sungguhan).
    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code;
      if (code === "rate_limited") {
        return { error: "Terlalu banyak percobaan masuk. Silakan coba lagi dalam 15 menit.", values: { email } };
      }
      if (error.type === "CredentialsSignin") {
        return { error: "Email atau password salah.", values: { email } };
      }
      console.error("[auth] signIn error:", error);
      return { error: "Tidak dapat masuk saat ini. Silakan coba lagi.", values: { email } };
    }
    throw error; // redirect sukses & error lain diteruskan ke Next.js
  }
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({ email: str(formData, "email"), password: str(formData, "password") });
  if (!parsed.success) {
    return { fieldErrors: firstErrors(parsed.error.issues), values: { email: str(formData, "email") } };
  }
  const redirectTo = safeCallbackUrl(str(formData, "callbackUrl"));
  return signInWithCredentials(parsed.data.email, parsed.data.password, redirectTo);
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    name: str(formData, "name"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  };
  const values = { name: raw.name, email: raw.email, phone: raw.phone };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error.issues), values };

  try {
    await createCustomer(parsed.data);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { fieldErrors: { email: "Email sudah terdaftar. Silakan masuk." }, values };
    }
    console.error("[auth] register error:", error);
    return { error: "Pendaftaran gagal. Silakan coba lagi.", values };
  }

  // Langsung masuk setelah berhasil daftar.
  return signInWithCredentials(parsed.data.email, parsed.data.password, safeCallbackUrl(str(formData, "callbackUrl")));
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
