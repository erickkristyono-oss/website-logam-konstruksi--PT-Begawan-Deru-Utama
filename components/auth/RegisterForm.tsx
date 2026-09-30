"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(registerAction, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const described = (f: string) => (fe[f] ? `${f}-error` : undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <FormAlert message={state.error} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field id="name" label="Nama lengkap" required error={fe.name}>
        <Input id="name" name="name" autoComplete="name" required maxLength={100} defaultValue={v.name}
          aria-invalid={!!fe.name} aria-describedby={described("name")} />
      </Field>

      <Field id="email" label="Email" required error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={v.email}
          aria-invalid={!!fe.email} aria-describedby={described("email")} />
      </Field>

      <Field id="phone" label="Telepon" hint="Opsional — untuk konfirmasi pesanan" error={fe.phone}>
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="08xx-xxxx-xxxx"
          defaultValue={v.phone} aria-invalid={!!fe.phone} aria-describedby={fe.phone ? "phone-error" : "phone-hint"} />
      </Field>

      <Field id="password" label="Password" required hint="Minimal 8 karakter, berisi huruf dan angka" error={fe.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} maxLength={128}
          aria-invalid={!!fe.password} aria-describedby={fe.password ? "password-error" : "password-hint"} />
      </Field>

      <Field id="confirmPassword" label="Ulangi password" required error={fe.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required maxLength={128}
          aria-invalid={!!fe.confirmPassword} aria-describedby={described("confirmPassword")} />
      </Field>

      <Button type="submit" variant="dark" size="lg" fullWidth disabled={pending} aria-busy={pending}>
        {pending ? "Mendaftarkan..." : "Daftar"}
      </Button>

      <p className="text-center text-[14px] text-neutral-600">
        Sudah punya akun?{" "}
        <Link
          href={callbackUrl !== "/account" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
