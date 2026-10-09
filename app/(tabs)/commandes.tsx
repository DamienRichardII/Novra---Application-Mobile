import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { colors } from '@/theme';
import { useOrders } from '@/stores/orders';
import { getOrderStatus, REFERENCE_RE } from '@/api/functions';
import { isUserFacing } from '@/api/errors';
import { useOnline } from '@/hooks/queries';
import { fr } from '@/i18n/fr';

export default function OrdersScreen() {
  const router = useRouter();
  const online = useOnline();
  const orders = useOrders((s) => s.orders);
  const upsert = useOrders((s) => s.upsert);
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Statuts relus à l'ouverture de l'onglet (jamais cachés comme source de vérité).
  const statuses = useQueries({
    queries: orders.slice(0, 10).map((o) => ({
      queryKey: ['order-list', o.reference],
      staleTime: 0,
      gcTime: 0,
      retry: 0,
      queryFn: () => (o.token ? getOrderStatus({ ref: o.reference, token: o.token }) : getOrderStatus({ reference: o.reference, email: o.email })),
    })),
  });

  const track = async () => {
    const ref = reference.trim().toUpperCase();
    if (!REFERENCE_RE.test(ref)) return setError(fr.orders.badRef);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(fr.checkout.invalidEmail);
    setError(null);
    setBusy(true);
    try {
      await getOrderStatus({ reference: ref, email: email.trim() });
      upsert({ reference: ref, email: email.trim(), createdAt: new Date().toISOString() });
      router.push({ pathname: '/commande/[reference]', params: { reference: ref } });
    } catch (e) {
      setError(isUserFacing(e) ? e.message : fr.common.genericError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ paddingTop: 12, paddingBottom: 20 }}>
        <T variant="h1">{fr.orders.title}</T>
      </View>

      <View style={{ gap: 14 }}>
        <T variant="h3">{fr.orders.follow}</T>
        <Field label={fr.orders.reference} value={reference} onChangeText={setReference} autoCapitalize="characters" autoCorrect={false} placeholder={fr.orders.referencePlaceholder} testID="track-ref" />
        <Field label={fr.orders.email} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" testID="track-email" />
        {error ? (
          <T variant="small" color={colors.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        <Button label={fr.orders.search} onPress={track} loading={busy} disabled={!online} testID="track-submit" />
      </View>

      <View style={{ gap: 4, paddingTop: 36 }}>
        <T variant="h3">{fr.orders.deviceOrders}</T>
        {orders.length === 0 ? (
          <T color={colors.white70} style={{ paddingTop: 8 }}>
            {fr.orders.emptyDevice}
          </T>
        ) : (
          orders.map((o, idx) => {
            const q = statuses[idx];
            return (
              <Pressable
                key={o.reference}
                accessibilityRole="link"
                accessibilityLabel={`Commande ${o.reference}`}
                onPress={() => router.push({ pathname: '/commande/[reference]', params: { reference: o.reference } })}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, borderTopWidth: 1, borderColor: colors.lineDark, marginTop: idx === 0 ? 8 : 0 }}
              >
                <View style={{ gap: 2 }}>
                  <T weight="semi">{o.reference}</T>
                  <T variant="small" color={colors.white70}>
                    {q?.data ? fr.status[q.data.status] ?? q.data.status : q?.isLoading ? fr.common.loading : new Date(o.createdAt).toLocaleDateString('fr-FR')}
                  </T>
                </View>
                <Icon name="chevron-right" size={18} />
              </Pressable>
            );
          })
        )}
      </View>

      <View style={{ paddingTop: 40, gap: 0 }}>
        {[
          { label: fr.pages.about, href: '/pages/a-propos' },
          { label: fr.pages.contact, href: '/pages/contact' },
          { label: fr.pages.legal, href: '/pages/legal' },
          { label: fr.admin.entry, href: '/admin' },
        ].map((l) => (
          <Pressable key={l.href} accessibilityRole="link" onPress={() => router.push(l.href as never)} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.lineDark }}>
            <T color={l.href === '/admin' ? colors.white45 : colors.white}>{l.label}</T>
            <Icon name="chevron-right" size={18} color={colors.white45} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
