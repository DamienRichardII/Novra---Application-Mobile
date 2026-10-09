import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { colorSwatch } from '@/api/catalogue';
import { hapticSelect } from '@/lib/haptics';

type Props = { name: string; size?: number; active?: boolean; onPress?: () => void };

/** Pastille de couleur ; actif = anneau. Zone tactile ≥ 44 px quand interactive. */
export function ColorDot({ name, size = 22, active, onPress }: Props) {
  const dot = (
    <View style={[styles.ring, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 }, active && { borderColor: colors.white }]}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colorSwatch(name), borderWidth: 1, borderColor: colors.white15 }} />
    </View>
  );
  if (!onPress) return <View accessibilityLabel={name}>{dot}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Coloris ${name}`}
      accessibilityState={{ selected: !!active }}
      hitSlop={6}
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      style={styles.hit}
    >
      {dot}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  hit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
