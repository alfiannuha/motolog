'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, TrustedWorkshop } from '@/types'

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const workshopSchema = z.object({
  name: z.string().trim().min(1, 'Nama bengkel wajib diisi').max(150),
  specialty: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()),
  addressOrMapsUrl: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000).nullable(),
  ),
  phoneNumber: z.preprocess(emptyToNull, z.string().trim().max(30).nullable()),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  notes: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
})

export async function getTrustedWorkshops(
  vehicleId: string,
): Promise<TrustedWorkshop[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('trusted_workshops')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

function toRow(vehicleId: string, data: z.infer<typeof workshopSchema>) {
  return {
    vehicle_id: vehicleId,
    name: data.name,
    specialty: data.specialty,
    address_or_maps_url: data.addressOrMapsUrl,
    phone_number: data.phoneNumber,
    rating: data.rating,
    notes: data.notes,
  }
}

export async function createWorkshop(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<TrustedWorkshop>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const parsed = workshopSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('trusted_workshops')
    .insert(toRow(vehicleId, parsed.data))
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  return { ok: true, data }
}

export async function updateWorkshop(
  workshopId: string,
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<TrustedWorkshop>> {
  if (!workshopId || !vehicleId) {
    return { ok: false, error: 'Data bengkel tidak valid' }
  }

  const parsed = workshopSchema.safeParse(Object.fromEntries(payload))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('trusted_workshops')
    .update(toRow(vehicleId, parsed.data))
    .eq('id', workshopId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  return { ok: true, data }
}

export async function deleteWorkshop(
  workshopId: string,
  vehicleId: string,
): Promise<ActionResult> {
  if (!workshopId || !vehicleId) {
    return { ok: false, error: 'Data bengkel tidak valid' }
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('trusted_workshops')
    .delete()
    .eq('id', workshopId)
    .eq('vehicle_id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  return { ok: true, data: undefined }
}
