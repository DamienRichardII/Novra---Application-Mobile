import { create } from 'zustand';

type ToastState = { message: string | null; id: number; show: (m: string) => void; hide: () => void };

export const useToast = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message) => set((s) => ({ message, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));
