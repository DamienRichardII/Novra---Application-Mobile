import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { T } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { BottomSheet } from '@/components/BottomSheet';
import { ErrorState, EmptyState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { colors, fonts } from '@/theme';
import { canEdit, fetchAdminProducts, saveStock, type AdminVariant } from '@/api/admin';
import { SIZE_ORDER } from '@/api/catalogue';
import { isUserFacing } from '@/api/errors';
import { useAdmin } from '@/stores/admin';
import { useToast } from '@/stores/toast';
import { hapticLight } from '@/lib/haptics';

type Row = AdminVariant & { productName: string; track: boolean };
const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'out', label: 'Ruptures' },
  { key: 'low', label: 'Stock faible' },
] as const;

/** Source unique : product_variants.stock ; chaque modification écrit stock_movements (doc 10). Pas de plafond d'affichage. */
export function Stocks() {
  const profile = useAdmin((s) => s.profile)!;
  const editable = canEdit(profile.role);
  const qc = useQueryClient();
  const show = useToast((s) => s.show);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'products'], queryFn: fetchAdminProducts, staleTime: 0 });
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [edit, setEdit] = useState<Row | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      (data ?? [])
        .flatMap((p) => p.product_variants.map((v) => ({ ...v, productName: p.name, track: p.track_inventory })))
        .sort((a, b) => a.productName.localeCompare(b.productName, 'fr') || a.color.localeCompare(b.color, 'fr') || SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    [data],
  );
  const shown = rows.filter((r) => {
    const t = q.trim().toLowerCase();
    if (t && !`${r.productName} ${r.color} ${r.size} ${r.sku}`.toLowerCase().includes(t)) return false;
    if (filter === 'out') return r.stock === 0;
    if (filter === 'low') return r.stock > 0 && r.stock <= r.low_stock_at;
    return true;
  });
  const untracked = (data ?? []).filter((p) => !p.track_inventory).length;

  const save = useMutation({
    mutationFn: ({ r, next }: { r: Row; next: number }) => saveStock(profile, r.id, next, r.stock),
    onSuccess: () => {
      show('Stock mis à jour');
      setEdit(null);
      setError(null);
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => setError(isUserFacing(e) ? e.message : 'Stock non enregistré.'),
  });

  if (isLoading) return <Skeleton height={240} />;
  if (isError) return <ErrorState title="Catalogue indisponible." onRetry={() => refetch()} />;

  return (
    <View style={{ gap: 14 }}>
      {untracked > 0 ? (
        <View style={styles.warn}>
          <T variant="small" weight="semi">
            Suivi des stocks inactif sur {untracked} produit{untracked > 1 ? 's' : ''}.
          </T>
          <T variant="small" color={colors.white70}>
            Ces produits se vendent sans compter. L’activation du suivi se décide depuis l’admin web : l’activer sans saisir les stocks bloquerait toutes les ventes.
          </T>
        </View>
      ) : null}
      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.white70} />
        <TextInput value={q} onChangeText={setQ} placeholder="Rechercher un produit, une taille…" placeholderTextColor={colors.white45} accessibilityLabel="Rechercher dans les stocks" style={styles.input} selectionColor={colors.white} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>
      <T variant="small" color={colors.white70}>
        {shown.length} référence{shown.length > 1 ? 's' : ''}
      </T>
      {shown.length === 0 ? (
        <EmptyState icon="box" title="Aucune référence" hint="Modifiez la recherche ou le filtre." />
      ) : (
        shown.map((r) => (
          <View key={r.id} style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${r.productName} ${r.color} ${r.size}, stock ${r.stock}. Modifier`} onPress={() => { setEdit(r); setValue(String(r.stock)); setError(null); }} style={{ flex: 1, gap: 2 }}>
              <T weight="semi" numberOfLines={1}>
                {r.productName}
              </T>
              <T variant="small" color={colors.white70}>
                {r.color} · {r.size}
                {!r.track ? ' · non suivi' : ''}
              </T>
            </Pressable>
            {editable ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Retirer 1" disabled={r.stock <= 0 || save.isPending} onPress={() => { hapticLight(); save.mutate({ r, next: r.stock - 1 }); }} style={styles.step}>
                <Icon name="minus" size={16} color={r.stock <= 0 ? colors.white45 : colors.white} />
              </Pressable>
            ) : null}
            <T weight="semi" style={{ minWidth: 34 }} align="center" color={r.stock === 0 ? colors.white45 : colors.white}>
              {r.stock}
            </T>
            {editable ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Ajouter 1" disabled={save.isPending} onPress={() => { hapticLight(); save.mutate({ r, next: r.stock + 1 }); }} style={styles.step}>
                <Icon name="plus" size={16} />
              </Pressable>
            ) : null}
          </View>
        ))
      )}

      <BottomSheet visible={!!edit} onClose={() => setEdit(null)} title={edit ? `${edit.productName} · ${edit.color} · ${edit.size}` : ''}>
        {edit ? (
          <>
            <Field label="Nouveau stock" value={value} onChangeText={(v) => setValue(v.replace(/\D/g, ''))} keyboardType="number-pad" editable={editable} />
            {!editable ? <T variant="small" color={colors.white70}>Lecture seule pour votre rôle.</T> : null}
            {error ? <T variant="small" color={colors.error}>{error}</T> : null}
            {editable ? <Button label="Enregistrer" onPress={() => save.mutate({ r: edit, next: Number(value || 0) })} loading={save.isPending} /> : null}
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  warn: { borderWidth: 1, borderColor: colors.white45, padding: 12, gap: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.white15, backgroundColor: colors.white08 },
  input: { flex: 1, color: colors.white, fontFamily: fonts.body, fontSize: 16, minHeight: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: colors.lineDark, paddingVertical: 8, minHeight: 60 },
  step: { width: 44, height: 44, borderWidth: 1, borderColor: colors.white15, alignItems: 'center', justifyContent: 'center' },
});
