import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

export function createServerClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error('Supabase URL/key belum dikonfigurasi di .env')
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
  })
}
