import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FavState = { slugs: string[]; toggle: (slug: string) => void; has: (slug: string) => boolean };

/** Favoris locaux, sans compte (doc 01/05). */
export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => set((s) => ({ slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [slug, ...s.slugs] })),
      has: (slug) => get().slugs.includes(slug),
    }),
    { name: 'novra_favorites_v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
