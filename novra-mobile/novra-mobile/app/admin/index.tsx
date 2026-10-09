import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Chip } from '@/components/Chip';
import { colors } from '@/theme';
import { useAdmin } from '@/stores/admin';
import { allowedViews, canEdit, ROLE_LABEL, type AdminView } from '@/api/admin';
import { Dashboard } from '@/admin/Dashboard';
import { Orders } from '@/admin/Orders';
import { Stocks } from '@/admin/Stocks';
import { Products } from '@/admin/Products';
import { fr } from '@/i18n/fr';

const LABELS: Record<AdminView, string> = { dashboard: fr.admin.dashboard, commandes: fr.admin.orders, stocks: fr.admin.stocks, produits: fr.admin.products };

export default function AdminScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { status, profile, message, signIn, signOut } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<AdminView>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const views = allowedViews(profile?.role);
  const activeView: AdminView = views.includes(view) ? view : (views[0] ?? 'dashboard');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/commandes'));

  if (status === 'loading') {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.white} />
        </View>
      </Screen>
    );
  }

  if (status === 'out' || !profile) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={back} style={styles.back}>
          <Icon name="arrow-left" />
        </Pressable>
        <T variant="h1" style={{ paddingTop: 8, paddingBottom: 24 }}>
          {fr.admin.title}
        </T>
        <View style={{ gap: 16 }}>
          <Field label={fr.admin.email} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" testID="admin-email" />
          <Field label={fr.admin.password} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="current-password" testID="admin-password" />
          {message ? (
            <T variant="small" color={colors.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
              {message}
            </T>
          ) : null}
          <Button
            label={fr.admin.signIn}
            loading={busy}
            disabled={!email.trim() || !password}
            onPress={async () => {
              setBusy(true);
              await signIn(email, password);
              setBusy(false);
              setPassword('');
            }}
            testID="admin-signin"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.white}
          onRefresh={async () => {
            setRefreshing(true);
            await qc.invalidateQueries({ queryKey: ['admin'] });
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={back} style={styles.back}>
          <Icon name="arrow-left" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fr.admin.signOut}
          onPress={async () => {
            await signOut();
            qc.removeQueries({ queryKey: ['admin'] });
          }}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <T variant="small" style={{ textDecorationLine: 'underline' }}>
            {fr.admin.signOut}
          </T>
        </Pressable>
      </View>
      <T variant="h1">{fr.admin.title}</T>
      <T variant="small" color={colors.white70} style={{ paddingBottom: 16 }}>
        {profile.full_name || profile.email} · {ROLE_LABEL[profile.role] ?? profile.role}
        {!canEdit(profile.role) ? ` · ${fr.admin.readOnly}` : ''}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 20 }}>
        {views.map((v) => (
          <Chip key={v} label={LABELS[v]} active={activeView === v} onPress={() => setView(v)} />
        ))}
      </View>
      {activeView === 'dashboard' ? <Dashboard /> : null}
      {activeView === 'commandes' ? <Orders /> : null}
      {activeView === 'stocks' ? <Stocks /> : null}
      {activeView === 'produits' ? <Products /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' } });
