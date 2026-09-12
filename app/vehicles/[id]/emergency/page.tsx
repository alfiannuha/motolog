import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { getBatteryLogs, getTireLogs } from '@/actions/emergency'
import { getVehicle } from '@/actions/vehicles'
import { EmergencyPanel } from '@/components/emergency/emergency-panel'
import { EmergencyToolkit } from '@/components/emergency/emergency-toolkit'
import { VehicleHeader } from '@/components/vehicles/vehicle-header'
import { VehicleTabs } from '@/components/vehicles/vehicle-tabs'

export default async function VehicleEmergencyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const [vehicle, tireLogs, batteryLogs] = await Promise.all([
    getVehicle(id),
    getTireLogs(id),
    getBatteryLogs(id),
  ])

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

      <VehicleHeader vehicle={vehicle} />
      <VehicleTabs vehicleId={vehicle.id} active="emergency" />

      <EmergencyPanel
        vehicleId={vehicle.id}
        vehicleType={vehicle.vehicle_type}
        tireLogs={tireLogs}
        batteryLogs={batteryLogs}
      />

      <div className="mt-4">
        <EmergencyToolkit />
      </div>
    </main>
  )
}
