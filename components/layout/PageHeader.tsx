import type { ReactNode } from "react";
import { Animate } from "@/components/ui/Animate";
import { Container } from "@/components/layout/Container";
import { BackgroundPhoto } from "@/components/ui/Photo";
import type { SiteImage } from "@/lib/config/images";
import { usableImage } from "@/lib/site-images";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Foto latar (opsional) — diatur di lib/config/images.ts. */
  image?: SiteImage;
};

/** Pita judul gelap untuk halaman selain homepage; header kaca berada di atasnya. */
export function PageHeader({ eyebrow, title, description, image }: PageHeaderProps) {
  const photo = usableImage(image);
  return (
    <section className="relative overflow-hidden bg-ink">
      {photo ? (
        <BackgroundPhoto image={photo} priority />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_90%_0%,rgba(168,42,178,0.16),transparent_70%)]"
        />
      )}
      <Container className="relative pb-14 pt-[132px] sm:pb-20 sm:pt-[160px]">
        <Animate delay={200} direction="up">
          {eyebrow && (
            <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.12em] text-accent">
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-[760px] text-[34px] font-normal leading-[1] text-white sm:text-[48px] md:text-[56px]">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-[560px] text-[16px] font-[450] leading-[1.4] text-white/75 sm:text-[18px]">
              {description}
            </p>
          )}
        </Animate>
      </Container>
    </section>
  );
}
