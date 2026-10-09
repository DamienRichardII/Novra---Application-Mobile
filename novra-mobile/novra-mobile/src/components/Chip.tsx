import { Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { hapticSelect } from '@/lib/haptics';

type Props = { label: string; active?: boolean; onPress?: () => void; disabled?: boolean };

/** Filtre : actif = fond blanc texte noir (inversé sur fond sombre). */
export function Chip({ label, active, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        hapticSelect();
        onPress?.();
      }}
      style={[styles.chip, active && styles.active, disabled && { opacity: 0.35 }]}
    >
      <T variant="small" weight="semi" color={active ? colors.black : colors.white}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: colors.white15, borderRadius: 999 },
  active: { backgroundColor: colors.white, borderColor: colors.white },
});
