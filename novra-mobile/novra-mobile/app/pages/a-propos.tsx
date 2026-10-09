import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { MediaImage } from '@/components/MediaImage';
import { colors } from '@/theme';
import { mediaUrl } from '@/lib/media';
import { fr } from '@/i18n/fr';

export default function AboutScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
        <Icon name="arrow-left" />
      </Pressable>
      <T variant="h1" style={{ paddingTop: 8 }}>
        {fr.pages.aboutTitle}
      </T>
      <View style={{ aspectRatio: 4 / 5, marginVertical: 24 }}>
        <MediaImage uri={mediaUrl('assets/web/vitrine/4o8a0158.jpg')} alt="Athlète NOVRA en veste coupe-vent noire" style={StyleSheet.absoluteFill} />
      </View>
      <T color={colors.white70}>{fr.pages.aboutText}</T>
      <View style={{ gap: 18, paddingTop: 32 }}>
        {fr.pages.dna.map((d) => (
          <View key={d.title} style={{ gap: 4, borderTopWidth: 1, borderColor: colors.lineDark, paddingTop: 14 }}>
            <T variant="h2">{d.title}</T>
            <T color={colors.white70}>{d.text}</T>
          </View>
        ))}
      </View>
      <T variant="h1" style={{ paddingTop: 36 }}>
        {fr.pages.aboutClosing}
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({ back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' } });
