import type { Metadata } from "next";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { siteImages } from "@/lib/config/images";
import { usableImage } from "@/lib/site-images";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { Card } from "@/components/ui/Card";
import { mapsUrl, siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Kontak",
  description: `Hubungi ${siteConfig.name} untuk kebutuhan material logam konstruksi.`,
};

const contactItems = [
  { icon: MapPin, label: "Alamat", value: siteConfig.address, href: undefined },
  { icon: Phone, label: "Telepon", value: siteConfig.phone.display, href: siteConfig.phone.href },
  { icon: Mail, label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
];

export default function ContactPage() {
  const officePhoto = usableImage(siteImages.contactOffice);

  return (
    <>
      <PageHeader
        image={siteImages.contactHeader}
        eyebrow="Kontak"
        title="Hubungi Kami"
        description="Kirim pertanyaan atau permintaan penawaran material. Tim kami akan menghubungi Anda."
      />

      <section className="bg-surface py-16 sm:py-24">
        <Container className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-8">
          <Reveal className="flex h-fit flex-col gap-6">
            {officePhoto && (
              <Photo image={officePhoto} sizes="(min-width: 1024px) 38vw, 100vw" className="aspect-[4/3]" />
            )}
            <Card>
              <h2 className="text-[20px] font-[450] text-neutral-950">Informasi Kontak</h2>
              <ul className="mt-6 flex flex-col gap-5">
                {contactItems.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-ink text-accent">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[13px] text-neutral-500">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className="break-words rounded-sm text-[15px] text-neutral-900 underline-offset-4 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-[15px] text-neutral-900">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-sm text-[14px] font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Lihat di Google Maps
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">(membuka tab baru)</span>
              </a>
            </Card>
          </Reveal>

          <Reveal delay={120}>
            <Card>
              <h2 className="text-[20px] font-[450] text-neutral-950">Kirim Pesan</h2>
              <p className="mt-2 text-[15px] text-neutral-600">
                Kirim pertanyaan atau permintaan penawaran. Kami akan membalas melalui email atau telepon.
              </p>
              <ContactForm />
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
