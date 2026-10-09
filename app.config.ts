import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'NOVRA',
  slug: 'novra-mobile',
  scheme: 'novra',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0a0a0a',
  ios: {
    bundleIdentifier: 'paris.novra.app',
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'paris.novra.app',
    adaptiveIcon: {
      backgroundColor: '#0a0a0a',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { bundler: 'metro', output: 'single', favicon: './assets/favicon.png', name: 'NOVRA', shortName: 'NOVRA', themeColor: '#0a0a0a', backgroundColor: '#0a0a0a' },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-image',
    'expo-video',
    'expo-web-browser',
    'expo-secure-store',
    'expo-sharing',
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 140, backgroundColor: '#0a0a0a', resizeMode: 'contain' }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
