'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, VehicleComplaint } from '@/types'

const CATEGORIES = [
  'engine',
  'cvt_transmission',
  'braking',
  'electrical',
  'handling',
  'other',
] as const
const SEVERITIES = ['low', 'medium', 'high'] as const

const complaintSchema = z.object({
  title: z.string().trim().min(1, 'Judul keluhan wajib diisi').max(150),
  symptomCategory: z.enum(CATEGORIES).default('other'),
  severity: z.enum(SEVERITIES).default('medium'),
})

export async function getComplaints(
  vehicleId: string,
  includeResolved = false,
): Promise<VehicleComplaint[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('vehicle_complaints')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (!includeResolved) query = query.eq('is_resolved', false)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

function revalidateVehicle(vehicleId: string) {
  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath(`/vehicles/${vehicleId}/prep`)
}

export async function createComplaint(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<VehicleComplaint>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = complaintSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicle_complaints')
    .insert({
      vehicle_id: vehicleId,
      title: parsed.data.title,
      symptom_category: parsed.data.symptomCategory,
      severity: parsed.data.severity,
    })
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateVehicle(vehicleId)
  return { ok: true, data }
}

export async function setComplaintResolved(
  complaintId: string,
  vehicleId: string,
  resolved: boolean,
  resolvedLogId?: string | null,
): Promise<ActionResult<VehicleComplaint>> {
  if (!complaintId || !vehicleId) {
    return { ok: false, error: 'Data keluhan tidak valid' }
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('vehicle_complaints')
    .update({
      is_resolved: resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_log_id: resolved ? (resolvedLogId ?? null) : null,
    })
    .eq('id', complaintId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateVehicle(vehicleId)
  return { ok: true, data }
}

export async function deleteComplaint(
  complaintId: string,
  vehicleId: string,
): Promise<ActionResult> {
  if (!complaintId || !vehicleId) {
    return { ok: false, error: 'Data keluhan tidak valid' }
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('vehicle_complaints')
    .delete()
    .eq('id', complaintId)
    .eq('vehicle_id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidateVehicle(vehicleId)
  return { ok: true, data: undefined }
}
