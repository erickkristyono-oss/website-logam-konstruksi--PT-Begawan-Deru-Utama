import { PackageX } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProductNotFound() {
  return (
    <>
      <div className="bg-ink pt-[100px] sm:pt-[118px]" />
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <EmptyState
            icon={PackageX}
            title="Produk tidak ditemukan"
            description="Produk yang Anda cari tidak tersedia atau sudah tidak dijual."
            action={
              <ButtonLink href="/products" variant="dark" size="md">
                Lihat Semua Produk
              </ButtonLink>
            }
          />
        </Container>
      </section>
    </>
  );
}
