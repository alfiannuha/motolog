'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const subscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint tidak valid'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export async function savePushSubscription(
  input: unknown,
): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Langganan notifikasi tidak valid' }
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: (await headers()).get('user-agent'),
    },
    { onConflict: 'endpoint' },
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

export async function removePushSubscription(
  endpoint: string,
): Promise<ActionResult> {
  if (!endpoint) return { ok: false, error: 'Endpoint tidak valid' }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}
