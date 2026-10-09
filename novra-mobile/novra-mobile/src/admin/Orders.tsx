import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { T } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState, ErrorState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { colors } from '@/theme';
import { canEdit, fetchOrders, isClosed, nextStatus, setOrderStatus, saveTracking, STATUS_ACTION, type AdminOrder } from '@/api/admin';
import { isUserFacing } from '@/api/errors';
import { useAdmin } from '@/stores/admin';
import { useToast } from '@/stores/toast';
import { formatPrice } from '@/lib/money';
import { fr } from '@/i18n/fr';

const STATUS_FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'Toutes', match: () => true },
  { key: 'paid', label: 'À préparer', match: (s) => s === 'paid' },
  { key: 'preparing', label: 'En préparation', match: (s) => s === 'preparing' },
  { key: 'out', label: 'Expédiées / prêtes', match: (s) => ['shipped', 'ready_for_pickup'].includes(s) },
  { key: 'done', label: 'Terminées', match: (s) => ['delivered', 'picked_up'].includes(s) },
  { key: 'pending', label: 'Paiement en attente', match: (s) => s === 'pending' },
  { key: 'cancelled', label: 'Annulées', match: (s) => ['cancelled', 'refunded'].includes(s) },
];
const MODES = [
  { key: 'delivery', label: 'Livraison' },
  { key: 'relay', label: 'Relais' },
  { key: 'pickup', label: 'Retrait' },
];

const dateFR = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export function Orders() {
  const profile = useAdmin((s) => s.profile)!;
  const qc = useQueryClient();
  const show = useToast((s) => s.show);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'orders'], queryFn: fetchOrders, staleTime: 0 });
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [url, setUrl] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = data?.find((o) => o.id === openId) ?? null;
  const editable = canEdit(profile.role);

  const list = (data ?? []).filter((o) => STATUS_FILTERS.find((f) => f.key === filter)!.match(o.status) && (!mode || o.fulfilment === mode));

  const afterChange = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
  };
  const advance = useMutation({
    mutationFn: async ({ o, status }: { o: AdminOrder; status: string }) =>
      setOrderStatus(profile, o.id, status, status === 'shipped' && o.fulfilment !== 'pickup' ? { carrier, tracking_number: tracking, tracking_url: url } : undefined),
    onSuccess: () => {
      show('Commande mise à jour');
      setError(null);
      afterChange();
    },
    onError: (e) => setError(isUserFacing(e) ? e.message : fr.common.genericError),
  });
  const saveTrack = useMutation({
    mutationFn: async (o: AdminOrder) => saveTracking(profile, o.id, { carrier, tracking_number: tracking, tracking_url: url }),
    onSuccess: () => {
      show('Suivi enregistré');
      afterChange();
    },
    onError: (e) => setError(isUserFacing(e) ? e.message : fr.common.genericError),
  });

  const openOrder = (o: AdminOrder) => {
    setOpenId(o.id);
    setCarrier(o.carrier ?? '');
    setTracking(o.tracking_number ?? '');
    setUrl(o.tracking_url ?? '');
    setError(null);
    setConfirmCancel(false);
  };

  if (isLoading) return <Skeleton height={240} />;
  if (isError) return <ErrorState title="Commandes indisponibles." onRetry={() => refetch()} />;

  const next = open ? nextStatus(open) : undefined;
  const a = open?.address ?? {};

  return (
    <View style={{ gap: 14 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
        {MODES.map((m) => (
          <Chip key={m.key} label={m.label} active={mode === m.key} onPress={() => setMode(mode === m.key ? null : m.key)} />
        ))}
      </ScrollView>

      {list.length === 0 ? (
        <EmptyState icon="package" title="Aucune commande" hint="Aucune commande ne correspond à ces filtres." />
      ) : (
        list.map((o) => (
          <Pressable key={o.id} accessibilityRole="button" accessibilityLabel={`Commande ${o.reference}, ${fr.status[o.status] ?? o.status}`} onPress={() => openOrder(o)} style={{ borderTopWidth: 1, borderColor: colors.lineDark, paddingVertical: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T weight="semi">{o.reference}</T>
              <T weight="semi">{formatPrice(Number(o.total))}</T>
            </View>
            <T variant="small" color={colors.white70}>
              {fr.status[o.status] ?? o.status} · {MODES.find((m) => m.key === o.fulfilment)?.label} · {dateFR(o.created_at)}
            </T>
            <T variant="small" color={colors.white45}>
              {o.email}
            </T>
          </Pressable>
        ))
      )}

      <BottomSheet visible={!!open} onClose={() => setOpenId(null)} title={open?.reference}>
        {open ? (
          <>
            <T color={colors.white70}>{fr.status[open.status] ?? open.status}</T>
            {open.fulfilment === 'relay' ? (
              <View style={{ borderWidth: 1, borderColor: colors.white45, padding: 12, gap: 4 }}>
                <T variant="eyebrow">Point relais</T>
                <T>{[a.address, a.zip, a.city].filter(Boolean).join(', ')}</T>
                <T variant="small" color={colors.white70}>
                  Point relais choisi par le client — ce n’est pas son domicile.
                </T>
              </View>
            ) : open.fulfilment === 'pickup' ? (
              <T>Retrait en boutique</T>
            ) : (
              <T>{[a.address, a.address2, a.zip, a.city, a.country].filter(Boolean).join(', ') || 'Adresse non renseignée.'}</T>
            )}
            <View style={{ gap: 2 }}>
              <T weight="semi">{[a.firstname, a.lastname].filter(Boolean).join(' ')}</T>
              <Pressable accessibilityRole="button" onPress={async () => { await Clipboard.setStringAsync(open.email); show(fr.common.copied); }}>
                <T variant="small" color={colors.white70}>
                  {open.email} — copier
                </T>
              </Pressable>
              {a.phone ? (
                <T variant="small" color={colors.white70}>
                  {a.phone}
                </T>
              ) : null}
            </View>
            <View style={{ gap: 8 }}>
              {(open.order_items ?? []).map((it, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <T variant="small" style={{ flex: 1 }}>
                    {it.qty} × {it.product_name} ({[it.color, it.size].filter(Boolean).join(' / ')})
                  </T>
                  <T variant="small">{formatPrice(Number(it.line_total))}</T>
                </View>
              ))}
              <T weight="semi" align="right">
                Total {formatPrice(Number(open.total))}
              </T>
            </View>

            {open.fulfilment !== 'pickup' && ['preparing', 'shipped', 'delivered'].includes(open.status) ? (
              <View style={{ gap: 10 }}>
                <T variant="h3">Suivi du colis</T>
                <Field label="Transporteur" value={carrier} onChangeText={setCarrier} editable={editable} placeholder="Colissimo" />
                <Field label="N° de suivi" value={tracking} onChangeText={setTracking} editable={editable} autoCapitalize="characters" />
                <Field label="Lien de suivi" value={url} onChangeText={setUrl} editable={editable} autoCapitalize="none" keyboardType="url" placeholder="https://…" />
                {editable ? <Button label="Enregistrer le suivi" variant="outline" onPress={() => saveTrack.mutate(open)} loading={saveTrack.isPending} /> : null}
              </View>
            ) : null}

            {!editable ? <T variant="small" color={colors.white70}>{fr.admin.readOnly}</T> : null}
            {error ? (
              <T variant="small" color={colors.error} accessibilityLiveRegion="polite">
                {error}
              </T>
            ) : null}

            {editable && !isClosed(open.status) ? (
              <View style={{ gap: 10 }}>
                {next ? <Button label={STATUS_ACTION[next]} onPress={() => advance.mutate({ o: open, status: next })} loading={advance.isPending} testID="admin-advance" /> : null}
                {open.status !== 'pending' ? (
                  confirmCancel ? (
                    <View style={{ gap: 8 }}>
                      <T variant="small" color={colors.white70}>
                        Annuler cette commande ? Le remboursement éventuel se fait depuis SumUp.
                      </T>
                      <Button label="Confirmer l’annulation" variant="outline" onPress={() => advance.mutate({ o: open, status: 'cancelled' })} loading={advance.isPending} />
                    </View>
                  ) : (
                    <Button label="Annuler la commande" variant="outline" onPress={() => setConfirmCancel(true)} />
                  )
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}
