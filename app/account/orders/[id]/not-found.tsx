import { PackageX } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function OrderNotFound() {
  return (
    <>
      <div className="bg-ink pt-[100px] sm:pt-[118px]" />
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <EmptyState
            icon={PackageX}
            title="Pesanan tidak ditemukan"
            description="Pesanan ini tidak ada atau bukan milik akun Anda."
            action={
              <ButtonLink href="/account/orders" variant="dark" size="md">
                Pesanan Saya
              </ButtonLink>
            }
          />
        </Container>
      </section>
    </>
  );
}
