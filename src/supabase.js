import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan VUE_APP_SUPABASE_URL o VUE_APP_SUPABASE_KEY en el archivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)