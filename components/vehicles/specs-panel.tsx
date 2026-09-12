'use client'

import { Droplet, Loader2, Pencil, Settings2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { upsertVehicleSpec } from '@/actions/specs'
import type { VehicleSpec } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const FIELDS: { name: keyof FormValues; label: string; placeholder: string }[] = [
  {
    name: 'engineOilSpec',
    label: 'Oli Mesin',
    placeholder: '10W-30 JASO MB, 0.8 Liter',
  },
  {
    name: 'transmissionOilSpec',
    label: 'Oli Transmisi / Gardan',
    placeholder: '120 ml',
  },
  { name: 'sparkPlugCode', label: 'Busi', placeholder: 'NGK CPR9EA-9' },
  {
    name: 'frontTireSize',
    label: 'Ban Depan',
    placeholder: '90/80-14 Tubeless (29 psi)',
  },
  {
    name: 'rearTireSize',
    label: 'Ban Belakang',
    placeholder: '100/80-14 Tubeless (33 psi)',
  },
  { name: 'batteryType', label: 'Aki', placeholder: 'GTZ6V / YTZ6V (5 Ah)' },
  {
    name: 'coolantCapacity',
    label: 'Coolant',
    placeholder: 'Reservoir 0.16L, Radiator 0.44L',
  },
]

type FormValues = {
  engineOilSpec: string
  transmissionOilSpec: string
  sparkPlugCode: string
  frontTireSize: string
  rearTireSize: string
  batteryType: string
  coolantCapacity: string
  notes: string
}

function toValues(spec: VehicleSpec | null): FormValues {
  return {
    engineOilSpec: spec?.engine_oil_spec ?? '',
    transmissionOilSpec: spec?.transmission_oil_spec ?? '',
    sparkPlugCode: spec?.spark_plug_code ?? '',
    frontTireSize: spec?.front_tire_size ?? '',
    rearTireSize: spec?.rear_tire_size ?? '',
    batteryType: spec?.battery_type ?? '',
    coolantCapacity: spec?.coolant_capacity ?? '',
    notes: spec?.notes ?? '',
  }
}

export function SpecsPanel({
  vehicleId,
  spec,
}: {
  vehicleId: string
  spec: VehicleSpec | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const values = toValues(spec)
  const filled = FIELDS.filter((field) => values[field.name])

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await upsertVehicleSpec(vehicleId, formData)
      if (result.ok) {
        dialogRef.current?.close()
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          <Settings2 className="size-3.5" />
          Spesifikasi Kendaraan
        </h2>
        <button
          type="button"
          onClick={() => {
            setError(null)
            dialogRef.current?.showModal()
          }}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Pencil className="size-3.5" />
          {filled.length > 0 ? 'Edit' : 'Isi Spesifikasi'}
        </button>
      </div>

      {filled.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15">
          Belum ada spesifikasi. Simpan oli, busi, ban, aki, dan coolant yang
          direkomendasikan pabrik.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-3">
          {filled.map((field) => (
            <div
              key={field.name}
              className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <Droplet className="size-3.5" />
                {field.label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium">{values[field.name]}</dd>
            </div>
          ))}
        </dl>
      )}

      {spec?.notes ? (
        <p className="mt-3 rounded-lg bg-black/[.03] p-3 text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
          {spec.notes}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[92vh] w-[min(94vw,520px)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Spesifikasi Kendaraan</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Referensi cepat part & ukuran pabrik.
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          {FIELDS.map((field) => (
            <label key={field.name} className="grid gap-1 text-sm">
              {field.label}
              <input
                name={field.name}
                defaultValue={values[field.name]}
                maxLength={100}
                placeholder={field.placeholder}
                className={fieldClass}
              />
            </label>
          ))}

          <label className="grid gap-1 text-sm">
            Catatan tambahan
            <textarea
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={values.notes}
              placeholder="Torsi baut, tipe part number, dll."
              className={fieldClass}
            />
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
      </dialog>
    </section>
  )
}
