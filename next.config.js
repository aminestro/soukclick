/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["media.soukclick.store"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        net:    false,
        tls:    false,
        fs:     false,
      }
    }
    return config
  },
}

module.exports = nextConfig
