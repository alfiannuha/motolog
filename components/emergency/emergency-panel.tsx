'use client'

import { AlertTriangle, Battery, CheckCircle2, Loader2, Plus, XCircle } from 'lucide-react'
import { useState, useTransition } from 'react'

import { createBatteryLog, createTireLog } from '@/actions/emergency'
import { assessBattery, assessTires } from '@/lib/emergency'
import type { EmergencyStatus } from '@/lib/emergency'
import { formatDate } from '@/lib/utils'
import type { BatteryLog, TireLog } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const STATUS_META: Record<EmergencyStatus, { label: string; className: string }> = {
  healthy: {
    label: 'Aman',
    className:
      'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  },
  warning: {
    label: 'Segera',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  critical: {
    label: 'Kritis',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
}

function StatusBadge({ status }: { status: EmergencyStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}

function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function TireSection({
  vehicleId,
  vehicleType,
  logs,
}: {
  vehicleId: string
  vehicleType: 'motorcycle' | 'car'
  logs: TireLog[]
}) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const latest = logs[0]
  const assessment = latest
    ? assessTires(
        {
          frontPsi: Number(latest.front_psi),
          rearPsi: Number(latest.rear_psi),
          treadCondition: latest.tread_condition,
        },
        vehicleType,
      )
    : null

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const result = await createTireLog(vehicleId, formData)
      if (result.ok) {
        form.reset()
        setAdding(false)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            Ban &amp; Tekanan Angin
            {assessment ? <StatusBadge status={assessment.status} /> : null}
          </h2>
          <p className="text-xs text-zinc-500">
            {latest
              ? `Terakhir dicek ${formatDate(latest.log_date)}`
              : 'Belum pernah dicatat'}
          </p>
        </div>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Plus className="size-3.5" />
            Catat
          </button>
        ) : null}
      </div>

      {assessment && assessment.issues.length > 0 ? (
        <ul className="mt-3 grid gap-1">
          {assessment.issues.map((issue) => (
            <li
              key={issue}
              className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <form onSubmit={submit} className="mt-4 grid gap-3">
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
              <select name="treadCondition" defaultValue="good" className={fieldClass}>
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
                placeholder="29"
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
                placeholder="33"
                className={fieldClass}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            Catatan (opsional)
            <textarea name="notes" rows={2} maxLength={2000} className={fieldClass} />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setError(null)
              }}
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

      {logs.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {logs.slice(0, 5).map((log) => {
            const reading = assessTires(
              {
                frontPsi: Number(log.front_psi),
                rearPsi: Number(log.rear_psi),
                treadCondition: log.tread_condition,
              },
              vehicleType,
            )
            const Icon =
              reading.status === 'healthy'
                ? CheckCircle2
                : reading.status === 'warning'
                  ? AlertTriangle
                  : XCircle
            return (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-3.5 shrink-0 text-zinc-400" />
                  <span>
                    <span className="font-medium">
                      {Number(log.front_psi)} / {Number(log.rear_psi)} psi
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {formatDate(log.log_date)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 capitalize text-xs text-zinc-500">
                  {log.tread_condition}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

function BatterySection({
  vehicleId,
  logs,
}: {
  vehicleId: string
  logs: BatteryLog[]
}) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const latest = logs[0]
  const assessment = latest
    ? assessBattery({
        voltage: latest.voltage == null ? null : Number(latest.voltage),
        condition: latest.condition,
      })
    : null

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const result = await createBatteryLog(vehicleId, formData)
      if (result.ok) {
        form.reset()
        setAdding(false)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Battery className="size-4 text-zinc-400" />
            Kesehatan Aki
            {assessment ? <StatusBadge status={assessment.status} /> : null}
          </h2>
          <p className="text-xs text-zinc-500">
            {latest
              ? `${assessment?.label} · ${formatDate(latest.check_date)}`
              : 'Belum pernah dicek'}
          </p>
        </div>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Plus className="size-3.5" />
            Catat
          </button>
        ) : null}
      </div>

      {adding ? (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Tanggal
              <input
                name="checkDate"
                type="date"
                required
                defaultValue={todayInputValue()}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Kondisi
              <select name="condition" defaultValue="healthy" className={fieldClass}>
                <option value="healthy">Sehat</option>
                <option value="weak">Lemah</option>
                <option value="replace">Harus ganti</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            Tegangan (V, opsional)
            <input
              name="voltage"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={30}
              placeholder="12.6 (mesin mati) / 14.1 (mesin hidup)"
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Catatan (opsional)
            <textarea name="notes" rows={2} maxLength={2000} className={fieldClass} />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setError(null)
              }}
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

      {logs.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {logs.slice(0, 5).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
            >
              <span className="font-medium">
                {log.voltage != null ? `${Number(log.voltage)} V` : '—'}
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  {formatDate(log.check_date)}
                </span>
              </span>
              <span className="shrink-0 capitalize text-xs text-zinc-500">
                {log.condition}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export function EmergencyPanel({
  vehicleId,
  vehicleType,
  tireLogs,
  batteryLogs,
}: {
  vehicleId: string
  vehicleType: 'motorcycle' | 'car'
  tireLogs: TireLog[]
  batteryLogs: BatteryLog[]
}) {
  return (
    <div className="grid gap-4">
      <TireSection vehicleId={vehicleId} vehicleType={vehicleType} logs={tireLogs} />
      <BatterySection vehicleId={vehicleId} logs={batteryLogs} />
    </div>
  )
}
