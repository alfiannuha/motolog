import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { getComplaints } from '@/actions/complaints'
import { getVehicleDetailWithRules } from '@/actions/maintenance'
import { getVehicle } from '@/actions/vehicles'
import { ComplaintsPanel } from '@/components/logs/complaints-panel'
import { PreServiceBriefPanel } from '@/components/logs/pre-service-brief'
import { VehicleHeader } from '@/components/vehicles/vehicle-header'
import { VehicleTabs } from '@/components/vehicles/vehicle-tabs'
import { buildPreServiceBrief } from '@/lib/checklist'
import { vehicleKind } from '@/lib/vehicle-kind'

export default async function VehiclePrepPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const [vehicle, detail, complaints] = await Promise.all([
    getVehicle(id),
    getVehicleDetailWithRules(id),
    getComplaints(id, true),
  ])

  if (!vehicle || !detail) notFound()

  const brief = buildPreServiceBrief(detail.parts, complaints)
  const label = `${vehicle.name} (${vehicle.license_plate}) · ${
    vehicleKind(vehicle.vehicle_type, vehicle.transmission_type).label
  }`

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black print:hidden dark:hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div className="print:hidden">
        <VehicleHeader vehicle={vehicle} />
        <VehicleTabs vehicleId={vehicle.id} active="prep" />
      </div>

      <PreServiceBriefPanel vehicleLabel={label} brief={brief} />

      <div className="mt-8 print:hidden">
        <ComplaintsPanel vehicleId={vehicle.id} complaints={complaints} />
      </div>
    </main>
  )
}
