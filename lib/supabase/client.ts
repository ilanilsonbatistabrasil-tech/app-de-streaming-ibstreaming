import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey, supabaseUrl } from './config'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { secure: process.env.NODE_ENV === 'production' },
  })
  return client
}
