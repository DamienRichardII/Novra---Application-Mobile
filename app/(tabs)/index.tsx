import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, FlatList, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, SCREEN_PADDING } from '@/theme';
import { T } from '@/components/Text';
import { Icon } from '@/components/Icon';
import { MediaImage } from '@/components/MediaImage';
import { Marquee } from '@/components/Marquee';
import { Button } from '@/components/Button';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useHome } from '@/hooks/queries';
import { ctaToRoute, type CmsSection } from '@/api/cms';
import { HERO_VIDEO_PATH, HERO_VIDEO_RATIO, config } from '@/lib/config';
import { mediaUrl } from '@/lib/media';
import { fr } from '@/i18n/fr';

const CATEGORY_BY_LABEL: Record<string, { key: string; label: string }> = {
  't-shirts': { key: 't-shirts', label: 'T-shirts' },
  polos: { key: 'polos', label: 'Polos' },
  ensembles: { key: 'ensembles', label: 'Ensembles' },
  pantalons: { key: 'pantalons', label: 'Pantalons' },
  vestes: { key: 'vestes', label: 'Vestes & Hoodie' },
  accessoires: { key: 'accessoires', label: 'Accessoires' },
};

function Hero({ section }: { section: CmsSection }) {
  const [reduce, setReduce] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => undefined);
  }, []);
  const media = section.media[0];
  const poster = media?.poster ?? media?.uri;
  const player = useVideoPlayer(mediaUrl(HERO_VIDEO_PATH) ?? null, (p) => {
    p.loop = true;
    p.muted = true;
  });
  // Sur le web, play() n'agit que sur une vidéo déjà montée : on lance donc la lecture après le montage,
  // et à nouveau dès que le flux est prêt. « Réduire les animations » : pas de lecture auto (bouton Lire).
  useEffect(() => {
    if (reduce) player.pause();
    else player.play();
  }, [player, reduce]);
  useEffect(() => {
    const s1 = player.addListener('statusChange', ({ status }) => {
      setReady(status === 'readyToPlay');
      if (status === 'readyToPlay' && !reduce) player.play();
    });
    const s2 = player.addListener('playingChange', ({ isPlaying }) => setPlaying(isPlaying));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [player, reduce]);
  return (
    <View style={{ aspectRatio: HERO_VIDEO_RATIO, backgroundColor: colors.black }} accessible accessibilityLabel={media?.alt || 'Film de marque NOVRA'}>
      <MediaImage uri={poster} focalX={media?.focalX} focalY={media?.focalY} style={[StyleSheet.absoluteFill, { backgroundColor: colors.black }]} />
      <VideoView player={player} nativeControls={false} contentFit="cover" playsInline style={[StyleSheet.absoluteFill, { opacity: ready ? 1 : 0 }]} allowsPictureInPicture={false} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black40 }]} pointerEvents="none" />
      <Pressable
        onPress={() => (playing ? player.pause() : player.play())}
        accessibilityRole="button"
        accessibilityLabel={playing ? fr.home.pauseVideo : fr.home.playVideo}
        hitSlop={8}
        style={{ position: 'absolute', right: 12, bottom: 12, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black40 }}
      >
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </Pressable>
    </View>
  );
}

function Editorial({ section, children, dark = false }: { section: CmsSection; children?: React.ReactNode; dark?: boolean }) {
  const m = section.media[0];
  return (
    <View style={{ backgroundColor: dark ? colors.blackSoft : colors.black }}>
      {m?.uri ? (
        <View style={{ aspectRatio: 4 / 5 }}>
          <MediaImage uri={m.uri} alt={m.alt} focalX={m.focalX} focalY={m.focalY} style={StyleSheet.absoluteFill} />
        </View>
      ) : null}
      <View style={{ padding: SCREEN_PADDING, paddingVertical: 36, gap: 14 }}>{children}</View>
    </View>
  );
}

function Collections({ section }: { section: CmsSection }) {
  const router = useRouter();
  const links = [
    { label: fr.home.collections[0], href: '/shop?gender=homme' },
    { label: fr.home.collections[1], href: '/shop?gender=femme' },
    { label: fr.home.collections[2], href: '/shop?cat=accessoires' },
  ] as const;
  return (
    <View style={{ gap: 2 }}>
      {section.media.slice(0, 3).map((m, i) => (
        <Pressable key={i} accessibilityRole="link" accessibilityLabel={`${links[i].label}, découvrir`} onPress={() => router.push(links[i].href)} style={{ aspectRatio: 3 / 4 }}>
          <MediaImage uri={m.uri} alt={m.alt} focalX={m.focalX} focalY={m.focalY} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black40 }]} pointerEvents="none" />
          <View style={{ position: 'absolute', left: SCREEN_PADDING, bottom: 24, gap: 6 }}>
            <T variant="h1">{links[i].label}</T>
            <T variant="eyebrow" style={{ textDecorationLine: 'underline' }}>
              Découvrir
            </T>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function Categories({ section }: { section: CmsSection }) {
  const router = useRouter();
  const tiles = section.media
    .map((m) => ({ m, cat: CATEGORY_BY_LABEL[m.alt.trim().toLowerCase()] }))
    .filter((t) => t.cat);
  return (
    <View style={{ paddingVertical: 36, paddingHorizontal: SCREEN_PADDING, gap: 20 }}>
      <View style={{ gap: 6 }}>
        <T variant="eyebrow" color={colors.white70}>
          {section.eyebrow ?? fr.home.categoriesEyebrow}
        </T>
        <T variant="h1">{section.title ?? fr.home.categoriesTitle}</T>
      </View>
      <View style={styles.catGrid}>
        {tiles.map(({ m, cat }) => (
          <Pressable key={cat.key} accessibilityRole="link" accessibilityLabel={cat.label} onPress={() => router.push(`/shop?cat=${cat.key}`)} style={styles.catTile}>
            <MediaImage uri={m.uri} focalX={m.focalX} focalY={m.focalY} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black40 }]} pointerEvents="none" />
            <T variant="h3" style={{ position: 'absolute', left: 12, bottom: 12, right: 12 }}>
              {cat.label}
            </T>
          </Pressable>
        ))}
      </View>
      <Button label={fr.common.seeAll} variant="outline" onPress={() => router.push('/shop')} />
    </View>
  );
}

function Community({ section }: { section: CmsSection }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, 720) * 0.72;
  return (
    <View style={{ backgroundColor: colors.blackSoft, paddingVertical: 36 }}>
      <FlatList
        horizontal
        data={section.media}
        keyExtractor={(m, i) => `${m.uri}-${i}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, gap: 10 }}
        snapToInterval={w + 10}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={{ width: w, aspectRatio: 4 / 5 }}>
            <MediaImage uri={item.uri} alt={item.alt} focalX={item.focalX} focalY={item.focalY} style={StyleSheet.absoluteFill} />
          </View>
        )}
        accessibilityLabel={fr.home.community}
      />
      {section.cta ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Instagram ${config.instagramHandle}`}
          onPress={() => WebBrowser.openBrowserAsync(section.cta!.url).catch(() => Linking.openURL(section.cta!.url))}
          style={{ paddingHorizontal: SCREEN_PADDING, paddingTop: 20 }}
        >
          <T variant="eyebrow" style={{ textDecorationLine: 'underline' }}>
            @{config.instagramHandle}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Rend les sections reçues du CMS ; un `section_type` / `section_key` inconnu est ignoré sans casser l'écran (doc 09). */
function renderSection(s: CmsSection, router: ReturnType<typeof useRouter>) {
  switch (s.key) {
    case 'hero':
      return <Hero key={s.key} section={s} />;
    case 'marque':
      return (
        <View key={s.key}>
          <Editorial section={s}>
            <T variant="display" style={{ fontSize: 44, lineHeight: 42 }} color={colors.white70}>
              {fr.home.slogan}
            </T>
            <T variant="h1">{s.title ?? fr.home.brand}</T>
          </Editorial>
          <Marquee words={fr.home.marquee} />
        </View>
      );
    case 'collections':
      return <Collections key={s.key} section={s} />;
    case 'categories':
      return <Categories key={s.key} section={s} />;
    case 'mission':
      return (
        <Editorial key={s.key} section={s} dark>
          <T variant="h1">{s.title ?? fr.home.mission}</T>
          <View style={styles.stats}>
            {fr.home.stats.map((st) => (
              <View key={st.label} style={styles.stat}>
                <T variant="h2">{st.value}</T>
                <T variant="small" color={colors.white70}>
                  {st.label}
                </T>
              </View>
            ))}
          </View>
        </Editorial>
      );
    case 'communaute':
      return <Community key={s.key} section={s} />;
    default:
      if (s.type === 'editorial' && s.title) {
        return (
          <Editorial key={s.key} section={s}>
            {s.eyebrow ? <T variant="eyebrow" color={colors.white70}>{s.eyebrow}</T> : null}
            <T variant="h1">{s.title}</T>
            {s.description ? <T color={colors.white70}>{s.description}</T> : null}
            {s.cta ? (
              <Button
                label={s.cta.label}
                variant="outline"
                onPress={() => {
                  const r = ctaToRoute(s.cta!.url);
                  if (r.kind === 'external' || s.cta!.blank) WebBrowser.openBrowserAsync(r.href).catch(() => undefined);
                  else router.push(r.href as never);
                }}
              />
            ) : null}
          </Editorial>
        );
      }
      return null;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useHome();
  const sections = useMemo(() => data?.sections ?? [], [data]);
  const body = useMemo(() => sections.map((s) => renderSection(s, router)), [sections, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.white} />}
      >
        <View style={styles.frame}>
          {isLoading ? <Skeleton height={560} /> : body}
          <View style={{ padding: SCREEN_PADDING, paddingTop: 28, gap: 14 }}>
            <Pressable accessibilityRole="link" onPress={() => router.push('/pages/a-propos')} style={styles.link}>
              <T weight="semi">{fr.pages.about}</T>
              <Icon name="chevron-right" size={18} />
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push('/pages/contact')} style={styles.link}>
              <T weight="semi">{fr.pages.contact}</T>
              <Icon name="chevron-right" size={18} />
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push('/pages/legal')} style={styles.link}>
              <T weight="semi">{fr.pages.legal}</T>
              <Icon name="chevron-right" size={18} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <OfflineBanner />
        <View style={styles.topRow} pointerEvents="box-none">
          <MediaLogo />
          <Pressable accessibilityRole="button" accessibilityLabel={fr.shop.searchA11y} hitSlop={8} onPress={() => router.push('/shop?focus=1')} style={styles.search}>
            <Icon name="search" size={20} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function MediaLogo() {
  return <Image source={require('../../assets/brand/novra-wordmark.png')} accessibilityLabel="NOVRA" style={{ width: 118, height: 17 }} contentFit="contain" />;
}

const styles = StyleSheet.create({
  frame: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SCREEN_PADDING, paddingVertical: 6, maxWidth: 720, width: '100%', alignSelf: 'center' },
  search: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black40, marginRight: -8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catTile: { width: '48.8%', aspectRatio: 3 / 4, overflow: 'hidden' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 8 },
  stat: { width: '45%', gap: 2 },
  link: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.lineDark },
});
