'use client'

import { useState } from 'react'
import { Wand2, Scissors, LayoutGrid, ArrowRight } from 'lucide-react'
import { ParsedDataset } from '@/app/page'
import { cleanRows } from '@/lib/stats'

interface DataCleanerProps {
  dataset: ParsedDataset | null
  onClean: (actions: Parameters<typeof cleanRows>[1]) => void
}

export function DataCleaner({ dataset, onClean }: DataCleanerProps) {
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            Cleaning actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={actions.deduplicate}
                onChange={(e) =>
                  setActions((a) => ({ ...a, deduplicate: e.target.checked }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                Remove duplicate rows
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={actions.trimWhitespace}
                onChange={(e) =>
                  setActions((a) => ({ ...a, trimWhitespace: e.target.checked }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                Trim whitespace
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={actions.dropNulls}
                onChange={(e) => setActions((a) => ({ ...a, dropNulls: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                Drop empty rows
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700">Fill missing with:</span>
              <input
                type="text"
                value={actions.fillMissing}
                onChange={(e) => setActions((a) => ({ ...a, fillMissing: e.target.value }))}
                placeholder="e.g. 0 / N/A"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            Columns to keep
          </h2>
          <p className="text-xs text-slate-500 mb-3">Uncheck columns to remove them from the cleaned data.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {columns.map((col) => (
              <label key={col} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={actions.columnsToKeep.includes(col)}
                  onChange={(e) =>
                    setActions((a) => ({
                      ...a,
                      columnsToKeep: e.target.checked
                        ? [...a.columnsToKeep, col]
                        : a.columnsToKeep.filter((c) => c !== col),
                    }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 group-hover:text-slate-900 truncate">
                  {col}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            Preview cleaned data
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {rows.length} → {cleaned.length} rows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                {actions.columnsToKeep.map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cleaned.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1 text-center text-xs font-mono text-slate-400">
                    {i + 1}
                  </td>
                  {actions.columnsToKeep.map((col) => {
                    const val = row[col]
                    const empty = val === null || val === undefined || val === ''
                    return (
                      <td
                        key={col}
                        className={`px-3 py-1 text-xs ${empty ? 'text-slate-400 italic' : 'text-slate-700'}`}
                      >
                        {empty ? '—' : String(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {cleaned.length > 20 && (
                <tr>
                  <td colSpan={actions.columnsToKeep.length + 1} className="px-3 py-3 text-center text-xs text-slate-500">
                    …and {cleaned.length - 20} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasChanges ? (
          <button
            onClick={() => onClean(actions)}
            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" /> Apply cleaning
          </button>
        ) : (
          <div className="mt-4 text-xs text-slate-400 text-center">No cleaning actions selected.</div>
        )}
      </div>
    </div>
  )
}
