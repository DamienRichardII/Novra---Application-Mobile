import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';

type Props = { width?: DimensionValue; height?: DimensionValue; aspectRatio?: number; style?: StyleProp<ViewStyle> };

/** Remplace les images pendant le chargement (jamais d'écran blanc). */
export function Skeleton({ width = '100%', height, aspectRatio, style }: Props) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, aspectRatio, backgroundColor: colors.grey[700] }, a, style]} />;
}
