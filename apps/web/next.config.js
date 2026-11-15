/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor packages the static site from apps/web/out.
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
