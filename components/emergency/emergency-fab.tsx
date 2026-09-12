'use client'

import { LifeBuoy } from 'lucide-react'
import { useState } from 'react'

import { EmergencySosDialog } from '@/components/emergency/emergency-sos-dialog'

export function EmergencyFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka toolkit darurat"
        className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 transition hover:bg-red-700"
      >
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-60" />
        <LifeBuoy className="relative size-7" />
        <span className="absolute -top-1 -right-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-black">
          SOS
        </span>
      </button>

      <EmergencySosDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
