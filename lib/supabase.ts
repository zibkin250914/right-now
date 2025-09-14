import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yubnlqdboiamaoxkisjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_MlCDY953SXcbwMwjdIqtrQ_3_gOK9Bv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Post {
  id: string
  channel: string
  chat_id: string
  message: string
  password: string
  created_at: string
}

export interface Feedback {
  id: string
  feedback: string
  created_at: string
  email_sent: boolean
}
