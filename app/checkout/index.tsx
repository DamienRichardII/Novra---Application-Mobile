import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Chip } from '@/components/Chip';
import { RadioCard } from '@/components/RadioCard';
import { EmptyState } from '@/components/States';
import { colors, SCREEN_PADDING } from '@/theme';
import { useCatalogue, useOnline, useStoreSettings } from '@/hooks/queries';
import { useCart } from '@/stores/cart';
import { useOrders } from '@/stores/orders';
import { priceLines, subtotalCents } from '@/lib/cart';
import { COUNTRIES, SHIPPING_LABELS, config, type ShippingMethod } from '@/lib/config';
import { estimateShippingCents } from '@/lib/shipping';
import { formatCents } from '@/lib/money';
import { addressSchema, contactSchema, fieldErrors, needsAddress } from '@/lib/checkout-schema';
import { uuidv4 } from '@/lib/uuid';
import { createOrder } from '@/api/functions';
import { isUserFacing } from '@/api/errors';
import { isPickupAvailable } from '@/api/store';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { fr } from '@/i18n/fr';

type Step = 0 | 1 | 2 | 3;

export default function CheckoutScreen() {
  const router = useRouter();
  const online = useOnline();
  const { data } = useCatalogue();
  const { data: store } = useStoreSettings();
  const { lines, promo } = useCart();
  const { upsert, getOrCreateKey, setPending } = useOrders();

  const [step, setStep] = useState<Step>(0);
  const [contact, setContact] = useState({ firstname: '', lastname: '', email: '', phone: '' });
  const [method, setMethod] = useState<ShippingMethod>('standard');
  const [addr, setAddr] = useState({ address: '', address2: '', zip: '', city: '', country: 'FR' as 'FR' | 'BE' | 'CH' | 'LU' });
  const [cgv, setCgv] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const priced = useMemo(() => priceLines(lines, data?.products ?? []), [lines, data]);
  const sub = subtotalCents(priced);
  const ship = estimateShippingCents(sub, method);
  const pickupOk = isPickupAvailable(store);
  const hasAddress = needsAddress(method);
  const relay = method === 'relay';
  const stepLabels = hasAddress ? fr.checkout.steps : [fr.checkout.steps[0], fr.checkout.steps[1], fr.checkout.steps[3]];
  const stepIndexVisible = hasAddress ? step : step === 3 ? 2 : step;

  if (lines.length === 0 || priced.some((l) => l.issue)) {
    return (
      <Screen scroll={false}>
        <EmptyState icon="shopping-bag" title={fr.checkout.emptyCart} action={{ label: fr.payment.backToCart, onPress: () => router.replace('/panier') }} />
      </Screen>
    );
  }

  const next = () => {
    setApiError(null);
    if (step === 0) {
      const e = fieldErrors(contactSchema.safeParse(contact));
      setErrors(e);
      if (Object.keys(e).length) return hapticError();
      return setStep(1);
    }
    if (step === 1) {
      setErrors({});
      return setStep(hasAddress ? 2 : 3);
    }
    if (step === 2) {
      const e = fieldErrors(addressSchema.safeParse(addr));
      setErrors(e);
      if (Object.keys(e).length) return hapticError();
      return setStep(3);
    }
  };
  const back = () => {
    setApiError(null);
    if (step === 0) return router.back();
    if (step === 3 && !hasAddress) return setStep(1);
    setStep((s) => (s - 1) as Step);
  };

  const pay = async () => {
    if (!cgv || !privacy) {
      setErrors({ terms: fr.checkout.mustAccept });
      return hapticError();
    }
    setErrors({});
    setApiError(null);
    setBusy(true);
    // Web : ouvrir l'onglet de paiement dans le geste utilisateur (anti-bloqueur de popups).
    const popup = Platform.OS === 'web' && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    try {
      const key = getOrCreateKey(uuidv4);
      const res = await createOrder({
        lines,
        email: contact.email.trim(),
        shipping: method,
        promo: promo || undefined,
        idempotency_key: key,
        address: hasAddress
          ? {
              firstname: contact.firstname.trim(),
              lastname: contact.lastname.trim(),
              phone: contact.phone.trim(),
              address: addr.address.trim(),
              address2: relay ? undefined : addr.address2.trim() || undefined,
              zip: addr.zip.trim(),
              city: addr.city.trim(),
              country: addr.country,
            }
          : // Retrait en boutique : le serveur n'exige ni rue, ni code postal, ni ville (vérifié).
            { firstname: contact.firstname.trim(), lastname: contact.lastname.trim(), phone: contact.phone.trim() },
      });
      upsert({ reference: res.reference, token: res.access_token, email: contact.email.trim(), createdAt: new Date().toISOString() });
      setPending({ reference: res.reference, token: res.access_token, email: contact.email.trim(), checkoutUrl: res.checkout_url, idempotencyKey: key });
      hapticSuccess();
      router.replace({ pathname: '/checkout/retour', params: { ref: res.reference } });
      if (Platform.OS === 'web') {
        if (popup) popup.location.href = res.checkout_url;
        else window.location.assign(res.checkout_url);
      } else {
        // Le retour n'est jamais cru sur parole : l'écran de retour relit order-status (doc 06).
        WebBrowser.openAuthSessionAsync(res.checkout_url, 'novra://commande').catch(() => undefined);
      }
    } catch (e) {
      popup?.close();
      hapticError();
      setApiError(isUserFacing(e) ? e.message : fr.common.genericError);
    } finally {
      setBusy(false);
    }
  };

  const upd = (k: keyof typeof contact) => (v: string) => setContact((c) => ({ ...c, [k]: v }));
  const updA = (k: keyof typeof addr) => (v: string) => setAddr((c) => ({ ...c, [k]: v }));

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          {apiError ? (
            <T variant="small" color={colors.white} style={styles.apiError} accessibilityLiveRegion="assertive" accessibilityRole="alert">
              {apiError}
            </T>
          ) : null}
          {step < 3 ? (
            <Button label={fr.checkout.next} onPress={next} testID="checkout-next" />
          ) : (
            <Button label={busy ? fr.checkout.paying : fr.checkout.pay} onPress={pay} loading={busy} disabled={!online} testID="checkout-pay" />
          )}
        </View>
      }
    >
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={fr.checkout.previous} onPress={back} style={styles.backBtn}>
          <Icon name={step === 0 ? 'x' : 'arrow-left'} />
        </Pressable>
        <T variant="h2">{fr.checkout.title}</T>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.steps} accessibilityRole="progressbar" accessibilityLabel={`Étape ${stepIndexVisible + 1} sur ${stepLabels.length} : ${stepLabels[stepIndexVisible]}`}>
        {stepLabels.map((l, i) => (
          <View key={l} style={{ flex: 1, gap: 6 }}>
            <View style={[styles.bar, i <= stepIndexVisible && styles.barOn]} />
            <T variant="eyebrow" color={i <= stepIndexVisible ? colors.white : colors.white45} style={{ fontSize: 9 }}>
              {String(i + 1).padStart(2, '0')} {l}
            </T>
          </View>
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.form}>
          <Field label={fr.checkout.firstname} value={contact.firstname} onChangeText={upd('firstname')} error={errors.firstname} textContentType="givenName" autoComplete="given-name" autoCapitalize="words" testID="f-firstname" />
          <Field label={fr.checkout.lastname} value={contact.lastname} onChangeText={upd('lastname')} error={errors.lastname} textContentType="familyName" autoComplete="family-name" autoCapitalize="words" testID="f-lastname" />
          <Field label={fr.checkout.email} value={contact.email} onChangeText={upd('email')} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" testID="f-email" />
          <Field label={fr.checkout.phone} value={contact.phone} onChangeText={upd('phone')} error={errors.phone} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" testID="f-phone" />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.form}>
          <T variant="h3">{fr.checkout.shippingMode}</T>
          {(['standard', 'express', 'relay'] as ShippingMethod[]).map((m) => (
            <RadioCard key={m} title={SHIPPING_LABELS[m].title} subtitle={SHIPPING_LABELS[m].subtitle} price={estimateShippingCents(sub, m) === 0 ? 'Offerte' : formatCents(estimateShippingCents(sub, m))} selected={method === m} onPress={() => setMethod(m)} />
          ))}
          {pickupOk ? (
            <RadioCard
              title={SHIPPING_LABELS.pickup.title}
              subtitle={`${store?.address}, ${store?.zip ?? ''} ${store?.city}`.trim()}
              price="Gratuit"
              selected={method === 'pickup'}
              onPress={() => setMethod('pickup')}
            />
          ) : null}
          <T variant="small" color={colors.white70}>
            {fr.cart.estimate}
          </T>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.form}>
          {relay ? (
            <T variant="small" color={colors.white70}>
              {fr.checkout.relayHelp}
            </T>
          ) : null}
          <Field label={relay ? fr.checkout.relayName : fr.checkout.address} value={addr.address} onChangeText={updA('address')} error={errors.address} textContentType="streetAddressLine1" autoComplete="street-address" />
          {!relay ? <Field label={fr.checkout.address2} value={addr.address2} onChangeText={updA('address2')} textContentType="streetAddressLine2" /> : null}
          <Field label={relay ? fr.checkout.relayZip : fr.checkout.zip} value={addr.zip} onChangeText={updA('zip')} error={errors.zip} keyboardType="number-pad" textContentType="postalCode" autoComplete="postal-code" />
          <Field label={relay ? fr.checkout.relayCity : fr.checkout.city} value={addr.city} onChangeText={updA('city')} error={errors.city} textContentType="addressCity" autoCapitalize="words" />
          <View style={{ gap: 8 }}>
            <T variant="eyebrow" color={colors.white70}>
              {fr.checkout.country}
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {COUNTRIES.map((c) => (
                <Chip key={c.code} label={c.label} active={addr.country === c.code} onPress={() => setAddr((a) => ({ ...a, country: c.code }))} />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.form}>
          <View style={styles.recap}>
            {priced.map((l) => (
              <View key={`${l.slug}-${l.color}-${l.size}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <T variant="small" style={{ flex: 1 }}>
                  {l.qty} × {l.product?.name} · {l.color} · {l.size}
                </T>
                <T variant="small">{formatCents(l.totalCents)}</T>
              </View>
            ))}
            <View style={styles.hr} />
            <Line label={fr.cart.subtotal} value={formatCents(sub)} />
            <Line label={fr.cart.shipping} value={ship === 0 ? 'Offerte' : formatCents(ship)} />
            {promo ? <Line label={fr.cart.discount} value={`Code ${promo} (vérifié au paiement)`} /> : null}
            <View style={styles.hr} />
            <Line label={fr.cart.total} value={formatCents(sub + ship)} strong />
            <T variant="small" color={colors.white70}>
              {fr.cart.estimate}
            </T>
          </View>

          <Check label={fr.checkout.termsLabel} checked={cgv} onToggle={() => setCgv((v) => !v)} />
          <Check label={fr.checkout.privacyLabel} checked={privacy} onToggle={() => setPrivacy((v) => !v)} />
          {errors.terms ? (
            <T variant="small" color={colors.error} accessibilityLiveRegion="polite">
              {errors.terms}
            </T>
          ) : null}
          <T variant="small" color={colors.white70}>
            {fr.checkout.withdrawal} {fr.checkout.payHint}
          </T>
          <T variant="small" color={colors.white45}>
            {config.siteUrl.replace('https://', '')}
          </T>
        </View>
      ) : null}
    </Screen>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <T weight={strong ? 'semi' : undefined} color={strong ? colors.white : colors.white70}>
        {label}
      </T>
      <T weight={strong ? 'semi' : undefined} style={{ flexShrink: 1 }} align="right">
        {value}
      </T>
    </View>
  );
}

function Check({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} onPress={onToggle} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 44 }}>
      <View style={[styles.box, checked && { backgroundColor: colors.white }]}>{checked ? <Icon name="check" size={16} color={colors.black} /> : null}</View>
      <T variant="small" style={{ flex: 1 }}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  backBtn: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  steps: { flexDirection: 'row', gap: 6, paddingVertical: 16 },
  bar: { height: 2, backgroundColor: colors.white15 },
  barOn: { backgroundColor: colors.white },
  form: { gap: 16, paddingBottom: 16 },
  recap: { gap: 8, borderWidth: 1, borderColor: colors.white15, padding: 16 },
  hr: { height: 1, backgroundColor: colors.lineDark, marginVertical: 4 },
  box: { width: 24, height: 24, borderWidth: 1.5, borderColor: colors.white70, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12, paddingBottom: 12, gap: 10, borderTopWidth: 1, borderColor: colors.lineDark, backgroundColor: colors.black },
  apiError: { borderWidth: 1, borderColor: colors.white45, padding: 12 },
});
