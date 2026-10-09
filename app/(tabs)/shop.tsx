import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, SCREEN_PADDING } from '@/theme';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { ColorDot } from '@/components/ColorDot';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ProductCard } from '@/components/ProductCard';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import { EmptyState } from '@/components/States';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useCatalogue } from '@/hooks/queries';
import { CATEGORIES, COLOR_SWATCHES, SIZE_ORDER } from '@/api/catalogue';
import { EMPTY_FILTERS, activeFilterCount, applyFilters, type Filters, type SortKey } from '@/lib/filters';
import { useRecentSearches } from '@/stores/search';
import { fr } from '@/i18n/fr';
import type { Product } from '@/types';

const PRICE_STEPS = [30, 50, 75, 100];
const GAP = 12;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <T variant="eyebrow" color={colors.white70}>
        {title}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ cat?: string; gender?: string; focus?: string }>();
  const { width } = useWindowDimensions();
  const { data, isLoading, isError, refetch, isRefetching } = useCatalogue();
  const products = useMemo(() => data?.products ?? [], [data]);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, category: params.cat && CATEGORIES.some((c) => c.key === params.cat) ? params.cat : null, gender: params.gender && ['homme', 'femme'].includes(params.gender) ? params.gender : null });
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('new');
  const [sheet, setSheet] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [searching, setSearching] = useState(false);
  const input = useRef<TextInput>(null);
  const { recent, push, clear } = useRecentSearches();

  // Contexte (?cat=, ?gender=) venant de l'accueil ou d'un lien profond : réajusté pendant le rendu.
  const paramKey = `${params.cat ?? ''}|${params.gender ?? ''}`;
  const [seenParams, setSeenParams] = useState(paramKey);
  if (paramKey !== seenParams) {
    setSeenParams(paramKey);
    const cat = params.cat && CATEGORIES.some((c) => c.key === params.cat) ? params.cat : null;
    const gender = params.gender && ['homme', 'femme'].includes(params.gender) ? params.gender : null;
    setFilters((f) => ({ ...f, category: cat, gender }));
  }
  useEffect(() => {
    if (params.focus) setTimeout(() => input.current?.focus(), 250);
  }, [params.focus]);

  const list = useMemo(() => applyFilters(products, filters, query, sort), [products, filters, query, sort]);
  const count = activeFilterCount(filters);

  const cols = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const frame = Math.min(width, 720);
  const itemW = Math.floor((frame - SCREEN_PADDING * 2 - GAP * (cols - 1)) / cols);

  const allColors = useMemo(() => Array.from(new Set(products.flatMap((p) => p.colors))).sort((a, b) => Object.keys(COLOR_SWATCHES).indexOf(a) - Object.keys(COLOR_SWATCHES).indexOf(b)), [products]);
  const allSizes = useMemo(() => SIZE_ORDER.filter((s) => products.some((p) => p.sizes.includes(s))), [products]);

  const open = () => {
    setDraft(filters);
    setSheet(true);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.frame}>
        <OfflineBanner />
        <View style={styles.header}>
          <T variant="h1">{fr.shop.title}</T>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Icon name="search" size={18} color={colors.white70} />
              <TextInput
                ref={input}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setSearching(true)}
                onBlur={() => setSearching(false)}
                onSubmitEditing={() => push(query)}
                returnKeyType="search"
                placeholder={fr.shop.search}
                placeholderTextColor={colors.white45}
                accessibilityLabel={fr.shop.searchA11y}
                selectionColor={colors.white}
                style={styles.input}
              />
              {query ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" hitSlop={10} onPress={() => setQuery('')}>
                  <Icon name="x" size={18} color={colors.white70} />
                </Pressable>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${fr.shop.filters}${count ? `, ${count} actifs` : ''}`} onPress={open} style={styles.filterBtn}>
              <Icon name="sliders" size={20} color={colors.black} />
              {count ? (
                <View style={styles.filterCount}>
                  <T variant="small" weight="bold" color={colors.white} style={{ fontSize: 10, lineHeight: 12 }}>
                    {count}
                  </T>
                </View>
              ) : null}
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
            <Chip label={fr.common.all} active={!filters.category} onPress={() => setFilters((f) => ({ ...f, category: null }))} />
            {CATEGORIES.map((c) => (
              <Chip key={c.key} label={c.label} active={filters.category === c.key} onPress={() => setFilters((f) => ({ ...f, category: f.category === c.key ? null : c.key }))} />
            ))}
          </ScrollView>
        </View>

        {searching && !query && recent.length ? (
          <View style={styles.recent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T variant="eyebrow" color={colors.white70}>
                {fr.shop.recent}
              </T>
              <Pressable onPress={clear} accessibilityRole="button" accessibilityLabel="Effacer l'historique">
                <T variant="small" color={colors.white70}>
                  Effacer
                </T>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {recent.map((r) => (
                <Chip key={r} label={r} onPress={() => setQuery(r)} />
              ))}
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.skelGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ width: itemW }}>
                <Skeleton aspectRatio={3 / 4} />
                <Skeleton height={14} width="70%" style={{ marginTop: 10 }} />
              </View>
            ))}
          </View>
        ) : isError && !products.length ? (
          <EmptyState icon="alert-circle" title={fr.shop.loadError} action={{ label: fr.common.retry, onPress: () => refetch() }} />
        ) : (
          <FlatList
            key={cols}
            data={list}
            numColumns={cols}
            keyExtractor={(p) => p.slug}
            columnWrapperStyle={{ gap: GAP, paddingHorizontal: SCREEN_PADDING }}
            contentContainerStyle={{ gap: 22, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.white} />}
            ListHeaderComponent={
              <View style={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T variant="small" color={colors.white70} accessibilityLiveRegion="polite">
                  {fr.shop.results(list.length)}
                </T>
                <Pressable accessibilityRole="button" accessibilityLabel={`${fr.shop.sort} : ${fr.shop.sortOptions[sort]}`} onPress={open} hitSlop={8}>
                  <T variant="small" weight="semi">
                    {fr.shop.sortOptions[sort]}
                  </T>
                </Pressable>
              </View>
            }
            ListEmptyComponent={
              <EmptyState icon="search" title={fr.shop.empty} hint={fr.shop.emptyHint} action={{ label: fr.shop.reset, onPress: () => { setFilters(EMPTY_FILTERS); setQuery(''); } }} />
            }
            renderItem={({ item }) => <ProductCard product={item} width={itemW} onQuickAdd={setQuick} />}
          />
        )}
      </View>

      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={fr.shop.filters}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label={fr.shop.reset} variant="outline" block={false} style={{ flex: 1 }} onPress={() => setDraft(EMPTY_FILTERS)} />
            <Button
              label={fr.shop.apply}
              block={false}
              style={{ flex: 2 }}
              onPress={() => {
                setFilters(draft);
                setSheet(false);
              }}
            />
          </View>
        }
      >
        <Section title={fr.shop.sort}>
          {(Object.keys(fr.shop.sortOptions) as SortKey[]).map((k) => (
            <Chip key={k} label={fr.shop.sortOptions[k]} active={sort === k} onPress={() => setSort(k)} />
          ))}
        </Section>
        <Section title={fr.shop.category}>
          {CATEGORIES.map((c) => (
            <Chip key={c.key} label={c.label} active={draft.category === c.key} onPress={() => setDraft((d) => ({ ...d, category: d.category === c.key ? null : c.key }))} />
          ))}
        </Section>
        <Section title={fr.shop.gender}>
          {(['homme', 'femme'] as const).map((g) => (
            <Chip key={g} label={fr.shop.genders[g]} active={draft.gender === g} onPress={() => setDraft((d) => ({ ...d, gender: d.gender === g ? null : g }))} />
          ))}
        </Section>
        <Section title={fr.shop.size}>
          {allSizes.map((s) => (
            <Chip key={s} label={s} active={draft.size === s} onPress={() => setDraft((d) => ({ ...d, size: d.size === s ? null : s }))} />
          ))}
        </Section>
        <View style={{ gap: 6 }}>
          <T variant="eyebrow" color={colors.white70}>
            {fr.shop.color}
            {draft.color ? ` — ${draft.color}` : ''}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {allColors.map((c) => (
              <ColorDot key={c} name={c} size={26} active={draft.color === c} onPress={() => setDraft((d) => ({ ...d, color: d.color === c ? null : c }))} />
            ))}
          </View>
        </View>
        <Section title={fr.shop.maxPrice}>
          {PRICE_STEPS.map((p) => (
            <Chip key={p} label={`${p} €`} active={draft.maxPrice === p} onPress={() => setDraft((d) => ({ ...d, maxPrice: d.maxPrice === p ? null : p }))} />
          ))}
        </Section>
        <Section title="Disponibilité">
          <Chip label={fr.shop.inStock} active={draft.inStock} onPress={() => setDraft((d) => ({ ...d, inStock: !d.inStock }))} />
          <Chip label={fr.shop.newOnly} active={draft.newOnly} onPress={() => setDraft((d) => ({ ...d, newOnly: !d.newOnly }))} />
        </Section>
      </BottomSheet>
      <QuickAddSheet product={quick} onClose={() => setQuick(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  frame: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12, paddingBottom: 12, gap: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.white15, backgroundColor: colors.white08 },
  input: { flex: 1, color: colors.white, fontFamily: fonts.body, fontSize: 16, minHeight: 44 },
  filterBtn: { width: 48, height: 48, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  filterCount: { position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  recent: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 12, gap: 10 },
  skelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: SCREEN_PADDING },
});
