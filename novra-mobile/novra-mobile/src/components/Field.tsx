import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts } from '@/theme';
import { T } from './Text';

type Props = TextInputProps & { label: string; error?: string | null };

export const Field = forwardRef<TextInput, Props>(function Field({ label, error, style, ...rest }, ref) {
  return (
    <View style={{ gap: 6 }}>
      <T variant="eyebrow" color={colors.white70}>
        {label}
      </T>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.white45}
        selectionColor={colors.white}
        style={[styles.input, error ? { borderColor: colors.error } : null, style]}
        {...rest}
      />
      {error ? (
        <T variant="small" color={colors.error} accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.white15, paddingHorizontal: 14, color: colors.white, fontFamily: fonts.body, fontSize: 16, backgroundColor: colors.white08 },
});
