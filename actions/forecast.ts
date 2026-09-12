'use server'

import { getFuelLogs } from '@/actions/fuel'
import {
  getMaintenanceHistory,
  getVehicleDetailWithRules,
} from '@/actions/maintenance'
import { estimateDailyKm, forecastPart } from '@/lib/prediction'
import type { PartForecast } from '@/lib/prediction'
import type { Vehicle } from '@/types'

export interface VehicleForecast {
  vehicle: Vehicle
  dailyKm: number
  isEstimated: boolean
  parts: Record<string, PartForecast>
}

export async function getVehicleForecast(
  vehicleId: string,
): Promise<VehicleForecast | null> {
  if (!vehicleId) return null

  const [detail, history, fuelLogs] = await Promise.all([
    getVehicleDetailWithRules(vehicleId),
    getMaintenanceHistory(vehicleId),
    getFuelLogs(vehicleId),
  ])

  if (!detail) return null

  const readings = [
    ...history.map((log) => ({ date: log.service_date, odometer: log.odometer })),
    ...fuelLogs.map((log) => ({ date: log.log_date, odometer: log.odometer })),
  ]

  const fallback = detail.vehicle.estimated_daily_km ?? 20
  const dailyKm = estimateDailyKm(readings, fallback)
  const isEstimated = dailyKm === fallback

  const parts: Record<string, PartForecast> = {}
  for (const part of detail.parts) {
    parts[part.ruleId] = forecastPart(
      { remainingKm: part.remainingKm, remainingDays: part.remainingDays },
      dailyKm,
    )
  }

  return { vehicle: detail.vehicle, dailyKm, isEstimated, parts }
}
