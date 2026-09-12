'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { calculatePartStatus, sortByUrgency } from '@/lib/maintenance-health'
import { createServerClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  MaintenanceLog,
  MaintenanceLogWithItems,
  VehicleDetail,
} from '@/types'

const RECEIPT_BUCKET = 'receipts'
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const itemSchema = z.object({
  itemName: z.string().trim().min(1, 'Nama item wajib diisi').max(100),
  itemType: z.enum(['part', 'service_fee']),
  cost: z.coerce.number().min(0, 'Biaya tidak boleh negatif'),
  ruleId: z.preprocess(
    emptyToNull,
    z.string().uuid('ID aturan tidak valid').nullable(),
  ),
})

const logSchema = z.object({
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal servis tidak valid'),
  odometer: z.coerce.number().int().min(0, 'Odometer tidak boleh negatif'),
  workshopName: z.preprocess(
    emptyToNull,
    z.string().trim().max(150, 'Nama bengkel terlalu panjang').nullable(),
  ),
  totalCost: z.coerce.number().min(0, 'Total biaya tidak boleh negatif').default(0),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000, 'Catatan terlalu panjang').nullable(),
  ),
  items: z.array(itemSchema).min(1, 'Tambahkan minimal satu item pekerjaan'),
})

type ParsedItems = z.infer<typeof itemSchema>

function parseItems(raw: unknown): unknown {
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export async function getVehicleDetailWithRules(
  vehicleId: string,
): Promise<VehicleDetail | null> {
  const supabase = createServerClient()
  const [vehicleResult, rulesResult] = await Promise.all([
    supabase.from('vehicles').select('*').eq('id', vehicleId).maybeSingle(),
    supabase.from('maintenance_rules').select('*').eq('vehicle_id', vehicleId),
  ])

  if (vehicleResult.error) throw new Error(vehicleResult.error.message)
  if (rulesResult.error) throw new Error(rulesResult.error.message)
  if (!vehicleResult.data) return null

  const vehicle = vehicleResult.data
  const parts = sortByUrgency(
    rulesResult.data.map((rule) =>
      calculatePartStatus(
        {
          ruleId: rule.id,
          partName: rule.part_name,
          intervalKm: rule.interval_km,
          intervalMonths: rule.interval_months,
          lastServiceOdometer: rule.last_service_odometer,
          lastServiceDate: rule.last_service_date,
        },
        vehicle.current_odometer,
      ),
    ),
  )

  return { vehicle, parts }
}

export async function getMaintenanceHistory(
  vehicleId: string,
): Promise<MaintenanceLogWithItems[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select('*, maintenance_log_items(*)')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as MaintenanceLogWithItems[]
}

async function uploadReceipt(
  vehicleId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { ok: false, error: 'Format nota harus JPEG, PNG, atau WebP' }
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { ok: false, error: 'Ukuran nota maksimal 5 MB' }
  }

  const supabase = createServerClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${vehicleId}/${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: `Gagal upload nota: ${error.message}` }

  const { data } = supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

export async function createMaintenanceLog(
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<MaintenanceLog>> {
  if (!vehicleId) return { ok: false, error: 'ID kendaraan tidak valid' }

  const receiptInput = payload.get('receiptFile')
  const receiptFile =
    receiptInput instanceof File && receiptInput.size > 0 ? receiptInput : null

  const parsed = logSchema.safeParse({
    ...Object.fromEntries(payload),
    items: parseItems(payload.get('items')),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const { serviceDate, odometer, workshopName, totalCost, notes, items } =
    parsed.data
  const supabase = createServerClient()

  let receiptUrl: string | null = null
  if (receiptFile) {
    const upload = await uploadReceipt(vehicleId, receiptFile)
    if (!upload.ok) return upload
    receiptUrl = upload.url
  }

  const { data: log, error: logError } = await supabase
    .from('maintenance_logs')
    .insert({
      vehicle_id: vehicleId,
      service_date: serviceDate,
      odometer,
      workshop_name: workshopName,
      total_cost: totalCost,
      receipt_image_url: receiptUrl,
      notes,
    })
    .select()
    .single()

  if (logError) return { ok: false, error: logError.message }

  const { error: itemsError } = await supabase
    .from('maintenance_log_items')
    .insert(
      items.map((item) => ({
        log_id: log.id,
        rule_id: item.ruleId,
        item_name: item.itemName,
        item_type: item.itemType,
        cost: item.cost,
      })),
    )

  if (itemsError) {
    await supabase.from('maintenance_logs').delete().eq('id', log.id)
    if (receiptUrl) {
      const path = receiptUrl.split(`/${RECEIPT_BUCKET}/`)[1]
      if (path) await supabase.storage.from(RECEIPT_BUCKET).remove([path])
    }
    return { ok: false, error: `Gagal menyimpan rincian: ${itemsError.message}` }
  }

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('current_odometer')
    .eq('id', vehicleId)
    .single()

  if (vehicle && odometer > vehicle.current_odometer) {
    await supabase
      .from('vehicles')
      .update({ current_odometer: odometer, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
  }

  const ruleIds = [
    ...new Set(
      items
        .map((item: ParsedItems) => item.ruleId)
        .filter((ruleId): ruleId is string => Boolean(ruleId)),
    ),
  ]

  if (ruleIds.length > 0) {
    await supabase
      .from('maintenance_rules')
      .update({ last_service_odometer: odometer, last_service_date: serviceDate })
      .in('id', ruleIds)
      .eq('vehicle_id', vehicleId)
  }

  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath('/')
  return { ok: true, data: log }
}
