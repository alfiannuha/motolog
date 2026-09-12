'use server'

import { getFuelLogs } from '@/actions/fuel'
import {
  getMaintenanceHistory,
  getVehicleDetailWithRules,
} from '@/actions/maintenance'
import { buildExpenseSummary } from '@/lib/analytics'
import type { AnalyticsItem, AnalyticsLog, ExpenseSummary } from '@/lib/analytics'
import { buildFuelStats } from '@/lib/fuel'
import type { FuelStats } from '@/lib/fuel'
import { estimateDailyKm } from '@/lib/prediction'
import type { MaintenanceLogWithItems, PartStatus, Vehicle } from '@/types'

export interface ReportPart {
  partName: string
  status: PartStatus['status']
  remainingKm: number | null
  remainingDays: number | null
  projectedCost: number
}

export interface ReportSession {
  serviceDate: string
  odometer: number
  workshopName: string | null
  description: string
  totalCost: number
}

export interface AnalyticsReport {
  vehicle: Vehicle
  generatedAt: string
  periodStart: string | null
  bookingMonths: number
  ownershipMonths: number
  totalKm: number
  maintenanceSpend: number
  fuelSpend: number
  combinedSpend: number
  costPerKm: number | null
  averageMonthly: number
  expense: ExpenseSummary
  fuel: FuelStats | null
  partTotal: number
  serviceFeeTotal: number
  topSessions: ReportSession[]
  criticalParts: ReportPart[]
  dailyKm: number
  isEstimatedUsage: boolean
}

const BOOKING_MONTHS = 12
const TOP_SESSIONS = 5

function monthsBetween(from: string, now: Date): number {
  const start = Date.parse(`${from.slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(start)) return 1
  return Math.max(1, (now.getTime() - start) / (30.44 * 86_400_000))
}

function describe(log: MaintenanceLogWithItems): string {
  return log.maintenance_log_items.map((item) => item.item_name).join(', ')
}

// Known service cost per part name, used to project upcoming spend without a
// dedicated parts-price table.
function buildCostLookup(
  parts: PartStatus[],
  logs: MaintenanceLogWithItems[],
): Record<string, number> {
  const lookup: Record<string, number> = {}

  for (const log of logs) {
    for (const item of log.maintenance_log_items) {
      if (!item.rule_id) continue
      const current = lookup[item.rule_id] ?? 0
      if (item.cost > current) lookup[item.rule_id] = item.cost
    }
  }

  return lookup
}

export async function getVehicleAnalyticsReport(
  vehicleId: string,
  months = 12,
): Promise<AnalyticsReport | null> {
  if (!vehicleId) return null

  const [detail, history, fuelLogs] = await Promise.all([
    getVehicleDetailWithRules(vehicleId),
    getMaintenanceHistory(vehicleId),
    getFuelLogs(vehicleId),
  ])

  if (!detail) return null

  const now = new Date()
  const { vehicle, parts } = detail

  const logs: AnalyticsLog[] = []
  const items: AnalyticsItem[] = []
  for (const log of history) {
    logs.push({
      service_date: log.service_date,
      odometer: log.odometer,
      total_cost: log.total_cost,
    })
    for (const item of log.maintenance_log_items) {
      items.push({ item_type: item.item_type, cost: item.cost })
    }
  }

  const expense = buildExpenseSummary({
    logs,
    items,
    currentOdometer: vehicle.current_odometer,
    now,
    months,
  })

  const fuel = fuelLogs.length > 0 ? buildFuelStats(fuelLogs) : null
  const fuelSpend = fuel?.totalCost ?? 0
  const combinedSpend = expense.lifetimeTotal + fuelSpend

  const allReadings = [
    ...history.map((log) => ({ date: log.service_date, odometer: log.odometer })),
    ...fuelLogs.map((log) => ({ date: log.log_date, odometer: log.odometer })),
  ]
  const fallback = vehicle.estimated_daily_km ?? 20
  const dailyKm = estimateDailyKm(allReadings, fallback)

  const totalKm = Math.max(0, vehicle.current_odometer - expense.initialOdometer)
  const costPerKm = totalKm > 0 ? combinedSpend / totalKm : null

  const ownershipMonths = expense.firstServiceDate
    ? monthsBetween(expense.firstServiceDate, now)
    : 1
  const averageMonthly = combinedSpend / ownershipMonths

  const costLookup = buildCostLookup(parts, history)
  const criticalParts: ReportPart[] = parts
    .filter((part) => part.status !== 'healthy')
    .map((part) => ({
      partName: part.partName,
      status: part.status,
      remainingKm: part.remainingKm,
      remainingDays: part.remainingDays,
      projectedCost: costLookup[part.ruleId] ?? 0,
    }))

  const topSessions: ReportSession[] = [...history]
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, TOP_SESSIONS)
    .map((log) => ({
      serviceDate: log.service_date,
      odometer: log.odometer,
      workshopName: log.workshop_name,
      description: describe(log),
      totalCost: log.total_cost,
    }))

  return {
    vehicle,
    generatedAt: now.toISOString(),
    periodStart: expense.firstServiceDate,
    bookingMonths: BOOKING_MONTHS,
    ownershipMonths,
    totalKm,
    maintenanceSpend: expense.lifetimeTotal,
    fuelSpend,
    combinedSpend,
    costPerKm,
    averageMonthly,
    expense,
    fuel,
    partTotal: expense.partTotal,
    serviceFeeTotal: expense.serviceFeeTotal,
    topSessions,
    criticalParts,
    dailyKm,
    isEstimatedUsage: dailyKm === fallback,
  }
}