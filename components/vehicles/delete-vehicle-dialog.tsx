'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import { deleteVehicle } from '@/actions/vehicles'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DeleteVehicleDialog({
  vehicleId,
  vehicleName,
  licensePlate,
}: {
  vehicleId: string
  vehicleName: string
  licensePlate: string
}) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const unlocked =
    confirmText.trim().toLowerCase() === licensePlate.trim().toLowerCase()

  function changeOpen(next: boolean) {
    if (pending) return
    setOpen(next)
    if (!next) {
      setConfirmText('')
      setError(null)
    }
  }

  function remove() {
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

      <AlertDialog open={open} onOpenChange={changeOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            className="mt-4 bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 className="size-4" />
            Hapus Kendaraan
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-red-700 dark:text-red-400">
              Hapus {vehicleName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini <strong>permanen</strong>. Semua data servis, BBM,
              ban, aki, dan foto nota milik kendaraan ini akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="delete-confirm" className="text-sm font-normal">
              Ketik <strong>{licensePlate}</strong> untuk mengonfirmasi
            </Label>
            <Input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={licensePlate}
              autoComplete="off"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={remove}
              disabled={!unlocked || pending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Hapus Permanen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
