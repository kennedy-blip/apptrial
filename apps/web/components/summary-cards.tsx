'use client'

import { motion } from 'framer-motion'
import { ColumnStats } from '@/lib/stats'

interface SummaryCardsProps {
  columns: string[]
  rows: Record<string, unknown>[]
  stats: ColumnStats[]
  isLight: boolean
  textMain: string
  textMuted: string
  inputBg: string
  inputBorder: string
}

export function SummaryCards({ columns, rows, stats, isLight, textMain, textMuted, inputBg, inputBorder }: SummaryCardsProps) {
  const numericStats = stats.filter((s) => s.type === 'numeric')
  const totalRows = rows.length
  const totalNulls = stats.reduce((a, b) => a + b.nulls, 0)
  const totalCells = totalRows * columns.length
  const nullPercent = totalCells === 0 ? 0 : (totalNulls / totalCells) * 100

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          key="rows"
          label="Rows"
          value={totalRows.toLocaleString()}
          desc="Total records"
          color="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-9-4H9m2 4h1"
          isLight={isLight}
          textMain={textMain}
        />
        <StatCard
          key="columns"
          label="Columns"
          value={columns.length.toLocaleString()}
          desc="Fields detected"
          color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          iconPath="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          isLight={isLight}
          textMain={textMain}
        />
        <StatCard
          key="nulls"
          label="Null cells"
          value={totalNulls.toLocaleString()}
          desc={`${nullPercent.toFixed(1)}% of all cells`}
          color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          iconPath="M20 12H4"
          isLight={isLight}
          textMain={textMain}
        />
        <StatCard
          key="numeric"
          label="Numeric cols"
          value={numericStats.length.toLocaleString()}
          desc="Available for charts"
          color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          isLight={isLight}
          textMain={textMain}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={`rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl glass-card`}
      >
        <div className="p-5 border-b border-white/10 dark:border-white/10">
          <h2 className={`text-lg font-semibold ${textMain}`}>Column summary</h2>
          <p className={`text-sm ${textMuted} mt-1`}>
            Mean, median, standard deviation, min/max for each numeric column.
          </p>
        </div>

        {numericStats.length === 0 ? (
          <div className="p-8 text-center">
            <span className={`text-sm ${textMuted}`}>No numeric columns detected. Upload data with numbers to see summary stats.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b border-white/10 dark:border-white/10 ${isLight ? 'bg-slate-50/50' : 'bg-slate-900/50'}`}>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Column</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Mean</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Median</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Std dev</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Min</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Max</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">Nulls</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {numericStats.map((s) => (
                  <motion.tr
                    key={s.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: s.name.length * 0.005 }}
                    whileHover={{ backgroundColor: isLight ? '#f8fafc' : '#1e293b' }}
                    className={`border-b border-white/10 dark:border-white/10 transition-colors duration-200 ${isLight ? 'bg-white/60' : 'bg-slate-800/40'}`}
                  >
                    <td className="px-4 py-2 text-sm font-medium font-mono">
                      <span className={`text-slate-700 dark:text-slate-300`}>{s.name}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      <span className={`text-slate-600 dark:text-slate-300`}>
                        {s.mean !== undefined ? s.mean.toFixed(3) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      <span className={`text-slate-600 dark:text-slate-300`}>
                        {s.median !== undefined ? s.median.toFixed(3) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      <span className={`text-slate-600 dark:text-slate-300`}>
                        {s.std !== undefined ? s.std.toFixed(3) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      <span className={`text-slate-600 dark:text-slate-300`}>
                        {s.min !== undefined ? s.min.toFixed(3) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      <span className={`text-slate-600 dark:text-slate-300`}>
                        {s.max !== undefined ? s.max.toFixed(3) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      <span className={`text-slate-600 dark:text-slate-300`}>{s.nulls}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="mt-6 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/10 dark:border-white/10 p-5 backdrop-blur-sm glass-panel-soft"
      >
        <h2 className={`text-lg font-semibold mb-4 ${textMain}`}>Quick correlations</h2>
        <p className={`text-sm ${textMuted} mb-4`}>
          Pick two numeric columns to see their Pearson correlation coefficient (-1 to 1).
        </p>
        {numericStats.length < 2 ? (
          <p className={`text-sm text-slate-500 dark:text-slate-500`}>Need at least two numeric columns.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {numericStats.slice(0, 6).map((s) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: s.name.length * 0.005 }}
                whileHover={{ y: -2 }}
                className={`bg-white/30 dark:bg-slate-800/30 rounded-lg p-3 border border-white/10 dark:border-white/10 transition-all duration-200`}
              >
                <div className={`text-xs font-medium uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400`}>{s.name}</div>
                <div className={`text-sm ${textMain}`}>
                  Mean: <span className="font-mono">{s.mean?.toFixed(2) ?? '—'}</span>
                </div>
                <div className={`text-sm ${textMain} mt-1`}>
                  Std dev: <span className="font-mono">{s.std?.toFixed(2) ?? '—'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  desc: string
  color: string
  iconPath: string
  isLight: boolean
  textMain: string
}

function StatCard({ label, value, desc, color, iconPath, isLight, textMain }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`${color} rounded-xl p-4 transition-all duration-300 ease-out`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <div className="p-1.5 rounded bg-white/60 dark:bg-white/10">
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
      </div>
      <div className={`text-2xl font-bold ${textMain}`}>{value}</div>
      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{desc}</div>
    </motion.div>
  )
}
