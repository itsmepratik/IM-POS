// ======== MOCK CLIENT ========
// This is a mock implementation that doesn't connect to Supabase
import { Database } from '@/types/supabase';

// Create a mock client to replace the real Supabase client
export const supabase = {
  // Auth methods (mocked)
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  
  // Storage methods (mocked)
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `/mock-storage/${bucket}/${path}` } }),
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
  
  // Database methods (mocked)
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
        order: () => ({ limit: () => ({ range: () => ({ data: [], error: null }) }) }),
        is: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        limit: () => ({ data: [], error: null }),
      }),
      order: () => ({ limit: () => ({ range: () => ({ data: [], error: null }) }) }),
      contains: () => ({ data: [], error: null }),
      or: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
      data: [],
      error: null,
    }),
    insert: (data: Record<string, unknown>) => ({
      select: () => ({
        single: async () => ({ data: { id: 'mock-id', ...data }, error: null }),
      }),
    }),
    update: (data: Record<string, unknown>) => ({
      eq: () => ({ data: { ...data }, error: null }),
    }),
    delete: () => ({
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
    }),
    upsert: () => ({ data: null, error: null }),
  }),
  
  // RPC methods (mocked)
  rpc: (func: string, params?: Record<string, unknown>) => ({
    data: null,
    error: null,
  }),
};

// Console warning to remind developers this is a mock
console.warn(
  'Using mock Supabase client. No actual database connections will be made.',
  'This is safe for development without a database.'
); 