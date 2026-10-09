import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type S = { recent: string[]; push: (q: string) => void; clear: () => void };

export const useRecentSearches = create<S>()(
  persist(
    (set) => ({
      recent: [],
      push: (q) => {
        const t = q.trim();
        if (t.length < 2) return;
        set((s) => ({ recent: [t, ...s.recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6) }));
      },
      clear: () => set({ recent: [] }),
    }),
    { name: 'novra_recent_searches_v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
