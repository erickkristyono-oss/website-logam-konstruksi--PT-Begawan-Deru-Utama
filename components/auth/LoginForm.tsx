"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <FormAlert message={state.error} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field id="email" label="Email" required error={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          aria-invalid={!!fe.email}
          aria-describedby={fe.email ? "email-error" : undefined}
        />
      </Field>

      <Field id="password" label="Password" required error={fe.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={!!fe.password}
          aria-describedby={fe.password ? "password-error" : undefined}
        />
      </Field>

      <Button type="submit" variant="dark" size="lg" fullWidth disabled={pending} aria-busy={pending}>
        {pending ? "Memproses..." : "Masuk"}
      </Button>

      <p className="text-center text-[14px] text-neutral-600">
        Belum punya akun?{" "}
        <Link
          href={callbackUrl !== "/account" ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
