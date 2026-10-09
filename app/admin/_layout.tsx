import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '@/stores/admin';
import { colors } from '@/theme';

const LOCK_MS = 5 * 60 * 1000; // verrouillage après 5 min d'inactivité (doc 10)

export default function AdminLayout() {
  const { status, init, signOut } = useAdmin();
  const qc = useQueryClient();
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const lock = async () => {
    await signOut('Session verrouillée après inactivité. Reconnectez-vous.');
    qc.removeQueries({ queryKey: ['admin'] }); // aucune donnée d'une session précédente ne survit
  };

  const arm = () => {
    last.current = Date.now();
    if (timer.current) clearTimeout(timer.current);
    if (useAdmin.getState().status === 'in') timer.current = setTimeout(lock, LOCK_MS);
  };

  useEffect(() => {
    arm();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && useAdmin.getState().status === 'in' && Date.now() - last.current > LOCK_MS) lock();
    });
    return () => {
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }} onTouchStart={arm} onStartShouldSetResponderCapture={() => { arm(); return false; }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black } }} />
    </View>
  );
}
