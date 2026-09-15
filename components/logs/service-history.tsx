'use client'

import { ChevronDown, FileText, Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import {
  deleteMaintenanceLog,
  updateMaintenanceLog,
} from '@/actions/maintenance'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatKm, formatRupiah, parseAmountToNumber } from '@/lib/utils'
import type { MaintenanceLogWithItems, PartStatus } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const dialogClass =
  'm-auto flex max-h-[92vh] w-[min(94vw,520px)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900'

const formClass = 'flex min-h-0 flex-1 flex-col'

const bodyClass = 'grid flex-1 gap-4 overflow-y-auto px-5 py-4'

const footerClass =
  'flex items-center justify-between gap-2 border-t border-black/10 px-5 py-3 dark:border-white/10'

const buttonClass =
  'flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black'

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

function itemsFromLog(log: MaintenanceLogWithItems): DraftItem[] {
  return log.maintenance_log_items.map((item) => ({
    key: uid++,
    ruleId: item.rule_id ?? '',
    itemName: item.item_name,
    itemType: item.item_type,
    cost: String(item.cost),
  }))
}

export function ServiceHistory({
  vehicleId,
  logs,
  parts,
}: {
  vehicleId: string
  logs: MaintenanceLogWithItems[]
  parts: PartStatus[]
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<HTMLDialogElement>(null)

  function openPreview(url: string) {
    setPreview(url)
    previewRef.current?.showModal()
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/15 py-12 text-center dark:border-white/15">
        <Wrench className="size-9 text-zinc-400" />
        <p className="font-medium">Belum ada riwayat servis</p>
        <p className="text-sm text-zinc-500">Catat servis pertama kendaraan ini.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid gap-3">
        {logs.map((log) => (
          <li key={log.id}>
            <details className="group overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{formatDate(log.service_date)}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {log.workshop_name ?? 'Mandiri'} · {formatKm(log.odometer)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-right">
                  <p className="font-semibold">{formatRupiah(log.total_cost)}</p>
                  <ChevronDown className="size-4 text-zinc-400 transition group-open:rotate-180" />
                </div>
              </summary>

              <div className="grid gap-3 border-t border-black/10 p-4 dark:border-white/10">
                <ul className="grid gap-1.5">
                  {log.maintenance_log_items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Badge className="rounded bg-black/5 px-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase dark:bg-white/10">
                          {item.item_type === 'part' ? 'Part' : 'Jasa'}
                        </Badge>
                        <span className="truncate">{item.item_name}</span>
                      </span>
                      <span className="shrink-0 text-zinc-600 dark:text-zinc-300">
                        {formatRupiah(item.cost)}
                      </span>
                    </li>
                  ))}
                </ul>

                {log.notes ? (
                  <p className="rounded-lg bg-black/[.03] p-2 text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
                    {log.notes}
                  </p>
                ) : null}

                <div className="flex items-center gap-2">
                  {log.receipt_image_url ? (
                    <button
                      type="button"
                      onClick={() => openPreview(log.receipt_image_url!)}
                      className="flex w-fit items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <FileText className="size-3.5" />
                      Lihat nota
                    </button>
                  ) : null}
                  <ServiceRowActions vehicleId={vehicleId} log={log} parts={parts} />
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>

      <dialog
        ref={previewRef}
        onClose={() => setPreview(null)}
        className="m-auto w-[min(94vw,640px)] rounded-2xl border border-black/10 bg-white p-4 backdrop:bg-black/60 dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="size-4" />
          Nota Servis
        </div>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Nota servis"
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        ) : null}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => previewRef.current?.close()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Tutup
          </button>
        </div>
      </dialog>
    </>
  )
}

function ServiceRowActions({
  vehicleId,
  log,
  parts,
}: {
  vehicleId: string
  log: MaintenanceLogWithItems
  parts: PartStatus[]
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [items, setItems] = useState<DraftItem[]>(() => itemsFromLog(log))
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const total = items.reduce((sum, item) => sum + (parseAmountToNumber(item.cost) || 0), 0)

  function openEdit() {
    setItems(itemsFromLog(log))
    setReceiptFile(null)
    setError(null)
    // The dialog stays mounted, so uncontrolled inputs keep whatever was typed
    // last time. reset() reverts them to the current log values.
    formRef.current?.reset()
    dialogRef.current?.showModal()
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

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const filled = items.filter(
      (item) => item.itemName.trim() !== '' || parseAmountToNumber(item.cost) > 0,
    )
    if (filled.length === 0) {
      setError('Tambahkan minimal satu item pekerjaan')
      return
    }

    const formData = new FormData(event.currentTarget)
    if (receiptFile) formData.set('receiptFile', receiptFile)
    formData.set(
      'items',
      JSON.stringify(
        filled.map((item) => ({
          itemName: item.itemName.trim(),
          itemType: item.itemType,
          cost: parseAmountToNumber(item.cost) || 0,
          ruleId: item.ruleId || null,
        })),
      ),
    )
    formData.set('totalCost', String(total))

    startTransition(async () => {
      const result = await updateMaintenanceLog(log.id, vehicleId, formData)
      if (result.ok) dialogRef.current?.close()
      else setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={openEdit}
        aria-label="Edit catatan servis"
        title="Edit"
        className="rounded-lg border border-black/10 p-1.5 text-zinc-500 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
      >
        <Pencil className="size-3.5" />
      </button>

      <ConfirmDeleteButton
        title="Hapus catatan servis ini?"
        description={`Servis ${formatDate(log.service_date)} sebesar ${formatRupiah(log.total_cost)} akan dihapus permanen, termasuk foto nota.`}
        onConfirm={() => deleteMaintenanceLog(log.id, vehicleId)}
      />

      <dialog
        ref={dialogRef}
        onClose={() => setError(null)}
        className={dialogClass}
      >
        <h2 className="px-5 pt-5 text-lg font-semibold">Edit Servis</h2>

        <form ref={formRef} onSubmit={submit} className={formClass}>
          <div className={bodyClass}>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Tanggal
              <input
                name="serviceDate"
                type="date"
                required
                defaultValue={log.service_date}
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
            Nama bengkel (opsional)
            <input
              name="workshopName"
              maxLength={150}
              defaultValue={log.workshop_name ?? ''}
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
                    type="text"
                    inputMode="decimal"
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
            Ganti foto nota (opsional, maks 5 MB)
            <input
              name="receiptFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setReceiptFile(event.target.files?.[0] ?? null)
              }
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-sm dark:file:bg-white/10"
            />
            {log.receipt_image_url && !receiptFile ? (
              <span className="text-xs text-zinc-500">
                Nota lama tetap dipakai jika tidak diganti.
              </span>
            ) : null}
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
            <span className="text-sm text-zinc-500">
              Total{' '}
              <span className="ml-1 text-lg font-semibold text-foreground">
                {formatRupiah(total)}
              </span>
            </span>
            <div className="flex gap-2">
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
          </div>
        </form>
      </dialog>
    </div>
  )
}

