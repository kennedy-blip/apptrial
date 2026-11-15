'use client'

import { useState, useEffect } from 'react'

// Where the built .apk is served from.
// Options: '/AppTrial.apk' (place the built APK in apps/web/public/)
//          or a GitHub Release asset URL after CI builds it for you.
const APK_DOWNLOAD_URL = '/AppTrial.apk'

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Gentle one-time suggestion popup on first visit
  useEffect(() => {
    const suggested = localStorage.getItem('apptrial:suggested')
    if (!suggested) {
      setModalOpen(true)
      localStorage.setItem('apptrial:suggested', '1')
    }
  }, [])

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setDownloading(true)
    // Let the browser download; keep modal open so user can see install steps
    setTimeout(() => setDownloading(false), 1500)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="font-bold text-xl tracking-tight">AppTrial</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-indigo-600 font-medium transition">
                Features
              </a>
              <a href="#download" className="text-slate-600 hover:text-indigo-600 font-medium transition">
                Download
              </a>
              <a
                href={APK_DOWNLOAD_URL}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                download
              >
                Get the APK
              </a>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600"
              aria-label="Open download menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <section className="text-center py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            Built for mobile
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            AppTrial in your browser,<br />
            <span className="text-indigo-600">the app on your phone.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Open the link, try the experience right here, then download and install the Android APK so
            you can use it anytime — even offline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition"
            >
              Download & install APK
            </button>
            <a href="#features" className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg border border-slate-200 hover:bg-slate-50 transition">
              See features
            </a>
          </div>

          <div className="mt-16 flex items-center justify-center gap-4 opacity-60 text-sm text-slate-500">
            <span className="h-px bg-slate-300 flex-1"></span>
            <span>Or scan to open</span>
            <span className="h-px bg-slate-300 flex-1"></span>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="w-40 h-40 rounded-2xl bg-white shadow p-2 flex items-center justify-center border border-slate-100">
              <svg className="w-24 h-24 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 border-t border-slate-200">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Why install the app?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Works offline',
                desc: 'Once installed, the app runs without an internet connection.',
                icon: 'wifi',
              },
              {
                title: 'Faster than the web',
                desc: 'Native performance and instant launches from your home screen.',
                icon: 'zap',
              },
              {
                title: 'Always up to date',
                desc: 'Open the app and it checks for updates automatically.',
                icon: 'refresh-cw',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:border-slate-300 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                  {feature.icon === 'wifi' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a6 6 0 0112 0m0 0a6 6 0 0112 0M3 15a6 6 0 01-1.143-3.782c-.205-.783-.205-1.73-.205-2.782a3 3 0 015.988 0m-5.988 0a3 3 0 005.988 0m-3.112 0a14.002 14.002 0 017.896 0m-7.896 0a14.002 14.002 0 007.896 0" />
                    </svg>
                  )}
                  {feature.icon === 'zap' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {feature.icon === 'refresh-cw' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Download suggestion section */}
        <section id="download" className="py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to install?</h2>
            <p className="text-slate-600 mb-8">
              Tap below to download the <span className="font-medium">AppTrial.apk</span> file and install it on your Android device.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download AppTrial.apk
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <span>AppTrial. Built with Next.js + Capacitor.</span>
          <span className="flex gap-4">
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
          </span>
        </div>
      </footer>

      {/* Download modal */}
      <div
        className={`
          fixed inset-0 z-50 ${modalOpen ? 'flex' : 'hidden'}
          items-center justify-center
          bg-slate-900/60 backdrop-blur-sm
          transition-opacity duration-200
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Download app"
      >
        {/* Backdrop click to close */}
        <button
          onClick={() => setModalOpen(false)}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />
        <div className="relative w-full max-w-md mx-auto p-6">
          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-2xl mb-6">
              ⬇
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Download AppTrial</h2>
            <p className="text-slate-600 text-center mb-8">
              Install the Android app and open it anytime from your home screen.
            </p>

            <div className="space-y-3">
              <a
                href={APK_DOWNLOAD_URL}
                onClick={handleDownload}
                download
                className={`w-full py-5 rounded-xl flex items-center justify-center gap-3 font-semibold text-lg transition ${
                  downloading
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30'
                }`}
              >
                {downloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l7-7.007z"
                      ></path>
                    </svg>
                    Preparing download…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Download AppTrial.apk
                  </>
                )}
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">How to install</h3>
              <ol className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>Tap <strong>Download AppTrial.apk</strong> above.</li>
                <li>If Chrome blocks the file, tap <strong>Keep</strong> or <strong>Download anyway</strong>.</li>
                <li>Open the downloaded file and tap <strong>Install</strong>.</li>
                <li>If prompted, enable <strong>Install from this browser</strong> in Settings → Apps → Special app access.</li>
                <li>Open AppTrial from your home screen.</li>
              </ol>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="mt-8 w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
