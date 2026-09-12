'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, MaintenanceRule } from '@/types'

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const interval = (label: string) =>
  z.preprocess(
    emptyToNull,
    z.coerce
      .number()
      .int()
      .min(1, `${label} minimal 1`)
      .nullable(),
  )

const ruleSchema = z.object({
  partName: z.string().trim().min(1, 'Nama komponen wajib diisi').max(100),
  intervalKm: interval('Interval km'),
  intervalMonths: interval('Interval bulan'),
})

function revalidateVehicle(vehicleId: string) {
  revalidatePath('/')
  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath(`/vehicles/${vehicleId}/fuel`)
  revalidatePath(`/vehicles/${vehicleId}/analytics`)
}

export async function createRule(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<MaintenanceRule>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = ruleSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('current_odometer')
    .eq('id', vehicleId)
    .maybeSingle()

  if (vehicleError) return { ok: false, error: vehicleError.message }
  if (!vehicle) return { ok: false, error: 'Kendaraan tidak ditemukan' }

  const { data, error } = await supabase
    .from('maintenance_rules')
    .insert({
      vehicle_id: vehicleId,
      part_name: parsed.data.partName,
      interval_km: parsed.data.intervalKm,
      interval_months: parsed.data.intervalMonths,
      last_service_odometer: vehicle.current_odometer,
      last_service_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateVehicle(vehicleId)
  return { ok: true, data }
}

export async function updateRule(
  ruleId: string,
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<MaintenanceRule>> {
  if (!ruleId || !vehicleId) return { ok: false, error: 'Data aturan tidak valid' }

  const parsed = ruleSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('maintenance_rules')
    .update({
      part_name: parsed.data.partName,
      interval_km: parsed.data.intervalKm,
      interval_months: parsed.data.intervalMonths,
    })
    .eq('id', ruleId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateVehicle(vehicleId)
  return { ok: true, data }
}

export async function deleteRule(
  ruleId: string,
  vehicleId: string,
): Promise<ActionResult> {
  if (!ruleId || !vehicleId) return { ok: false, error: 'Data aturan tidak valid' }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('maintenance_rules')
    .delete()
    .eq('id', ruleId)
    .eq('vehicle_id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidateVehicle(vehicleId)
  return { ok: true, data: undefined }
}
