import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { fr } from '@/i18n/fr';
import type { Fulfilment, OrderStatusResponse } from '@/types';

const FLOW: Record<Fulfilment, string[]> = {
  delivery: ['paid', 'preparing', 'shipped', 'delivered'],
  relay: ['paid', 'preparing', 'shipped', 'delivered'],
  pickup: ['paid', 'preparing', 'ready_for_pickup', 'picked_up'],
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : undefined;

const dateFor = (o: OrderStatusResponse, step: string): string | undefined => {
  const ev = o.events?.find((e) => (e.status ?? e.type) === step)?.created_at;
  if (ev) return fmt(ev);
  const map: Record<string, string | null | undefined> = {
    paid: o.paid_at,
    shipped: o.shipped_at,
    ready_for_pickup: o.ready_at,
    delivered: o.completed_at,
    picked_up: o.completed_at,
  };
  return fmt(map[step]);
};

/** Frise verticale selon `fulfilment` (OV_STEPS du site). États spéciaux : annulée / échec / expirée. */
export function Timeline({ order }: { order: OrderStatusResponse }) {
  if (order.status === 'cancelled' || order.status === 'payment_failed' || order.status === 'payment_expired') {
    return (
      <View style={styles.special}>
        <T variant="h3">{fr.status[order.status]}</T>
        <T color={colors.white70} variant="small">
          {fmt(order.payment_failed_at ?? order.payment_expired_at ?? order.created_at)}
        </T>
      </View>
    );
  }
  const steps = FLOW[order.fulfilment] ?? FLOW.delivery;
  const current = order.status === 'pending' ? -1 : steps.indexOf(order.status);
  return (
    <View accessibilityRole="list">
      {steps.map((s, i) => {
        const done = i <= current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <View key={s} style={styles.row} accessible accessibilityLabel={`${fr.status[s]}${done ? ', fait' : ', à venir'}`}>
            <View style={styles.rail}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]} />
              {!last ? <View style={[styles.line, i < current && styles.lineDone]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 22 }}>
              <T weight={active ? 'semi' : undefined} color={done ? colors.white : colors.white45}>
                {fr.status[s]}
              </T>
              {done ? (
                <T variant="small" color={colors.white70}>
                  {dateFor(order, s)}
                </T>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.white45, marginTop: 4 },
  dotDone: { backgroundColor: colors.white, borderColor: colors.white },
  dotActive: { shadowColor: colors.white, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  line: { flex: 1, width: 1.5, backgroundColor: colors.white15, marginTop: 2 },
  lineDone: { backgroundColor: colors.white },
  special: { borderWidth: 1, borderColor: colors.white45, padding: 16, gap: 4 },
});
