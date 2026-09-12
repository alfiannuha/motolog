import { getVehicleDetailWithRules } from '@/actions/maintenance'
import { getVehicles } from '@/actions/vehicles'
import { getWebPush } from '@/lib/push'
import { createServerClient } from '@/lib/supabase/server'
import type { PartStatus, Vehicle } from '@/types'

type Alert = { vehicle: Vehicle; part: PartStatus }

function message(alert: Alert) {
  const { vehicle, part } = alert
  const body =
    part.status === 'critical'
      ? part.remainingKm != null && part.remainingKm <= 0
        ? `Lewat ${Math.abs(part.remainingKm).toLocaleString('id-ID')} km dari jadwal`
        : 'Sudah lewat jadwal servis'
      : part.remainingKm != null
        ? `Sisa ${part.remainingKm.toLocaleString('id-ID')} km lagi`
        : `Sisa ${part.remainingDays ?? 0} hari lagi`

  return {
    title: `${part.partName} perlu servis`,
    body: `${vehicle.name} (${vehicle.license_plate}) — ${body}`,
    url: `/vehicles/${vehicle.id}`,
  }
}

export async function sendMaintenanceAlerts(): Promise<{
  ok: boolean
  alerts: number
  sent: number
  removed: number
}> {
  const vehicles = await getVehicles()
  const alerts: Alert[] = []

  for (const vehicle of vehicles) {
    const detail = await getVehicleDetailWithRules(vehicle.id)
    if (!detail) continue
    for (const part of detail.parts) {
      if (part.status !== 'healthy') alerts.push({ vehicle: detail.vehicle, part })
    }
  }

  if (alerts.length === 0) return { ok: true, alerts: 0, sent: 0, removed: 0 }

  const supabase = createServerClient()
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (!subscriptions?.length) return { ok: true, alerts: alerts.length, sent: 0, removed: 0 }

  const webpush = getWebPush()
  // ponytail: one push per alert per run; add a last_notified_status column if dedup/spam matters
  const payloads = alerts.map((alert) => JSON.stringify(message(alert)))
  let sent = 0
  let removed = 0

  for (const subscription of subscriptions) {
    const target = {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }

    for (const payload of payloads) {
      try {
        await webpush.sendNotification(target, payload)
        sent++
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint)
          removed++
          break
        }
      }
    }
  }

  return { ok: true, alerts: alerts.length, sent, removed }
}
