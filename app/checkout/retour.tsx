import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme';
import { getOrderStatus } from '@/api/functions';
import { useOrders } from '@/stores/orders';
import { useCart } from '@/stores/cart';
import { hapticSuccess } from '@/lib/haptics';
import { fr } from '@/i18n/fr';

type Phase = 'verifying' | 'paid' | 'failed' | 'expired' | 'slow' | 'error';

const POLL_MS = 2000;
const POLL_MAX = 15; // 30 s (doc 06)

/**
 * Retour de paiement. L'URL de retour n'est JAMAIS une preuve : seule la lecture d'order-status
 * (`paid` posé par le serveur via apply_payment_result) vide le panier (R7).
 */
export default function PaymentReturn() {
  const { ref, t } = useLocalSearchParams<{ ref?: string; t?: string }>();
  const router = useRouter();
  const pending = useOrders((s) => s.pending);
  const stored = useOrders((s) => s.orders.find((o) => o.reference === (ref ?? pending?.reference)));
  const { resetKey, setPending } = useOrders();
  const clearCart = useCart((s) => s.clear);

  const reference = ref ?? pending?.reference ?? stored?.reference;
  const token = t ?? pending?.token ?? stored?.token;
  const [phase, setPhase] = useState<Phase>('verifying');
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(false);
  const pollRef = useRef<() => void>(() => undefined);

  const poll = useCallback(async () => {
    if (!reference || !token || done.current) return;
    try {
      const o = await getOrderStatus({ ref: reference, token });
      if (o.paid) {
        done.current = true;
        clearCart();
        resetKey();
        setPending(undefined);
        hapticSuccess();
        setPhase('paid');
        return;
      }
      if (o.failed || o.status === 'payment_failed') {
        done.current = true;
        resetKey(); // nouvelle clé pour une nouvelle tentative
        setPhase('failed');
        return;
      }
      if (o.expired || o.status === 'payment_expired') {
        done.current = true;
        resetKey();
        setPhase('expired');
        return;
      }
    } catch {
      /* réseau : on retente */
    }
    attempts.current += 1;
    if (attempts.current >= POLL_MAX) {
      setPhase('slow');
      return;
    }
    timer.current = setTimeout(() => pollRef.current(), POLL_MS);
  }, [reference, token, clearCart, resetKey, setPending]);

  const restart = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    attempts.current = 0;
    done.current = false;
    setPhase('verifying');
    poll();
  }, [poll]);

  useEffect(() => {
    pollRef.current = poll;
    timer.current = setTimeout(() => pollRef.current(), 0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [poll]);

  // Retour au premier plan après le paiement : relire immédiatement.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && !done.current) restart();
    });
    return () => sub.remove();
  }, [restart]);

  const resume = () => {
    const url = pending?.checkoutUrl;
    if (!url) return;
    if (Platform.OS === 'web') Linking.openURL(url).catch(() => undefined);
    else WebBrowser.openAuthSessionAsync(url, 'novra://commande').catch(() => undefined);
    restart();
  };

  if (!reference || !token) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <T variant="h2" align="center">
            {fr.payment.pendingTitle}
          </T>
          <Button label={fr.payment.backToCart} onPress={() => router.replace('/panier')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }} accessibilityLiveRegion="polite">
        {phase === 'verifying' ? (
          <>
            <ActivityIndicator color={colors.white} size="large" />
            <T variant="h2" align="center">
              {fr.payment.verifyingTitle}
            </T>
            <T color={colors.white70} align="center">
              {fr.payment.verifying}
            </T>
          </>
        ) : null}

        {phase === 'paid' ? (
          <>
            <Icon name="check-circle" size={48} />
            <T variant="h1" align="center">
              {fr.payment.paidTitle}
            </T>
            <T color={colors.white70} align="center">
              {reference}
            </T>
            <Button label={fr.payment.follow} onPress={() => router.replace({ pathname: '/commande/[reference]', params: { reference } })} />
            <Button label={fr.cart.cta} variant="outline" onPress={() => router.replace('/shop')} />
          </>
        ) : null}

        {phase === 'slow' ? (
          <>
            <Icon name="clock" size={44} />
            <T variant="h2" align="center">
              {fr.payment.pendingTitle}
            </T>
            <T color={colors.white70} align="center">
              {fr.payment.pendingText}
            </T>
            <Button label={fr.payment.refresh} onPress={restart} />
            {pending?.checkoutUrl ? <Button label={fr.payment.resume} variant="outline" onPress={resume} /> : null}
            <Button label={fr.payment.follow} variant="outline" onPress={() => router.replace({ pathname: '/commande/[reference]', params: { reference } })} />
          </>
        ) : null}

        {phase === 'failed' || phase === 'expired' ? (
          <>
            <Icon name="x-circle" size={44} />
            <T variant="h2" align="center">
              {phase === 'failed' ? fr.payment.failedTitle : fr.payment.expiredTitle}
            </T>
            <T color={colors.white70} align="center">
              Votre panier est conservé.
            </T>
            <Button label={fr.payment.retry} onPress={() => router.replace('/checkout')} />
            <Button label={fr.payment.backToCart} variant="outline" onPress={() => router.replace('/panier')} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
