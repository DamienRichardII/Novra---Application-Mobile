import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { hapticSelect } from '@/lib/haptics';

type Props = { sizes: string[]; selected?: string | null; isAvailable: (size: string) => boolean; onSelect: (size: string) => void };

/** Grille 4 colonnes ; taille indisponible = barrée et désactivée (jamais cachée). */
export function SizeGrid({ sizes, selected, isAvailable, onSelect }: Props) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {sizes.map((s) => {
        const ok = isAvailable(s);
        const active = selected === s;
        return (
          <Pressable
            key={s}
            disabled={!ok}
            accessibilityRole="radio"
            accessibilityLabel={ok ? `Taille ${s}` : `Taille ${s}, indisponible`}
            accessibilityState={{ selected: active, disabled: !ok }}
            onPress={() => {
              hapticSelect();
              onSelect(s);
            }}
            style={[styles.cell, active && styles.active, !ok && styles.off]}
          >
            <T weight="semi" color={active ? colors.black : ok ? colors.white : colors.white45} style={!ok ? { textDecorationLine: 'line-through' } : undefined}>
              {s}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '23.5%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.white15 },
  active: { backgroundColor: colors.white, borderColor: colors.white },
  off: { opacity: 0.55 },
});
