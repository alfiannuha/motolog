'use client'

import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { removePushSubscription, savePushSubscription } from '@/actions/push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index++) {
    bytes[index] = raw.charCodeAt(index)
  }
  return bytes
}

function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

function noopSubscribe() {
  return () => undefined
}

export function NotificationToggle() {
  const supported = useSyncExternalStore(noopSubscribe, isPushSupported, () => false)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(Boolean(subscription)))
      .catch(() => undefined)
  }, [supported])

  async function toggle() {
    if (!VAPID_PUBLIC_KEY || busy) return
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      const existing = await registration.pushManager.getSubscription()

      if (existing) {
        await removePushSubscription(existing.endpoint)
        await existing.unsubscribe()
        setSubscribed(false)
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const saved = await savePushSubscription(subscription.toJSON())
      setSubscribed(saved.ok)
    } catch {
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !VAPID_PUBLIC_KEY}
      aria-pressed={subscribed}
      title={subscribed ? 'Matikan notifikasi servis' : 'Aktifkan notifikasi servis'}
      className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="size-4" />
      ) : (
        <BellOff className="size-4" />
      )}
      <span className="hidden sm:inline">
        {subscribed ? 'Notifikasi aktif' : 'Aktifkan notifikasi'}
      </span>
    </button>
  )
}
