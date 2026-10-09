import { useQuery } from '@tanstack/react-query';
import { getOrderStatus } from '@/api/functions';
import type { StoredOrder } from '@/types';

/** Une commande n'est jamais mise en cache comme source de vérité : toujours relue via order-status (doc 03). */
export function useOrderQuery(o: Pick<StoredOrder, 'reference' | 'token' | 'email'> | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['order', o?.reference],
    enabled: enabled && !!o,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    queryFn: () => (o!.token ? getOrderStatus({ ref: o!.reference, token: o!.token }) : getOrderStatus({ reference: o!.reference, email: o!.email })),
  });
}
