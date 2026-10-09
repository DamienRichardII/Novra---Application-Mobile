import { useQuery } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { fetchCatalogue, type CatalogueResult } from '@/api/catalogue';
import { fetchHomeSections } from '@/api/cms';
import { fetchStoreSettings } from '@/api/store';

/** staleTime 60 s comme CATALOGUE_TTL / CMS_CACHE_TTL du site (doc 03). */
export const STALE_MS = 60_000;

export function useCatalogue() {
  return useQuery<CatalogueResult>({ queryKey: ['catalogue'], queryFn: fetchCatalogue, staleTime: STALE_MS });
}

export function useHome() {
  return useQuery({ queryKey: ['home'], queryFn: fetchHomeSections, staleTime: STALE_MS });
}

export function useStoreSettings() {
  return useQuery({ queryKey: ['store'], queryFn: fetchStoreSettings, staleTime: 5 * STALE_MS });
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false));
    return unsub;
  }, []);
  return online;
}

/** Hors ligne si le réseau est coupé OU si le catalogue affiché n'est pas celui du serveur. */
export function useOffline(): boolean {
  const online = useOnline();
  const { data } = useCatalogue();
  return !online || (!!data && data.source !== 'live');
}
