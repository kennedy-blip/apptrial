'use client'

import { useState, useCallback, useMemo } from 'react'
import { parse as parseCsv } from 'papaparse'
import * as XLSX from 'xlsx'
import { Download, FileText, BarChart3, Wand2, LayoutGrid, AlertCircle, Check, Loader2, RotateCw } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { DataCleaner } from '@/components/data-cleaner'
import { ChartStudio } from '@/components/chart-studio'
import { SummaryCards } from '@/components/summary-cards'
import { analyzeColumn, cleanRows, correlation, type ColumnStats, type Row } from '@/lib/stats'

type Tab = 'parser' | 'clean' | 'visualize' | 'summary'

export interface ParsedDataset {
  name: string
  columns: string[]
  rows: Row[]
  rawRows: Row[] // original, before cleaning
}

export default function Home() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)
  const [cleaned, setCleaned] = useState<Row[] | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('parser')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [chartPng, setChartPng] = useState<string | null>(null)

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
            // object of arrays -> transpose
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

        setDataset({
          name: file.name,
          columns,
          rows,
          rawRows: [...rows],
        })
        setCleaned(null)
        setActiveTab('clean')
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

    if (resultIsBuffer(ext)) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }, [])

  const resultIsBuffer = (ext: string) => ext === 'xlsx' || ext === 'xls'

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
    setActiveTab('parser')
  }

  if (!dataset) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">DataDrop</span>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Offline-first</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                  disabled={!dataset}
                >
                  New dataset
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-6 uppercase tracking-wider">
              DataDrop · Mobile Data Cleaner
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Inspect & clean your data<br />
              <span className="text-indigo-600">right on your phone.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload a CSV, JSON, or Excel file to instantly see row counts, column types, nulls, and
              outliers. Then clean, chart, and export — no code, no server, works fully offline once
              installed as an app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <label className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition cursor-pointer">
                <Download className="w-5 h-5 mr-2" />
                Choose file (CSV / JSON / Excel)
                <input
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </label>
              <button
                className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg border border-slate-200 hover:bg-slate-50 transition"
                disabled
              >
                Try sample data
              </button>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'CSV · JSON · Excel', desc: 'Instant file parser' },
                { label: 'Dedupe · Trim · Fill', desc: 'One-tap cleaning' },
                { label: 'Bar · Line · Scatter', desc: 'Quick charts' },
                { label: 'Mean · Median · StdDev', desc: 'Summary cards' },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{f.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="p-2 text-slate-400 hover:text-indigo-600"
                title="New dataset"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 text-sm">{dataset.name}</span>
                  <span className="text-xs text-slate-500">
                    {dataset.rows.length} rows × {dataset.columns.length} cols
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartPng(null)}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Back to upload
              </button>
              <a
                href={URL.createObjectURL(new Blob([JSON.stringify(currentRows, null, 2)], { type: 'application/json' }))}
                download={`cleaned-${dataset.name.replace(/\.[^/.]+$/, '')}.json`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </a>
            </div>
          </div>
        </div>
      </nav>

      {parseError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
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

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {[
            ['parser', 'Parser'],
            ['clean', 'Clean'],
            ['visualize', 'Charts'],
            ['summary', 'Summary'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {activeTab === 'parser' && (
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Dataset preview</h2>
              <p className="text-sm text-slate-500 mb-4">
                First 50 rows shown. Use Clean to transform, then Charts or Summary to analyze.
              </p>
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
              onExportPng={setChartPng}
            />
          )}
          {activeTab === 'summary' && (
            <SummaryCards columns={columns} rows={currentRows} stats={stats} />
          )}
        </div>

        {chartPng && (
          <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Chart export</h2>
              <a
                href={chartPng}
                download="datadrop-chart.png"
                className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" /> Download PNG
              </a>
            </div>
            <div className="p-6 flex justify-center items-center min-h-[300px] bg-slate-50">
              <img src={chartPng} alt="Exported chart" className="max-w-full max-h-[500px] rounded-lg border border-slate-200 shadow" />
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <span>DataDrop — client-side only. Your data never leaves your device.</span>
          <span>CSV · JSON · Excel · Offline · PNG export</span>
        </div>
      </footer>
    </div>
  )
}
