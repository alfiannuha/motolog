'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function ConfirmDeleteButton({
  title,
  description,
  onConfirm,
  label = 'Hapus',
  className,
}: {
  title: string
  description: string
  onConfirm: () => Promise<{ ok: boolean; error?: string }>
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function changeOpen(next: boolean) {
    if (pending) return
    setOpen(next)
    if (!next) setError(null)
  }

  function confirm() {
    startTransition(async () => {
      const result = await onConfirm()
      if (result.ok) setOpen(false)
      else setError(result.error ?? 'Gagal menghapus data')
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={
            className ??
            'rounded-lg border border-black/10 p-1.5 text-zinc-500 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5'
          }
        >
          <Trash2 className="size-3.5" />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Hapus
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
