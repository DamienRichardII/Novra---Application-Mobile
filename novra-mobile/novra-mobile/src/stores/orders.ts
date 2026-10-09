import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from '@/lib/storage';
import type { StoredOrder } from '@/types';

type OrdersState = {
  orders: StoredOrder[];
  /** Tentative de paiement en cours : sert à « Reprendre le paiement » avec la même clé (doc 06). */
  pending?: { reference: string; token: string; email: string; checkoutUrl: string; idempotencyKey: string };
  idempotencyKey?: string;
  upsert: (o: StoredOrder) => void;
  remove: (reference: string) => void;
  getOrCreateKey: (make: () => string) => string;
  resetKey: () => void;
  setPending: (p: OrdersState['pending']) => void;
};

/** Jetons de commande et e-mail : stockage sécurisé de l'appareil (doc 08/11). */
export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      upsert: (o) =>
        set((s) => ({
          orders: [o, ...s.orders.filter((x) => x.reference !== o.reference)].slice(0, 50),
        })),
      remove: (reference) => set((s) => ({ orders: s.orders.filter((x) => x.reference !== reference) })),
      getOrCreateKey: (make) => {
        const existing = get().idempotencyKey;
        if (existing) return existing;
        const k = make();
        set({ idempotencyKey: k });
        return k;
      },
      resetKey: () => set({ idempotencyKey: undefined, pending: undefined }),
      setPending: (pending) => set({ pending }),
    }),
    { name: 'novra_orders_v1', storage: createJSONStorage(() => secureStorage) },
  ),
);
