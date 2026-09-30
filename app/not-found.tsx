import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-ink px-5 py-24 text-center">
      <div className="max-w-md">
        <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-accent">404</p>
        <h1 className="mt-3 text-[34px] font-normal leading-[1.05] text-white sm:text-[44px]">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 text-white/70">Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p>
        <ButtonLink href="/" variant="light" size="lg" className="mt-8">
          Kembali ke Beranda
        </ButtonLink>
      </div>
    </main>
  );
}
