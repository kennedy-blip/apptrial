import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'DataDrop — Pocket Data-Wrangling Utility',
  description:
    'Parse, clean, explore, visualize, and export CSV, JSON, and Excel data privately on your device.',
  applicationName: 'DataDrop',
  appleWebApp: {
    capable: true,
    title: 'DataDrop',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  )
}
