'use client'

import {
  Battery,
  CircleAlert,
  CircleCheck,
  Loader2,
  Plus,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createBatteryLog, createTireLog } from '@/actions/emergency'
import {
  assessTires,
  batteryState,
  comparePressure,
  parsePsiFromSpec,
  RECOMMENDED_PSI,
} from '@/lib/emergency'
import { formatDate } from '@/lib/utils'
import type { BatteryLog, TireLog, VehicleSpec } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const BADGE = {
  healthy:
    'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  unknown:
    'bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400',
} as const

function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function PressureCard({
  label,
  psi,
  recommended,
}: {
  label: string
  psi: number | null
  recommended: number
}) {
  const state = psi == null ? 'unknown' : comparePressure(psi, recommended)
  const meta =
    state === 'under'
      ? { text: 'Kurang angin', badge: BADGE.critical, Icon: CircleAlert }
      : state === 'over'
        ? { text: 'Terlalu keras', badge: BADGE.warning, Icon: TriangleAlert }
        : state === 'normal'
          ? { text: 'Normal', badge: BADGE.healthy, Icon: CircleCheck }
          : { text: 'Belum ada data', badge: BADGE.unknown, Icon: CircleAlert }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-zinc-500">Anjuran {recommended} psi</p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}
        >
          <meta.Icon className="size-3.5" />
          {meta.text}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold">
        {psi == null ? '—' : `${psi} psi`}
      </p>
    </div>
  )
}

export function HealthQuickCheck({
  vehicleId,
  vehicleType,
  spec,
  tireLogs,
  batteryLogs,
}: {
  vehicleId: string
  vehicleType: 'motorcycle' | 'car'
  spec: VehicleSpec | null
  tireLogs: TireLog[]
  batteryLogs: BatteryLog[]
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const latestTire = tireLogs[0]
  const latestBattery = batteryLogs[0]

  const defaultPsi = RECOMMENDED_PSI[vehicleType]
  const frontRecommended =
    parsePsiFromSpec(spec?.front_tire_size) ?? defaultPsi.front
  const rearRecommended =
    parsePsiFromSpec(spec?.rear_tire_size) ?? defaultPsi.rear

  const tireAssessment = latestTire
    ? assessTires(
        {
          frontPsi: Number(latestTire.front_psi),
          rearPsi: Number(latestTire.rear_psi),
          treadCondition: latestTire.tread_condition,
        },
        vehicleType,
      )
    : null

  const voltage =
    latestBattery?.voltage == null ? null : Number(latestBattery.voltage)
  const state = batteryState(voltage)
  const batteryMeta =
    state === 'healthy'
      ? { label: 'Sehat', badge: BADGE.healthy }
      : state === 'warning'
        ? { label: 'Perlu dipantau', badge: BADGE.warning }
        : state === 'weak'
          ? { label: 'Lemah', badge: BADGE.critical }
          : { label: 'Belum ada data', badge: BADGE.unknown }

  function show() {
    setError(null)
    setOpen(true)
    dialogRef.current?.showModal()
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const tireData = new FormData(form)

    const batteryData = new FormData(form)
    batteryData.set('checkDate', String(tireData.get('logDate') ?? ''))
    batteryData.set('condition', interpretVoltage(batteryData.get('voltage')))

    startTransition(async () => {
      const tireResult = await createTireLog(vehicleId, tireData)
      if (!tireResult.ok) {
        setError(tireResult.error)
        return
      }
      const batteryResult = await createBatteryLog(vehicleId, batteryData)
      if (!batteryResult.ok) {
        setError(batteryResult.error)
        return
      }
      dialogRef.current?.close()
      setOpen(false)
    })
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Ban &amp; Aki
        </h2>
        <button
          type="button"
          onClick={show}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Plus className="size-3.5" />
          Catat Tekanan Ban &amp; Aki
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PressureCard
          label="Ban Depan"
          psi={latestTire ? Number(latestTire.front_psi) : null}
          recommended={frontRecommended}
        />
        <PressureCard
          label="Ban Belakang"
          psi={latestTire ? Number(latestTire.rear_psi) : null}
          recommended={rearRecommended}
        />

        <div className="rounded-xl border border-black/10 bg-white p-4 sm:col-span-2 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 font-medium">
                <Battery className="size-4 text-zinc-400" />
                Kesehatan Aki
              </p>
              <p className="text-xs text-zinc-500">
                {latestBattery
                  ? `Terakhir dicek ${formatDate(latestBattery.check_date)}`
                  : 'Belum pernah dicek'}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${batteryMeta.badge}`}
            >
              {batteryMeta.label}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold">
            {voltage == null ? '—' : `${voltage} V`}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Sehat ≥ 12.4V · Lemah &lt; 12.0V (mesin mati)
          </p>
        </div>
      </div>

      {tireAssessment && tireAssessment.issues.length > 0 ? (
        <ul className="mt-3 grid gap-1">
          {tireAssessment.issues.map((issue) => (
            <li
              key={issue}
              className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400"
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto max-h-[92vh] w-[min(94vw,480px)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Catat Ban &amp; Aki</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {open ? (
          <form onSubmit={submit} className="mt-4 grid gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tekanan Angin Ban
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                Tanggal
                <input
                  name="logDate"
                  type="date"
                  required
                  defaultValue={todayInputValue()}
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Kondisi tapak
                <select
                  name="treadCondition"
                  defaultValue="good"
                  className={fieldClass}
                >
                  <option value="good">Baik</option>
                  <option value="worn">Aus</option>
                  <option value="critical">Kritis</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                Depan (psi)
                <input
                  name="frontPsi"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={1}
                  required
                  defaultValue={latestTire ? Number(latestTire.front_psi) : frontRecommended}
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Belakang (psi)
                <input
                  name="rearPsi"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={1}
                  required
                  defaultValue={latestTire ? Number(latestTire.rear_psi) : rearRecommended}
                  className={fieldClass}
                />
              </label>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Kesehatan Aki
            </p>
            <label className="grid gap-1 text-sm">
              Tegangan (V, opsional)
              <input
                name="voltage"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={30}
                defaultValue={voltage ?? ''}
                placeholder="12.6 (mesin mati) / 14.1 (mesin hidup)"
                className={fieldClass}
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
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

// The DB stores a coarse condition; derive it from the measured voltage.
function interpretVoltage(raw: FormDataEntryValue | null): string {
  const value = raw == null || raw === '' ? null : Number(raw)
  const state = batteryState(value)
  if (state === 'weak') return 'replace'
  if (state === 'warning') return 'weak'
  return 'healthy'
}
