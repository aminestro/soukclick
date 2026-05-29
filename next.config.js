/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["media.soukclick.store"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
