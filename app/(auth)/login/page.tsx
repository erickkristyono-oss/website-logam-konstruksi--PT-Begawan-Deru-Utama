import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/dal";
import { safeCallbackUrl } from "@/lib/validations/auth";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);

  const fromProtected = typeof params.callbackUrl === "string";

  return (
    <>
      <h1 className="text-[30px] font-normal leading-tight text-neutral-950">Masuk</h1>
      <p className="mt-2 text-neutral-600">
        {fromProtected ? "Silakan masuk untuk melanjutkan." : "Masuk ke akun Anda untuk berbelanja dan melihat pesanan."}
      </p>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </>
  );
}
