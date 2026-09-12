import { FileText, Gauge, TrendingUp, Wallet } from 'lucide-react'

import { formatKm, formatRupiah } from '@/lib/utils'
import type { ExpenseSummary } from '@/lib/analytics'

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

export function ExpenseAnalytics({
  vehicleId,
  summary,
}: {
  vehicleId: string
  summary: ExpenseSummary
}) {
  const maxTrend = Math.max(...summary.monthlyTrend.map((point) => point.total), 1)
  const categorized = summary.partTotal + summary.serviceFeeTotal
  const partPct = categorized > 0 ? Math.round((summary.partTotal / categorized) * 100) : 0
  const laborPct = categorized > 0 ? 100 - partPct : 0

  return (
    <div className="grid gap-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          icon={Wallet}
          label="Total Spend"
          value={formatRupiah(summary.lifetimeTotal)}
          hint={`${summary.logCount} catatan servis`}
        />
        <MetricCard
          icon={Gauge}
          label="Cost / KM"
          value={summary.costPerKm != null ? formatRupiah(Math.round(summary.costPerKm)) : '—'}
          hint={
            summary.trackedKm > 0
              ? `dari ${formatKm(summary.trackedKm)} tercatat`
              : 'data jarak belum cukup'
          }
        />
        <MetricCard
          icon={TrendingUp}
          label="Rata-rata / Bulan"
          value={formatRupiah(Math.round(summary.averageMonthly))}
          hint={`${formatRupiah(Math.round(summary.averageYearly))} / tahun`}
        />
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold">Tren Pengeluaran Bulanan</h2>
        <div className="flex h-40 items-end gap-2">
          {summary.monthlyTrend.map((point) => {
            const pct = (point.total / maxTrend) * 100
            return (
              <div
                key={point.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                title={`${point.month}: ${formatRupiah(point.total)}`}
              >
                <span className="text-[10px] text-zinc-500">
                  {point.total > 0 ? Math.round(point.total / 1000) + 'k' : ''}
                </span>
                <div
                  className="w-full rounded-t bg-black/80 dark:bg-white/80"
                  style={{ height: point.total > 0 ? `${Math.max(pct, 3)}%` : '2px' }}
                />
                <span className="text-xs text-zinc-500">{point.month}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold">Part vs Jasa</h2>
        {categorized > 0 ? (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="bg-black dark:bg-white" style={{ width: `${partPct}%` }} />
              <div className="bg-amber-500" style={{ width: `${laborPct}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-black dark:bg-white" />
                Part · {formatRupiah(summary.partTotal)} ({partPct}%)
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-500" />
                Jasa · {formatRupiah(summary.serviceFeeTotal)} ({laborPct}%)
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">Belum ada rincian item.</p>
        )}
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Financial Report</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Unduh laporan audit pengeluaran & kesehatan kendaraan (PDF).
        </p>
        <a
          href={`/api/vehicles/${vehicleId}/analytics/pdf`}
          download
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
        >
          <FileText className="size-4" />
          Download Financial PDF Report
        </a>
      </section>
    </div>
  )
}
