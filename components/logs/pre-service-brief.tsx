'use client'

import { Check, ClipboardCopy, Printer } from 'lucide-react'
import { useState } from 'react'

import { buildMechanicBriefText } from '@/lib/checklist'
import type { PreServiceBrief } from '@/lib/checklist'
import { Badge } from '@/components/ui/badge'
import { formatKm } from '@/lib/utils'

const STATUS_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
}

function remaining(km: number | null, days: number | null): string {
  if (km != null) {
    return km >= 0 ? `Sisa ${formatKm(km)}` : `Lewat ${formatKm(Math.abs(km))}`
  }
  if (days != null) {
    return days >= 0 ? `Sisa ${days} hari` : `Lewat ${Math.abs(days)} hari`
  }
  return '-'
}

export function PreServiceBriefPanel({
  vehicleLabel,
  brief,
}: {
  vehicleLabel: string
  brief: PreServiceBrief
}) {
  const [copied, setCopied] = useState(false)

  async function copyBrief() {
    const text = buildMechanicBriefText(vehicleLabel, brief)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-lg font-semibold">Persiapan Servis</h1>
            <p className="text-sm text-zinc-500">
              Brief siap tunjukkan ke mekanik sebelum pengerjaan.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyBrief}
              className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <ClipboardCopy className="size-3.5" />
              )}
              {copied ? 'Tersalin' : 'Salin Brief'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
            >
              <Printer className="size-3.5" />
              Print / Simpan PDF
            </button>
          </div>
        </div>

        <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Wajib Ganti / Periksa
        </h2>
        {brief.parts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Tidak ada komponen yang mendesak saat ini.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {brief.parts.map((item) => (
              <li
                key={item.partName}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 dark:border-white/10"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label={item.partName}
                    className="size-4 shrink-0"
                  />
                  <span className="truncate text-sm font-medium">{item.partName}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {remaining(item.remainingKm, item.remainingDays)}
                  </span>
                  <Badge
                    className={`text-[10px] font-semibold uppercase ${
                      STATUS_BADGE[item.status] ?? ''
                    }`}
                  >
                    {item.status === 'critical' ? 'Overdue' : 'Segera'}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Keluhan untuk Dicek
        </h2>
        {brief.complaints.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Tidak ada keluhan tercatat.</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {brief.complaints.map((complaint) => (
              <li
                key={complaint.id}
                className="flex items-start gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <input
                  type="checkbox"
                  aria-label={complaint.title}
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{complaint.title}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 border-t border-black/10 pt-3 text-xs text-zinc-500 dark:border-white/10">
          Dibuat otomatis oleh MotoLog · Mohon konfirmasi estimasi biaya sebelum
          pengerjaan.
        </p>
      </section>
    </div>
  )
}
