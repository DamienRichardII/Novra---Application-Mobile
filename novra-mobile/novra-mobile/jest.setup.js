process.env.EXPO_PUBLIC_MEDIA_BASE = 'https://novra.paris/';
process.env.EXPO_PUBLIC_SITE_URL = 'https://novra.paris';
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: () => () => undefined,
  fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
}));
