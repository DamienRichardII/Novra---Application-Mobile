import { getSupabase } from './supabase';
import { UserFacingError } from './errors';

/* Rôles et écrans — `ROLE_VIEWS` de l'admin web. L'interface masque, la base impose (RLS). */
export type AdminRole = 'super_admin' | 'manager' | 'marketing' | 'support';
export type AdminView = 'dashboard' | 'commandes' | 'stocks' | 'produits';

export const ROLE_VIEWS: Record<AdminRole, AdminView[] | null> = {
  super_admin: null,
  manager: ['dashboard', 'commandes', 'produits', 'stocks'],
  marketing: ['dashboard'],
  support: ['dashboard', 'commandes'],
};
export const ROLE_LABEL: Record<string, string> = { super_admin: 'Super admin', manager: 'Chef de projet', marketing: 'Marketing', support: 'Support' };
export const canEdit = (role?: string) => !!role && ['super_admin', 'manager', 'marketing'].includes(role);
export const allowedViews = (role?: string): AdminView[] => {
  const all: AdminView[] = ['dashboard', 'commandes', 'stocks', 'produits'];
  if (!role) return [];
  const v = ROLE_VIEWS[role as AdminRole];
  return v === undefined ? ['dashboard'] : v === null ? all : all.filter((x) => v.includes(x));
};

export type AdminProfile = { id: string; email: string; full_name?: string | null; role: AdminRole; active: boolean };

export async function adminSignIn(email: string, password: string): Promise<AdminProfile> {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) throw new UserFacingError('Identifiants incorrects.');
  const profile = await adminLoadProfile();
  if (!profile) {
    await sb.auth.signOut();
    throw new UserFacingError('Ce compte n’a pas d’accès à l’espace pro.');
  }
  return profile;
}

/** Profil lu dans admin_profiles ; sans profil actif → déconnexion immédiate (doc 10). */
export async function adminLoadProfile(): Promise<AdminProfile | null> {
  const sb = getSupabase();
  const { data: sess } = await sb.auth.getSession();
  if (!sess.session) return null;
  const { data: profile } = await sb.from('admin_profiles').select('*').eq('id', sess.session.user.id).maybeSingle();
  if (!profile || !profile.active) {
    await sb.auth.signOut();
    return null;
  }
  void sb.from('admin_profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', profile.id);
  return profile as AdminProfile;
}

export async function adminSignOut() {
  await getSupabase().auth.signOut();
}

async function logActivity(profile: AdminProfile, action: string, entity: string, entityId: string | null, detail?: unknown) {
  try {
    await getSupabase().from('activity_log').insert({ actor_id: profile.id, actor_email: profile.email, action, entity, entity_id: entityId, detail: detail ?? null });
  } catch {
    /* le journal ne bloque jamais une action métier */
  }
}

/* ------------------------------ Lecture ------------------------------ */
export type DashStats = Record<string, unknown> & {
  revenue_30d?: number;
  orders_30d?: number;
  orders_total?: number;
  customers?: number;
  customers_30d?: number;
  stock_out?: number;
  stock_low?: number;
};

export async function fetchStats(): Promise<DashStats> {
  const { data, error } = await getSupabase().rpc('admin_dashboard_stats');
  if (error) throw new UserFacingError('Statistiques indisponibles.');
  return (data ?? {}) as DashStats;
}

export type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  fulfilment: 'delivery' | 'relay' | 'pickup';
  email: string;
  address: Record<string, string | null> | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_method?: string | null;
  payment_method?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  promo_code?: string | null;
  created_at: string;
  paid_at?: string | null;
  order_items?: { product_name: string; color?: string; size?: string; unit_price: number; qty: number; line_total: number }[];
};

export async function fetchOrders(): Promise<AdminOrder[]> {
  const { data, error } = await getSupabase().from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(200);
  if (error) throw new UserFacingError('Commandes indisponibles.');
  return (data ?? []) as AdminOrder[];
}

export type AdminVariant = { id: string; sku: string; color: string; size: string; stock: number; low_stock_at: number };
export type AdminProduct = { id: string; slug: string; name: string; price: number; status: string; category: string; track_inventory: boolean; images: string[]; product_variants: AdminVariant[] };

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await getSupabase().from('products').select('id, slug, name, price, status, category, track_inventory, images, product_variants(id,sku,color,size,stock,low_stock_at)').order('sort_order');
  if (error) throw new UserFacingError('Catalogue indisponible.');
  return (data ?? []) as unknown as AdminProduct[];
}

/* ------------------------------ Écriture ------------------------------ */
/** Étapes suivantes (`NEXT_STATUS` de l'admin web). Aucun « Marquer payée » : interdit par le trigger orders_guard_paid. */
export const NEXT_STATUS: Record<string, Record<string, string>> = {
  delivery: { paid: 'preparing', preparing: 'shipped', shipped: 'delivered' },
  relay: { paid: 'preparing', preparing: 'shipped', shipped: 'delivered' },
  pickup: { paid: 'preparing', preparing: 'ready_for_pickup', ready_for_pickup: 'picked_up' },
};
export const STATUS_ACTION: Record<string, string> = {
  preparing: 'Mettre en préparation',
  shipped: 'Marquer comme expédiée',
  delivered: 'Marquer comme livrée',
  ready_for_pickup: 'Prête à être retirée',
  picked_up: 'Marquer comme retirée',
};
export const nextStatus = (o: Pick<AdminOrder, 'fulfilment' | 'status'>) => (NEXT_STATUS[o.fulfilment] ?? NEXT_STATUS.delivery)[o.status];
export const isClosed = (status: string) => ['delivered', 'picked_up', 'cancelled', 'refunded'].includes(status);

export async function setOrderStatus(profile: AdminProfile, id: string, status: string, tracking?: { carrier?: string; tracking_number?: string; tracking_url?: string }) {
  if (!canEdit(profile.role)) throw new UserFacingError('Lecture seule pour votre rôle.');
  if (status === 'paid') throw new UserFacingError('Le statut « payée » est posé uniquement par le paiement.');
  const patch: Record<string, unknown> = { status };
  if (tracking) {
    patch.carrier = tracking.carrier?.trim() || null;
    patch.tracking_number = tracking.tracking_number?.trim() || null;
    patch.tracking_url = tracking.tracking_url?.trim() || null;
  }
  const { error } = await getSupabase().from('orders').update(patch).eq('id', id);
  if (error) throw new UserFacingError('Statut non modifié.');
  await logActivity(profile, 'order_status', 'orders', id, { status });
}

export async function saveTracking(profile: AdminProfile, id: string, t: { carrier?: string; tracking_number?: string; tracking_url?: string }) {
  if (!canEdit(profile.role)) throw new UserFacingError('Lecture seule pour votre rôle.');
  const { error } = await getSupabase().from('orders').update({ carrier: t.carrier?.trim() || null, tracking_number: t.tracking_number?.trim() || null, tracking_url: t.tracking_url?.trim() || null }).eq('id', id);
  if (error) throw new UserFacingError('Suivi non enregistré.');
  await logActivity(profile, 'order_tracking', 'orders', id);
}

/** Valeur + mouvement associé (qui, delta, motif), comme l'écran Stocks du web. */
export async function saveStock(profile: AdminProfile, variantId: string, next: number, previous: number) {
  if (!canEdit(profile.role)) throw new UserFacingError('Lecture seule pour votre rôle.');
  const delta = next - previous;
  if (!delta) return;
  if (next < 0 || !Number.isInteger(next)) throw new UserFacingError('Quantité invalide.');
  const sb = getSupabase();
  const { error } = await sb.from('product_variants').update({ stock: next }).eq('id', variantId);
  if (error) throw new UserFacingError('Stock non enregistré.');
  await sb.from('stock_movements').insert({ variant_id: variantId, delta, reason: 'Correction manuelle', created_by: profile.id });
  await logActivity(profile, 'update_stock', 'product_variants', variantId, { delta });
}

/** Ratio d'écart au-delà duquel une confirmation est exigée (faute de frappe probable : 4,50 € au lieu de 45 €). */
export const priceNeedsConfirm = (before: number, after: number) => {
  const ratio = before > 0 ? after / before : 1;
  return ratio > 2 || ratio < 0.5;
};

export async function savePrice(profile: AdminProfile, product: Pick<AdminProduct, 'id' | 'price'>, price: number) {
  if (!canEdit(profile.role)) throw new UserFacingError('Lecture seule pour votre rôle.');
  if (!Number.isFinite(price) || price <= 0) throw new UserFacingError('Le prix doit être un nombre supérieur à zéro.');
  const { error } = await getSupabase().from('products').update({ price }).eq('id', product.id);
  if (error) throw new UserFacingError('Enregistrement impossible.');
  await logActivity(profile, 'update_product', 'products', product.id, { price_avant: Number(product.price), price_apres: price });
}
