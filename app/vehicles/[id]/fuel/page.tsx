import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { getFuelLogs } from '@/actions/fuel'
import { getVehicle } from '@/actions/vehicles'
import { FuelPanel } from '@/components/fuel/fuel-panel'
import { LogFuelButton } from '@/components/fuel/fuel-log-dialog'
import { VehicleHeader } from '@/components/vehicles/vehicle-header'
import { VehicleTabs } from '@/components/vehicles/vehicle-tabs'

export default async function VehicleFuelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const [vehicle, logs] = await Promise.all([getVehicle(id), getFuelLogs(id)])

  if (!vehicle) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black dark:hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <VehicleHeader vehicle={vehicle}>
        <LogFuelButton vehicleId={vehicle.id} currentOdometer={vehicle.current_odometer} />
      </VehicleHeader>

      <VehicleTabs vehicleId={vehicle.id} active="fuel" />

      <FuelPanel vehicleId={vehicle.id} logs={logs} />
    </main>
  )
}
