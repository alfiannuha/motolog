'use client'

import { Gauge, Loader2, PencilLine } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'

import { updateOdometer } from '@/actions/vehicles'
import { vehicleKind } from '@/lib/vehicle-kind'
import type { VehicleWithLastLog } from '@/types'

export function VehicleList({ vehicles }: { vehicles: VehicleWithLastLog[] }) {
  const [selected, setSelected] = useState<VehicleWithLastLog | null>(null)
  const [odometer, setOdometer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)

  function openDialog(vehicle: VehicleWithLastLog) {
    setSelected(vehicle)
    setOdometer(String(vehicle.current_odometer))
    setError(null)
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
    setSelected(null)
  }

  function submit() {
    if (!selected) return
    const value = Number(odometer)
    startTransition(async () => {
      const result = await updateOdometer(selected.id, value)
      if (result.ok) closeDialog()
      else setError(result.error)
    })
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {vehicles.map((vehicle) => {
          const kind = vehicleKind(vehicle.vehicle_type, vehicle.transmission_type)
          const VehicleIcon = kind.icon

          return (
          <li
            key={vehicle.id}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <VehicleIcon className="size-8 text-zinc-500" />
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {vehicle.name}
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                      {kind.label}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">{vehicle.license_plate}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                    <Gauge className="size-4" />
                    {vehicle.current_odometer.toLocaleString('id-ID')} km
                  </p>
                  {vehicle.last_service_date ? (
                    <p className="text-xs text-zinc-500">
                      Servis terakhir{' '}
                      {new Date(vehicle.last_service_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · Rp{vehicle.last_total_cost.toLocaleString('id-ID')}
                    </p>
                  ) : null}
                </div>
              </Link>
            </div>
            <button
              onClick={() => openDialog(vehicle)}
              className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              <PencilLine className="size-4" />
              Update KM
            </button>
          </li>
          )
        })}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        className="m-auto w-[min(92vw,380px)] rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">
          Update Kilometer
          {selected ? <span className="text-zinc-500"> — {selected.name}</span> : null}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Odometer saat ini {selected?.current_odometer.toLocaleString('id-ID')} km.
          Tidak boleh lebih kecil.
        </p>

        <input
          type="number"
          inputMode="numeric"
          min={selected?.current_odometer ?? 0}
          value={odometer}
          onChange={(event) => setOdometer(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          autoFocus
          className="mt-4 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-lg outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
        />

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={closeDialog}
            className="rounded-lg px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan
          </button>
        </div>
      </dialog>
    </>
  )
}
