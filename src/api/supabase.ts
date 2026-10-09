import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { secureStorage } from '@/lib/storage';

let client: SupabaseClient | null = null;

/** Client unique. URL et clé viennent exclusivement de la configuration (migration Supabase prévue — doc 12). */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabaseUrl || 'http://localhost', config.supabaseKey || 'missing', {
      auth: {
        storage: secureStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
