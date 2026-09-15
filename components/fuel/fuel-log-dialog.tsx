'use client'

import { Fuel, Loader2, MapPin, Pencil } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createFuelLog, deleteFuelLog, updateFuelLog } from '@/actions/fuel'
import { fetchFuelPrices } from '@/actions/fuel-price'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'
import type { FuelPrice } from '@/lib/fuel-price'
import { parseAmountToNumber } from '@/lib/utils'
import type { FuelLog } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const dialogClass =
  'm-auto flex max-h-[92vh] w-[min(94vw,480px)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900'

const formClass = 'flex min-h-0 flex-1 flex-col'

const bodyClass = 'grid flex-1 gap-4 overflow-y-auto px-5 py-4'

const footerClass =
  'flex justify-end gap-2 border-t border-black/10 px-5 py-3 dark:border-white/10'

const buttonClass =
  'flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black'

export const FUEL_TYPES = [
  'Pertalite',
  'Pertamax',
  'Pertamax Turbo',
  'Pertamina Dex',
  'Dexlite',
  'Bio Solar',
  'Pertamax Green 95',
  'Shell Super',
  'Shell V-Power',
  'Revvo 89',
  'Revvo 92',
]

// Pertamina product code per fuel type, for MyPertamina live prices.
const PRODUCT_CODE: Record<string, string> = {
  Pertalite: 'PERTALITE',
  Pertamax: 'PERTAMAX',
  'Pertamax Turbo': 'PERTAMAX TURBO',
  'Pertamina Dex': 'PERTAMINA DEX',
  Dexlite: 'DEXLITE',
  'Bio Solar': 'PERTAMINA BIOSOLAR SUBSIDI',
  'Pertamax Green 95': 'PERTAMAX GREEN 95',
}

// Fallback when location is denied: national estimates (Rp/liter).
const FUEL_PRICES: Record<string, number> = {
  Pertalite: 10_000,
  Pertamax: 12_500,
  'Pertamax Turbo': 14_000,
  'Pertamina Dex': 13_500,
  Dexlite: 12_000,
  'Bio Solar': 6_800,
  'Pertamax Green 95': 12_000,
  'Shell Super': 13_000,
  'Shell V-Power': 14_500,
  'Revvo 89': 11_500,
  'Revvo 92': 13_000,
}

function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function litersFrom(total: string, price: string): string {
  const amount = parseAmountToNumber(total) / parseAmountToNumber(price)
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : ''
}

function FuelFields({
  price,
  total,
  onPrice,
  onTotal,
}: {
  price: string
  total: string
  onPrice: (value: string) => void
  onTotal: (value: string) => void
}) {
  const liters = litersFrom(total, price)

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          Harga / liter
          <input
            name="pricePerLiter"
            type="text"
            inputMode="decimal"
            required
            value={price}
            onChange={(event) => onPrice(event.target.value)}
            placeholder="15.950"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Total bayar
          <input
            name="totalCost"
            type="text"
            inputMode="decimal"
            required
            value={total}
            onChange={(event) => onTotal(event.target.value)}
            placeholder="50.000"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        Jumlah (liter)
        <input
          type="text"
          readOnly
          tabIndex={-1}
          value={liters}
          placeholder="Otomatis dari total ÷ harga"
          className={`${fieldClass} cursor-not-allowed opacity-60`}
        />
        <span className="text-xs text-zinc-500">
          {liters ? `${liters} L` : 'Terisi otomatis dari total bayar ÷ harga per liter'}
        </span>
      </label>
    </>
  )
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
  const [livePrices, setLivePrices] = useState<FuelPrice[]>([])
  const [province, setProvince] = useState<string | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'ready' | 'denied'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const fuelTypeRef = useRef(fuelType)
  const requestRef = useRef(0)

  function priceFor(type: string, prices: FuelPrice[] = livePrices): number | null {
    const code = PRODUCT_CODE[type]
    const live = code ? prices.find((item) => item.product === code) : undefined
    return live?.price ?? FUEL_PRICES[type] ?? null
  }

  function open() {
    fuelTypeRef.current = 'Pertalite'
    setFuelType('Pertalite')
    setPrice(String(priceFor('Pertalite', livePrices) ?? ''))
    setTotal('')
    setError(null)
    formRef.current?.reset()
    dialogRef.current?.showModal()
    requestLocation()
  }

  function requestLocation() {
    const requestId = ++requestRef.current
    if (!('geolocation' in navigator)) {
      setGeoState('denied')
      return
    }
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await fetchFuelPrices(
          position.coords.latitude,
          position.coords.longitude,
        )
        if (requestRef.current !== requestId) return
        if (result.prices.length === 0) {
          setGeoState('denied')
          return
        }
        setLivePrices(result.prices)
        setProvince(result.province)
        setGeoState('ready')
        setPrice(String(priceFor(fuelTypeRef.current, result.prices) ?? ''))
      },
      () => {
        if (requestRef.current === requestId) setGeoState('denied')
      },
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  function pickFuelType(next: string) {
    fuelTypeRef.current = next
    setFuelType(next)
    const estimate = priceFor(next)
    if (estimate) setPrice(String(estimate))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await createFuelLog(vehicleId, formData)
      if (result.ok) dialogRef.current?.close()
      else setError(result.error)
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

      <dialog ref={dialogRef} className={dialogClass}>
        <h2 className="px-5 pt-5 text-lg font-semibold">Catat Isi BBM</h2>

        <form ref={formRef} onSubmit={submit} className={formClass}>
          <div className={bodyClass}>
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
                type="text"
                inputMode="numeric"
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
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="size-3" />
              {geoState === 'loading'
                ? 'Mendeteksi lokasi untuk harga BBM…'
                : geoState === 'ready'
                  ? `Harga live MyPertamina · ${province}`
                  : geoState === 'denied'
                    ? 'Lokasi tidak aktif — pakai estimasi nasional'
                    : 'Izinkan lokasi untuk harga BBM sesuai provinsi'}
            </span>
          </label>

          <FuelFields price={price} total={total} onPrice={setPrice} onTotal={setTotal} />

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
          </div>

          <div className={footerClass}>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button type="submit" disabled={pending} className={buttonClass}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

export function FuelRowActions({
  vehicleId,
  log,
}: {
  vehicleId: string
  log: FuelLog
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [price, setPrice] = useState(() => String(log.price_per_liter))
  const [total, setTotal] = useState(() => String(log.total_cost))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openEdit() {
    setPrice(String(log.price_per_liter))
    setTotal(String(log.total_cost))
    setError(null)
    // The dialog stays mounted, so uncontrolled inputs keep whatever was typed
    // last time. reset() reverts them to the current log values.
    formRef.current?.reset()
    dialogRef.current?.showModal()
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updateFuelLog(log.id, vehicleId, formData)
      if (result.ok) dialogRef.current?.close()
      else setError(result.error)
    })
  }

  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={openEdit}
        aria-label="Edit catatan BBM"
        title="Edit"
        className="rounded-lg border border-black/10 p-1.5 text-zinc-500 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
      >
        <Pencil className="size-3.5" />
      </button>

      <ConfirmDeleteButton
        title="Hapus catatan BBM ini?"
        description={`Catatan ${log.liters} L tanggal ${log.log_date} akan dihapus permanen.`}
        onConfirm={() => deleteFuelLog(log.id, vehicleId)}
      />

      <dialog
        ref={dialogRef}
        onClose={() => setError(null)}
        className={dialogClass}
      >
        <h2 className="px-5 pt-5 text-lg font-semibold">Edit Isi BBM</h2>

        <form ref={formRef} onSubmit={submit} className={formClass}>
          <div className={bodyClass}>
            <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Tanggal
              <input
                name="logDate"
                type="date"
                required
                defaultValue={log.log_date}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Odometer (km)
              <input
                name="odometer"
                type="text"
                inputMode="numeric"
                required
                defaultValue={log.odometer}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            Jenis BBM
            <select
              name="fuelType"
              defaultValue={log.fuel_type ?? 'Pertalite'}
              className={fieldClass}
            >
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <FuelFields price={price} total={total} onPrice={setPrice} onTotal={setTotal} />

          <label className="flex items-center gap-2 text-sm">
            <input
              name="isFullTank"
              type="checkbox"
              defaultChecked={log.is_full_tank}
              value="true"
              className="size-4"
            />
            Tangki penuh (dibutuhkan untuk hitung KM/L)
          </label>

          <label className="grid gap-1 text-sm">
            Catatan (opsional)
            <textarea
              name="notes"
              rows={2}
              maxLength={2000}
              defaultValue={log.notes ?? ''}
              className={fieldClass}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <div className={footerClass}>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button type="submit" disabled={pending} className={buttonClass}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
