import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { MediaImage } from '@/components/MediaImage';
import { EmptyState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { colors, SCREEN_PADDING } from '@/theme';
import { useCatalogue, useOnline } from '@/hooks/queries';
import { useCart } from '@/stores/cart';
import { priceLines, subtotalCents } from '@/lib/cart';
import { estimateShippingCents, freeShippingProgress, remainingForFreeShipping } from '@/lib/shipping';
import { formatCents } from '@/lib/money';
import { mediaUrl } from '@/lib/media';
import { hapticLight } from '@/lib/haptics';
import { fr } from '@/i18n/fr';

export default function CartScreen() {
  const router = useRouter();
  const { data, isLoading } = useCatalogue();
  const online = useOnline();
  const { lines, promo, setQty, remove, setPromo } = useCart();
  const [promoInput, setPromoInput] = useState(promo);
  const live = data?.source === 'live';

  const priced = useMemo(() => priceLines(lines, data?.products ?? []), [lines, data]);
  const sub = subtotalCents(priced);
  const ship = estimateShippingCents(sub, 'standard');
  const blocked = priced.some((l) => l.issue);
  const canCheckout = lines.length > 0 && !blocked && online && live;

  if (lines.length === 0) {
    return (
      <Screen scroll={false}>
        <View style={{ paddingTop: 12 }}>
          <T variant="h1">{fr.cart.title}</T>
        </View>
        <EmptyState icon="shopping-bag" title={fr.cart.empty} hint={fr.cart.emptyHint} action={{ label: fr.cart.cta, onPress: () => router.push('/shop') }} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T weight="semi">{fr.cart.total} (estimation)</T>
            <T weight="semi">{formatCents(sub + ship)}</T>
          </View>
          <Button label={fr.cart.checkout} disabled={!canCheckout} onPress={() => router.push('/checkout')} testID="cart-checkout" />
          {!canCheckout && lines.length > 0 && !blocked ? (
            <T variant="small" color={colors.white70} align="center">
              {fr.cart.offlineDisabled}
            </T>
          ) : null}
        </View>
      }
    >
      <View style={{ paddingTop: 12, paddingBottom: 12 }}>
        <T variant="h1">{fr.cart.title}</T>
      </View>

      {sub < 8000 && !blocked ? (
        <View style={{ gap: 8, paddingBottom: 18 }}>
          <T variant="small" color={colors.white70}>
            {fr.cart.freeShippingProgress(formatCents(remainingForFreeShipping(sub)))}
          </T>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${freeShippingProgress(sub) * 100}%` }]} />
          </View>
        </View>
      ) : sub >= 8000 ? (
        <T variant="small" color={colors.white70} style={{ paddingBottom: 18 }}>
          {fr.cart.freeShippingReached}
        </T>
      ) : null}

      {isLoading && !data ? <Skeleton height={120} /> : null}

      <View style={{ gap: 0 }}>
        {priced.map((l) => (
          <View key={`${l.slug}-${l.color}-${l.size}`} style={styles.line}>
            <View style={styles.thumb}>
              <MediaImage uri={mediaUrl(l.product?.images[0])} focalX={l.product?.focalX} focalY={l.product?.focalY} style={StyleSheet.absoluteFill} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T weight="semi" numberOfLines={2}>
                {l.product?.name ?? l.slug}
              </T>
              <T variant="small" color={colors.white70}>
                {l.color} · {l.size}
              </T>
              {l.issue ? (
                <T variant="small" color={colors.white} style={styles.issue} accessibilityLiveRegion="polite">
                  {l.issue === 'missing' ? fr.cart.lineProblem : fr.cart.lineSizeGone}
                </T>
              ) : (
                <T weight="semi">{formatCents(l.unitCents)}</T>
              )}
              <View style={styles.lineActions}>
                <View style={styles.qty}>
                  <Pressable accessibilityRole="button" accessibilityLabel={fr.cart.decrease} onPress={() => { hapticLight(); setQty(l.slug, l.color, l.size, l.qty - 1); }} style={styles.qtyBtn} disabled={l.qty <= 1}>
                    <Icon name="minus" size={16} color={l.qty <= 1 ? colors.white45 : colors.white} />
                  </Pressable>
                  <T weight="semi" style={{ minWidth: 24 }} align="center" accessibilityLabel={`Quantité ${l.qty}`}>
                    {l.qty}
                  </T>
                  <Pressable accessibilityRole="button" accessibilityLabel={fr.cart.increase} onPress={() => { hapticLight(); setQty(l.slug, l.color, l.size, l.qty + 1); }} style={styles.qtyBtn} disabled={l.qty >= 20}>
                    <Icon name="plus" size={16} color={l.qty >= 20 ? colors.white45 : colors.white} />
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`${fr.cart.remove} ${l.product?.name ?? l.slug}`} onPress={() => remove(l.slug, l.color, l.size)} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <T variant="small" style={{ textDecorationLine: 'underline' }}>
                    {fr.cart.remove}
                  </T>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 10, paddingVertical: 22 }}>
        <Field label={fr.cart.promo} value={promoInput} onChangeText={setPromoInput} autoCapitalize="characters" autoCorrect={false} returnKeyType="done" onSubmitEditing={() => setPromo(promoInput)} placeholder="BIENVENUE10" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label={fr.cart.promoApply} variant="outline" block={false} style={{ flex: 1 }} onPress={() => setPromo(promoInput)} disabled={!promoInput.trim()} />
          {promo ? <Button label={fr.cart.promoRemove} variant="outline" block={false} style={{ flex: 1 }} onPress={() => { setPromo(''); setPromoInput(''); }} /> : null}
        </View>
        <T variant="small" color={colors.white70}>
          {promo ? fr.cart.promoPending(promo) : fr.cart.promoNote}
        </T>
      </View>

      <View style={styles.summary}>
        <Row label={fr.cart.subtotal} value={formatCents(sub)} />
        <Row label={fr.cart.shipping} value={ship === 0 ? 'Offerte' : formatCents(ship)} />
        <T variant="small" color={colors.white70}>
          {fr.cart.estimate}
        </T>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <T color={colors.white70}>{label}</T>
      <T>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderTopWidth: 1, borderColor: colors.lineDark },
  thumb: { width: 92, aspectRatio: 3 / 4, backgroundColor: colors.grey[700], overflow: 'hidden' },
  lineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  qty: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.white15 },
  qtyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  track: { height: 3, backgroundColor: colors.white15 },
  fill: { height: 3, backgroundColor: colors.white },
  issue: { borderWidth: 1, borderColor: colors.white45, padding: 8 },
  summary: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderColor: colors.lineDark, paddingVertical: 16 },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12, paddingBottom: 12, gap: 10, borderTopWidth: 1, borderColor: colors.lineDark, backgroundColor: colors.black },
});
