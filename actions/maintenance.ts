'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { calculatePartStatus, sortByUrgency } from '@/lib/maintenance-health'
import { createServerClient } from '@/lib/supabase/server'
import { parseAmount } from '@/lib/utils'
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
  odometer: z.preprocess(
    parseAmount,
    z.coerce.number().int().min(0, 'Odometer tidak boleh negatif'),
  ),
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

function receiptPath(url: string | null): string | null {
  return url?.split(`/${RECEIPT_BUCKET}/`)[1] ?? null
}

function revalidateMaintenance(vehicleId: string) {
  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath(`/vehicles/${vehicleId}/analytics`)
  revalidatePath('/')
}

// current_odometer is a high-water mark: it only ever moves up, so editing or
// deleting an old log never silently drags the vehicle's mileage back.
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

// Rule "last service" pointers are derived state: after any log change, replay
// the newest log per linked rule so they never point at a deleted/edited entry.
async function syncRuleLastService(
  supabase: ReturnType<typeof createServerClient>,
  vehicleId: string,
  ruleIds: string[],
) {
  const unique = [...new Set(ruleIds.filter(Boolean))]
  if (unique.length === 0) return

  const { data: items } = await supabase
    .from('maintenance_log_items')
    .select('rule_id, maintenance_logs!inner(service_date, odometer)')
    .eq('maintenance_logs.vehicle_id', vehicleId)
    .in('rule_id', unique)

  type ItemRow = {
    rule_id: string | null
    maintenance_logs: { service_date: string; odometer: number } | null
  }

  const latest = new Map<string, { service_date: string; odometer: number }>()
  for (const row of (items ?? []) as ItemRow[]) {
    const log = row.maintenance_logs
    if (!row.rule_id || !log) continue
    const current = latest.get(row.rule_id)
    if (
      !current ||
      log.service_date > current.service_date ||
      (log.service_date === current.service_date && log.odometer > current.odometer)
    ) {
      latest.set(row.rule_id, log)
    }
  }

  for (const ruleId of unique) {
    const newest = latest.get(ruleId)
    if (!newest) continue
    await supabase
      .from('maintenance_rules')
      .update({
        last_service_odometer: newest.odometer,
        last_service_date: newest.service_date,
      })
      .eq('id', ruleId)
      .eq('vehicle_id', vehicleId)
  }
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
      const path = receiptPath(receiptUrl)
      if (path) await supabase.storage.from(RECEIPT_BUCKET).remove([path])
    }
    return { ok: false, error: `Gagal menyimpan rincian: ${itemsError.message}` }
  }

  await bumpVehicleOdometer(supabase, vehicleId, odometer)

  await syncRuleLastService(
    supabase,
    vehicleId,
    items.map((item: ParsedItems) => item.ruleId ?? ''),
  )

  revalidateMaintenance(vehicleId)
  return { ok: true, data: log }
}

export async function updateMaintenanceLog(
  logId: string,
  vehicleId: string,
  payload: FormData,
): Promise<ActionResult<MaintenanceLog>> {
  if (!logId || !vehicleId) return { ok: false, error: 'Data servis tidak valid' }

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

  const { serviceDate, odometer, workshopName, totalCost, notes, items } = parsed.data
  const supabase = createServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_logs')
    .select('id, receipt_image_url')
    .eq('id', logId)
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existing) return { ok: false, error: 'Catatan servis tidak ditemukan' }

  const { data: previousItems } = await supabase
    .from('maintenance_log_items')
    .select('rule_id')
    .eq('log_id', logId)

  let receiptUrl = existing.receipt_image_url
  if (receiptFile) {
    const upload = await uploadReceipt(vehicleId, receiptFile)
    if (!upload.ok) return upload
    receiptUrl = upload.url
  }

  const { data: log, error: updateError } = await supabase
    .from('maintenance_logs')
    .update({
      service_date: serviceDate,
      odometer,
      workshop_name: workshopName,
      total_cost: totalCost,
      receipt_image_url: receiptUrl,
      notes,
    })
    .eq('id', logId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (updateError) return { ok: false, error: updateError.message }

  const { error: clearError } = await supabase
    .from('maintenance_log_items')
    .delete()
    .eq('log_id', logId)

  if (clearError) return { ok: false, error: clearError.message }

  const { error: itemsError } = await supabase
    .from('maintenance_log_items')
    .insert(
      items.map((item) => ({
        log_id: logId,
        rule_id: item.ruleId,
        item_name: item.itemName,
        item_type: item.itemType,
        cost: item.cost,
      })),
    )

  if (itemsError) return { ok: false, error: itemsError.message }

  if (receiptFile && existing.receipt_image_url) {
    const oldPath = receiptPath(existing.receipt_image_url)
    if (oldPath) await supabase.storage.from(RECEIPT_BUCKET).remove([oldPath])
  }

  await bumpVehicleOdometer(supabase, vehicleId, odometer)

  const affectedRules = [
    ...(previousItems ?? []).map((item) => item.rule_id ?? ''),
    ...items.map((item) => item.ruleId ?? ''),
  ]
  await syncRuleLastService(supabase, vehicleId, affectedRules)

  revalidateMaintenance(vehicleId)
  return { ok: true, data: log }
}

export async function deleteMaintenanceLog(
  logId: string,
  vehicleId: string,
): Promise<ActionResult> {
  if (!logId || !vehicleId) return { ok: false, error: 'Data servis tidak valid' }

  const supabase = createServerClient()
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_logs')
    .select('receipt_image_url')
    .eq('id', logId)
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existing) return { ok: false, error: 'Catatan servis tidak ditemukan' }

  const { data: items } = await supabase
    .from('maintenance_log_items')
    .select('rule_id')
    .eq('log_id', logId)

  const { error: itemsError } = await supabase
    .from('maintenance_log_items')
    .delete()
    .eq('log_id', logId)

  if (itemsError) return { ok: false, error: itemsError.message }

  const { error } = await supabase
    .from('maintenance_logs')
    .delete()
    .eq('id', logId)
    .eq('vehicle_id', vehicleId)

  if (error) return { ok: false, error: error.message }

  const path = receiptPath(existing.receipt_image_url)
  if (path) await supabase.storage.from(RECEIPT_BUCKET).remove([path])

  await syncRuleLastService(
    supabase,
    vehicleId,
    (items ?? []).map((item) => item.rule_id ?? ''),
  )

  revalidateMaintenance(vehicleId)
  return { ok: true, data: undefined }
}
