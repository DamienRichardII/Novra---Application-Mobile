import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, SCREEN_PADDING } from '@/theme';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { MediaImage } from '@/components/MediaImage';
import { ColorDot } from '@/components/ColorDot';
import { SizeGrid } from '@/components/SizeGrid';
import { Button } from '@/components/Button';
import { Accordion } from '@/components/Accordion';
import { ProductCard } from '@/components/ProductCard';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import { EmptyState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useCatalogue } from '@/hooks/queries';
import { useAddToCart } from '@/hooks/useAddToCart';
import { isSizeAvailable, relatedProducts, variantStock, isProductAvailable } from '@/api/catalogue';
import { useFavorites } from '@/stores/favorites';
import { formatPrice } from '@/lib/money';
import { mediaUrl } from '@/lib/media';
import { config } from '@/lib/config';
import { hapticLight } from '@/lib/haptics';
import { fr } from '@/i18n/fr';
import type { Product } from '@/types';

function Viewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.black }}>
        <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          <MediaImage uri={uri ?? undefined} contentFit="contain" style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.black }} />
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer l'image" onPress={onClose} style={{ position: 'absolute', top: insets.top + 8, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.black70, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" />
        </Pressable>
      </View>
    </Modal>
  );
}

function Gallery({ product }: { product: Product }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, 720);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        data={product.images}
        keyExtractor={(u, i) => `${u}-${i}`}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / w))}
        getItemLayout={(_, i) => ({ length: w, offset: w * i, index: i })}
        renderItem={({ item, index: i }) => (
          <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${product.name}, photo ${i + 1} sur ${product.images.length}. Toucher pour agrandir`} onPress={() => setZoom(mediaUrl(item) ?? null)} style={{ width: w, aspectRatio: 3 / 4 }}>
            <MediaImage uri={mediaUrl(item)} focalX={product.focalX} focalY={product.focalY} style={StyleSheet.absoluteFill} priority={i === 0 ? 'high' : 'normal'} />
          </Pressable>
        )}
      />
      {product.images.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {product.images.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
      <Viewer uri={zoom} onClose={() => setZoom(null)} />
    </View>
  );
}

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading } = useCatalogue();
  const product = useMemo(() => data?.products.find((p) => p.slug === slug), [data, slug]);

  if (isLoading && !product) {
    return (
      <SafeAreaView style={styles.root}>
        <Skeleton aspectRatio={3 / 4} />
      </SafeAreaView>
    );
  }
  if (!product) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState icon="alert-circle" title={fr.product.notFound} action={{ label: fr.product.related, onPress: () => router.replace('/shop') }} />
      </SafeAreaView>
    );
  }
  // `key` : l'état (couleur, taille, quantité) repart de zéro pour chaque produit.
  return <ProductView key={product.slug} product={product} all={data?.products ?? []} />;
}

function ProductView({ product, all }: { product: Product; all: Product[] }) {
  const router = useRouter();
  const fav = useFavorites((s) => s.slugs.includes(product.slug));
  const toggleFav = useFavorites((s) => s.toggle);
  const addToCart = useAddToCart();
  // Une seule couleur / une seule taille : présélection ; sinon l'utilisateur doit choisir (R2).
  const [color, setColor] = useState<string | null>(product.colors.length === 1 ? product.colors[0] : null);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [quick, setQuick] = useState<Product | null>(null);

  const available = isProductAvailable(product);
  const stock = color && size ? variantStock(product, color, size) : null;
  const needColor = !color;
  const needSize = !size;
  const hint = needColor ? fr.product.chooseColor : needSize ? fr.product.chooseSize : stock !== null && stock > 0 && stock <= 3 ? fr.product.lastUnits(stock) : null;
  const related = relatedProducts(all, product);
  const sizeOk = color && size ? isSizeAvailable(product, size, color) : true;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <OfflineBanner />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={styles.frame}>
          <Gallery product={product} />
          <View style={{ padding: SCREEN_PADDING, gap: 20 }}>
            <View style={{ gap: 6 }}>
              {product.isNew ? <T variant="eyebrow" color={colors.white70}>{fr.product.newBadge}</T> : null}
              <T variant="h1">{product.name}</T>
              <T variant="body" weight="semi">
                {formatPrice(product.price)}
              </T>
            </View>

            {product.colors.length > 0 ? (
              <View style={{ gap: 4 }}>
                <T variant="eyebrow" color={colors.white70}>
                  {fr.shop.color}
                  {color ? ` — ${color}` : ''}
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {product.colors.map((c) => (
                    <ColorDot key={c} name={c} size={28} active={color === c} onPress={() => { setColor(c); if (size && !isSizeAvailable(product, size, c)) setSize(null); }} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <T variant="eyebrow" color={colors.white70}>
                {fr.shop.size}
                {size ? ` — ${size}` : ''}
              </T>
              <SizeGrid sizes={product.sizes} selected={size} isAvailable={(s) => isSizeAvailable(product, s, color ?? undefined)} onSelect={setSize} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <T variant="eyebrow" color={colors.white70}>
                {fr.product.quantity}
              </T>
              <View style={styles.qty}>
                <Pressable accessibilityRole="button" accessibilityLabel={fr.cart.decrease} onPress={() => { hapticLight(); setQty((q) => Math.max(1, q - 1)); }} style={styles.qtyBtn}>
                  <Icon name="minus" size={18} />
                </Pressable>
                <T weight="semi" style={{ minWidth: 28 }} align="center">
                  {qty}
                </T>
                <Pressable accessibilityRole="button" accessibilityLabel={fr.cart.increase} onPress={() => { hapticLight(); setQty((q) => Math.min(20, q + 1)); }} style={styles.qtyBtn}>
                  <Icon name="plus" size={18} />
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label={fav ? fr.product.favoriteRemove : fr.product.favoriteAdd}
                variant="outline"
                block={false}
                style={{ flex: 1 }}
                onPress={() => toggleFav(product.slug)}
              />
              <Button
                label={fr.product.share}
                variant="outline"
                block={false}
                style={{ flex: 1 }}
                onPress={() =>
                  Share.share({ message: `${product.name} — NOVRA`, url: `${config.siteUrl}/product.html?slug=${product.slug}` }).catch(() => undefined)
                }
              />
            </View>

            <View>
              {product.description ? (
                <Accordion title={fr.product.description} defaultOpen>
                  <T color={colors.white70}>{product.description}</T>
                  {product.technicalDetails.length ? (
                    <View style={{ gap: 4, marginTop: 6 }}>
                      {product.technicalDetails.map((d) => (
                        <T key={d} variant="small" color={colors.white70}>
                          — {d}
                        </T>
                      ))}
                    </View>
                  ) : null}
                </Accordion>
              ) : null}
              {product.composition || product.care ? (
                <Accordion title={fr.product.material}>
                  {product.composition ? (
                    <T color={colors.white70}>
                      <T weight="semi">{fr.product.composition} : </T>
                      {product.composition}
                    </T>
                  ) : null}
                  {product.care ? (
                    <T color={colors.white70}>
                      <T weight="semi">{fr.product.care} : </T>
                      {product.care}
                    </T>
                  ) : null}
                </Accordion>
              ) : null}
              <Accordion title={fr.product.shipping}>
                <T color={colors.white70}>{fr.product.shippingText}</T>
              </Accordion>
              <View style={{ borderTopWidth: 1, borderColor: colors.lineDark }} />
            </View>
          </View>

          {related.length ? (
            <View style={{ gap: 14, paddingBottom: 12 }}>
              <T variant="h2" style={{ paddingHorizontal: SCREEN_PADDING }}>
                {fr.product.related}
              </T>
              <FlatList
                horizontal
                data={related}
                keyExtractor={(p) => p.slug}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, gap: 12 }}
                renderItem={({ item }) => <ProductCard product={item} width={160} onQuickAdd={setQuick} />}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/shop'))} style={styles.roundBtn}>
          <Icon name="arrow-left" />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bar}>
        <View style={styles.barInner}>
          {hint ? (
            <T variant="small" color={colors.white70} align="center" accessibilityLiveRegion="polite">
              {hint}
            </T>
          ) : null}
          <Button
            label={available ? fr.product.addToCart : fr.product.soldOut}
            disabled={!available || needColor || needSize || !sizeOk}
            onPress={() => {
              const r = addToCart(product, color, size, qty);
              if (r.ok) setQty(1);
            }}
          />
        </View>
      </SafeAreaView>
      <QuickAddSheet product={quick} onClose={() => setQuick(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  frame: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  top: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 12 },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.black70, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white45 },
  dotOn: { backgroundColor: colors.white, width: 18 },
  qty: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.white15 },
  qtyBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.black90, borderTopWidth: 1, borderColor: colors.lineDark },
  barInner: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: SCREEN_PADDING, paddingTop: 10, paddingBottom: 6, gap: 8 },
});
