'use client'

import { Fuel, Loader2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createFuelLog } from '@/actions/fuel'

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

// Estimasi harga nasional (Rp/liter). Edit bebas di form — tidak ada API resmi.
const FUEL_PRICES: Record<string, number> = {
  Pertalite: 10_000,
  Pertamax: 12_500,
  'Pertamax Turbo': 14_000,
  'Shell Super': 13_000,
  'Shell V-Power': 14_500,
  'Revvo 89': 11_500,
  'Revvo 92': 13_000,
  'Bio Solar': 6_800,
  'Pertamina Dex': 13_500,
}

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
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState('')
  const [fuelType, setFuelType] = useState('Pertalite')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const liters = (() => {
    const amount = Number(total.replace(',', '.')) / Number(price.replace(',', '.'))
    return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : ''
  })()

  function open() {
    setPrice(String(FUEL_PRICES.Pertalite))
    setTotal('')
    setFuelType('Pertalite')
    setError(null)
    formRef.current?.reset()
    dialogRef.current?.showModal()
  }

  function pickFuelType(next: string) {
    setFuelType(next)
    const estimate = FUEL_PRICES[next]
    if (estimate) setPrice(String(estimate))
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

          <label className="grid gap-1 text-sm">
            Jenis BBM
            <select
              name="fuelType"
              value={fuelType}
              onChange={(event) => pickFuelType(event.target.value)}
              className={fieldClass}
            >
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-500">
              Harga terisi otomatis (estimasi) — sesuaikan dengan harga SPBU.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Harga / liter
              <input
                name="pricePerLiter"
                type="number"
                inputMode="numeric"
                min={0}
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="10000"
                className={fieldClass}
              />
            </label>
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
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            Jumlah (liter)
            <input
              name="liters"
              type="text"
              readOnly
              tabIndex={-1}
              value={liters}
              placeholder="Otomatis dari total ÷ harga"
              className={`${fieldClass} cursor-not-allowed opacity-60`}
            />
            <span className="text-xs text-zinc-500">
              {liters
                ? `${liters} L`
                : 'Terisi otomatis dari total bayar ÷ harga per liter'}
            </span>
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
