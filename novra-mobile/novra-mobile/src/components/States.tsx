import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { Button } from './Button';
import { Icon } from './Icon';

type Props = { title: string; hint?: string; action?: { label: string; onPress: () => void }; icon?: React.ComponentProps<typeof Icon>['name'] };

export function EmptyState({ title, hint, action, icon = 'inbox' }: Props) {
  return (
    <View style={styles.wrap}>
      <Icon name={icon} size={32} color={colors.white45} />
      <T variant="h2" align="center">
        {title}
      </T>
      {hint ? (
        <T color={colors.white70} align="center">
          {hint}
        </T>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} block={false} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export function ErrorState({ title, onRetry }: { title: string; onRetry?: () => void }) {
  return <EmptyState icon="alert-circle" title={title} action={onRetry ? { label: 'Réessayer', onPress: onRetry } : undefined} />;
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, paddingTop: 64 } });
