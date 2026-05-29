/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development"

const nextConfig = {
  // standalone only for production builds (Docker / EasyPanel)
  // next dev works without it; enabling it in dev breaks HMR occasionally
  ...(isDev ? {} : { output: "standalone" }),

  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket (production)
      {
        protocol: "https",
        hostname:  "media.soukclick.store",
        pathname:  "/**",
      },
      // Placehold.co — seed / test images
      {
        protocol: "https",
        hostname:  "placehold.co",
        pathname:  "/**",
      },
      // localhost — next/image from local uploads during dev
      {
        protocol: "http",
        hostname:  "localhost",
        pathname:  "/**",
      },
    ],
    formats: ["image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",       value: "DENY"                            },
          { key: "X-Content-Type-Options", value: "nosniff"                         },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },

  trailingSlash: false,

  // Relax during dev so the server always starts even with TS warnings
  typescript: { ignoreBuildErrors: isDev },
  eslint:     { ignoreDuringBuilds: isDev },
}

module.exports = nextConfig
