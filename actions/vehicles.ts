'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { getStandardRules } from '@/lib/standard-rules'
import type { ActionResult, Vehicle, VehicleWithLastLog } from '@/types'
import type { Database } from '@/types/database'

type MaintenanceRuleInsert =
  Database['public']['Tables']['maintenance_rules']['Insert']

const RECEIPT_BUCKET = 'receipts'

const createVehicleSchema = z.object({
  name: z.string().trim().min(1, 'Nama kendaraan wajib diisi').max(100),
  license_plate: z.string().trim().min(1, 'Plat nomor wajib diisi').max(20),
  vehicle_type: z.enum(['motorcycle', 'car'], {
    message: 'Jenis kendaraan harus motorcycle atau car',
  }),
  transmission_type: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.enum(['matic', 'manual']).nullable(),
  ),
  manufacture_year: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number()
      .int()
      .min(1900, 'Tahun tidak valid')
      .max(2100, 'Tahun tidak valid')
      .nullable(),
  ),
  current_odometer: z.coerce
    .number()
    .int()
    .min(0, 'Odometer tidak boleh negatif')
    .default(0),
})

function standardRules(vehicle: Vehicle): MaintenanceRuleInsert[] {
  const today = new Date().toISOString().slice(0, 10)

  return getStandardRules(vehicle.vehicle_type, vehicle.transmission_type).map(
    (rule) => ({
      vehicle_id: vehicle.id,
      part_name: rule.partName,
      interval_km: rule.intervalKm,
      interval_months: rule.intervalMonths,
      last_service_odometer: vehicle.current_odometer,
      last_service_date: today,
    }),
  )
}

export async function getVehicles(): Promise<VehicleWithLastLog[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, maintenance_logs(service_date, total_cost)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data.map(({ maintenance_logs, ...vehicle }) => {
    const latest = maintenance_logs.reduce<(typeof maintenance_logs)[number] | null>(
      (acc, log) =>
        !acc || log.service_date > acc.service_date ? log : acc,
      null,
    )

    return {
      ...vehicle,
      log_count: maintenance_logs.length,
      last_service_date: latest?.service_date ?? null,
      last_total_cost: latest?.total_cost ?? 0,
    }
  })
}

export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function createVehicle(
  formData: FormData,
): Promise<ActionResult<Vehicle>> {
  const parsed = createVehicleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const supabase = createServerClient()
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  const { error: ruleError } = await supabase
    .from('maintenance_rules')
    .insert(standardRules(vehicle))

  if (ruleError) {
    await supabase.from('vehicles').delete().eq('id', vehicle.id)
    return { ok: false, error: `Gagal membuat aturan servis: ${ruleError.message}` }
  }

  revalidatePath('/')
  return { ok: true, data: vehicle }
}

export async function updateOdometer(
  vehicleId: string,
  newOdometer: number,
): Promise<ActionResult<Vehicle>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }
  if (!Number.isInteger(newOdometer) || newOdometer < 0) {
    return { ok: false, error: 'Odometer harus bilangan bulat positif' }
  }

  const supabase = createServerClient()
  const { data: vehicle, error: fetchError } = await supabase
    .from('vehicles')
    .select('current_odometer')
    .eq('id', vehicleId)
    .single()

  if (fetchError || !vehicle) {
    return { ok: false, error: 'Kendaraan tidak ditemukan' }
  }

  if (newOdometer < vehicle.current_odometer) {
    return {
      ok: false,
      error: `Odometer tidak boleh lebih kecil dari ${vehicle.current_odometer} km`,
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({ current_odometer: newOdometer, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  return { ok: true, data }
}

const legalSchema = z.object({
  taxDueDate: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal pajak tidak valid')
      .nullable(),
  ),
  plateDueDate: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal plat tidak valid')
      .nullable(),
  ),
  estimatedDailyKm: z.coerce
    .number()
    .int()
    .min(1, 'Estimasi harian minimal 1 km')
    .max(2000, 'Estimasi harian tidak wajar')
    .default(20),
})

export async function updateVehicleLegal(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<Vehicle>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = legalSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      tax_due_date: parsed.data.taxDueDate,
      plate_due_date: parsed.data.plateDueDate,
      estimated_daily_km: parsed.data.estimatedDailyKm,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath(`/vehicles/${vehicleId}`)
  return { ok: true, data }
}

export async function deleteVehicle(
  vehicleId: string,
): Promise<ActionResult<undefined>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const supabase = createServerClient()

  const { data: vehicle, error: fetchError } = await supabase
    .from('vehicles')
    .select('license_plate')
    .eq('id', vehicleId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!vehicle) return { ok: false, error: 'Kendaraan tidak ditemukan' }

  const { data: logs, error: logsError } = await supabase
    .from('maintenance_logs')
    .select('id, receipt_image_url')
    .eq('vehicle_id', vehicleId)

  if (logsError) return { ok: false, error: logsError.message }

  const logIds = (logs ?? []).map((log) => log.id)
  const filePaths = (logs ?? [])
    .map((log) => log.receipt_image_url?.split(`/${RECEIPT_BUCKET}/`)[1])
    .filter((path): path is string => Boolean(path))

  // maintenance_log_items hang off maintenance_logs; clear them first so this
  // works even if the base schema was created without ON DELETE CASCADE.
  if (logIds.length > 0) {
    const { error } = await supabase
      .from('maintenance_log_items')
      .delete()
      .in('log_id', logIds)
    if (error) {
      return { ok: false, error: `Gagal menghapus rincian servis: ${error.message}` }
    }
  }

  // Explicitly clear every child table before the parent vehicle row, so the
  // delete is safe regardless of whether each FK declares ON DELETE CASCADE.
  const childDeletes = [
    await supabase.from('maintenance_logs').delete().eq('vehicle_id', vehicleId),
    await supabase.from('maintenance_rules').delete().eq('vehicle_id', vehicleId),
    await supabase.from('fuel_logs').delete().eq('vehicle_id', vehicleId),
    await supabase.from('vehicle_specs').delete().eq('vehicle_id', vehicleId),
    await supabase.from('trusted_workshops').delete().eq('vehicle_id', vehicleId),
    await supabase.from('vehicle_complaints').delete().eq('vehicle_id', vehicleId),
    await supabase.from('tire_logs').delete().eq('vehicle_id', vehicleId),
    await supabase.from('battery_logs').delete().eq('vehicle_id', vehicleId),
  ]

  const failed = childDeletes.find((result) => result.error)
  if (failed?.error) {
    return {
      ok: false,
      error: `Gagal menghapus data terkait: ${failed.error.message}`,
    }
  }

  const { error: vehicleError } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)

  if (vehicleError) return { ok: false, error: vehicleError.message }

  if (filePaths.length > 0) {
    await supabase.storage.from(RECEIPT_BUCKET).remove(filePaths)
  }

  revalidatePath('/')
  redirect(`/?deleted=${encodeURIComponent(vehicle.license_plate)}`)
}

