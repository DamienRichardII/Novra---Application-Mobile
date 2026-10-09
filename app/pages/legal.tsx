import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme';
import { config } from '@/lib/config';
import { fr } from '@/i18n/fr';

/** Les textes légaux restent sur le site : une seule source (doc 09). Ouverture dans le navigateur intégré. */
const DOCS = [
  { label: fr.pages.cgv, path: 'cgv.html' },
  { label: fr.pages.privacy, path: 'politique-confidentialite.html' },
  { label: fr.pages.mentions, path: 'mentions-legales.html' },
];

export default function LegalScreen() {
  const router = useRouter();
  const open = (path: string) => {
    const url = `${config.siteUrl}/${path}`;
    return Platform.OS === 'web' ? Linking.openURL(url) : WebBrowser.openBrowserAsync(url);
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
        <Icon name="arrow-left" />
      </Pressable>
      <T variant="h1" style={{ paddingTop: 8, paddingBottom: 12 }}>
        {fr.pages.legal}
      </T>
      <T color={colors.white70} style={{ paddingBottom: 20 }}>
        {fr.legalNotice}
      </T>
      <View>
        {DOCS.map((d) => (
          <Pressable key={d.path} accessibilityRole="link" accessibilityLabel={d.label} onPress={() => open(d.path)} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.lineDark }}>
            <T weight="semi">{d.label}</T>
            <Icon name="external-link" size={18} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' } });
