'use client'

import { ChevronDown, FileText, Image as ImageIcon, Wrench } from 'lucide-react'
import { useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { formatDate, formatKm, formatRupiah } from '@/lib/utils'
import type { MaintenanceLogWithItems } from '@/types'

export function ServiceHistory({ logs }: { logs: MaintenanceLogWithItems[] }) {
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
