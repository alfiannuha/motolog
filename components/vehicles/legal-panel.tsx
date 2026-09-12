'use client'

import { CalendarClock, FileWarning, Loader2, Pencil } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { updateVehicleLegal } from '@/actions/vehicles'
import { getLegalStatus } from '@/lib/prediction'
import type { HealthStatus, Vehicle } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const STATUS_META: Record<
  HealthStatus,
  { label: string; badge: string }
> = {
  healthy: {
    label: 'Aman',
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  },
  warning: {
    label: 'Segera',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  critical: {
    label: 'Lewat',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
}

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function countdown(days: number): string {
  if (days < 0) return `lewat ${Math.abs(days)} hari`
  if (days === 0) return 'jatuh tempo hari ini'
  return `${days} hari lagi`
}

function LegalCard({
  icon: Icon,
  label,
  dueDate,
}: {
  icon: typeof CalendarClock
  label: string
  dueDate: string | null
}) {
  const status = getLegalStatus(dueDate)

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <Icon className="size-3.5" />
          {label}
        </div>
        {status ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[status.status].badge}`}
          >
            {STATUS_META[status.status].label}
          </span>
        ) : null}
      </div>

      {dueDate && status ? (
        <>
          <p className="mt-2 font-semibold">{formatDate(dueDate)}</p>
          <p className="text-xs text-zinc-500">{countdown(status.daysRemaining)}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">Belum diatur</p>
      )}
    </div>
  )
}

export function LegalPanel({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)

  function show() {
    setError(null)
    setOpen(true)
    dialogRef.current?.showModal()
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await updateVehicleLegal(vehicle.id, formData)
      if (result.ok) {
        dialogRef.current?.close()
        setOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pajak & Legalitas
        </h2>
        <button
          type="button"
          onClick={show}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Pencil className="size-3.5" />
          Atur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LegalCard
          icon={CalendarClock}
          label="Pajak Tahunan"
          dueDate={vehicle.tax_due_date}
        />
        <LegalCard
          icon={FileWarning}
          label="Plat 5 Tahunan"
          dueDate={vehicle.plate_due_date}
        />
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,440px)] rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Pajak & Estimasi Harian</h2>
        {open ? (
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              Jatuh tempo pajak tahunan (PKB)
              <input
                name="taxDueDate"
                type="date"
                defaultValue={vehicle.tax_due_date ?? ''}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-sm">
              Jatuh tempo plat / ganti kaleng (5 tahunan)
              <input
                name="plateDueDate"
                type="date"
                defaultValue={vehicle.plate_due_date ?? ''}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-sm">
              Estimasi jarak tempuh harian (km/hari)
              <input
                name="estimatedDailyKm"
                type="number"
                inputMode="numeric"
                min={1}
                max={2000}
                defaultValue={vehicle.estimated_daily_km ?? 20}
                className={fieldClass}
              />
              <span className="text-xs text-zinc-500">
                Dipakai untuk prediksi servis bila data jarak belum cukup.
              </span>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-lg px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </section>
  )
}
