import { SHIPPING, type ShippingMethod } from './config';

/** ESTIMATION d'affichage : create-order recalcule tout côté serveur (doc 04/06). */
export function estimateShippingCents(subtotal: number, method: ShippingMethod): number {
  if (method === 'standard' && subtotal >= SHIPPING.freeFromCents) return 0;
  return SHIPPING.rates[method];
}

export const remainingForFreeShipping = (subtotal: number) => Math.max(0, SHIPPING.freeFromCents - subtotal);
export const freeShippingProgress = (subtotal: number) => Math.min(1, subtotal / SHIPPING.freeFromCents);
