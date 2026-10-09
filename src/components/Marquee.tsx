import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';
import { T } from './Text';

type Props = { words: string[] };

/** Bande défilante infinie (décorative). Figée si « réduire les animations » est actif. */
export function Marquee({ words }: Props) {
  const [width, setWidth] = useState(0);
  const [reduce, setReduce] = useState(false);
  const x = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!width || reduce) return;
    x.value = 0;
    x.value = withRepeat(withTiming(-width, { duration: width * 28, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [width, reduce, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const row = (suffix: string) => (
    <View style={styles.row} key={suffix}>
      {words.map((w) => (
        <T key={w + suffix} variant="h1" color={colors.white} style={styles.word}>
          {w}
          <T variant="h1" color={colors.white45}>
            {'  /  '}
          </T>
        </T>
      ))}
    </View>
  );

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Nos points forts : ${words.join(', ')}`} importantForAccessibility="yes">
      <Animated.View style={[styles.track, style]}>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>{row('a')}</View>
        {row('b')}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', paddingVertical: 22, backgroundColor: colors.black, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.lineDark },
  track: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  word: { paddingRight: 4 },
});
