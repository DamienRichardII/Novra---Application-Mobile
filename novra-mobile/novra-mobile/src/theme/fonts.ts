export const fonts = {
  display: 'BarlowCondensed_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const typeScale = {
  display: { fontFamily: fonts.display, fontSize: 56, lineHeight: 52, textTransform: 'uppercase', letterSpacing: -0.56 },
  h1: { fontFamily: fonts.display, fontSize: 40, lineHeight: 38, textTransform: 'uppercase', letterSpacing: -0.4 },
  h2: { fontFamily: fonts.display, fontSize: 28, lineHeight: 27, textTransform: 'uppercase', letterSpacing: -0.28 },
  h3: { fontFamily: fonts.display, fontSize: 20, lineHeight: 20, textTransform: 'uppercase', letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 1.32 },
} as const;

export type TypeVariant = keyof typeof typeScale;
