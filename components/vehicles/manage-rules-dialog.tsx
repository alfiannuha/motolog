'use client'

import { Loader2, Plus, Settings2, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { createRule, deleteRule, updateRule } from '@/actions/rules'
import type { PartStatus } from '@/types'

const fieldClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white'

const dialogClass =
  'm-auto flex max-h-[92vh] w-[min(94vw,520px)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900'

const bodyClass = 'grid flex-1 gap-2 overflow-y-auto px-5 py-4'

const footerClass =
  'flex justify-end border-t border-black/10 px-5 py-3 dark:border-white/10'

function RuleRow({ vehicleId, part }: { vehicleId: string; part: PartStatus }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await updateRule(part.ruleId, vehicleId, formData)
      setError(result.ok ? null : result.error)
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteRule(part.ruleId, vehicleId)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <form
      onSubmit={save}
      className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-black/10 p-3 dark:border-white/10"
    >
      <input
        name="partName"
        defaultValue={part.partName}
        maxLength={100}
        required
        className={`${fieldClass} col-span-2`}
      />
      <div className="col-span-2 flex items-end gap-2">
        <label className="grid flex-1 gap-1 text-xs text-zinc-500">
          Interval (km)
          <input
            name="intervalKm"
            type="text"
            inputMode="numeric"
            defaultValue={part.intervalKm ?? ''}
            placeholder="—"
            className={fieldClass}
          />
        </label>
        <label className="grid flex-1 gap-1 text-xs text-zinc-500">
          Interval (bulan)
          <input
            name="intervalMonths"
            type="text"
            inputMode="numeric"
            defaultValue={part.intervalMonths ?? ''}
            placeholder="—"
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Hapus ${part.partName}`}
          className="rounded-lg border border-black/10 p-2 text-zinc-500 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {error ? <p className="col-span-2 text-xs text-red-600">{error}</p> : null}
    </form>
  )
}

export function ManageRulesDialog({
  vehicleId,
  parts,
}: {
  vehicleId: string
  parts: PartStatus[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const addFormRef = useRef<HTMLFormElement>(null)

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await createRule(vehicleId, formData)
      if (result.ok) {
        addFormRef.current?.reset()
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          dialogRef.current?.showModal()
        }}
        className="flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
      >
        <Settings2 className="size-4" />
        Kelola Komponen
      </button>

      <dialog ref={dialogRef} className={dialogClass}>
        <div className="px-5 pt-5">
          <h2 className="text-lg font-semibold">Kelola Komponen Servis</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Atur interval servis tiap komponen kendaraan ini.
          </p>
        </div>

        <div className={bodyClass}>
          {parts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/15 p-4 text-center text-sm text-zinc-500 dark:border-white/15">
              Belum ada komponen. Tambahkan di bawah.
            </p>
          ) : (
            parts.map((part) => (
              <RuleRow key={part.ruleId} vehicleId={vehicleId} part={part} />
            ))
          )}

          <form
            ref={addFormRef}
            onSubmit={add}
            className="mt-2 grid gap-2 rounded-xl border border-black/10 bg-black/[.02] p-3 dark:border-white/10 dark:bg-white/[.03]"
          >
            <span className="text-sm font-medium">Tambah komponen baru</span>
            <input
              name="partName"
              required
              maxLength={100}
              placeholder="Aki, Ban Depan, Gear Set..."
              className={fieldClass}
            />
            <div className="flex gap-2">
              <input
                name="intervalKm"
                type="text"
                inputMode="numeric"
                placeholder="Interval km"
                className={fieldClass}
              />
              <input
                name="intervalMonths"
                type="text"
                inputMode="numeric"
                placeholder="Interval bulan"
                className={fieldClass}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Tambah Komponen
            </button>
          </form>
        </div>

        <div className={footerClass}>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            Tutup
          </button>
        </div>
      </dialog>
    </>
  )
}
