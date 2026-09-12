import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { getVehicleExpenseSummary } from '@/actions/analytics'
import { getVehicle } from '@/actions/vehicles'
import { ExpenseAnalytics } from '@/components/analytics/expense-analytics'
import { VehicleHeader } from '@/components/vehicles/vehicle-header'
import { VehicleTabs } from '@/components/vehicles/vehicle-tabs'

export default async function VehicleAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const [vehicle, summary] = await Promise.all([
    getVehicle(id),
    getVehicleExpenseSummary(id),
  ])

  if (!vehicle || !summary) notFound()

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
      <VehicleTabs vehicleId={vehicle.id} active="analytics" />

      <ExpenseAnalytics vehicleId={vehicle.id} summary={summary} />
    </main>
  )
}
