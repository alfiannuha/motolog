import Link from 'next/link'

const TABS = [
  { key: 'health', label: 'Health', href: '' },
  { key: 'prep', label: 'Persiapan', href: '/prep' },
  { key: 'specs', label: 'Spesifikasi', href: '/specs' },
  { key: 'fuel', label: 'BBM', href: '/fuel' },
  { key: 'analytics', label: 'Analytics', href: '/analytics' },
  { key: 'settings', label: 'Pengaturan', href: '/settings' },
] as const

export function VehicleTabs({
  vehicleId,
  active,
}: {
  vehicleId: string
  active:
    | 'health'
    | 'prep'
    | 'specs'
    | 'fuel'
    | 'analytics'
    | 'settings'
}) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <Link
            key={tab.key}
            href={`/vehicles/${vehicleId}${tab.href}`}
            className={`shrink-0 flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
              isActive
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
