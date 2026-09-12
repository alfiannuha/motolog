'use client'

import { Battery, CircleAlert, CircleCheck, Loader2, Plus, TriangleAlert } from 'lucide-react'
import { useState, useTransition } from 'react'

import { createBatteryLog, createTireLog } from '@/actions/emergency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  unknown: 'bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400',
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
        <Badge className={`gap-1 ${meta.badge}`}>
          <meta.Icon className="size-3.5" />
          {meta.text}
        </Badge>
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

  function changeOpen(next: boolean) {
    if (pending) return
    setOpen(next)
    if (!next) setError(null)
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
      setOpen(false)
    })
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Ban &amp; Aki
        </h2>
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-black/10 dark:border-white/10"
            >
              <Plus className="size-3.5" />
              Catat Tekanan Ban &amp; Aki
            </Button>
          </DialogTrigger>

          <DialogContent
            showCloseButton={false}
            className="max-h-[92vh] overflow-y-auto sm:max-w-md"
          >
            <DialogHeader>
              <DialogTitle>Catat Ban &amp; Aki</DialogTitle>
            </DialogHeader>

            <form onSubmit={submit} className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Tekanan Angin Ban
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="tire-date" className="text-sm font-normal">
                    Tanggal
                  </Label>
                  <input
                    id="tire-date"
                    name="logDate"
                    type="date"
                    required
                    defaultValue={todayInputValue()}
                    className={fieldClass}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="tire-tread" className="text-sm font-normal">
                    Kondisi tapak
                  </Label>
                  <select
                    id="tire-tread"
                    name="treadCondition"
                    defaultValue="good"
                    className={fieldClass}
                  >
                    <option value="good">Baik</option>
                    <option value="worn">Aus</option>
                    <option value="critical">Kritis</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="tire-front" className="text-sm font-normal">
                    Depan (psi)
                  </Label>
                  <Input
                    id="tire-front"
                    name="frontPsi"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={1}
                    required
                    defaultValue={
                      latestTire ? Number(latestTire.front_psi) : frontRecommended
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="tire-rear" className="text-sm font-normal">
                    Belakang (psi)
                  </Label>
                  <Input
                    id="tire-rear"
                    name="rearPsi"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={1}
                    required
                    defaultValue={
                      latestTire ? Number(latestTire.rear_psi) : rearRecommended
                    }
                  />
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Kesehatan Aki
              </p>
              <div className="grid gap-1">
                <Label htmlFor="battery-voltage" className="text-sm font-normal">
                  Tegangan (V, opsional)
                </Label>
                <Input
                  id="battery-voltage"
                  name="voltage"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={30}
                  defaultValue={voltage ?? ''}
                  placeholder="12.6 (mesin mati) / 14.1 (mesin hidup)"
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => changeOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <Badge className={batteryMeta.badge}>{batteryMeta.label}</Badge>
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
