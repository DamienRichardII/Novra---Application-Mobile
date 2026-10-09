import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '@/theme';
import { T } from './Text';
import { hapticLight } from '@/lib/haptics';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline' | 'light';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

/** `solid` = blanc sur fond sombre (CTA principal), `outline` = filet, `light` = noir sur blanc. */
export function Button({ label, onPress, variant = 'solid', disabled, loading, block = true, style, accessibilityLabel, testID }: Props) {
  const solid = variant === 'solid' || variant === 'light';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        block && styles.block,
        solid ? styles.solid : styles.outline,
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? colors.black : colors.white} />
      ) : (
        <T style={{ fontFamily: fonts.bodySemi, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase' }} color={solid ? colors.black : colors.white}>
          {label}
        </T>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  block: { alignSelf: 'stretch' },
  solid: { backgroundColor: colors.white },
  outline: { borderWidth: 1, borderColor: colors.white45, backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
});
