'use client'

import { Download, Share, X } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

const DISMISS_KEY = 'motolog-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosDevice(): boolean {
  const ua = window.navigator.userAgent
  const ios = /iphone|ipad|ipod/i.test(ua)
  const ipadOs = /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1
  const otherBrowser = /crios|fxios|edgios/i.test(ua)
  return (ios || ipadOs) && !otherBrowser
}

function noopSubscribe() {
  return () => undefined
}

function subscribeDismiss(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('motolog:install-dismissed', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('motolog:install-dismissed', callback)
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  const dismissed = useSyncExternalStore(
    subscribeDismiss,
    () => localStorage.getItem(DISMISS_KEY) === '1',
    () => false,
  )
  const standalone = useSyncExternalStore(noopSubscribe, isStandalone, () => false)
  const ios = useSyncExternalStore(noopSubscribe, isIosDevice, () => false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const platform: 'android' | 'ios' | null = dismissed || standalone
    ? null
    : deferred
      ? 'android'
      : ios
        ? 'ios'
        : null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    window.dispatchEvent(new Event('motolog:install-dismissed'))
    setDeferred(null)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') dismiss()
    else setDeferred(null)
  }

  if (!platform) return null

  return (
    <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-3 text-zinc-100 shadow-xl">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
          {platform === 'ios' ? <Share className="size-5" /> : <Download className="size-5" />}
        </span>

        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Pasang MotoLog</p>
          {platform === 'ios' ? (
            <p className="text-zinc-400">
              Ketuk ikon <Share className="inline size-3.5 align-text-bottom" /> Share, lalu
              pilih &ldquo;Add to Home Screen&rdquo;.
            </p>
          ) : (
            <p className="text-zinc-400">Akses lebih cepat dari layar utama HP-mu.</p>
          )}
        </div>

        {platform === 'android' ? (
          <button
            onClick={install}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black"
          >
            Pasang
          </button>
        ) : null}

        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
