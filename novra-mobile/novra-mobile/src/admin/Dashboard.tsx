import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { T } from '@/components/Text';
import { EmptyState, ErrorState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { colors } from '@/theme';
import { fetchAdminProducts, fetchOrders, fetchStats } from '@/api/admin';
import { formatPrice } from '@/lib/money';
import { fr } from '@/i18n/fr';

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ width: '48.5%', borderWidth: 1, borderColor: colors.white15, padding: 14, gap: 4 }}>
      <T variant="eyebrow" color={colors.white70}>
        {label}
      </T>
      <T variant="h1">{value}</T>
      {sub ? (
        <T variant="small" color={colors.white70}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/** Aucun chiffre de démonstration : sans vente, l'écran le dit (doc 10). */
export function Dashboard() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchStats, staleTime: 0 });
  const orders = useQuery({ queryKey: ['admin', 'orders'], queryFn: fetchOrders, staleTime: 0 });
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: fetchAdminProducts, staleTime: 0 });

  if (stats.isLoading) return <Skeleton height={220} />;
  if (stats.isError) return <ErrorState title="Statistiques indisponibles." onRetry={() => stats.refetch()} />;

  const s = stats.data ?? {};
  const rev = Number(s.revenue_30d ?? 0);
  const n30 = Number(s.orders_30d ?? 0);
  const toPrepare = (orders.data ?? []).filter((o) => o.status === 'paid').length;
  const lowOut = (products.data ?? []).flatMap((p) => p.product_variants.map((v) => ({ p, v }))).filter(({ p, v }) => p.track_inventory && v.stock <= v.low_stock_at);
  const empty = !n30 && !Number(s.orders_total ?? 0);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Kpi label="CA (30 j)" value={formatPrice(rev)} sub="30 derniers jours" />
        <Kpi label="Commandes (30 j)" value={String(n30)} sub={`${s.orders_total ?? 0} au total`} />
        <Kpi label="À préparer" value={String(toPrepare)} sub="Commandes payées" />
        <Kpi label="Ruptures" value={String(s.stock_out ?? 0)} sub={`${s.stock_low ?? 0} en stock faible`} />
      </View>
      {empty ? <EmptyState icon="bar-chart-2" title={fr.admin.emptyStats} hint="Les chiffres apparaîtront dès la première commande payée." /> : null}
      {lowOut.length ? (
        <View style={{ gap: 8 }}>
          <T variant="h3">Stocks à surveiller</T>
          {lowOut.slice(0, 6).map(({ p, v }) => (
            <View key={v.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T variant="small" style={{ flex: 1 }}>
                {p.name} · {v.color} · {v.size}
              </T>
              <T variant="small" weight="semi">
                {v.stock === 0 ? 'Rupture' : v.stock}
              </T>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
