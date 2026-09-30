import { BackgroundPhoto } from "@/components/ui/Photo";
import { siteImages } from "@/lib/config/images";
import { usableImage, usableVideo } from "@/lib/site-images";

/**
 * Background hero. Foto / video diatur di lib/config/images.ts (hero, heroVideo).
 * Urutan: video → foto → latar bawaan (gradient + grid garis tipis, 0 KB aset).
 * Video harus muted + playsInline agar autoplay di iOS.
 */
export function HeroBackground() {
  const video = usableVideo(siteImages.heroVideo);
  const photo = video ? null : usableImage(siteImages.hero);

  if (photo) return <BackgroundPhoto image={photo} priority />;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {video ? (
        <>
          <video className="absolute inset-0 h-full w-full object-cover" src={video} autoPlay loop muted playsInline />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,25,0.9)_0%,rgba(8,10,25,0.5)_100%)]" />
        </>
      ) : (
        <>
          {/* Cahaya ungu brand + biru baja */}
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_20%,rgba(168,42,178,0.22),transparent_70%),radial-gradient(50%_60%_at_10%_90%,rgba(70,110,170,0.28),transparent_70%)]" />
          {/* Grid garis tipis, memudar ke tepi */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
        </>
      )}
    </div>
  );
}
