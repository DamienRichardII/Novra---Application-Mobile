import { create } from 'zustand';
import { adminLoadProfile, adminSignIn, adminSignOut, type AdminProfile } from '@/api/admin';
import { isUserFacing } from '@/api/errors';

type AdminState = {
  status: 'loading' | 'out' | 'in';
  profile: AdminProfile | null;
  message: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (message?: string) => Promise<void>;
};

/** Session admin non persistée ici : le client Supabase la garde dans le stockage sécurisé. */
export const useAdmin = create<AdminState>((set) => ({
  status: 'loading',
  profile: null,
  message: null,
  init: async () => {
    try {
      const profile = await adminLoadProfile();
      set({ status: profile ? 'in' : 'out', profile });
    } catch {
      set({ status: 'out', profile: null });
    }
  },
  signIn: async (email, password) => {
    try {
      const profile = await adminSignIn(email, password);
      set({ status: 'in', profile, message: null });
    } catch (e) {
      set({ status: 'out', profile: null, message: isUserFacing(e) ? e.message : 'Connexion impossible. Vérifiez votre réseau.' });
    }
  },
  signOut: async (message) => {
    await adminSignOut().catch(() => undefined);
    set({ status: 'out', profile: null, message: message ?? null });
  },
}));
