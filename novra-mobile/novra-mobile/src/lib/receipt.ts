import { formatPrice } from './money';
import type { OrderItem, OrderStatusResponse } from '@/types';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const itemName = (i: OrderItem) => String(i.name ?? i.product_name ?? i.slug ?? 'Article');
export const itemQty = (i: OrderItem) => Number(i.qty ?? i.quantity ?? 1);
export const itemUnit = (i: OrderItem) => Number(i.unit_price ?? i.price ?? 0);

/** Reçu de commande imprimable / PDF (équivalent du reçu navigateur du site). */
export function buildReceiptHtml(o: OrderStatusResponse): string {
  const rows = (o.items ?? [])
    .map(
      (i) =>
        `<tr><td>${esc(itemName(i))}<br><small>${esc([i.color, i.size].filter(Boolean).join(' · '))}</small></td><td class="r">${itemQty(i)}</td><td class="r">${formatPrice(itemUnit(i) * itemQty(i))}</td></tr>`,
    )
    .join('');
  const date = o.paid_at ?? o.created_at;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
  body{font-family:Helvetica,Arial,sans-serif;color:#0a0a0a;padding:32px;max-width:640px;margin:auto}
  h1{font-size:28px;letter-spacing:-.01em;text-transform:uppercase;margin:0 0 4px}
  table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px 0;border-bottom:1px solid #e2e2e2;text-align:left;font-size:14px}
  .r{text-align:right}small{color:#6f6f6f}.tot td{font-weight:700;border-bottom:0}
  </style></head><body>
  <h1>NOVRA</h1><p>Reçu de commande n° <strong>${esc(o.reference)}</strong><br>${date ? new Date(date).toLocaleDateString('fr-FR') : ''}</p>
  <table><thead><tr><th>Article</th><th class="r">Qté</th><th class="r">Total</th></tr></thead><tbody>${rows}
  <tr><td>Sous-total</td><td></td><td class="r">${formatPrice(Number(o.subtotal ?? 0))}</td></tr>
  <tr><td>Livraison</td><td></td><td class="r">${formatPrice(Number(o.shipping ?? 0))}</td></tr>
  ${Number(o.discount) ? `<tr><td>Remise</td><td></td><td class="r">-${formatPrice(Number(o.discount))}</td></tr>` : ''}
  <tr class="tot"><td>Total TTC</td><td></td><td class="r">${formatPrice(Number(o.total ?? 0))}</td></tr></tbody></table>
  <p><small>NOVRA — Aulnay-sous-Bois. Droit de rétractation de 14 jours. Retours gratuits sous 30 jours.</small></p>
  </body></html>`;
}
