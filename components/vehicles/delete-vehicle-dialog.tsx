'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { deleteVehicle } from '@/actions/vehicles'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

export function DeleteVehicleDialog({
  vehicleId,
  vehicleName,
  licensePlate,
}: {
  vehicleId: string
  vehicleName: string
  licensePlate: string
}) {
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const unlocked =
    confirmText.trim().toLowerCase() === licensePlate.trim().toLowerCase()

  function open() {
    setConfirmText('')
    setError(null)
    dialogRef.current?.showModal()
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!unlocked) return

    startTransition(async () => {
      const result = await deleteVehicle(vehicleId)
      if (result && !result.ok) setError(result.error)
    })
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
      <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
        <AlertTriangle className="size-4" />
        Zona Berbahaya
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Menghapus kendaraan bersifat permanen. Seluruh riwayat servis, log BBM,
        catatan ban &amp; aki, serta foto nota akan ikut terhapus dan tidak dapat
        dikembalikan.
      </p>
      <button
        type="button"
        onClick={open}
        className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        <Trash2 className="size-4" />
        Hapus Kendaraan
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(94vw,460px)] rounded-2xl border border-black/10 bg-white p-5 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400">
          <AlertTriangle className="size-5" />
          Hapus {vehicleName}?
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Tindakan ini <strong>permanen</strong>. Semua data servis, BBM, ban,
          aki, dan foto nota milik kendaraan ini akan dihapus.
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Ketik <strong>{licensePlate}</strong> untuk mengonfirmasi
            <input
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={licensePlate}
              autoComplete="off"
              className={fieldClass}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
              className="rounded-lg px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!unlocked || pending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Hapus Permanen
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}
