'use client'

import { CheckCircle2, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import {
  createComplaint,
  deleteComplaint,
  setComplaintResolved,
} from '@/actions/complaints'
import { Badge } from '@/components/ui/badge'
import { categoryLabel, severityMeta, SYMPTOM_CATEGORIES } from '@/lib/checklist'
import type { VehicleComplaint } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

export function ComplaintsPanel({
  vehicleId,
  complaints,
}: {
  vehicleId: string
  complaints: VehicleComplaint[]
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Keluhan Kendaraan
        </h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Plus className="size-3.5" />
            Catat Keluhan
          </button>
        ) : null}
      </div>

      <div className="grid gap-3">
        {adding ? (
          <AddComplaintForm
            vehicleId={vehicleId}
            onDone={() => setAdding(false)}
          />
        ) : null}

        {complaints.length === 0 && !adding ? (
          <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15">
            Tidak ada keluhan aktif. Catat bunyi atau gejala agar tidak lupa saat
            ke bengkel.
          </p>
        ) : null}

        {complaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            vehicleId={vehicleId}
            complaint={complaint}
          />
        ))}
      </div>
    </section>
  )
}

function AddComplaintForm({
  vehicleId,
  onDone,
}: {
  vehicleId: string
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await createComplaint(vehicleId, formData)
      if (result.ok) onDone()
      else setError(result.error)
    })
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
    >
      <label className="grid gap-1 text-sm">
        Keluhan / gejala
        <input
          name="title"
          required
          maxLength={150}
          autoFocus
          placeholder="CVT getar/gredek saat rpm rendah"
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          Kategori
          <select name="symptomCategory" defaultValue="other" className={fieldClass}>
            {SYMPTOM_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Tingkat
          <select name="severity" defaultValue="medium" className={fieldClass}>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
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
  )
}

function ComplaintCard({
  vehicleId,
  complaint,
}: {
  vehicleId: string
  complaint: VehicleComplaint
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const severity = severityMeta(complaint.severity)
  const resolved = Boolean(complaint.is_resolved)

  function toggle() {
    startTransition(async () => {
      const result = await setComplaintResolved(complaint.id, vehicleId, !resolved)
      if (!result.ok) setError(result.error)
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteComplaint(complaint.id, vehicleId)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-medium ${resolved ? 'text-zinc-500 line-through' : ''}`}>
            {complaint.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className="rounded bg-black/5 px-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase dark:bg-white/10">
              {categoryLabel(complaint.symptom_category)}
            </Badge>
            {!resolved ? (
              <Badge className={`${severity.badge}`}>{severity.label}</Badge>
            ) : null}
            {resolved ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                Selesai
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            title={resolved ? 'Tandai belum selesai' : 'Tandai selesai'}
            className="rounded-lg border border-black/10 p-1.5 text-zinc-500 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            {resolved ? (
              <RotateCcw className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Hapus keluhan"
            className="rounded-lg border border-black/10 p-1.5 text-zinc-500 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
