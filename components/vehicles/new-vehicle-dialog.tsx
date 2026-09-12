'use client'

import { Loader2, Plus } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createVehicle } from '@/actions/vehicles'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

export function NewVehicleDialog() {
  const [error, setError] = useState<string | null>(null)
  const [vehicleType, setVehicleType] = useState('motorcycle')
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await createVehicle(formData)
      if (result.ok) {
        formRef.current?.reset()
        setVehicleType('motorcycle')
        setError(null)
        dialogRef.current?.close()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null)
          dialogRef.current?.showModal()
        }}
        className="flex items-center gap-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
      >
        <Plus className="size-4" />
        Tambah Kendaraan
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,420px)] rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Tambah Kendaraan Baru</h2>

        <form ref={formRef} onSubmit={submit} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Nama kendaraan
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Vario Hitam"
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1 text-sm">
            Nomor polisi
            <input
              name="license_plate"
              required
              maxLength={20}
              placeholder="AB 1234 XY"
              className={fieldClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Jenis
              <select
                name="vehicle_type"
                value={vehicleType}
                onChange={(event) => setVehicleType(event.target.value)}
                className={fieldClass}
              >
                <option value="motorcycle">Motor</option>
                <option value="car">Mobil</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              Tahun
              <input
                name="manufacture_year"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                placeholder="2022"
                className={fieldClass}
              />
            </label>
          </div>

          {vehicleType === 'motorcycle' ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm">Transmisi</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm has-[:checked]:border-black has-[:checked]:bg-black/5 dark:border-white/15 dark:has-[:checked]:border-white dark:has-[:checked]:bg-white/10">
                  <input
                    type="radio"
                    name="transmission_type"
                    value="matic"
                    defaultChecked
                    className="size-4"
                  />
                  Matic (CVT)
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm has-[:checked]:border-black has-[:checked]:bg-black/5 dark:border-white/15 dark:has-[:checked]:border-white dark:has-[:checked]:bg-white/10">
                  <input
                    type="radio"
                    name="transmission_type"
                    value="manual"
                    className="size-4"
                  />
                  Bebek / Manual (Gigi)
                </label>
              </div>
            </fieldset>
          ) : null}

          <label className="grid gap-1 text-sm">
            Odometer awal (km)
            <input
              name="current_odometer"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={0}
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
    </>
  )
}
