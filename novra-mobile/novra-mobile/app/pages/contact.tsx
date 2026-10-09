import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { colors } from '@/theme';
import { config } from '@/lib/config';
import { useStoreSettings } from '@/hooks/queries';
import { fr } from '@/i18n/fr';

/**
 * Contact : les formulaires du site n'enregistrent rien aujourd'hui (doc 09/12) → l'app propose uniquement
 * l'e-mail et Instagram, via Linking. Aucun formulaire factice.
 */
export default function ContactScreen() {
  const router = useRouter();
  const { data: store } = useStoreSettings();
  const open = (url: string) => (Platform.OS === 'web' ? Linking.openURL(url) : url.startsWith('mailto:') ? Linking.openURL(url) : WebBrowser.openBrowserAsync(url));
  return (
    <Screen edges={['top', 'bottom']}>
      <Pressable accessibilityRole="button" accessibilityLabel={fr.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
        <Icon name="arrow-left" />
      </Pressable>
      <T variant="h1" style={{ paddingTop: 8, paddingBottom: 12 }}>
        {fr.pages.contact}
      </T>
      <T color={colors.white70}>{fr.pages.contactHint}</T>
      <View style={{ gap: 12, paddingVertical: 24 }}>
        <Button label={`${fr.pages.mail} — ${config.contactEmail}`} onPress={() => open(`mailto:${config.contactEmail}`)} />
        <Button label={`${fr.pages.instagram} @${config.instagramHandle}`} variant="outline" onPress={() => open(`https://www.instagram.com/${config.instagramHandle}/`)} />
      </View>
      {store?.address ? (
        <View style={{ gap: 6, borderTopWidth: 1, borderColor: colors.lineDark, paddingTop: 20 }}>
          <T variant="h3">{fr.pages.store}</T>
          <T>
            {store.address}, {store.zip} {store.city}
          </T>
          {store.hours?.length ? (
            <View style={{ paddingTop: 10, gap: 2 }}>
              <T variant="eyebrow" color={colors.white70}>
                {fr.pages.hours}
              </T>
              {store.hours.map((h) => (
                <T key={h.day} variant="small" color={colors.white70}>
                  {h.day} — {h.hours}
                </T>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' } });
