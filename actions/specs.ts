'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, VehicleSpec } from '@/types'

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable())

const specSchema = z.object({
  engineOilSpec: optionalText(100),
  transmissionOilSpec: optionalText(100),
  sparkPlugCode: optionalText(50),
  frontTireSize: optionalText(50),
  rearTireSize: optionalText(50),
  batteryType: optionalText(50),
  coolantCapacity: optionalText(50),
  notes: optionalText(2000),
})

export async function getVehicleSpec(
  vehicleId: string,
): Promise<VehicleSpec | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicle_specs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function upsertVehicleSpec(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<VehicleSpec>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = specSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicle_specs')
    .upsert(
      {
        vehicle_id: vehicleId,
        engine_oil_spec: parsed.data.engineOilSpec,
        transmission_oil_spec: parsed.data.transmissionOilSpec,
        spark_plug_code: parsed.data.sparkPlugCode,
        front_tire_size: parsed.data.frontTireSize,
        rear_tire_size: parsed.data.rearTireSize,
        battery_type: parsed.data.batteryType,
        coolant_capacity: parsed.data.coolantCapacity,
        notes: parsed.data.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'vehicle_id' },
    )
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  return { ok: true, data }
}
