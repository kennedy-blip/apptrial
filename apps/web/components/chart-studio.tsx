'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import {
  Bar,
  Line,
  Scatter,
} from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend, Title as TitleComponent } from 'chart.js'
import { BarChart3, Image as ImageIcon, Download, RotateCw, X, LayoutGrid } from 'lucide-react'
import { toPng } from 'html-to-image'
import { correlation, type ColumnStats } from '@/lib/stats'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type ChartType = 'bar' | 'line' | 'scatter' | 'distribution'

interface ChartStudioProps {
  columns: string[]
  rows: Record<string, unknown>[]
  numericCols: string[]
  stats: ColumnStats[]
  onExportPng: (png: string) => void
}

const EMPTY_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false, position: 'top' as const },
    title: { display: false, text: '' },
  },
}

export function ChartStudio({ columns, rows, numericCols, stats, onExportPng }: ChartStudioProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [xCol, setXCol] = useState<string | null>(columns[0] ?? null)
  const [yCol, setYCol] = useState<string | null>(numericCols[0] ?? null)
  const [chartTitle, setChartTitle] = useState('My Chart')
  const [chartColor, setChartColor] = useState('#6366f1')
  const chartRef = useRef<HTMLDivElement>(null)

  const xValues = rows.map((r) => r[xCol ?? ''])
  const yValues = rows.map((r) => r[yCol ?? ''])

  const numericX = xValues.map((v) => (typeof v === 'number' ? v : Number(v))).filter((v) => !Number.isNaN(v))
  const numericY = yValues.map((v) => (typeof v === 'number' ? v : Number(v))).filter((v) => !Number.isNaN(v))

  const data = useMemo(() => {
    const labels = xValues.map(String)

    if (chartType === 'scatter') {
      const points = rows.map((r) => ({
        x: r[xCol ?? ''],
        y: r[yCol ?? ''],
      })).filter((p) => p.x !== null && p.x !== undefined && p.x !== '' && p.y !== null && p.y !== undefined && p.y !== '')
      return {
        datasets: [
          {
            label: `${yCol} vs ${xCol}`,
            data: points as { x: number | string; y: number | string }[],
            backgroundColor: chartColor,
            borderColor: chartColor,
          },
        ],
      }
    }

    if (chartType === 'distribution' && yCol) {
      // histogram-like: bin numeric y values
      const vals = numericY
      if (vals.length === 0) return { labels: [], datasets: [] }
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const binCount = 10
      const binSize = (max - min) / binCount || 1
      const bins: { label: string; count: number }[] = []
      for (let i = 0; i < binCount; i++) {
        const lo = min + i * binSize
        const hi = min + (i + 1) * binSize
        const count = vals.filter((v) => v >= lo && v < hi).length
        bins.push({ label: `${lo.toFixed(1)}–${hi.toFixed(1)}`, count })
      }
      return {
        labels: bins.map((b) => b.label),
        datasets: [{ label: `Count of ${yCol}`, data: bins.map((b) => b.count), backgroundColor: chartColor }],
      }
    }

    return {
      labels,
      datasets: [
        {
          label: yCol ?? 'Value',
          data: yValues,
          backgroundColor: chartColor,
          borderColor: chartColor,
          borderWidth: 2,
          fill: chartType === 'line',
          tension: chartType === 'line' ? 0.3 : 0,
        },
      ],
    }
  }, [rows, chartType, xCol, yCol, numericY, xValues, yValues, chartColor])

  const options = useMemo(() => ({
    ...EMPTY_OPTIONS,
    plugins: {
      ...EMPTY_OPTIONS.plugins,
      title: { display: !!chartTitle, text: chartTitle },
      tooltip: { mode: 'nearest' as const, intersect: false },
    },
    scales: chartType === 'scatter'
      ? {
          x: { type: 'linear' as const, position: 'bottom', title: { display: true, text: xCol } },
          y: { title: { display: true, text: yCol }, beginAtZero: true },
        }
      : {
          x: chartType === 'distribution' ? { title: { display: true, text: yCol } } : { title: { display: true, text: xCol } },
          y: { title: { display: !!yCol, text: yCol }, beginAtZero: chartType !== 'line' },
        },
  }), [chartType, xCol, yCol, chartTitle])

  const ChartComponent = chartType === 'bar' ? Bar : chartType === 'line' ? Line : Scatter

  const handleExport = useCallback(async () => {
    if (!chartRef.current) return
    try {
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      })
      onExportPng(dataUrl)
    } catch (err) {
      // Fallback: try to grab canvas directly
      const canvas = chartRef.current.querySelector('canvas')
      if (canvas) {
        onExportPng(canvas.toDataURL('image/png'))
      }
    }
  }, [onExportPng])

  const canChart = Boolean(xCol && yCol && rows.length > 0)

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Chart settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Chart type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'bar' as ChartType, label: 'Bar' },
                    { value: 'line' as ChartType, label: 'Line' },
                    { value: 'scatter' as ChartType, label: 'Scatter' },
                    { value: 'distribution' as ChartType, label: 'Distribution' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setChartType(opt.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                        chartType === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Title</label>
                <input
                  type="text"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="My Chart"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={chartColor}
                    onChange={(e) => setChartColor(e.target.value)}
                    className="w-10 h-10 cursor-pointer border-0 bg-transparent rounded-lg"
                  />
                  <span className="text-xs text-slate-500">{chartColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">X axis</label>
                <select
                  value={xCol ?? ''}
                  onChange={(e) => setXCol(e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select column</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Y axis</label>
                <select
                  value={yCol ?? ''}
                  onChange={(e) => setYCol(e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select column</option>
                  {numericCols.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {numericCols.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No numeric columns detected.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-600" />
              Column stats
            </h2>
            <div className="space-y-3">
              {stats.slice(0, 6).map((s) => (
                <div key={s.name} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{s.name}</span>
                    <span className="text-xs font-mono text-slate-500">{s.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    {s.type === 'numeric' && s.mean !== undefined && (
                      <div className="flex justify-between">
                        <span>Mean</span>
                        <span className="font-mono text-slate-700">{s.mean.toFixed(2)}</span>
                      </div>
                    )}
                    {s.type === 'numeric' && s.std !== undefined && (
                      <div className="flex justify-between">
                        <span>Std dev</span>
                        <span className="font-mono text-slate-700">{s.std.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Nulls</span>
                      <span className="font-mono text-slate-700">{s.nulls} ({s.nullPercent.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique</span>
                      <span className="font-mono text-slate-700">{s.unique}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ref-container" ref={chartRef}>
            {canChart ? (
              <div className="relative h-[400px] lg:h-[500px] w-full">
                <ChartComponent
                  data={data as any}
                  options={options as any}
                />
              </div>
            ) : (
              <div className="h-[400px] lg:h-[500px] flex flex-col items-center justify-center text-slate-400">
                <RotateCw className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">Select X and Y columns to chart</p>
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleExport}
                disabled={!canChart}
                className="p-2 bg-white text-slate-600 rounded-lg shadow border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Export PNG"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {}}
                className="p-2 bg-white text-slate-600 rounded-lg shadow border border-slate-200 hover:bg-slate-50 transition"
                title="Copy image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {}}
                className="p-2 bg-white text-slate-600 rounded-lg shadow border border-slate-200 hover:bg-slate-50 transition"
                title="Reset"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {canChart && numericCols.length >= 2 && xCol && yCol && numericX.length > 1 && numericY.length > 1 && (
            <div className="mt-4 bg-slate-50 rounded-xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Correlation</h3>
              <p className="text-sm text-slate-600">
                Pearson correlation between <span className="font-mono text-indigo-600">{xCol}</span> and{' '}
                <span className="font-mono text-indigo-600">{yCol}</span>:{' '}
                <span className="font-semibold text-slate-900">
                  {correlation(numericX, numericY).toFixed(3)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
