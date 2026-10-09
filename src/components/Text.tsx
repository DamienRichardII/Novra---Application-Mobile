import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, typeScale, type TypeVariant } from '@/theme';

type Props = TextProps & { variant?: TypeVariant; color?: string; weight?: 'medium' | 'semi' | 'bold'; align?: TextStyle['textAlign'] };

const weightFont = { medium: 'Inter_500Medium', semi: 'Inter_600SemiBold', bold: 'Inter_700Bold' } as const;

/** Texte thémé : titres Barlow Condensed en capitales, corps Inter. */
export function T({ variant = 'body', color = colors.white, weight, align, style, ...rest }: Props) {
  const base = typeScale[variant] as TextStyle;
  return (
    <RNText
      {...rest}
      accessibilityRole={rest.accessibilityRole ?? (variant === 'display' || variant === 'h1' || variant === 'h2' ? 'header' : undefined)}
      style={[base, { color }, weight && variant !== 'display' && !variant.startsWith('h') ? { fontFamily: weightFont[weight] } : null, align ? { textAlign: align } : null, style]}
    />
  );
}
