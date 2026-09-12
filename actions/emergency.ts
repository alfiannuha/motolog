'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, BatteryLog, TireLog } from '@/types'

const emptyToNull = (value: unknown) =>
  value == null || (typeof value === 'string' && value.trim() === '')
    ? null
    : value

const TREAD_CONDITIONS = ['good', 'worn', 'critical'] as const
const BATTERY_CONDITIONS = ['healthy', 'weak', 'replace'] as const

const tireLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  frontPsi: z.coerce
    .number()
    .positive('Tekanan ban depan harus lebih dari 0')
    .max(100, 'Tekanan ban tidak wajar'),
  rearPsi: z.coerce
    .number()
    .positive('Tekanan ban belakang harus lebih dari 0')
    .max(100, 'Tekanan ban tidak wajar'),
  treadCondition: z.enum(TREAD_CONDITIONS).default('good'),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000, 'Catatan terlalu panjang').nullable(),
  ),
})

const batteryLogSchema = z.object({
  checkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  voltage: z.preprocess(
    emptyToNull,
    z.coerce
      .number()
      .min(0, 'Tegangan tidak boleh negatif')
      .max(30, 'Tegangan tidak wajar')
      .nullable(),
  ),
  condition: z.enum(BATTERY_CONDITIONS).default('healthy'),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000, 'Catatan terlalu panjang').nullable(),
  ),
})

export async function getTireLogs(vehicleId: string): Promise<TireLog[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tire_logs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('log_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getBatteryLogs(vehicleId: string): Promise<BatteryLog[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('battery_logs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('check_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

function revalidateEmergency(vehicleId: string) {
  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath('/')
}

export async function createTireLog(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<TireLog>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = tireLogSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { logDate, frontPsi, rearPsi, treadCondition, notes } = parsed.data

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tire_logs')
    .insert({
      vehicle_id: vehicleId,
      log_date: logDate,
      front_psi: frontPsi,
      rear_psi: rearPsi,
      tread_condition: treadCondition,
      notes,
    })
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateEmergency(vehicleId)
  return { ok: true, data }
}

export async function createBatteryLog(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<BatteryLog>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = batteryLogSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { checkDate, voltage, condition, notes } = parsed.data

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('battery_logs')
    .insert({
      vehicle_id: vehicleId,
      check_date: checkDate,
      voltage,
      condition,
      notes,
    })
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateEmergency(vehicleId)
  return { ok: true, data }
}
