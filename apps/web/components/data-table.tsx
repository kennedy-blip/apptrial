'use client'

export interface DataTableProps {
  columns: string[]
  rows: Record<string, unknown>[]
  maxRows?: number
}

export function DataTable({ columns, rows, maxRows = 50 }: DataTableProps) {
  const displayRows = rows.slice(0, maxRows)
  const hasMore = rows.length > maxRows

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="w-12 px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 text-center text-xs font-mono text-slate-400 w-12">
                {i + 1}
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
                    className={`px-4 py-2 text-xs truncate max-w-32 ${empty ? 'text-slate-400 italic' : isNum ? 'text-right text-slate-700 font-mono' : 'text-slate-700'}`}
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
        <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100 text-center">
          Showing {maxRows} of {rows.length} rows
        </div>
      )}
    </div>
  )
}
