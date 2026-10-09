import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mergeLine } from '@/lib/cart';
import { SHIPPING } from '@/lib/config';
import type { CartLine } from '@/types';

type CartState = {
  lines: CartLine[];
  promo: string;
  add: (line: CartLine) => void;
  setQty: (slug: string, color: string, size: string, qty: number) => void;
  remove: (slug: string, color: string, size: string) => void;
  setPromo: (code: string) => void;
  clear: () => void;
};

const same = (l: CartLine, slug: string, color: string, size: string) => l.slug === slug && l.color === color && l.size === size;

/** Clé `novra_cart_v1`, comme le site. Persistant après redémarrage. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promo: '',
      add: (line) => set((s) => ({ lines: mergeLine(s.lines, line) })),
      setQty: (slug, color, size, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (same(l, slug, color, size) ? { ...l, qty: Math.min(SHIPPING.limits.maxQty, Math.max(1, qty)) } : l)),
        })),
      remove: (slug, color, size) => set((s) => ({ lines: s.lines.filter((l) => !same(l, slug, color, size)) })),
      setPromo: (code) => set({ promo: code.trim().toUpperCase() }),
      clear: () => set({ lines: [], promo: '' }),
    }),
    { name: 'novra_cart_v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
