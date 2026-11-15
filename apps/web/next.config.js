/** @type {import('next').NextConfig} */
const capacitorBuild = process.env.CAPACITOR_BUILD === '1'

const nextConfig = {
  // Vercel uses the standard Next.js server build. The Android pipeline opts
  // into a static export so Capacitor packages the exact same app UI.
  ...(capacitorBuild ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
