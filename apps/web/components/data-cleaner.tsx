'use client'

import { useState } from 'react'
import { Wand2, Scissors, LayoutGrid, ArrowRight } from 'lucide-react'
import { ParsedDataset } from '@/app/page'
import { cleanRows } from '@/lib/stats'

interface DataCleanerProps {
  dataset: ParsedDataset | null
  onClean: (actions: Parameters<typeof cleanRows>[1]) => void
  isLight: boolean
  textMain: string
  textMuted: string
  inputBg: string
  inputBorder: string
}

export function DataCleaner({
  dataset,
  onClean,
  isLight,
  textMain,
  textMuted,
  inputBg,
  inputBorder,
}: DataCleanerProps) {
  const [actions, setActions] = useState({
    deduplicate: false,
    trimWhitespace: false,
    fillMissing: '',
    dropNulls: false,
    columnsToKeep: dataset?.columns ?? [],
  })

  const columns = dataset?.columns ?? []
  const rows = dataset?.rows ?? []
  const cleaned = cleanRows(rows, actions)

  const hasChanges =
    actions.deduplicate ||
    actions.trimWhitespace ||
    actions.fillMissing !== '' ||
    actions.dropNulls ||
    actions.columnsToKeep.length !== columns.length

  return (
    <div className="p-6">
      <div className="grid gap-6 mb-6">
        <div className={`rounded-2xl p-5 shadow-xl border border-white/20 dark:border-white/10 transition-all ${isLight ? 'bg-white/90' : 'bg-slate-900/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textMain}`}>
            <Wand2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Cleaning actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer group transition-colors">
              <input
                type="checkbox"
                checked={actions.deduplicate}
                onChange={(e) =>
                  setActions((a) => ({ ...a, deduplicate: e.target.checked }))
                }
                className="rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
              />
              <span className={`text-sm transition-colors group-hover:text-indigo-400 ${
                isLight ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300'
              }`}>
                Remove duplicate rows
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group transition-colors">
              <input
                type="checkbox"
                checked={actions.trimWhitespace}
                onChange={(e) =>
                  setActions((a) => ({ ...a, trimWhitespace: e.target.checked }))
                }
                className="rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
              />
              <span className={`text-sm transition-colors group-hover:text-indigo-400 ${
                isLight ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300'
              }`}>
                Trim whitespace
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group transition-colors">
              <input
                type="checkbox"
                checked={actions.dropNulls}
                onChange={(e) => setActions((a) => ({ ...a, dropNulls: e.target.checked }))}
                className="rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
              />
              <span className={`text-sm transition-colors group-hover:text-indigo-400 ${
                isLight ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300'
              }`}>
                Drop empty rows
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className={`text-sm transition-colors ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Fill missing with:
              </span>
              <input
                type="text"
                value={actions.fillMissing}
                onChange={(e) => setActions((a) => ({ ...a, fillMissing: e.target.value }))}
                placeholder="e.g. 0 / N/A"
                className={`flex-1 px-3 py-2 text-sm rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm ${isLight ? `border-slate-300 bg-white text-slate-900` : `border-slate-700 bg-slate-800 text-slate-100`} ${inputBorder}`}
              />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-5 shadow-xl border border-white/20 dark:border-white/10 transition-all ${isLight ? 'bg-white/90' : 'bg-slate-900/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textMain}`}>
            <LayoutGrid className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Columns to keep
          </h2>
          <p className={`text-xs mb-3 ${textMuted}`}>Uncheck columns to remove them from the cleaned data.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {columns.map((col) => (
              <label key={col} className="flex items-center gap-2 cursor-pointer group transition-colors">
                <input
                  type="checkbox"
                  checked={actions.columnsToKeep.includes(col)}
                  onChange={(e) =>
                    setActions((a) => ({
                      ...a,
                      columnsToKeep: e.target.checked
                        ? [...a.columnsToKeep, col]
                        : a.columnsToKeep.filter((c) => c !== col),
                    }))}
                  className="rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
                />
                <span className={`text-xs transition-colors group-hover:text-indigo-400 truncate ${
                  isLight ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300'
                }`}>
                  {col}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-5 shadow-xl border border-white/20 dark:border-white/10 transition-all ${isLight ? 'bg-white/90' : 'bg-slate-900/80'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${textMain}`}>
            <Scissors className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Preview cleaned data
          </h2>
          <span className="text-xs font-mono transition-colors">
            {`${rows.length} → ${cleaned.length} rows`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b border-white/10 dark:border-white/10 ${isLight ? 'bg-slate-50/50' : 'bg-slate-900/50'}`}>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                  <span className="text-slate-500 dark:text-slate-400">#</span>
                </th>
                {actions.columnsToKeep.map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cleaned.slice(0, 20).map((row, i) => (
                <tr key={i} className={`border-b border-white/10 dark:border-white/10 transition-colors hover:${
                  isLight ? 'bg-slate-50' : 'bg-slate-800/50'
                }`}>
                  <td className="px-3 py-1 text-center text-xs font-mono w-12">
                    <span className={`text-slate-400 dark:text-slate-500`}>{i + 1}</span>
                  </td>
                  {actions.columnsToKeep.map((col) => {
                    const val = row[col]
                    const empty = val === null || val === undefined || val === ''
                    return (
                      <td
                        key={col}
                        className={`px-3 py-1 text-xs transition-colors ${empty ? 'text-slate-400 italic dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        {empty ? '—' : String(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {cleaned.length > 20 && (
                <tr>
                  <td colSpan={actions.columnsToKeep.length + 1} className="px-3 py-3 text-center text-xs">
                    <span className={`text-slate-500 dark:text-slate-400`}>
                      …and {cleaned.length - 20} more rows
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasChanges ? (
          <button
            onClick={() => onClean(actions)}
            className={`mt-4 w-full py-3 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
              isLight
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/40 hover:-translate-y-0.5'
                : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/50 hover:-translate-y-0.5'
            }`}
          >
            <ArrowRight className="w-4 h-4" /> Apply cleaning
          </button>
        ) : (
          <div className={`mt-4 text-xs text-center transition-colors ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            No cleaning actions selected.
          </div>
        )}
      </div>
    </div>
  )
}
