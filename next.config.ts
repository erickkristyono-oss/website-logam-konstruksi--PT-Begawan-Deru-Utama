import type { NextConfig } from "next";

/**
 * Header keamanan dasar untuk semua halaman. (HSTS & Content-Security-Policy diatur saat
 * persiapan production di Phase 11, karena bergantung pada domain & hosting.)
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Upload foto produk dari halaman admin (maks. 5 MB + overhead form).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
