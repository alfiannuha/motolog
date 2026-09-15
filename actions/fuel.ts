'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { parseAmount } from '@/lib/utils'
import type { ActionResult, FuelLog } from '@/types'

const toBool = (value: unknown) =>
  value === true || value === 'true' || value === 'on' || value === '1' || value === 1

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const fuelLogSchema = z.object({
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  odometer: z.preprocess(
    parseAmount,
    z.coerce.number().int().min(0, 'Odometer tidak boleh negatif'),
  ),
  pricePerLiter: z.preprocess(
    parseAmount,
    z.coerce.number().positive('Harga per liter harus lebih dari 0'),
  ),
  totalCost: z.preprocess(
    parseAmount,
    z.coerce.number().positive('Total bayar harus lebih dari 0'),
  ),
  fuelType: z.preprocess(
    emptyToNull,
    z.string().trim().max(50, 'Jenis BBM terlalu panjang').nullable(),
  ),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000, 'Catatan terlalu panjang').nullable(),
  ),
})

export async function getFuelLogs(vehicleId: string): Promise<FuelLog[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('log_date', { ascending: false })
    .order('odometer', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

function revalidateFuel(vehicleId: string) {
  revalidatePath('/')
  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath(`/vehicles/${vehicleId}/fuel`)
  revalidatePath(`/vehicles/${vehicleId}/analytics`)
}

// current_odometer is a high-water mark: it only ever moves up, so editing or
// deleting an old record never silently drags the vehicle's mileage back.
async function bumpVehicleOdometer(
  supabase: ReturnType<typeof createServerClient>,
  vehicleId: string,
  odometer: number,
) {
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('current_odometer')
    .eq('id', vehicleId)
    .maybeSingle()

  if (vehicle && odometer > vehicle.current_odometer) {
    await supabase
      .from('vehicles')
      .update({ current_odometer: odometer, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
  }
}

export async function createFuelLog(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<FuelLog>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = fuelLogSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { logDate, odometer, pricePerLiter, totalCost, fuelType, notes } =
    parsed.data
  const isFullTank = toBool(payload.get('isFullTank'))
  const liters = Math.round((totalCost / pricePerLiter) * 100) / 100

  const supabase = createServerClient()
  const [vehicleResult, latestResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('current_odometer')
      .eq('id', vehicleId)
      .maybeSingle(),
    supabase
      .from('fuel_logs')
      .select('odometer')
      .eq('vehicle_id', vehicleId)
      .order('odometer', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (vehicleResult.error) return { ok: false, error: vehicleResult.error.message }
  if (!vehicleResult.data) return { ok: false, error: 'Kendaraan tidak ditemukan' }
  if (latestResult.error) return { ok: false, error: latestResult.error.message }

  const previous = latestResult.data?.odometer
  if (previous != null && odometer < previous) {
    return {
      ok: false,
      error: `Odometer tidak boleh lebih kecil dari catatan BBM sebelumnya (${previous} km)`,
    }
  }

  const { data: log, error } = await supabase
    .from('fuel_logs')
    .insert({
      vehicle_id: vehicleId,
      log_date: logDate,
      odometer,
      liters,
      price_per_liter: pricePerLiter,
      total_cost: totalCost,
      is_full_tank: isFullTank,
      fuel_type: fuelType,
      notes,
    })
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  await bumpVehicleOdometer(supabase, vehicleId, odometer)

  revalidateFuel(vehicleId)
  return { ok: true, data: log }
}

export async function updateFuelLog(
  logId: string,
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<FuelLog>> {
  if (!logId || !vehicleId) return { ok: false, error: 'Data BBM tidak valid' }

  const parsed = fuelLogSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { logDate, odometer, pricePerLiter, totalCost, fuelType, notes } = parsed.data
  const isFullTank = toBool(payload.get('isFullTank'))
  const liters = Math.round((totalCost / pricePerLiter) * 100) / 100

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fuel_logs')
    .update({
      log_date: logDate,
      odometer,
      liters,
      price_per_liter: pricePerLiter,
      total_cost: totalCost,
      is_full_tank: isFullTank,
      fuel_type: fuelType,
      notes,
    })
    .eq('id', logId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  await bumpVehicleOdometer(supabase, vehicleId, odometer)

  revalidateFuel(vehicleId)
  return { ok: true, data }
}

export async function deleteFuelLog(
  logId: string,
  vehicleId: string,
): Promise<ActionResult> {
  if (!logId || !vehicleId) return { ok: false, error: 'Data BBM tidak valid' }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('fuel_logs')
    .delete()
    .eq('id', logId)
    .eq('vehicle_id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidateFuel(vehicleId)
  return { ok: true, data: undefined }
}
