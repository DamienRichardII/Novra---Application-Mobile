import { useMemo, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { ProductCard } from '@/components/ProductCard';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import { EmptyState } from '@/components/States';
import { useCatalogue } from '@/hooks/queries';
import { useFavorites } from '@/stores/favorites';
import { SCREEN_PADDING } from '@/theme';
import { fr } from '@/i18n/fr';
import type { Product } from '@/types';

const GAP = 12;

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const slugs = useFavorites((s) => s.slugs);
  const { data } = useCatalogue();
  const [quick, setQuick] = useState<Product | null>(null);
  const items = useMemo(() => slugs.map((s) => data?.products.find((p) => p.slug === s)).filter((p): p is Product => !!p), [slugs, data]);
  const cols = width >= 600 ? 3 : 2;
  const itemW = Math.floor((Math.min(width, 720) - SCREEN_PADDING * 2 - GAP * (cols - 1)) / cols);

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ paddingHorizontal: SCREEN_PADDING, paddingTop: 12, paddingBottom: 16 }}>
        <T variant="h1">{fr.favorites.title}</T>
      </View>
      {items.length === 0 ? (
        <EmptyState icon="heart" title={fr.favorites.empty} hint={fr.favorites.emptyHint} action={{ label: fr.favorites.cta, onPress: () => router.push('/shop') }} />
      ) : (
        <FlatList
          key={cols}
          data={items}
          numColumns={cols}
          keyExtractor={(p) => p.slug}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: SCREEN_PADDING }}
          contentContainerStyle={{ gap: 22, paddingBottom: 32 }}
          renderItem={({ item }) => <ProductCard product={item} width={itemW} onQuickAdd={setQuick} />}
        />
      )}
      <QuickAddSheet product={quick} onClose={() => setQuick(null)} />
    </Screen>
  );
}
