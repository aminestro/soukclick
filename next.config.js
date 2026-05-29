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
}

module.exports = nextConfig
