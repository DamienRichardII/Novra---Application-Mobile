import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabase';
import fallbackJson from '@/data/catalogue-fallback.json';
import type { Product, Variant } from '@/types';

export const CATEGORIES: { key: string; label: string }[] = [
  { key: 't-shirts', label: 'T-shirts' },
  { key: 'polos', label: 'Polos' },
  { key: 'ensembles', label: 'Ensembles' },
  { key: 'pantalons', label: 'Pantalons' },
  { key: 'vestes', label: 'Vestes & Hoodie' },
  { key: 'accessoires', label: 'Accessoires' },
];

/** Ordre d'affichage des tailles (doc 05) : jamais alphabétique. */
export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'TU'];
export const sortSizes = (sizes: string[]) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

/** Pastilles de couleur — `COLOR_SWATCHES` de js/products.js (à garder synchronisé). */
export const COLOR_SWATCHES: Record<string, string> = {
  Noir: '#111111',
  Blanc: '#f2f2f2',
  Gris: '#8a8d90',
  Anthracite: '#33363a',
  Beige: '#e4dfcd',
  Kaki: '#5a6046',
  Orange: '#e8481c',
  Menthe: '#57e0c0',
  Corail: '#ff5a5f',
  Rose: '#c9a1a6',
  'Bleu roi': '#1e4fc2',
  'Vert clair': '#8fd694',
};
export const colorSwatch = (name: string) => COLOR_SWATCHES[name] ?? '#888888';

const CACHE_KEY = 'novra_catalogue_v1';

export type CatalogueSource = 'live' | 'cache' | 'bundled';
export type CatalogueResult = { products: Product[]; source: CatalogueSource };

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  gender: string | null;
  price: number | string;
  description: string | null;
  details: unknown;
  images: string[] | null;
  colors: string[] | null;
  sizes: string[] | null;
  badge?: string | null;
  featured?: boolean | null;
  track_inventory?: boolean | null;
  focal_x?: number | null;
  focal_y?: number | null;
  created_at?: string;
  product_variants?: Variant[] | null;
};

const num = (v: unknown, d = 50) => (Number.isFinite(Number(v)) ? Number(v) : d);

function parseDetails(raw: unknown) {
  // En base, `details` est soit une liste (ancien format), soit { technicalDetails, composition, care }.
  if (Array.isArray(raw)) return { technicalDetails: raw.map(String), composition: '', care: '' };
  if (raw && typeof raw === 'object') {
    const o = raw as { technicalDetails?: unknown; composition?: unknown; care?: unknown };
    return {
      technicalDetails: Array.isArray(o.technicalDetails) ? o.technicalDetails.map(String) : [],
      composition: typeof o.composition === 'string' ? o.composition : '',
      care: typeof o.care === 'string' ? o.care : '',
    };
  }
  return { technicalDetails: [], composition: '', care: '' };
}

export function normalizeProduct(r: Row): Product {
  const cat = CATEGORIES.find((c) => c.key === r.category);
  const d = parseDetails(r.details);
  return {
    id: r.slug,
    slug: r.slug,
    name: r.name,
    category: r.category,
    categoryLabel: cat?.label ?? r.category,
    gender: r.gender ?? 'unisexe',
    price: Number(r.price) || 0,
    description: r.description ?? '',
    images: (r.images ?? []).filter(Boolean),
    colors: r.colors ?? [],
    sizes: sortSizes(r.sizes ?? []),
    variants: (r.product_variants ?? []).map((v) => ({ color: v.color, size: v.size, stock: Number(v.stock) || 0 })),
    trackInventory: !!r.track_inventory,
    isNew: (r.badge ?? '').toLowerCase().startsWith('nouv'),
    featured: !!r.featured,
    technicalDetails: d.technicalDetails,
    composition: d.composition,
    care: d.care,
    focalX: num(r.focal_x),
    focalY: num(r.focal_y),
    createdAt: r.created_at,
  };
}

const usable = (p: Product) => p.images.length > 0 && p.colors.length > 0 && p.sizes.length > 0 && p.price > 0;

/** Instantané embarqué au build (`npm run snapshot`). */
export function bundledCatalogue(): Product[] {
  return (fallbackJson.products as unknown as Row[]).map(normalizeProduct).filter(usable);
}

async function readCache(): Promise<Product[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { products?: Product[] };
    return Array.isArray(parsed.products) && parsed.products.length ? parsed.products : null;
  } catch {
    return null;
  }
}

/**
 * Catalogue : base Supabase (prix, photos, statut font foi) → dernier catalogue en cache → instantané embarqué.
 * Seuls les produits actifs sont lus (RLS) ; une réponse vide n'efface rien.
 */
export async function fetchCatalogue(): Promise<CatalogueResult> {
  try {
    const { data, error } = await getSupabase()
      .from('products')
      .select(
        'id, slug, name, category, gender, price, description, details, images, colors, sizes, badge, featured, track_inventory, focal_x, focal_y, created_at, sort_order, product_variants(color, size, stock)',
      )
      .eq('status', 'active')
      .order('sort_order');
    if (error) throw error;
    const products = (data as unknown as Row[]).map(normalizeProduct).filter(usable);
    if (!products.length) throw new Error('Catalogue vide');
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), products })).catch(() => undefined);
    return { products, source: 'live' };
  } catch {
    const cached = await readCache();
    if (cached) return { products: cached, source: 'cache' };
    return { products: bundledCatalogue(), source: 'bundled' };
  }
}

/* ------------------------- Disponibilité (affichage) ------------------------- */

/** Un produit non suivi est toujours vendable ; sinon il faut une variante en stock. */
export function variantStock(p: Product, color: string, size: string): number | null {
  const v = p.variants.find((x) => x.color === color && x.size === size);
  if (!p.trackInventory) return null; // illimité côté affichage
  return v ? v.stock : 0;
}

export function isVariantAvailable(p: Product, color: string, size: string): boolean {
  const s = variantStock(p, color, size);
  return s === null || s > 0;
}

export function isSizeAvailable(p: Product, size: string, color?: string): boolean {
  if (!p.trackInventory) return true;
  const colors = color ? [color] : p.colors;
  return colors.some((c) => isVariantAvailable(p, c, size));
}

export function isProductAvailable(p: Product): boolean {
  if (!p.trackInventory) return true;
  return p.colors.some((c) => p.sizes.some((s) => isVariantAvailable(p, c, s)));
}

/** « Vous aimerez aussi » : même catégorie, puis même genre, puis le reste (`getRelatedProducts` du site). */
export function relatedProducts(all: Product[], product: Product, limit = 6): Product[] {
  const others = all.filter((p) => p.slug !== product.slug);
  const same = others.filter((p) => p.category === product.category);
  const sameGender = others.filter((p) => p.category !== product.category && p.gender === product.gender);
  const rest = others.filter((p) => !same.includes(p) && !sameGender.includes(p));
  return [...same, ...sameGender, ...rest].slice(0, limit);
}
