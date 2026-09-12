import { Gauge } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { formatKm } from '@/lib/utils'
import { vehicleKind } from '@/lib/vehicle-kind'
import type { Vehicle } from '@/types'

export function VehicleHeader({
  vehicle,
  children,
}: {
  vehicle: Vehicle
  children?: ReactNode
}) {
  const kind = vehicleKind(vehicle.vehicle_type, vehicle.transmission_type)
  const VehicleIcon = kind.icon

  return (
    <header className="mb-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <VehicleIcon className="size-10 text-zinc-400" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{vehicle.name}</h1>
            <Badge className="rounded-full bg-black/5 px-2 text-[10px] font-medium tracking-wide text-zinc-600 uppercase dark:bg-white/10 dark:text-zinc-300">
              {kind.label}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {vehicle.license_plate}
            {vehicle.manufacture_year ? ` · ${vehicle.manufacture_year}` : ''}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
            <Gauge className="size-4" />
            {formatKm(vehicle.current_odometer)}
          </p>
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  )
}
