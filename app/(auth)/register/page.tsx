import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/dal";
import { safeCallbackUrl } from "@/lib/validations/auth";

export const metadata: Metadata = {
  title: "Daftar",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function RegisterPage({ searchParams }: Props) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);

  return (
    <>
      <h1 className="text-[30px] font-normal leading-tight text-neutral-950">Buat akun</h1>
      <p className="mt-2 text-neutral-600">Daftar untuk memesan material dan memantau pesanan Anda.</p>
      <div className="mt-8">
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </>
  );
}
