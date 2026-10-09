import { ScrollView, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, SCREEN_PADDING } from '@/theme';
import { OfflineBanner } from './OfflineBanner';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
};

/** Fond noir, zones de sécurité respectées, contenu centré sur grands écrans (web/tablette). */
export function Screen({ children, scroll = true, padded = true, edges = ['top'], refreshControl, contentStyle, footer }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <View style={styles.frame}>
        <OfflineBanner />
        {scroll ? (
          <ScrollView
            contentContainerStyle={[padded && styles.padded, { paddingBottom: 32 }, contentStyle]}
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
        )}
        {footer}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  frame: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  padded: { paddingHorizontal: SCREEN_PADDING },
});
