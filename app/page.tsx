import { Bike, CheckCircle2 } from 'lucide-react'
import { connection } from 'next/server'

import { getVehicles } from '@/actions/vehicles'
import { NotificationToggle } from '@/components/pwa/notification-toggle'
import { NewVehicleDialog } from '@/components/vehicles/new-vehicle-dialog'
import { VehicleList } from '@/components/vehicles/vehicle-list'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>
}) {
  await connection()
  const [vehicles, { deleted }] = await Promise.all([getVehicles(), searchParams])

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">MotoLog</h1>
          <p className="text-sm text-zinc-500">Kelola kendaraan dan jadwal servismu.</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationToggle />
          <NewVehicleDialog />
        </div>
      </header>

      {deleted ? (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
          <CheckCircle2 className="size-4 shrink-0" />
          Kendaraan {deleted} berhasil dihapus.
        </p>
      ) : null}

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/15 py-16 text-center dark:border-white/15">
          <Bike className="size-10 text-zinc-400" />
          <p className="font-medium">Belum ada kendaraan</p>
          <p className="text-sm text-zinc-500">Tambahkan kendaraan pertamamu.</p>
        </div>
      ) : (
        <VehicleList vehicles={vehicles} />
      )}
    </main>
  )
}
