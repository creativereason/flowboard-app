import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const missingConfig = !url || !key

// createClient throws on an empty URL, so fall back to placeholders and let
// App render a setup message instead of crashing to a blank page.
export const supabase = createClient(url || 'http://localhost', key || 'missing')
