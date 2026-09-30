"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * next/image yang fade-in halus setelah selesai dimuat (tidak "muncul tiba-tiba").
 * Tanpa JavaScript, gambar tetap tampil normal (lihat .fade-img di globals.css).
 * Gambar `priority` (paling penting di layar awal) TIDAK di-fade agar tampil secepat mungkin.
 */
export function FadeImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  // eslint-disable-next-line jsx-a11y/alt-text -- alt diteruskan lewat props
  if (props.priority) return <Image {...props} className={className} onLoad={onLoad} />;
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt diteruskan lewat props
    <Image
      {...props}
      data-loaded={loaded ? "true" : "false"}
      className={cn("fade-img", className)}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
