'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, FuelLog } from '@/types'

const toBool = (value: unknown) =>
  value === true || value === 'true' || value === 'on' || value === '1' || value === 1

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const fuelLogSchema = z.object({
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  odometer: z.coerce.number().int().min(0, 'Odometer tidak boleh negatif'),
  liters: z.coerce.number().positive('Jumlah liter harus lebih dari 0'),
  pricePerLiter: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  totalCost: z.coerce.number().min(0, 'Total tidak boleh negatif'),
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

export async function createFuelLog(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<FuelLog>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = fuelLogSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { logDate, odometer, liters, pricePerLiter, fuelType, notes } = parsed.data
  const isFullTank = toBool(payload.get('isFullTank'))
  const totalCost =
    parsed.data.totalCost > 0 ? parsed.data.totalCost : liters * pricePerLiter

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

  if (odometer > vehicleResult.data.current_odometer) {
    await supabase
      .from('vehicles')
      .update({ current_odometer: odometer, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
  }

  revalidatePath('/')
  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath(`/vehicles/${vehicleId}/fuel`)
  return { ok: true, data: log }
}
