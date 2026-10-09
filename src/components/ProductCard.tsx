import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme';
import { T } from './Text';
import { Icon } from './Icon';
import { MediaImage } from './MediaImage';
import { ColorDot } from './ColorDot';
import { formatPrice } from '@/lib/money';
import { mediaUrl } from '@/lib/media';
import { isProductAvailable } from '@/api/catalogue';
import { useFavorites } from '@/stores/favorites';
import { hapticLight } from '@/lib/haptics';
import { fr } from '@/i18n/fr';
import type { Product } from '@/types';

type Props = { product: Product; onQuickAdd?: (p: Product) => void; width?: number };

function ProductCardBase({ product, onQuickAdd, width }: Props) {
  const router = useRouter();
  const fav = useFavorites((s) => s.slugs.includes(product.slug));
  const toggle = useFavorites((s) => s.toggle);
  const available = isProductAvailable(product);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}${available ? '' : ', épuisé'}`}
      onPress={() => router.push(`/produit/${product.slug}`)}
      style={[styles.card, width ? { width } : { flex: 1 }]}
    >
      <View style={styles.media}>
        <MediaImage uri={mediaUrl(product.images[0])} focalX={product.focalX} focalY={product.focalY} style={StyleSheet.absoluteFill} recyclingKey={product.slug} />
        {product.isNew ? (
          <View style={styles.badge}>
            <T style={styles.badgeText} color={colors.white}>
              {fr.product.newBadge}
            </T>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fav ? fr.product.favoriteRemove : fr.product.favoriteAdd}
          accessibilityState={{ selected: fav }}
          hitSlop={8}
          onPress={() => {
            hapticLight();
            toggle(product.slug);
          }}
          style={[styles.heart, fav && styles.heartOn]}
        >
          <Icon name="heart" size={18} color={fav ? colors.black : colors.white} />
        </Pressable>
        {onQuickAdd && available ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter ${product.name} au panier`}
            hitSlop={6}
            onPress={() => onQuickAdd(product)}
            style={styles.quick}
          >
            <Icon name="plus" size={20} color={colors.black} />
          </Pressable>
        ) : null}
        {!available ? (
          <View style={styles.soldOut}>
            <T variant="eyebrow" color={colors.black}>
              {fr.product.soldOut}
            </T>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 2, paddingTop: 10 }}>
        <T weight="semi" numberOfLines={1} style={{ fontSize: 14, lineHeight: 20 }}>
          {product.name}
        </T>
        <T variant="small" color={colors.white70} numberOfLines={1}>
          {product.categoryLabel}
        </T>
        <View style={styles.priceRow}>
          <T weight="semi" style={{ fontSize: 14, lineHeight: 20 }}>
            {formatPrice(product.price)}
          </T>
          {product.colors.length > 1 ? (
            <View style={{ flexDirection: 'row', marginRight: -3 }}>
              {product.colors.slice(0, 4).map((c) => (
                <ColorDot key={c} name={c} size={10} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: { minWidth: 0 },
  media: { aspectRatio: 3 / 4, overflow: 'hidden', backgroundColor: colors.grey[700] },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.black78, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 3 },
  badgeText: { fontSize: 9, lineHeight: 11, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Inter_600SemiBold' },
  heart: { position: 'absolute', top: 6, right: 6, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black40, overflow: 'hidden' },
  heartOn: { backgroundColor: colors.white },
  quick: { position: 'absolute', right: 8, bottom: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  soldOut: { position: 'absolute', left: 8, bottom: 8, backgroundColor: colors.white, paddingHorizontal: 8, paddingVertical: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 },
});
