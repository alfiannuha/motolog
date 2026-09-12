export type { Database, Tables, VehicleType, TransmissionType, ItemType } from './database'
export type { HealthStatus, PartStatus } from '@/lib/maintenance-health'
export type {
  ExpenseSummary,
  MonthlySpendPoint,
} from '@/lib/analytics'

import type { Tables } from './database'
import type { PartStatus } from '@/lib/maintenance-health'

export type Vehicle = Tables<'vehicles'>
export type MaintenanceRule = Tables<'maintenance_rules'>
export type MaintenanceLog = Tables<'maintenance_logs'>
export type MaintenanceLogItem = Tables<'maintenance_log_items'>
export type FuelLog = Tables<'fuel_logs'>
export type TireLog = Tables<'tire_logs'>
export type BatteryLog = Tables<'battery_logs'>
export type VehicleSpec = Tables<'vehicle_specs'>
export type TrustedWorkshop = Tables<'trusted_workshops'>
export type VehicleComplaint = Tables<'vehicle_complaints'>

export type SymptomCategory =
  | 'engine'
  | 'cvt_transmission'
  | 'braking'
  | 'electrical'
  | 'handling'
  | 'other'
export type ComplaintSeverity = 'low' | 'medium' | 'high'

export type VehicleWithLastLog = Vehicle & {
  log_count: number
  last_service_date: string | null
  last_total_cost: number
}

export type MaintenanceLogWithItems = MaintenanceLog & {
  maintenance_log_items: MaintenanceLogItem[]
}

export type VehicleDetail = {
  vehicle: Vehicle
  parts: PartStatus[]
}

export type { LegalStatus, PartForecast } from '@/lib/prediction'

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }
