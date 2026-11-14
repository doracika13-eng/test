import type { NextConfig } from "next";

// STATIC_EXPORT=1 → fully static site in /out (used for Netlify, see netlify.toml).
// Phase 2 (Shopify checkout, newsletter API) needs the server build: `npm run build`.
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStatic ? { output: "export" as const, trailingSlash: true } : {}),
  poweredByHeader: false,
  images: {
    unoptimized: isStatic,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1440, 1920],
    remotePatterns: [
      // Shopify-hosted product media (Phase 2)
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  ...(isStatic ? {} : { headers: serverHeaders }),
};

async function serverHeaders() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
}

export default nextConfig;
