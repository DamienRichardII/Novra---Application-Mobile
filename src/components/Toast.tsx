import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { T } from './Text';
import { useToast } from '@/stores/toast';

export function Toast() {
  const { message, id, hide } = useToast();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2200);
    return () => clearTimeout(t);
  }, [message, id, hide]);
  if (!message) return null;
  return (
    <Animated.View key={id} entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(200)} style={[styles.toast, { bottom: insets.bottom + 92 }]} accessibilityLiveRegion="polite" accessibilityRole="alert" pointerEvents="none">
      <T variant="small" weight="semi" color={colors.black}>
        {message}
      </T>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: colors.white, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, zIndex: 50 },
});
