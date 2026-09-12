import { Bike } from 'lucide-react'
import { connection } from 'next/server'

import { getVehicles } from '@/actions/vehicles'
import { NotificationToggle } from '@/components/pwa/notification-toggle'
import { NewVehicleDialog } from '@/components/vehicles/new-vehicle-dialog'
import { VehicleList } from '@/components/vehicles/vehicle-list'

export default async function DashboardPage() {
  await connection()
  const vehicles = await getVehicles()

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
