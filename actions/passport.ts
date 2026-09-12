'use server'

import { getFuelLogs } from '@/actions/fuel'
import {
  getMaintenanceHistory,
  getVehicleDetailWithRules,
} from '@/actions/maintenance'
import { buildFuelStats } from '@/lib/fuel'
import type { FuelStats } from '@/lib/fuel'
import type {
  MaintenanceLogWithItems,
  PartStatus,
  Vehicle,
} from '@/types'

export interface VehiclePassport {
  vehicle: Vehicle
  totalServiceVisits: number
  lifetimeMaintenanceCost: number
  parts: PartStatus[]
  history: MaintenanceLogWithItems[]
  fuel: FuelStats | null
  generatedAt: string
}

export async function getVehiclePassportData(
  vehicleId: string,
): Promise<VehiclePassport | null> {
  if (!vehicleId) return null

  const [detail, history, fuelLogs] = await Promise.all([
    getVehicleDetailWithRules(vehicleId),
    getMaintenanceHistory(vehicleId),
    getFuelLogs(vehicleId),
  ])

  if (!detail) return null

  return {
    vehicle: detail.vehicle,
    totalServiceVisits: history.length,
    lifetimeMaintenanceCost: history.reduce((sum, log) => sum + log.total_cost, 0),
    parts: detail.parts,
    history,
    fuel: fuelLogs.length > 0 ? buildFuelStats(fuelLogs) : null,
    generatedAt: new Date().toISOString(),
  }
}
