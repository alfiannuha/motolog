import { Droplet, Fuel, Gauge, TrendingDown, Wallet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buildFuelStats } from '@/lib/fuel'
import { formatKm, formatRupiah } from '@/lib/utils'
import type { FuelLog } from '@/types'

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  )
}

const num = (value: number | null, suffix = '') =>
  value == null ? '—' : `${value.toLocaleString('id-ID')}${suffix}`

export function FuelPanel({ logs }: { logs: FuelLog[] }) {
  const stats = buildFuelStats(logs)

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/15 py-12 text-center dark:border-white/15">
        <Fuel className="size-9 text-zinc-400" />
        <p className="font-medium">Belum ada catatan BBM</p>
        <p className="text-sm text-zinc-500">
          Catat isi BBM untuk memantau konsumsi dan biaya per km.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={Gauge}
          label="Rata-rata"
          value={num(stats.averageKmPerLiter, ' km/L')}
          hint={
            stats.segments.length > 0
              ? `dari ${stats.segments.length} pengisian penuh`
              : 'butuh 2x tangki penuh'
          }
        />
        <MetricCard
          icon={TrendingDown}
          label="Terakhir"
          value={num(stats.lastKmPerLiter, ' km/L')}
          hint={
            stats.bestKmPerLiter != null
              ? `terbaik ${num(stats.bestKmPerLiter)} km/L`
              : undefined
          }
        />
        <MetricCard
          icon={Wallet}
          label="Biaya BBM"
          value={formatRupiah(stats.totalCost)}
          hint={`${stats.entries} pengisian`}
        />
        <MetricCard
          icon={Droplet}
          label="Biaya / KM"
          value={stats.costPerKm != null ? formatRupiah(Math.round(stats.costPerKm)) : '—'}
          hint={stats.trackedKm > 0 ? `dari ${formatKm(stats.trackedKm)}` : 'data belum cukup'}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Riwayat Isi BBM
        </h2>
        <ul className="grid gap-2">
          {logs.map((log) => {
            const segment = stats.segments.find(
              (item) => item.odometer === log.odometer,
            )
            return (
              <li
                key={log.id}
                className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {new Date(`${log.log_date}T00:00:00`).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <Badge className="rounded bg-black/5 px-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase dark:bg-white/10">
                        {log.fuel_type ?? 'BBM'}
                      </Badge>
                      {!log.is_full_tank ? (
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Sebagian
                        </Badge>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatKm(log.odometer)} · {log.liters} L ·{' '}
                      {formatRupiah(log.price_per_liter)}/L
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{formatRupiah(log.total_cost)}</p>
                    {segment ? (
                      <p className="text-xs text-zinc-500">
                        {segment.kmPerLiter} km/L
                      </p>
                    ) : null}
                  </div>
                </div>
                {log.notes ? (
                  <p className="mt-2 rounded-lg bg-black/[.03] p-2 text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
                    {log.notes}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
