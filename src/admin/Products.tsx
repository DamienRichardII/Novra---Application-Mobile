import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { T } from '@/components/Text';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { BottomSheet } from '@/components/BottomSheet';
import { MediaImage } from '@/components/MediaImage';
import { ErrorState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { colors } from '@/theme';
import { canEdit, fetchAdminProducts, priceNeedsConfirm, savePrice, type AdminProduct } from '@/api/admin';
import { isUserFacing } from '@/api/errors';
import { useAdmin } from '@/stores/admin';
import { useToast } from '@/stores/toast';
import { formatPrice } from '@/lib/money';
import { mediaUrl } from '@/lib/media';

/** V1 mobile : modification du prix avec confirmation au-delà du double (doc 10). Photos et fiches : admin web. */
export function Products() {
  const profile = useAdmin((s) => s.profile)!;
  const editable = canEdit(profile.role);
  const qc = useQueryClient();
  const show = useToast((s) => s.show);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'products'], queryFn: fetchAdminProducts, staleTime: 0 });
  const [edit, setEdit] = useState<AdminProduct | null>(null);
  const [price, setPrice] = useState('');
  const [needConfirm, setNeedConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: ({ p, value }: { p: AdminProduct; value: number }) => savePrice(profile, p, value),
    onSuccess: () => {
      show('Prix enregistré — visible en boutique sous une minute');
      setEdit(null);
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['catalogue'] });
    },
    onError: (e) => setError(isUserFacing(e) ? e.message : 'Enregistrement impossible.'),
  });

  if (isLoading) return <Skeleton height={240} />;
  if (isError) return <ErrorState title="Catalogue indisponible." onRetry={() => refetch()} />;

  const submit = () => {
    if (!edit) return;
    const value = Number(price.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return setError('Le prix doit être un nombre supérieur à zéro.');
    if (priceNeedsConfirm(Number(edit.price), value) && !needConfirm) {
      setNeedConfirm(true);
      return;
    }
    mut.mutate({ p: edit, value });
  };

  return (
    <View style={{ gap: 0 }}>
      {(data ?? []).map((p) => (
        <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.name}, ${formatPrice(Number(p.price))}. Modifier le prix`} onPress={() => { setEdit(p); setPrice(String(p.price).replace('.', ',')); setError(null); setNeedConfirm(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.lineDark, paddingVertical: 12 }}>
          <View style={{ width: 48, aspectRatio: 3 / 4, overflow: 'hidden' }}>
            <MediaImage uri={mediaUrl(p.images?.[0])} style={{ flex: 1 }} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T weight="semi" numberOfLines={1}>
              {p.name}
            </T>
            <T variant="small" color={colors.white70}>
              {p.category} · {p.status === 'active' ? 'En vente' : 'Archivé'}
            </T>
          </View>
          <T weight="semi">{formatPrice(Number(p.price))}</T>
        </Pressable>
      ))}

      <BottomSheet visible={!!edit} onClose={() => setEdit(null)} title={edit?.name}>
        {edit ? (
          <>
            <Field label="Prix TTC (€)" value={price} onChangeText={(v) => { setPrice(v); setNeedConfirm(false); }} keyboardType="decimal-pad" editable={editable} />
            {!editable ? <T variant="small" color={colors.white70}>Lecture seule pour votre rôle.</T> : null}
            {needConfirm ? (
              <T variant="small" color={colors.white} accessibilityLiveRegion="polite">
                Le prix passe de {formatPrice(Number(edit.price))} à {formatPrice(Number(price.replace(',', '.')))}. Ce nouveau prix sera affiché en boutique et encaissé. Touchez à nouveau pour confirmer.
              </T>
            ) : null}
            {error ? <T variant="small" color={colors.error}>{error}</T> : null}
            {editable ? <Button label={needConfirm ? 'Confirmer le nouveau prix' : 'Enregistrer'} onPress={submit} loading={mut.isPending} /> : null}
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}
