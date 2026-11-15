'use client'

import { useState, useCallback, useMemo } from 'react'
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
} from 'lucide-react'
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

export default function Home() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)
  const [cleaned, setCleaned] = useState<Row[] | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('parser')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [chartPng, setChartPng] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!dataset ? (
        <LandingSection
          handleFile={handleFile}
          loadSampleDataset={loadSampleDataset}
          handleApkDownload={handleApkDownload}
          isParsing={isParsing}
          isDownloading={isDownloading}
          reset={reset}
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
        />
      )}
    </div>
  )
}

function LandingSection({
  handleFile,
  loadSampleDataset,
  handleApkDownload,
  isParsing,
  isDownloading,
  reset,
}: {
  handleFile: (file: File) => void
  loadSampleDataset: () => void
  handleApkDownload: () => void
  isParsing: boolean
  isDownloading: boolean
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-slate-900">DataDrop</span>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full block mt-1">Offline-first APK</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
                disabled
              >
                New dataset
              </button>
              <a
                href={APK_DOWNLOAD_URL}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/40 transition flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Get the APK
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-6 uppercase tracking-wider shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600" />
            </span>
            DataDrop · Mobile Data Cleaner
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Clean your data<br />
            <span className="text-indigo-600 font-bold">anywhere — even offline.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            Upload a CSV, JSON, or Excel file to instantly inspect, clean, and visualize it — right
            from your phone's browser. Install the APK to work with files from WhatsApp or email
            completely offline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <label className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-500/40 transition cursor-pointer">
              <Download className="w-5 h-5 mr-2" />
              Choose file (CSV / JSON / Excel)
              <input
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] as File)}
              />
            </label>
            <button
              onClick={loadSampleDataset}
              disabled={isParsing}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg border shadow-md transition flex items-center justify-center gap-2 ${
                isParsing
                  ? 'bg-white text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
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
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="p-8 md:p-12 flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Get the mobile app</h2>
              <p className="text-slate-600 mb-6">
                Install DataDrop on Android to inspect files straight from your downloads — no
                internet needed.
              </p>
              <button
                onClick={handleApkDownload}
                disabled={isDownloading}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed ${
                  isDownloading
                    ? 'bg-slate-200 text-slate-400'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/50'
                }`}
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
              </button>
              <p className="text-xs text-slate-400 mt-3">
                Sideload on Android · Enable "Install unknown apps" for your browser
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center p-8">
              <div className="w-48 h-48 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-lg shadow-indigo-100">
                <Smartphone className="w-24 h-24 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Instant file parser',
                desc: 'CSV, JSON, Excel — see rows, columns, types, nulls, and outliers.',
                color: 'bg-indigo-100 text-indigo-600',
                Icon: Download,
              },
              {
                title: 'One-tap cleaning',
                desc: 'Dedupe, trim whitespace, fill missing values — no code required.',
                color: 'bg-emerald-100 text-emerald-600',
                Icon: Zap,
              },
              {
                title: 'Quick charts',
                desc: 'Bar, line, scatter, distribution — export as PNG.',
                color: 'bg-blue-100 text-blue-600',
                Icon: Smartphone,
              },
            ].map((f) => {
              const Icon = f.Icon
              return (
                <div key={f.title} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <span>DataDrop — client-side only. Your data never leaves your device.</span>
          <span className="flex gap-4">
            <a href="#" className="hover:text-slate-700">Privacy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
          </span>
        </div>
      </footer>
    </div>
  )
}

function LoadedSection({
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
}: {
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
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="p-2 text-slate-400 hover:text-indigo-600 transition"
                title="New dataset"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900">{dataset.name}</span>
                  <span className="text-xs text-slate-500">
                    {dataset.rows.length} rows × {dataset.columns.length} cols
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {}}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              >
                Back to upload
              </button>
              <a
                href={URL.createObjectURL(new Blob([unparse(currentRows)], { type: 'text/csv' }))}
                download={`cleaned-${dataset.name.replace(/\.[^/.]+$/, '')}.csv`}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </a>
              <a
                href={URL.createObjectURL(new Blob([JSON.stringify(currentRows, null, 2)], { type: 'application/json' }))}
                download={`cleaned-${dataset.name.replace(/\.[^/.]+$/, '')}.json`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-500/40 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </a>
            </div>
          </div>
        </div>
      </nav>

      {parseError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">Parse error</h3>
                <p className="text-sm text-red-700 mt-1">{parseError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
                activeTab === t.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          {activeTab === 'parser' && (
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Dataset preview</h2>
                  <p className="text-sm text-slate-500">
                    First 50 rows shown. Use Clean to transform, then Charts or Summary to analyze.
                  </p>
                </div>
              </div>
              <DataTable columns={columns} rows={currentRows} maxRows={50} />
            </div>
          )}
          {activeTab === 'clean' && (
            <DataCleaner dataset={dataset} onClean={handleClean} />
          )}
          {activeTab === 'visualize' && (
            <ChartStudio
              columns={columns}
              rows={currentRows}
              numericCols={numericCols}
              stats={stats}
              onExportPng={() => {}}
            />
          )}
          {activeTab === 'summary' && (
            <SummaryCards columns={columns} rows={currentRows} stats={stats} />
          )}
        </div>

        {chartPng && (
          <div className="mt-8 rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Chart export</h2>
              <a
                href={chartPng}
                download="datadrop-chart.png"
                className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PNG
              </a>
            </div>
            <div className="p-8 flex justify-center items-center min-h-[300px] bg-slate-50">
              <img src={chartPng} alt="Exported chart" className="max-w-full max-h-[500px] rounded-xl border border-slate-200 shadow-lg" />
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <span>DataDrop — client-side only. Your data never leaves your device.</span>
          <span className="flex gap-4">
            <a href="#" className="hover:text-slate-700">Privacy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
