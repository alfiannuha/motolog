import { CalendarClock, CircleAlert, CircleCheck, TrendingDown, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatKm } from '@/lib/utils'
import type { PartForecast } from '@/lib/prediction'
import type { HealthStatus, PartStatus } from '@/types'

const STATUS_META: Record<
  HealthStatus,
  {
    label: string
    icon: typeof CircleCheck
    badge: string
    bar: string
    text: string
  }
> = {
  healthy: {
    label: 'Aman',
    icon: CircleCheck,
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    bar: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
  },
  warning: {
    label: 'Segera',
    icon: TriangleAlert,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  critical: {
    label: 'Overdue',
    icon: CircleAlert,
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
}

function remainingLabel(value: number, unit: string): string {
  return value >= 0
    ? `${value.toLocaleString('id-ID')} ${unit} lagi`
    : `lewat ${Math.abs(value).toLocaleString('id-ID')} ${unit}`
}

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function countdownDays(days: number): string {
  if (days < 0) return `lewat ${Math.abs(days)} hari`
  if (days === 0) return 'hari ini'
  return `${days} hari`
}

function intervalLabel(part: PartStatus): string {
  const parts: string[] = []
  if (part.intervalKm != null) parts.push(`${part.intervalKm.toLocaleString('id-ID')} km`)
  if (part.intervalMonths != null) parts.push(`${part.intervalMonths} bulan`)
  return parts.length > 0 ? `Interval ${parts.join(' / ')}` : 'Tanpa interval'
}

export function PartHealthSummary({
  parts,
  forecasts,
  dailyKm,
  estimated,
}: {
  parts: PartStatus[]
  forecasts?: Record<string, PartForecast>
  dailyKm?: number
  estimated?: boolean
}) {
  if (parts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15">
        Belum ada aturan servis untuk kendaraan ini.
      </p>
    )
  }

  const usageBanner =
    forecasts && dailyKm != null ? (
      <div className="flex items-center gap-2 rounded-lg bg-black/[.03] px-3 py-2 text-xs text-zinc-600 sm:col-span-2 dark:bg-white/5 dark:text-zinc-300">
        <TrendingDown className="size-3.5 shrink-0" />
        {estimated
          ? `Prediksi memakai estimasi ${dailyKm.toLocaleString('id-ID')} km/hari`
          : `Laju tempuh terdeteksi ${dailyKm.toLocaleString('id-ID', { maximumFractionDigits: 1 })} km/hari`}
      </div>
    ) : null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {usageBanner}
      {parts.map((part) => {
        const meta = STATUS_META[part.status]
        const Icon = meta.icon
        const forecast = forecasts?.[part.ruleId]

        return (
          <div
            key={part.ruleId}
            className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{part.partName}</p>
                <p className="text-xs text-zinc-500">{intervalLabel(part)}</p>
              </div>
              <Badge className={`gap-1 ${meta.badge}`}>
                <Icon className="size-3.5" />
                {meta.label}
              </Badge>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full ${meta.bar}`}
                style={{ width: `${part.percentageRemaining}%` }}
              />
            </div>

            <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-medium ${meta.text}`}>
              {part.remainingKm != null ? (
                <span>{remainingLabel(part.remainingKm, 'km')}</span>
              ) : null}
              {part.remainingDays != null ? (
                <span>{remainingLabel(part.remainingDays, 'hari')}</span>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Terakhir servis {formatKm(part.lastServiceOdometer)}
            </p>

            {forecast && forecast.dueDate ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <CalendarClock className="size-3.5" />
                Prediksi jatuh tempo {formatDate(forecast.dueDate)}
                {forecast.daysUntilDue != null
                  ? ` (${countdownDays(forecast.daysUntilDue)})`
                  : ''}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
