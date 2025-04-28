import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putvnnpptgiupfsohggq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHZubnBwdGdpdXBmc29oZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODUxMzQsImV4cCI6MjA1NDI2MTEzNH0.i4x7TVrZo2gqIInWS-0uBJNxNWlnoItM0YmypbrpIw4'
 
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'pos-inventory'
      }
    }
  }
) 