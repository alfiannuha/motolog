import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { getBatteryLogs, getTireLogs } from '@/actions/emergency'
import {
  getMaintenanceHistory,
  getVehicleDetailWithRules,
} from '@/actions/maintenance'
import { getVehicleForecast } from '@/actions/forecast'
import { getVehicleSpec } from '@/actions/specs'
import { LogServiceButton } from '@/components/logs/log-service-dialog'
import { ServiceHistory } from '@/components/logs/service-history'
import { HealthQuickCheck } from '@/components/vehicles/health-quick-check'
import { LegalPanel } from '@/components/vehicles/legal-panel'
import { ManageRulesDialog } from '@/components/vehicles/manage-rules-dialog'
import { PartHealthSummary } from '@/components/vehicles/part-health-summary'
import { PassportButton } from '@/components/vehicles/passport-button'
import { VehicleHeader } from '@/components/vehicles/vehicle-header'
import { VehicleTabs } from '@/components/vehicles/vehicle-tabs'

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const [detail, history, forecast, spec, tireLogs, batteryLogs] =
    await Promise.all([
      getVehicleDetailWithRules(id),
      getMaintenanceHistory(id),
      getVehicleForecast(id),
      getVehicleSpec(id),
      getTireLogs(id),
      getBatteryLogs(id),
    ])

  if (!detail) notFound()

  const { vehicle, parts } = detail

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
        <div className="flex flex-wrap gap-2">
          <LogServiceButton
            vehicleId={vehicle.id}
            currentOdometer={vehicle.current_odometer}
            parts={parts}
          />
          <PassportButton vehicleId={vehicle.id} />
          <ManageRulesDialog vehicleId={vehicle.id} parts={parts} />
        </div>
      </VehicleHeader>

      <VehicleTabs vehicleId={vehicle.id} active="health" />

      <LegalPanel vehicle={vehicle} />

      <HealthQuickCheck
        vehicleId={vehicle.id}
        vehicleType={vehicle.vehicle_type}
        spec={spec}
        tireLogs={tireLogs}
        batteryLogs={batteryLogs}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Status Komponen
        </h2>
        <PartHealthSummary
          parts={parts}
          forecasts={forecast?.parts}
          dailyKm={forecast?.dailyKm}
          estimated={forecast?.isEstimated}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Riwayat Servis
        </h2>
        <ServiceHistory logs={history} />
      </section>
    </main>
  )
}
