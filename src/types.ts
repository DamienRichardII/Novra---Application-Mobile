export type Variant = { color: string; size: string; stock: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  gender: 'homme' | 'femme' | 'unisexe' | string;
  price: number; // euros, affichage uniquement
  description: string;
  images: string[];
  colors: string[];
  sizes: string[];
  variants: Variant[];
  trackInventory: boolean;
  isNew: boolean;
  featured: boolean;
  technicalDetails: string[];
  composition: string;
  care: string;
  focalX: number;
  focalY: number;
  createdAt?: string;
};

export type CartLine = { slug: string; color: string; size: string; qty: number };

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'cancelled'
  | 'payment_failed'
  | 'payment_expired';

export type Fulfilment = 'delivery' | 'relay' | 'pickup';

export type OrderItem = {
  name?: string;
  product_name?: string;
  slug?: string;
  color?: string;
  size?: string;
  qty?: number;
  quantity?: number;
  unit_price?: number;
  price?: number;
  image?: string;
  [k: string]: unknown;
};

export type OrderEvent = { status?: string; type?: string; label?: string; note?: string; created_at?: string; [k: string]: unknown };

export type OrderStatusResponse = {
  reference: string;
  status: OrderStatus;
  paid: boolean;
  cancelled?: boolean;
  failed?: boolean;
  expired?: boolean;
  fulfilment: Fulfilment;
  email?: string;
  address?: Record<string, string | null> | null;
  store?: { name?: string; address?: string; zip?: string; city?: string; phone?: string; hours?: { day: string; hours: string }[]; pickup_note?: string | null } | null;
  shipping_method?: string;
  payment_method?: string;
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  promo_code?: string | null;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  created_at?: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  payment_failed_at?: string | null;
  payment_expired_at?: string | null;
  items?: OrderItem[];
  events?: OrderEvent[];
};

export type StoredOrder = { reference: string; token?: string; email: string; createdAt: string };

export type StoreSettings = {
  name?: string;
  address?: string | null;
  zip?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: { day: string; hours: string }[] | null;
  pickup_note?: string | null;
};
