'use client'

import { ColumnStats } from '@/lib/stats'

interface SummaryCardsProps {
  columns: string[]
  rows: Record<string, unknown>[]
  stats: ColumnStats[]
}

export function SummaryCards({ columns, rows, stats }: SummaryCardsProps) {
  const numericStats = stats.filter((s) => s.type === 'numeric')
  const totalRows = rows.length
  const totalNulls = stats.reduce((a, b) => a + b.nulls, 0)
  const totalCells = totalRows * columns.length
  const nullPercent = totalCells === 0 ? 0 : (totalNulls / totalCells) * 100

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Rows"
          value={totalRows.toLocaleString()}
          desc="Total records"
          icon="list"
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Columns"
          value={columns.length.toLocaleString()}
          desc="Fields detected"
          icon="layout-grid"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Null cells"
          value={totalNulls.toLocaleString()}
          desc={`${nullPercent.toFixed(1)}% of all cells`}
          icon="minus"
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Numeric cols"
          value={numericStats.length.toLocaleString()}
          desc="Available for charts"
          icon="bar-chart-3"
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Column summary</h2>
          <p className="text-sm text-slate-500 mt-1">
            Mean, median, standard deviation, min/max for each numeric column.
          </p>
        </div>

        {numericStats.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No numeric columns detected. Upload data with numbers to see summary stats.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Column</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Mean</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Median</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Std dev</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Min</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Max</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Nulls</th>
                </tr>
              </thead>
              <tbody>
                {numericStats.map((s) => (
                  <tr key={s.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm font-medium text-slate-700 font-mono">{s.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700 font-mono">
                      {s.mean !== undefined ? s.mean.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700 font-mono">
                      {s.median !== undefined ? s.median.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700 font-mono">
                      {s.std !== undefined ? s.std.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700 font-mono">
                      {s.min !== undefined ? s.min.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700 font-mono">
                      {s.max !== undefined ? s.max.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700 font-mono">
                      {s.nulls}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick correlations</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pick two numeric columns to see their Pearson correlation coefficient (-1 to 1).
        </p>
        {numericStats.length < 2 ? (
          <p className="text-sm text-slate-400">Need at least two numeric columns.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {numericStats.slice(0, 6).map((s, i) => (
              <div key={s.name} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{s.name}</div>
                <div className="text-sm text-slate-700">
                  Mean: <span className="font-mono">{s.mean?.toFixed(2) ?? '—'}</span>
                </div>
                <div className="text-sm text-slate-700 mt-1">
                  Std dev: <span className="font-mono">{s.std?.toFixed(2) ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  desc: string
  icon: string
  color: string
}

function StatCard({ label, value, desc, icon, color }: StatCardProps) {
  const Icon = icon === 'list' ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-9-4H9m2 4h1" />
    </svg>
  ) : icon === 'layout-grid' ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ) : icon === 'minus' ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )

  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="p-1.5 rounded bg-white/60">{Icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </div>
  )
}
