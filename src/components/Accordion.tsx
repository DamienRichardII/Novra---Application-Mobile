import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { T } from './Text';
import { Icon } from './Icon';

type Props = { title: string; children: React.ReactNode; defaultOpen?: boolean };

export function Accordion({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={title} onPress={() => setOpen((o) => !o)} style={styles.head}>
        <T variant="h3">{title}</T>
        <Icon name={open ? 'minus' : 'plus'} size={20} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderColor: colors.lineDark },
  head: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  body: { paddingBottom: 18, gap: 8 },
});
