/**
 * Configuration unique. Aucune URL ni clé ne doit être écrite ailleurs (doc 03).
 * Les variables EXPO_PUBLIC_* sont visibles dans le binaire : n'y mettre que du public.
 */
const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const config = {
  supabaseUrl: trimSlash(process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''),
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  mediaBase: trimSlash(process.env.EXPO_PUBLIC_MEDIA_BASE ?? process.env.EXPO_PUBLIC_SITE_URL ?? ''),
  siteUrl: trimSlash(process.env.EXPO_PUBLIC_SITE_URL ?? ''),
  contactEmail: 'Novraurban@gmail.com',
  instagramHandle: 'novra_officiel',
} as const;

export const isConfigured = () => !!config.supabaseUrl && !!config.supabaseKey;

/**
 * Règles d'AFFICHAGE uniquement (le serveur recalcule tout dans create-order) — doc 06/07.
 * Centralisées ici pour ne pas les disperser dans les écrans.
 */
export const SHIPPING = {
  freeFromCents: 8000,
  rates: { standard: 490, express: 990, relay: 290, pickup: 0 },
  limits: { maxQty: 20, maxLines: 40 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING.rates;

export const SHIPPING_LABELS: Record<ShippingMethod, { title: string; subtitle: string }> = {
  standard: { title: 'Livraison standard', subtitle: '24-48 h ouvrées' },
  express: { title: 'Livraison express', subtitle: '24 h, commande avant 12 h' },
  relay: { title: 'Point relais', subtitle: '2-4 jours ouvrés' },
  pickup: { title: 'Retrait en boutique', subtitle: 'Gratuit' },
};

export const COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'LU', label: 'Luxembourg' },
] as const;

/** Vidéo de marque de l'accueil (fichier du site, hors base). */
export const HERO_VIDEO_PATH = 'assets/web/video/novra-hero.mp4';
export const HERO_POSTER_PATH = 'assets/web/video/novra-hero-poster.jpg';
