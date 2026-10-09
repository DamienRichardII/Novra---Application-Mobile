import { config } from '@/lib/config';
import { UserFacingError } from './errors';
import type { ShippingMethod } from '@/lib/config';
import type { CartLine, OrderStatusResponse } from '@/types';

const TIMEOUT_MS = 30000;

async function call<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T & { error?: string; code?: string } }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${config.supabaseUrl}/functions/v1/${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { apikey: config.supabaseKey, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { ok: res.ok, status: res.status, data: data as T & { error?: string; code?: string } };
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') {
      throw new UserFacingError('Le serveur met trop de temps à répondre. Réessayez.', 'TIMEOUT', 504);
    }
    throw new UserFacingError('Connexion impossible. Vérifiez votre réseau.', 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

export type CreateOrderInput = {
  lines: CartLine[];
  email: string;
  shipping: ShippingMethod;
  promo?: string;
  idempotency_key: string;
  address?: {
    firstname: string;
    lastname: string;
    phone: string;
    address?: string;
    address2?: string;
    zip?: string;
    city?: string;
    country?: string;
  };
};

export type CreateOrderResponse = { reference: string; access_token: string; checkout_id?: string; checkout_url: string };

/** Le téléphone n'envoie que des références et des quantités : jamais un montant (règle d'or). */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const body = {
    lines: input.lines.map((l) => ({ slug: l.slug, color: l.color, size: l.size, qty: l.qty })),
    email: input.email,
    shipping: input.shipping,
    idempotency_key: input.idempotency_key,
    ...(input.promo ? { promo: input.promo } : {}),
    ...(input.address ? { address: input.address } : {}),
    // client: 'app' sera ajouté avec l'évolution B1 (voir MOBILE_APP_README.md).
  };
  const { ok, status, data } = await call<CreateOrderResponse>('create-order', { method: 'POST', body: JSON.stringify(body) });
  if (!ok || !data.checkout_url) {
    throw new UserFacingError(data.error || 'Impossible de créer la commande. Réessayez.', data.code, status);
  }
  return data;
}

export const REFERENCE_RE = /^NVR-\d{6}-[A-Z0-9]{4}$/;

/** Retour de paiement (réf + jeton) ou suivi (réf + e-mail) — jamais la référence seule. */
export async function getOrderStatus(
  params: { ref: string; token: string } | { reference: string; email: string },
): Promise<OrderStatusResponse> {
  const qs =
    'ref' in params
      ? `ref=${encodeURIComponent(params.ref)}&t=${encodeURIComponent(params.token)}`
      : `reference=${encodeURIComponent(params.reference)}&email=${encodeURIComponent(params.email)}`;
  const { ok, status, data } = await call<OrderStatusResponse>(`order-status?${qs}`, { method: 'GET' });
  if (!ok) {
    throw new UserFacingError(
      data.error || (status === 404 ? 'Commande introuvable. Vérifiez le numéro et l’e-mail.' : 'Impossible de lire la commande.'),
      data.code,
      status,
    );
  }
  return data;
}
