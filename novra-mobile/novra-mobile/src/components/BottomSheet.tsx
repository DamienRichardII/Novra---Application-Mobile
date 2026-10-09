import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { T } from './Text';
import { Icon } from './Icon';

type Props = { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; footer?: React.ReactNode };

export function BottomSheet({ visible, onClose, title, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <T variant="h3">{title ?? ''}</T>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10} style={styles.close}>
              <Icon name="x" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.black70 },
  sheet: { backgroundColor: colors.blackSoft, borderTopLeftRadius: 14, borderTopRightRadius: 14, maxHeight: '88%', width: '100%', maxWidth: 640, alignSelf: 'center', borderTopWidth: 1, borderColor: colors.lineDark },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.white15, marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  body: { paddingHorizontal: 20, paddingVertical: 12, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});
