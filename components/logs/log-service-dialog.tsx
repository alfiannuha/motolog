'use client'

import { Loader2, Plus, ScanLine, Trash2, Wrench } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createMaintenanceLog } from '@/actions/maintenance'
import { scanReceipt } from '@/actions/receipt-ocr'
import { compressImage, matchRuleId } from '@/lib/receipt'
import { formatRupiah } from '@/lib/utils'
import type { PartStatus } from '@/types'

type DraftItem = {
  key: number
  ruleId: string
  itemName: string
  itemType: 'part' | 'service_fee'
  cost: string
}

let uid = 0
const newItem = (): DraftItem => ({
  key: uid++,
  ruleId: '',
  itemName: '',
  itemType: 'part',
  cost: '',
})

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function LogServiceButton({
  vehicleId,
  currentOdometer,
  parts,
}: {
  vehicleId: string
  currentOdometer: number
  parts: PartStatus[]
}) {
  const [items, setItems] = useState<DraftItem[]>([newItem()])
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const workshopRef = useRef<HTMLInputElement>(null)

  const total = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)

  function open() {
    setItems([newItem()])
    setError(null)
    setScanning(false)
    setReceiptFile(null)
    formRef.current?.reset()
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  function patchItem(key: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    )
  }

  function selectRule(key: number, ruleId: string) {
    const part = parts.find((candidate) => candidate.ruleId === ruleId)
    patchItem(key, {
      ruleId,
      ...(part ? { itemName: part.partName, itemType: 'part' as const } : {}),
    })
  }

  async function handleScan(file: File) {
    setError(null)
    setScanning(true)
    try {
      const compressed = await compressImage(file)
      setReceiptFile(compressed)

      const formData = new FormData()
      formData.set('file', compressed)
      const result = await scanReceipt(formData)

      if (!result.success) {
        setError('Gagal membaca nota. Isi manual atau coba foto yang lebih jelas.')
        return
      }

      const { workshopName, serviceDate, totalCost, items: extracted } = result.data
      if (serviceDate && dateRef.current) dateRef.current.value = serviceDate
      if (workshopName && workshopRef.current) workshopRef.current.value = workshopName

      const rows =
        extracted.length > 0
          ? extracted
          : totalCost > 0
            ? [{ itemName: 'Total nota', cost: totalCost, itemType: 'service_fee' as const }]
            : []

      if (rows.length > 0) {
        setItems(
          rows.map((row) => ({
            key: uid++,
            ruleId: matchRuleId(row.itemName, parts),
            itemName: row.itemName,
            itemType: row.itemType,
            cost: String(row.cost),
          })),
        )
      }
    } finally {
      setScanning(false)
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    const filled = items.filter(
      (item) => item.itemName.trim() !== '' || Number(item.cost) > 0,
    )
    if (filled.length === 0) {
      setError('Tambahkan minimal satu item pekerjaan')
      return
    }

    const formData = new FormData(form)
    if (receiptFile) formData.set('receiptFile', receiptFile)
    formData.set(
      'items',
      JSON.stringify(
        filled.map((item) => ({
          itemName: item.itemName.trim(),
          itemType: item.itemType,
          cost: Number(item.cost) || 0,
          ruleId: item.ruleId || null,
        })),
      ),
    )
    formData.set('totalCost', String(total))

    startTransition(async () => {
      const result = await createMaintenanceLog(vehicleId, formData)
      if (result.ok) {
        close()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
      >
        <Wrench className="size-4" />
        Log Servis Baru
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[92vh] w-[min(94vw,520px)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Log Servis Baru</h2>

        <form ref={formRef} onSubmit={submit} className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <input
              ref={scanInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void handleScan(file)
              }}
            />
            <button
              type="button"
              onClick={() => scanInputRef.current?.click()}
              disabled={scanning}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 bg-black/[0.03] px-4 py-3 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:bg-white/[0.03] dark:hover:bg-white/5"
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ScanLine className="size-4" />
              )}
              {scanning ? 'Analyzing receipt with AI...' : 'Scan Nota dengan AI'}
            </button>
            {receiptFile && !scanning ? (
              <p className="text-xs text-zinc-500">
                Nota terpindai siap disimpan: {receiptFile.name}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Tanggal
              <input
                ref={dateRef}
                name="serviceDate"
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
            Nama bengkel (opsional)
            <input
              ref={workshopRef}
              name="workshopName"
              maxLength={150}
              placeholder="Mandiri / Bengkel Jaya"
              className={fieldClass}
            />
          </label>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Item pekerjaan</span>
              <button
                type="button"
                onClick={() => setItems((current) => [...current, newItem()])}
                className="flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <Plus className="size-3.5" />
                Tambah
              </button>
            </div>

            {items.map((item) => (
              <div
                key={item.key}
                className="grid gap-2 rounded-lg border border-black/10 p-3 dark:border-white/10"
              >
                <select
                  value={item.ruleId}
                  onChange={(event) => selectRule(item.key, event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Tanpa komponen</option>
                  {parts.map((part) => (
                    <option key={part.ruleId} value={part.ruleId}>
                      {part.partName}
                    </option>
                  ))}
                </select>

                <input
                  value={item.itemName}
                  onChange={(event) =>
                    patchItem(item.key, { itemName: event.target.value })
                  }
                  placeholder="Nama item / jasa"
                  maxLength={100}
                  className={fieldClass}
                />

                <div className="flex gap-2">
                  <select
                    value={item.itemType}
                    onChange={(event) =>
                      patchItem(item.key, {
                        itemType: event.target.value as DraftItem['itemType'],
                      })
                    }
                    className="w-32 rounded-lg border border-black/15 bg-transparent px-2 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white dark:bg-zinc-900"
                  >
                    <option value="part">Part</option>
                    <option value="service_fee">Jasa</option>
                  </select>
                  <input
                    value={item.cost}
                    onChange={(event) =>
                      patchItem(item.key, { cost: event.target.value })
                    }
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Biaya"
                    className={`${fieldClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) => {
                        const next = current.filter((row) => row.key !== item.key)
                        return next.length > 0 ? next : [newItem()]
                      })
                    }
                    aria-label="Hapus item"
                    className="rounded-lg border border-black/10 px-2 text-zinc-500 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <label className="grid gap-1 text-sm">
            Foto nota (opsional, maks 5 MB)
            <input
              name="receiptFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) =>
                setReceiptFile(event.target.files?.[0] ?? null)
              }
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-sm dark:file:bg-white/10"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Catatan (opsional)
            <textarea name="notes" rows={2} maxLength={2000} className={fieldClass} />
          </label>

          <div className="flex items-center justify-between border-t border-black/10 pt-3 dark:border-white/10">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="text-lg font-semibold">{formatRupiah(total)}</span>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
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
