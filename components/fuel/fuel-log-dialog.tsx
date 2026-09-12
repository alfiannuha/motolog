'use client'

import { Fuel, Loader2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createFuelLog } from '@/actions/fuel'
import { formatRupiah } from '@/lib/utils'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const FUEL_TYPES = [
  'Pertalite',
  'Pertamax',
  'Pertamax Turbo',
  'Shell Super',
  'Shell V-Power',
  'Revvo 89',
  'Revvo 92',
  'Bio Solar',
  'Pertamina Dex',
]

function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function LogFuelButton({
  vehicleId,
  currentOdometer,
}: {
  vehicleId: string
  currentOdometer: number
}) {
  const [liters, setLiters] = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function open() {
    setLiters('')
    setPrice('')
    setTotal('')
    setError(null)
    formRef.current?.reset()
    dialogRef.current?.showModal()
  }

  function recalc(nextLiters: string, nextPrice: string) {
    const amount = Number(nextLiters) * Number(nextPrice)
    if (amount > 0) setTotal(String(Math.round(amount)))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await createFuelLog(vehicleId, formData)
      if (result.ok) {
        dialogRef.current?.close()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
      >
        <Fuel className="size-4" />
        Catat Isi BBM
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[92vh] w-[min(94vw,480px)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Catat Isi BBM</h2>

        <form ref={formRef} onSubmit={submit} className="mt-4 grid gap-4">
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
              Odometer (km)
              <input
                name="odometer"
                type="number"
                inputMode="numeric"
                min={0}
                required
                defaultValue={currentOdometer}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Jumlah (liter)
              <input
                name="liters"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                required
                value={liters}
                onChange={(event) => {
                  setLiters(event.target.value)
                  recalc(event.target.value, price)
                }}
                placeholder="3.5"
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Harga / liter
              <input
                name="pricePerLiter"
                type="number"
                inputMode="numeric"
                min={0}
                required
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value)
                  recalc(liters, event.target.value)
                }}
                placeholder="10000"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            Total bayar
            <input
              name="totalCost"
              type="number"
              inputMode="numeric"
              min={0}
              required
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              placeholder="35000"
              className={fieldClass}
            />
            <span className="text-xs text-zinc-500">
              {total ? formatRupiah(Number(total) || 0) : 'Terisi otomatis dari liter × harga'}
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            Jenis BBM
            <input
              name="fuelType"
              list="fuel-types"
              maxLength={50}
              defaultValue="Pertalite"
              className={fieldClass}
            />
            <datalist id="fuel-types">
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              name="isFullTank"
              type="checkbox"
              defaultChecked
              value="true"
              className="size-4"
            />
            Tangki penuh (dibutuhkan untuk hitung KM/L)
          </label>

          <label className="grid gap-1 text-sm">
            Catatan (opsional)
            <textarea name="notes" rows={2} maxLength={2000} className={fieldClass} />
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
      </dialog>
    </>
  )
}
