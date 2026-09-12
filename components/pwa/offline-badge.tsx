'use client'

import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function OfflineBadge() {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  )

  if (!offline) return null

  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-2">
      <span className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
        <WifiOff className="size-3.5" />
        Mode offline — menampilkan data tersimpan
      </span>
    </div>
  )
}
