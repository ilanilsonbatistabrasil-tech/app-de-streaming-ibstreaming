const ibStreamingUrl = 'https://idhtndbidzpwsnlqlbkz.supabase.co'
const ibStreamingAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaHRuZGJpZHpwd3NubHFsYmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMTgyODQsImV4cCI6MjExMDY5NDI4NH0.i5VwYlLLbeRUva5VCUvl_zqdwbe86ouNIJJIvqHt9SQ'

const configuredUrl = process.env.NEXT_PUBLIC_IBSTREAMING_SUPABASE_URL
const configuredAnonKey = process.env.NEXT_PUBLIC_IBSTREAMING_SUPABASE_ANON_KEY
const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const defaultAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const defaultMatchesIbStreaming = Boolean(defaultUrl?.includes('idhtndbidzpwsnlqlbkz'))

export const supabaseUrl = configuredUrl || (defaultMatchesIbStreaming && defaultUrl ? defaultUrl : ibStreamingUrl)
export const supabaseAnonKey = configuredAnonKey || (defaultMatchesIbStreaming && defaultAnonKey ? defaultAnonKey : ibStreamingAnonKey)
