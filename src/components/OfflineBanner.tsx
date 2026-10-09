import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { Icon } from './Icon';
import { fr } from '@/i18n/fr';
import { useOffline } from '@/hooks/queries';

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="wifi-off" size={14} color={colors.black} />
      <T variant="small" weight="semi" color={colors.black} style={{ flex: 1 }}>
        {fr.common.offlineBanner}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({ bar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.grey[200], paddingHorizontal: 16, paddingVertical: 8 } });
