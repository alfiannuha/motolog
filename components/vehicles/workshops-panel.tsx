'use client'

import { Loader2, MapPin, Phone, Plus, Star, Trash2, Wrench } from 'lucide-react'
import { useState, useTransition } from 'react'

import {
  createWorkshop,
  deleteWorkshop,
  updateWorkshop,
} from '@/actions/workshops'
import type { TrustedWorkshop } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${
            index < rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-zinc-300 dark:text-zinc-600'
          }`}
        />
      ))}
    </span>
  )
}

function WorkshopForm({
  vehicleId,
  workshop,
  onDone,
}: {
  vehicleId: string
  workshop?: TrustedWorkshop
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = workshop
        ? await updateWorkshop(workshop.id, vehicleId, formData)
        : await createWorkshop(vehicleId, formData)
      if (result.ok) onDone()
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Nama bengkel
        <input
          name="name"
          required
          maxLength={150}
          defaultValue={workshop?.name ?? ''}
          placeholder="AHASS Jaya Motor"
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1 text-sm">
        Spesialisasi
        <input
          name="specialty"
          maxLength={100}
          defaultValue={workshop?.specialty ?? ''}
          placeholder="Spesialis CVT, Bubut / Shock"
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1 text-sm">
        Alamat / link Maps
        <input
          name="addressOrMapsUrl"
          defaultValue={workshop?.address_or_maps_url ?? ''}
          placeholder="Jl. Raya No. 1 / https://maps.app.goo.gl/..."
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          Telepon
          <input
            name="phoneNumber"
            maxLength={30}
            defaultValue={workshop?.phone_number ?? ''}
            placeholder="0812xxxx"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Rating (1-5)
          <input
            name="rating"
            type="number"
            inputMode="numeric"
            min={1}
            max={5}
            defaultValue={workshop?.rating ?? 5}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        Catatan
        <textarea
          name="notes"
          rows={2}
          maxLength={2000}
          defaultValue={workshop?.notes ?? ''}
          placeholder="Mekanik andalan: Mas Danang"
          className={fieldClass}
        />
      </label>

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

function WorkshopCard({
  workshop,
  vehicleId,
}: {
  workshop: TrustedWorkshop
  vehicleId: string
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      const result = await deleteWorkshop(workshop.id, vehicleId)
      if (!result.ok) setError(result.error)
    })
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <WorkshopForm
          vehicleId={vehicleId}
          workshop={workshop}
          onDone={() => setEditing(false)}
        />
      </li>
    )
  }

  const mapsUrl = workshop.address_or_maps_url

  return (
    <li className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <Wrench className="size-4 text-zinc-400" />
            {workshop.name}
          </p>
          {workshop.specialty ? (
            <p className="mt-0.5 text-xs text-zinc-500">{workshop.specialty}</p>
          ) : null}
          <div className="mt-1.5">
            <Stars rating={workshop.rating ?? 5} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-black/10 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Hapus ${workshop.name}`}
            className="rounded-lg border border-black/10 p-1.5 text-zinc-500 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 grid gap-1 text-xs text-zinc-500">
        {mapsUrl ? (
          <a
            href={mapsUrl.startsWith('http') ? mapsUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-black dark:hover:text-white"
          >
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{mapsUrl}</span>
          </a>
        ) : null}
        {workshop.phone_number ? (
          <a
            href={`tel:${workshop.phone_number}`}
            className="flex items-center gap-1.5 hover:text-black dark:hover:text-white"
          >
            <Phone className="size-3.5 shrink-0" />
            {workshop.phone_number}
          </a>
        ) : null}
        {workshop.notes ? <p>{workshop.notes}</p> : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </li>
  )
}

export function WorkshopsPanel({
  vehicleId,
  workshops,
}: {
  vehicleId: string
  workshops: TrustedWorkshop[]
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Bengkel Langganan
        </h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <Plus className="size-3.5" />
            Tambah
          </button>
        ) : null}
      </div>

      <ul className="grid gap-3">
        {adding ? (
          <li className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <WorkshopForm vehicleId={vehicleId} onDone={() => setAdding(false)} />
          </li>
        ) : null}

        {workshops.length === 0 && !adding ? (
          <li className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15">
            Belum ada bengkel langganan. Simpan bengkel favoritmu.
          </li>
        ) : null}

        {workshops.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            workshop={workshop}
            vehicleId={vehicleId}
          />
        ))}
      </ul>
    </section>
  )
}
