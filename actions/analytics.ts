'use server'

import { buildExpenseSummary } from '@/lib/analytics'
import type { AnalyticsItem, AnalyticsLog, ExpenseSummary } from '@/lib/analytics'
import { createServerClient } from '@/lib/supabase/server'

export async function getVehicleExpenseSummary(
  vehicleId: string,
  months = 6,
): Promise<ExpenseSummary | null> {
  const supabase = createServerClient()
  const [vehicleResult, logsResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('current_odometer')
      .eq('id', vehicleId)
      .maybeSingle(),
    supabase
      .from('maintenance_logs')
      .select('service_date, odometer, total_cost, maintenance_log_items(item_type, cost)')
      .eq('vehicle_id', vehicleId),
  ])

  if (vehicleResult.error) throw new Error(vehicleResult.error.message)
  if (logsResult.error) throw new Error(logsResult.error.message)
  if (!vehicleResult.data) return null

  const logs: AnalyticsLog[] = []
  const items: AnalyticsItem[] = []

  for (const row of logsResult.data) {
    logs.push({
      service_date: row.service_date,
      odometer: row.odometer,
      total_cost: row.total_cost,
    })
    for (const item of row.maintenance_log_items) {
      items.push({ item_type: item.item_type, cost: item.cost })
    }
  }

  return buildExpenseSummary({
    logs,
    items,
    currentOdometer: vehicleResult.data.current_odometer,
    months,
  })
}
