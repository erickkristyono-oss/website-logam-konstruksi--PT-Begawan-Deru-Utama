import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { mainNav } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";

const linkClass =
  "rounded-sm text-[15px] text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.4fr] lg:gap-10">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-[320px] text-[15px] leading-[1.5] text-white/70">
            {siteConfig.tagline}
          </p>
        </div>

        <nav aria-label="Navigasi footer">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/50">
            Menu
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>


        <div>
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/50">
            Kontak
          </h2>
          <ul className="mt-4 flex flex-col gap-4 text-[15px] text-white/70">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <address className="not-italic">{siteConfig.address}</address>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <a href={siteConfig.phone.href} className={linkClass}>
                {siteConfig.phone.display}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <a href={`mailto:${siteConfig.email}`} className={`${linkClass} break-words`}>
                {siteConfig.email}
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Hak cipta dilindungi.
          </p>
        </Container>
      </div>
    </footer>
  );
}
