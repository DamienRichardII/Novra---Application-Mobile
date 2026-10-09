import { useState } from 'react';
import { Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, SCREEN_PADDING } from '@/theme';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Timeline } from '@/components/Timeline';
import { EmptyState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useOrders } from '@/stores/orders';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import { useToast } from '@/stores/toast';
import { formatPrice } from '@/lib/money';
import { buildReceiptHtml, itemName, itemQty, itemUnit } from '@/lib/receipt';
import { hapticLight } from '@/lib/haptics';
import { isUserFacing } from '@/api/errors';
import { fr } from '@/i18n/fr';

export default function OrderScreen() {
  const { reference, t } = useLocalSearchParams<{ reference: string; t?: string }>();
  const router = useRouter();
  const stored = useOrders((s) => s.orders.find((o) => o.reference === reference));
  const remove = useOrders((s) => s.remove);
  const show = useToast((s) => s.show);
  const [busy, setBusy] = useState(false);

  // Jeton (lien profond / retour) ou e-mail mémorisé : jamais la référence seule.
  const creds = stored ? { ...stored, token: t ?? stored.token } : t ? { reference, token: t, email: '' } : null;
  const { data: o, isLoading, error, refetch, isRefetching } = useOrderQuery(creds);

  const copy = async () => {
    hapticLight();
    await Clipboard.setStringAsync(reference ?? '');
    show(fr.orders.refCopied);
  };

  const receipt = async () => {
    if (!o) return;
    setBusy(true);
    try {
      const html = buildReceiptHtml(o);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Reçu ${o.reference}` });
      }
    } catch {
      show(fr.common.genericError);
    } finally {
      setBusy(false);
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/commandes'));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.frame}>
        <OfflineBanner />
        <View style={styles.head}>
          <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={back} style={styles.back}>
            <Icon name="arrow-left" />
          </Pressable>
          <T variant="h2">{fr.orders.title}</T>
          <View style={{ width: 44 }} />
        </View>

        {!creds ? (
          <EmptyState icon="search" title={fr.orders.notFound} action={{ label: fr.orders.follow, onPress: () => router.replace('/commandes') }} />
        ) : isLoading ? (
          <View style={{ padding: SCREEN_PADDING, gap: 14 }}>
            <Skeleton height={28} width="60%" />
            <Skeleton height={160} />
          </View>
        ) : error || !o ? (
          <EmptyState icon="alert-circle" title={isUserFacing(error) ? error.message : fr.common.genericError} action={{ label: fr.common.retry, onPress: () => refetch() }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: SCREEN_PADDING, gap: 28, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.white} />}
          >
            <View style={{ gap: 6 }}>
              <T variant="eyebrow" color={colors.white70}>
                {fr.orders.reference}
              </T>
              <Pressable accessibilityRole="button" accessibilityLabel={`${fr.orders.copyRef} ${o.reference}`} onPress={copy} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <T variant="h1">{o.reference}</T>
                <Icon name="copy" size={18} color={colors.white70} />
              </Pressable>
              <T color={colors.white70}>{fr.status[o.status] ?? o.status}</T>
            </View>

            <Timeline order={o} />

            {o.carrier || o.tracking_number || o.tracking_url ? (
              <View style={styles.box}>
                {o.carrier ? (
                  <T>
                    <T weight="semi">{fr.orders.carrier} : </T>
                    {o.carrier}
                  </T>
                ) : null}
                {o.tracking_number ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Copier le numéro de suivi ${o.tracking_number}`} onPress={async () => { await Clipboard.setStringAsync(o.tracking_number!); show(fr.common.copied); }}>
                    <T>
                      <T weight="semi">{fr.orders.tracking} : </T>
                      {o.tracking_number}
                    </T>
                  </Pressable>
                ) : null}
                {o.tracking_url ? <Button label={fr.orders.trackParcel} onPress={() => (Platform.OS === 'web' ? Linking.openURL(o.tracking_url!) : WebBrowser.openBrowserAsync(o.tracking_url!))} /> : null}
              </View>
            ) : null}

            {o.fulfilment === 'pickup' && o.store ? (
              <View style={styles.box}>
                <T variant="eyebrow" color={colors.white70}>
                  {fr.orders.pickupAt}
                </T>
                <T weight="semi">{o.store.name ?? 'NOVRA'}</T>
                <T>
                  {o.store.address}, {o.store.zip} {o.store.city}
                </T>
                {o.store.hours?.map((h) => (
                  <T key={h.day} variant="small" color={colors.white70}>
                    {h.day} — {h.hours}
                  </T>
                ))}
                {o.store.pickup_note ? <T variant="small">{o.store.pickup_note}</T> : null}
              </View>
            ) : o.address ? (
              <View style={styles.box}>
                <T variant="eyebrow" color={colors.white70}>
                  {o.fulfilment === 'relay' ? fr.orders.relayAt : fr.orders.deliveryTo}
                </T>
                <T>{[o.address.address, [o.address.zip, o.address.city].filter(Boolean).join(' '), o.address.country].filter(Boolean).join('\n')}</T>
              </View>
            ) : null}

            <View style={{ gap: 12 }}>
              <T variant="eyebrow" color={colors.white70}>
                {fr.orders.items}
              </T>
              {(o.items ?? []).map((i, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <T weight="semi">{itemName(i)}</T>
                    <T variant="small" color={colors.white70}>
                      {[i.color, i.size].filter(Boolean).join(' · ')} · × {itemQty(i)}
                    </T>
                  </View>
                  <T>{formatPrice(itemUnit(i) * itemQty(i))}</T>
                </View>
              ))}
              <View style={styles.hr} />
              <Row label={fr.cart.subtotal} value={formatPrice(Number(o.subtotal ?? 0))} />
              <Row label={fr.cart.shipping} value={Number(o.shipping) ? formatPrice(Number(o.shipping)) : 'Offerte'} />
              {Number(o.discount) ? <Row label={`${fr.cart.discount}${o.promo_code ? ` (${o.promo_code})` : ''}`} value={`-${formatPrice(Number(o.discount))}`} /> : null}
              <Row label={fr.cart.total} value={formatPrice(Number(o.total ?? 0))} strong />
            </View>

            {o.paid ? <Button label={fr.orders.receipt} variant="outline" onPress={receipt} loading={busy} /> : null}
            {stored ? (
              <Pressable accessibilityRole="button" onPress={() => { remove(stored.reference); back(); }} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <T variant="small" color={colors.white70} style={{ textDecorationLine: 'underline' }}>
                  {fr.orders.forget}
                </T>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <T weight={strong ? 'semi' : undefined} color={strong ? colors.white : colors.white70}>
        {label}
      </T>
      <T weight={strong ? 'semi' : undefined}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  frame: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { borderWidth: 1, borderColor: colors.white15, padding: 16, gap: 8 },
  hr: { height: 1, backgroundColor: colors.lineDark },
});
