export { colors } from './colors';
export { fonts, typeScale } from './fonts';
export type { TypeVariant } from './fonts';
export { motion, easeOut } from './motion';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, huge: 40 } as const;
/** Marge d'écran (doc 02). */
export const SCREEN_PADDING = 20;
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
