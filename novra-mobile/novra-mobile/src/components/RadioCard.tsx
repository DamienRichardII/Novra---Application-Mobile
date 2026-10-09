import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { hapticSelect } from '@/lib/haptics';

type Props = { title: string; subtitle?: string; price?: string; selected: boolean; onPress: () => void };

export function RadioCard({ title, subtitle, price, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}${price ? `, ${price}` : ''}`}
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      style={[styles.card, selected && styles.sel]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
      <View style={{ flex: 1 }}>
        <T weight="semi">{title}</T>
        {subtitle ? (
          <T variant="small" color={colors.white70}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {price ? <T weight="semi">{price}</T> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, padding: 16, borderWidth: 1, borderColor: colors.white15 },
  sel: { borderColor: colors.white, backgroundColor: colors.white08 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.white45, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.white },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white },
});
