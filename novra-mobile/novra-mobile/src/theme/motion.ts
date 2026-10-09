import { Easing } from 'react-native-reanimated';

export const motion = {
  ease: [0.22, 0.61, 0.36, 1] as const,
  easeOut: [0.16, 1, 0.3, 1] as const,
  fast: 200,
  base: 350,
  slow: 700,
};

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
