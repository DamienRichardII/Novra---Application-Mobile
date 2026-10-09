import { getSupabase } from './supabase';
import type { StoreSettings } from '@/types';

/** Retrait en boutique : actif seulement si adresse ET ville sont renseignées (doc 07). */
export async function fetchStoreSettings(): Promise<StoreSettings | null> {
  try {
    const { data, error } = await getSupabase().from('store_settings').select('name,address,zip,city,phone,email,hours,pickup_note').limit(1).maybeSingle();
    if (error || !data) return null;
    return data as StoreSettings;
  } catch {
    return null;
  }
}

export const isPickupAvailable = (s: StoreSettings | null | undefined) => !!(s?.address && s?.city);
