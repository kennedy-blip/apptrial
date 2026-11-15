import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AppTrial — Try the App',
  description: 'Open AppTrial in your browser, then download and install the Android app.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased">{children}</body>
    </html>
  )
}
