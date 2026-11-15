export type ColumnStats = {
  name: string
  type: 'numeric' | 'categorical' | 'mixed' | 'date'
  total: number
  nulls: number
  nullPercent: number
  unique: number
  mean?: number
  median?: number
  std?: number
  min?: number
  max?: number
  topValue?: string
  topCount?: number
}

export type Row = Record<string, unknown>

export function isNumeric(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false
  if (typeof v === 'number') return !Number.isNaN(v)
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return false
    const n = Number(trimmed)
    return !Number.isNaN(n)
  }
  return false
}

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isNaN(v) ? null : v
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isNaN(n) ? null : n
  }
  return null
}

export function analyzeColumn(name: string, values: unknown[]): ColumnStats {
  const total = values.length
  const numericVals: number[] = []
  const nonNull: unknown[] = []
  const freq = new Map<string, number>()

  for (const v of values) {
    if (v === null || v === undefined || v === '') continue
    nonNull.push(v)
    const key = String(v)
    freq.set(key, (freq.get(key) || 0) + 1)
    const n = toNumber(v)
    if (n !== null) numericVals.push(n)
  }

  const nulls = total - nonNull.length
  const nullPercent = total === 0 ? 0 : (nulls / total) * 100
  const unique = freq.size

  let topValue: string | undefined
  let topCount = 0
  Array.from(freq.entries()).forEach(([k, c]) => {
    if (c > topCount) {
      topCount = c
      topValue = k
    }
  })

  const stats: ColumnStats = {
    name,
    type: numericVals.length === nonNull.length ? 'numeric' : nonNull.length === 0 ? 'categorical' : 'mixed',
    total,
    nulls,
    nullPercent,
    unique,
    topValue,
    topCount,
  }

  if (numericVals.length > 0) {
    const mean = numericVals.reduce((a, b) => a + b, 0) / numericVals.length
    const sorted = [...numericVals].sort((a, b) => a - b)
    const median =
      sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    const variance =
      numericVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericVals.length
    const std = Math.sqrt(variance)

    stats.type = 'numeric'
    stats.mean = mean
    stats.median = median
    stats.std = std
    stats.min = sorted[0]
    stats.max = sorted[sorted.length - 1]
  }

  return stats
}

export function correlation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0
  const mx = x.reduce((a, b) => a + b, 0) / n
  const my = y.reduce((a, b) => a + b, 0) / n
  let cov = 0
  let vx = 0
  let vy = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx
    const dy = y[i] - my
    cov += dx * dy
    vx += dx * dx
    vy += dy * dy
  }
  const denom = Math.sqrt(vx * vy)
  return denom === 0 ? 0 : cov / denom
}

export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return []
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor((sorted.length - 1) * 0.25)]
  const q3 = sorted[Math.floor((sorted.length - 1) * 0.75)]
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr
  return values.filter((v) => v < lower || v > upper)
}

export function cleanRows(
  rows: Row[],
  actions: {
    deduplicate?: boolean
    trimWhitespace?: boolean
    fillMissing?: string
    dropNulls?: boolean
    columnsToKeep?: string[]
  }
): Row[] {
  let result = [...rows]

  if (actions.columnsToKeep && actions.columnsToKeep.length > 0) {
    const keep = new Set(actions.columnsToKeep)
    result = result.map((r) => {
      const cleaned: Row = {}
      Array.from(keep).forEach((k) => {
        if (k in r) cleaned[k] = r[k]
      })
      return cleaned
    })
  }

  if (actions.trimWhitespace) {
    result = result.map((r) => {
      const cleaned: Row = {}
      for (const [k, v] of Object.entries(r)) {
        cleaned[k] = typeof v === 'string' ? v.trim() : v
      }
      return cleaned
    })
  }

  if (actions.deduplicate) {
    const seen = new Set<string>()
    result = result.filter((r) => {
      const key = JSON.stringify(r)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  if (actions.fillMissing !== undefined && actions.fillMissing !== '') {
    const fill = actions.fillMissing
    result = result.map((r) => {
      const cleaned: Row = {}
      for (const [k, v] of Object.entries(r)) {
        cleaned[k] = v === null || v === undefined || v === '' ? fill : v
      }
      return cleaned
    })
  }

  if (actions.dropNulls) {
    result = result.filter((r) => {
      return Object.values(r).some((v) => v !== null && v !== undefined && v !== '')
    })
  }

  return result
}
