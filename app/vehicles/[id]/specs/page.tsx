import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { getVehicleSpec } from '@/actions/specs'
import { getTrustedWorkshops } from '@/actions/workshops'
import { getVehicle } from '@/actions/vehicles'
import { SpecsPanel } from '@/components/vehicles/specs-panel'
import { VehicleHeader } from '@/components/vehicles/vehicle-header'
import { VehicleTabs } from '@/components/vehicles/vehicle-tabs'
import { WorkshopsPanel } from '@/components/vehicles/workshops-panel'

export default async function VehicleSpecsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const [vehicle, spec, workshops] = await Promise.all([
    getVehicle(id),
    getVehicleSpec(id),
    getTrustedWorkshops(id),
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
      <VehicleTabs vehicleId={vehicle.id} active="specs" />

      <div className="grid gap-8">
        <SpecsPanel vehicleId={vehicle.id} spec={spec} />
        <WorkshopsPanel vehicleId={vehicle.id} workshops={workshops} />
      </div>
    </main>
  )
}
