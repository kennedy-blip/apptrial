'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { parse as parseCsv, unparse } from 'papaparse'
import * as XLSX from 'xlsx'
import {
  Download,
  FileText,
  AlertCircle,
  Loader2,
  RotateCw,
  Smartphone,
  Zap,
  Moon,
  Sun,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DataTable } from '@/components/data-table'
import { DataCleaner } from '@/components/data-cleaner'
import { ChartStudio } from '@/components/chart-studio'
import { SummaryCards } from '@/components/summary-cards'
import { analyzeColumn, cleanRows, correlation, type ColumnStats, type Row } from '@/lib/stats'

const APK_DOWNLOAD_URL =
  'https://github.com/kennedy-blip/apptrial/releases/download/AppTrial-latest/AppTrial.apk'

type Tab = 'parser' | 'clean' | 'visualize' | 'summary'

export interface ParsedDataset {
  name: string
  columns: string[]
  rows: Row[]
  rawRows: Row[]
}

const SAMPLE_CSV = `date,product,region,units,revenue,rating
2024-01-01,Widget A,North,10,250.00,4.5
2024-01-02,Widget B,South,15,375.00,4.2
2024-01-01,Widget A,North,10,250.00,4.5
2024-01-03, Widget C ,East,20,,4.0
2024-01-04,Widget A,West,8,200.00,
2024-01-05,Widget B,South,12,300.00,3.8
,Widget C,East,20,500.00,4.7
2024-01-07,Widget A,North,10,250.00,4.5
2024-01-08,Widget D,West,5,125.00,4.1
2024-01-08,Widget D,West,5,125.00,4.1`

function setDatasetFromParsed(
  setDataset: (d: ParsedDataset) => void,
  setCleaned: () => void,
  setActiveTab: (t: Tab) => void,
  name: string,
  columns: string[],
  rows: Row[]
) {
  setDataset({ name, columns, rows, rawRows: [...rows] })
  setCleaned()
  setActiveTab('clean')
}

interface LandingSectionProps {
  handleFile: (file: File) => void
  loadSampleDataset: () => void
  handleApkDownload: () => void
  toggleDark: () => void
  darkMode: boolean
  isParsing: boolean
  isDownloading: boolean
  reset: () => void
  isLight: boolean
  cardBg: string
  cardBorder: string
  textMain: string
  textMuted: string
  inputBg: string
  inputBorder: string
}

interface LoadedSectionProps {
  dataset: ParsedDataset
  currentRows: Row[]
  columns: string[]
  stats: ColumnStats[]
  numericCols: string[]
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  tabs: { key: Tab; label: string }[]
  parseError: string | null
  chartPng: string | null
  reset: () => void
  handleClean: (actions: Parameters<typeof cleanRows>[1]) => void
  darkMode: boolean
  toggleDark: () => void
  isLight: boolean
  cardBg: string
  cardBorder: string
  textMain: string
  textMuted: string
  inputBg: string
  inputBorder: string
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)
  const [cleaned, setCleaned] = useState<Row[] | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('parser')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [chartPng, setChartPng] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Dark mode persistence — sync to <html> class for Tailwind darkMode: 'class'
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    try {
      localStorage.setItem('datadrop:dark', next ? '1' : '0')
    } catch {}
  }

  const handleFile = useCallback((file: File) => {
    setParseError(null)
    setIsParsing(true)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (!result) throw new Error('Failed to read file')

        let columns: string[] = []
        let rows: Row[] = []

        if (ext === 'csv') {
          const text = typeof result === 'string' ? result : new TextDecoder().decode(result as ArrayBuffer)
          const parsed = parseCsv(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          })
          if (parsed.errors.length > 0 && parsed.data.length === 0) {
            throw new Error(parsed.errors[0].message ?? 'CSV parse error')
          }
          columns = parsed.meta.fields ?? []
          rows = (parsed.data as unknown as Row[]).filter(
            (r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== '')
          )
        } else if (ext === 'json') {
          const text = typeof result === 'string' ? result : new TextDecoder().decode(result as ArrayBuffer)
          const data = JSON.parse(text)
          if (Array.isArray(data)) {
            columns = data.length > 0 ? Object.keys(data[0]) : []
            rows = data as Row[]
          } else if (data && typeof data === 'object') {
            const keys = Object.keys(data)
            const firstKey = keys[0]
            const len = Array.isArray(data[firstKey]) ? data[firstKey].length : 0
            columns = keys
            rows = []
            for (let i = 0; i < len; i++) {
              const r: Row = {}
              for (const k of keys) {
                const arr = data[k]
                r[k] = Array.isArray(arr) ? arr[i] : undefined
              }
              rows.push(r)
            }
          } else {
            throw new Error('Unsupported JSON structure. Use an array of objects.')
          }
        } else if (ext === 'xlsx' || ext === 'xls') {
          const buffer = result as ArrayBuffer
          const workbook = XLSX.read(buffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]
          if (json.length < 2) throw new Error('Excel sheet is empty')
          columns = (json[0] as unknown[]).map(String)
          rows = json.slice(1).map((r) => {
            const obj: Row = {}
            columns.forEach((c, i) => {
              obj[c] = r[i]
            })
            return obj
          })
        } else {
          throw new Error('Unsupported file type. Upload .csv, .json, or .xlsx')
        }

        if (rows.length === 0) {
          throw new Error('No data rows found in file')
        }

        setDatasetFromParsed(setDataset, () => setCleaned(null), setActiveTab, file.name, columns, rows)
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Unknown parse error')
      } finally {
        setIsParsing(false)
      }
    }

    reader.onerror = () => {
      setParseError('Failed to read file')
      setIsParsing(false)
    }

    if (ext === 'xlsx' || ext === 'xls') {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }, [])

  const loadSampleDataset = useCallback(() => {
    setParseError(null)
    setIsParsing(true)
    setTimeout(() => {
      try {
        const parsed = parseCsv(SAMPLE_CSV, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        })
        const columns = parsed.meta.fields ?? []
        const rows = (parsed.data as unknown as Row[]).filter(
          (r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== '')
        )
        setDatasetFromParsed(setDataset, () => setCleaned(null), setActiveTab, 'sample-data.csv', columns, rows)
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Unknown parse error')
      } finally {
        setIsParsing(false)
      }
    }, 300)
  }, [])

  const handleClean = useCallback(
    (actions: Parameters<typeof cleanRows>[1]) => {
      if (!dataset) return
      const next = cleanRows(dataset.rows, actions)
      setCleaned(next)
    },
    [dataset]
  )

  const currentRows = cleaned ?? dataset?.rows ?? []
  const columns = dataset?.columns ?? []

  const stats = useMemo(() => {
    if (currentRows.length === 0) return []
    return columns.map((col) => {
      const values = currentRows.map((r) => r[col])
      return analyzeColumn(col, values)
    })
  }, [currentRows, columns])

  const numericCols = stats.filter((s) => s.type === 'numeric').map((s) => s.name)

  const reset = () => {
    setDataset(null)
    setCleaned(null)
    setParseError(null)
    setChartPng(null)
    setIsDownloading(false)
    setActiveTab('parser')
  }

  const handleApkDownload = () => {
    setIsDownloading(true)
    setTimeout(() => setIsDownloading(false), 2000)
  }

  const tabs = [
    { key: 'parser' as Tab, label: 'Parser' },
    { key: 'clean' as Tab, label: 'Clean' },
    { key: 'visualize' as Tab, label: 'Charts' },
    { key: 'summary' as Tab, label: 'Summary' },
  ]

  const isLight = !darkMode

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {!dataset ? (
        <LandingSection
          handleFile={handleFile}
          loadSampleDataset={loadSampleDataset}
          handleApkDownload={handleApkDownload}
          toggleDark={toggleDark}
          darkMode={darkMode}
          isParsing={isParsing}
          isDownloading={isDownloading}
          reset={reset}
          isLight={isLight}
          cardBg={isLight ? 'bg-white/80' : 'bg-slate-900/60'}
          cardBorder={isLight ? 'border-slate-200' : 'border-slate-800/50'}
          textMain={isLight ? 'text-slate-900' : 'text-slate-100'}
          textMuted={isLight ? 'text-slate-500' : 'text-slate-400'}
          inputBg={isLight ? 'bg-white' : 'bg-slate-900/50'}
          inputBorder={isLight ? 'border-slate-300' : 'border-slate-700'}
        />
      ) : (
        <LoadedSection
          dataset={dataset}
          currentRows={currentRows}
          columns={columns}
          stats={stats}
          numericCols={numericCols}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          parseError={parseError}
          chartPng={chartPng}
          reset={reset}
          handleClean={handleClean}
          darkMode={darkMode}
          toggleDark={toggleDark}
          isLight={isLight}
          cardBg={isLight ? 'bg-white/90' : 'bg-slate-900/80'}
          cardBorder={isLight ? 'border-slate-200' : 'border-slate-800/50'}
          textMain={isLight ? 'text-slate-900' : 'text-slate-100'}
          textMuted={isLight ? 'text-slate-500' : 'text-slate-400'}
          inputBg={isLight ? 'bg-white' : 'bg-slate-900/50'}
          inputBorder={isLight ? 'border-slate-300' : 'border-slate-700'}
        />
      )}
    </div>
  )
}

const LandingSection = (props: LandingSectionProps) => {
  const {
    handleFile,
    loadSampleDataset,
    handleApkDownload,
    toggleDark,
    darkMode,
    isParsing,
    isDownloading,
    reset,
    isLight,
    textMain,
    textMuted,
  } = props

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="sticky top-0 z-40 border-b border-white/10 bg-white/10 backdrop-blur-xl transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className={`font-bold text-xl tracking-tight ${textMain}`}>DataDrop</span>
                <span className="text-xs font-medium text-indigo-500 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-full block mt-1">
                  Offline-first APK
                </span>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDark}
                className={`p-2.5 rounded-xl transition-all ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-yellow-400 hover:bg-slate-700'}`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <a
                href={APK_DOWNLOAD_URL}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg btn-gradient"
              >
                <Smartphone className="w-4 h-4" />
                Get the APK
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-[120px] -translate-y-1/3 dark:bg-indigo-900/30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-[120px] -translate-y-1/3 dark:bg-purple-900/30" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8 uppercase tracking-wider backdrop-blur-sm border border-white/20 dark:border-indigo-500/30"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400/60 opacity-70" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400" />
            </span>
            DataDrop · Mobile Data Cleaner
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
          >
            <span className={`${textMain} dark:text-slate-100`}>Clean your data</span><br />
            <span className="text-gradient bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 font-bold">
              anywhere — even offline.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-12 leading-relaxed"
          >
            Upload a CSV, JSON, or Excel file to instantly inspect, clean, and visualize it — right
            from your phone's browser. Install the APK to work with files from WhatsApp or email
            completely offline.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 ${isParsing ? 'bg-white/30 text-slate-400 border-white/20 opacity-60 cursor-not-allowed dark:bg-slate-800/30 dark:border-slate-700' : isLight ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-1' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:-translate-y-1'}`}
            >
              <Download className="w-5 h-5" />
              Choose file (CSV / JSON / Excel)
              <input
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] as File)}
              />
            </motion.label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadSampleDataset}
              disabled={isParsing}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${isParsing ? 'bg-white/30 text-slate-400 border-white/20 opacity-60 cursor-not-allowed dark:bg-slate-800/30 dark:border-slate-700' : isLight ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-1' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:-translate-y-1'}`}
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Try sample data
                </>
              )}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            className="rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl glass-card"
          >
            <div className="p-8 md:p-12 flex-1">
              <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Get the mobile app</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Install DataDrop on Android to inspect files straight from your downloads — no
                internet needed.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApkDownload}
                disabled={isDownloading}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed btn-gradient"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing download…
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Download DataDrop.apk (4.23 MB)
                  </>
                )}
              </motion.button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Sideload on Android · Enable "Install unknown apps" for your browser
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center p-8">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="w-48 h-48 rounded-2xl bg-indigo-50/40 dark:bg-indigo-900/30 border border-indigo-100/30 dark:border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-200/30 dark:shadow-indigo-900/30"
              >
                <Smartphone className="w-24 h-24 text-indigo-500 dark:text-indigo-400" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'Instant file parser',
                desc: 'CSV, JSON, Excel — see rows, columns, types, nulls, and outliers.',
                color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                Icon: Download,
              },
              {
                title: 'One-tap cleaning',
                desc: 'Dedupe, trim whitespace, fill missing values — no code required.',
                color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                Icon: Zap,
              },
              {
                title: 'Quick charts',
                desc: 'Bar, line, scatter, distribution — export as PNG.',
                color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                Icon: Smartphone,
              },
            ].map((f) => {
              const Icon = f.Icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-2xl transition-all hover:-translate-y-2 shadow-sm border glass-card"
                >
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>

      <footer className="border-t border-white/20 dark:border-white/10 bg-white/5 dark:bg-slate-900/5 backdrop-blur py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className={textMuted}>DataDrop — client-side only. Your data never leaves your device.</span>
          <span className="flex gap-4">
            <a href="#" className={`hover:text-indigo-400 transition ${textMuted}`}>Privacy</a>
            <a href="#" className={`hover:text-indigo-400 transition ${textMuted}`}>Terms</a>
          </span>
        </div>
      </footer>
    </div>
  )
}

const LoadedSection = (props: LoadedSectionProps) => {
  const {
    dataset,
    currentRows,
    columns,
    stats,
    numericCols,
    activeTab,
    setActiveTab,
    tabs,
    parseError,
    chartPng,
    reset,
    handleClean,
    darkMode,
    toggleDark,
    isLight,
    textMain,
    textMuted,
  } = props

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl transition-colors duration-300 ${isLight ? 'bg-white/80' : 'bg-slate-900/80'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={reset}
              className="p-2 rounded-xl transition-all hover:bg-white/20 dark:hover:bg-slate-800"
              title="New dataset"
            >
              <RotateCw className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </motion.div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className={`font-bold text-sm ${textMain}`}>{dataset.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {dataset.rows.length} rows × {dataset.columns.length} cols
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {}}
                className={`px-3 py-2 rounded-xl transition-all text-sm font-medium ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'}`}
              >
                Back to upload
              </motion.button>
              <a
                href={URL.createObjectURL(new Blob([unparse(currentRows)], { type: 'text/csv' }))}
                download={`cleaned-${dataset.name.replace(/\.[^/.]+$/, '')}.csv`}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-2 btn-gradient"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </a>
              <a
                href={URL.createObjectURL(new Blob([JSON.stringify(currentRows, null, 2)], { type: 'application/json' }))}
                download={`cleaned-${dataset.name.replace(/\.[^/.]+$/, '')}.json`}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-500/30 flex items-center gap-2 btn-gradient"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </a>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={toggleDark}
                className="p-2 rounded-xl transition-all hover:bg-white/20 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {parseError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
        >
          <div className={`rounded-2xl p-5 shadow-sm border transition-all ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800/50'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">Parse error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{parseError}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6"
        >
          {tabs.map((t) => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all shadow-sm ${activeTab === t.key ? isLight ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/60' : isLight ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              {t.label}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl glass-card`}
          >
            {activeTab === 'parser' && (
              <div className="p-8 border-b border-white/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-lg font-bold ${textMain} mb-1`}>Dataset preview</h2>
                    <p className={`text-sm ${textMuted}`}>
                      First 50 rows shown. Use Clean to transform, then Charts or Summary to analyze.
                    </p>
                  </div>
                </div>
                <DataTable columns={columns} rows={currentRows} maxRows={50} isLight={isLight} textMain={textMain} textMuted={textMuted} inputBg="" inputBorder="" />
              </div>
            )}
            {activeTab === 'clean' && (
              <DataCleaner dataset={dataset} onClean={handleClean} isLight={isLight} textMain={textMain} textMuted={textMuted} inputBg="" inputBorder="" />
            )}
            {activeTab === 'visualize' && (
              <ChartStudio columns={columns} rows={currentRows} numericCols={numericCols} stats={stats} onExportPng={() => {}} isLight={isLight} textMain={textMain} textMuted={textMuted} inputBg="" inputBorder="" />
            )}
            {activeTab === 'summary' && (
              <SummaryCards columns={columns} rows={currentRows} stats={stats} isLight={isLight} textMain={textMain} textMuted={textMuted} inputBg="" inputBorder="" />
            )}
          </motion.div>
        </AnimatePresence>

        {chartPng && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl glass-card"
          >
            <div className="p-6 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${textMain}`}>Chart export</h2>
              <a
                href={chartPng}
                download="datadrop-chart.png"
                className={`px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${isLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-400 hover:text-indigo-300'}`}
              >
                <Download className="w-4 h-4" /> Download PNG
              </a>
            </div>
            <div className="p-8 flex justify-center items-center min-h-[300px]">
              <img src={chartPng} alt="Exported chart" className="max-w-full max-h-[500px] rounded-xl border border-white/20 shadow-xl" />
            </div>
          </motion.div>
        )}
      </div>

      <footer className="border-t border-white/20 dark:border-white/10 bg-white/5 dark:bg-slate-900/5 backdrop-blur py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className={textMuted}>DataDrop — client-side only. Your data never leaves your device.</span>
          <span className="flex gap-4">
            <a href="#" className={`hover:text-indigo-400 transition ${textMuted}`}>Privacy</a>
            <a href="#" className={`hover:text-indigo-400 transition ${textMuted}`}>Terms</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
