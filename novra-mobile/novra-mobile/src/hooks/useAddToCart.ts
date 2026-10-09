import { useCallback } from 'react';
import { useCart } from '@/stores/cart';
import { useToast } from '@/stores/toast';
import { hapticSuccess } from '@/lib/haptics';
import { fr } from '@/i18n/fr';
import type { Product } from '@/types';

/** Ajout au panier avec confirmation visuelle + retour haptique. La taille est obligatoire (R2). */
export function useAddToCart() {
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);
  return useCallback(
    (p: Product, color: string | null, size: string | null, qty = 1): { ok: boolean; reason?: string } => {
      if (!color) return { ok: false, reason: fr.product.chooseColor };
      if (!size) return { ok: false, reason: fr.product.chooseSize };
      add({ slug: p.slug, color, size, qty });
      hapticSuccess();
      show(fr.product.added);
      return { ok: true };
    },
    [add, show],
  );
}
