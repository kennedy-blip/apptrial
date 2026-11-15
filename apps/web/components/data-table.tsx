'use client'

export interface DataTableProps {
  columns: string[]
  rows: Record<string, unknown>[]
  maxRows?: number
  isLight: boolean
  textMain: string
  textMuted: string
  inputBg: string
  inputBorder: string
}

export function DataTable({
  columns,
  rows,
  maxRows = 50,
  isLight,
  textMain,
  textMuted,
  inputBg,
  inputBorder,
}: DataTableProps) {
  const displayRows = rows.slice(0, maxRows)
  const hasMore = rows.length > maxRows

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/20 dark:border-white/10 shadow-xl transition-all">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={`border-b border-white/10 dark:border-white/10 ${isLight ? 'bg-slate-50/50' : 'bg-slate-900/50'}`}>
            <th className="w-12 px-3 py-3 text-center text-xs font-medium tracking-wider">
              <span className={`text-slate-500 dark:text-slate-400 uppercase`}>#</span>
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium tracking-wider"
              >
                <span className={`text-slate-500 dark:text-slate-400 uppercase`}>{col}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className={`border-b border-white/10 dark:border-white/10 transition-colors hover:${
              isLight ? 'bg-slate-50' : 'bg-slate-800/50'
            }`}>
              <td className="px-3 py-2 text-center text-xs font-mono w-12">
                <span className={`text-slate-400 dark:text-slate-500 font-mono`}>{i + 1}</span>
              </td>
              {columns.map((col) => {
                const val = row[col]
                const isNum =
                  typeof val === 'number' ||
                  (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.trim())))
                const empty = val === null || val === undefined || val === ''
                return (
                  <td
                    key={col}
                    className={`px-4 py-2 text-xs truncate max-w-32 transition-colors ${
                      empty
                        ? 'text-slate-400 italic dark:text-slate-500'
                        : isNum
                        ? 'text-right font-mono text-slate-600 dark:text-slate-300'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {empty ? '—' : String(val)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className={`px-4 py-3 text-xs border-t border-white/10 dark:border-white/10 text-center ${isLight ? 'bg-slate-50/50' : 'bg-slate-900/50'}`}>
          <span className={`text-slate-500 dark:text-slate-400`}>
            Showing {maxRows} of {rows.length} rows
          </span>
        </div>
      )}
    </div>
  )
}
