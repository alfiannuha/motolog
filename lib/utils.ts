export { cn } from 'cn'

export function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

export function formatKm(value: number): string {
  return `${value.toLocaleString('id-ID')} km`
}

// Indonesian format groups thousands with "." and separates decimals with ",".
// HTML number inputs reject commas outright, so money fields are text inputs and
// normalise here before Number() (client) or zod (server) sees them.
// Non-string input is returned untouched so zod coercion still reports its own
// "expected number" error instead of a confusing NaN.
export function parseAmount(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (text === '') return value
  return text.replace(/\./g, '').replace(',', '.')
}

export function parseAmountToNumber(value: string): number {
  const normalized = parseAmount(value)
  return typeof normalized === 'string' ? Number(normalized) : Number.NaN
}
