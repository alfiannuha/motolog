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
