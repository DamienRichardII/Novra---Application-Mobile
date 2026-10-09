import { SHIPPING } from './config';
import { toCents } from './money';
import type { CartLine, Product } from '@/types';

const clampQty = (q: number) => Math.min(SHIPPING.limits.maxQty, Math.max(1, Math.floor(q) || 1));

/** Fusion des lignes identiques (même slug + couleur + taille), quantité 1–20, 40 lignes max (limites du serveur). */
export function mergeLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const idx = lines.findIndex((l) => l.slug === incoming.slug && l.color === incoming.color && l.size === incoming.size);
  if (idx >= 0) {
    return lines.map((l, i) => (i === idx ? { ...l, qty: clampQty(l.qty + incoming.qty) } : l));
  }
  if (lines.length >= SHIPPING.limits.maxLines) return lines;
  return [...lines, { ...incoming, qty: clampQty(incoming.qty) }];
}

export type LineIssue = 'missing' | 'size-gone';
export type PricedLine = CartLine & { product?: Product; unitCents: number; totalCents: number; issue?: LineIssue };

/** Le prix n'est jamais stocké dans le panier : il est relu du catalogue à l'affichage (doc 06). */
export function priceLines(lines: CartLine[], catalogue: Product[]): PricedLine[] {
  const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
  return lines.map((l) => {
    const product = bySlug.get(l.slug);
    if (!product) return { ...l, unitCents: 0, totalCents: 0, issue: 'missing' as const };
    const unitCents = toCents(product.price);
    const ok = product.sizes.includes(l.size) && product.colors.includes(l.color);
    return { ...l, product, unitCents, totalCents: unitCents * l.qty, issue: ok ? undefined : ('size-gone' as const) };
  });
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const subtotalCents = (priced: PricedLine[]) => priced.reduce((n, l) => n + l.totalCents, 0);
