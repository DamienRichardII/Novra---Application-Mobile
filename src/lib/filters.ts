import { isProductAvailable, isSizeAvailable } from '@/api/catalogue';
import type { Product } from '@/types';

export type SortKey = 'new' | 'priceAsc' | 'priceDesc' | 'name';

export type Filters = {
  category: string | null;
  gender: string | null;
  size: string | null;
  color: string | null;
  maxPrice: number | null;
  inStock: boolean;
  newOnly: boolean;
};

export const EMPTY_FILTERS: Filters = { category: null, gender: null, size: null, color: null, maxPrice: null, inStock: false, newOnly: false };

export const activeFilterCount = (f: Filters) =>
  [f.category, f.gender, f.size, f.color, f.maxPrice].filter((v) => v !== null).length + (f.inStock ? 1 : 0) + (f.newOnly ? 1 : 0);

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Filtrage local sur nom / catégorie / couleur (catalogue de quelques dizaines de produits — doc 05). */
export function matchesQuery(p: Product, query: string): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  const hay = norm([p.name, p.categoryLabel, p.category, p.gender, ...p.colors].join(' '));
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export function applyFilters(products: Product[], f: Filters, query: string, sort: SortKey): Product[] {
  const out = products.filter((p) => {
    if (f.category && p.category !== f.category) return false;
    if (f.gender && p.gender !== f.gender && p.gender !== 'unisexe') return false;
    if (f.color && !p.colors.includes(f.color)) return false;
    if (f.size && !(p.sizes.includes(f.size) && isSizeAvailable(p, f.size, f.color ?? undefined))) return false;
    if (f.maxPrice !== null && p.price > f.maxPrice) return false;
    if (f.inStock && !isProductAvailable(p)) return false;
    if (f.newOnly && !p.isNew) return false;
    return matchesQuery(p, query);
  });
  const by: Record<SortKey, (a: Product, b: Product) => number> = {
    new: (a, b) => Number(b.isNew) - Number(a.isNew) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name, 'fr'),
  };
  return [...out].sort(by[sort]);
}
