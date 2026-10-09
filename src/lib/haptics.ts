import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try {
    Promise.resolve(fn()).catch(() => undefined);
  } catch {
    /* retour haptique indisponible : sans effet sur le parcours */
  }
};

export const hapticLight = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const hapticSelect = () => run(() => Haptics.selectionAsync());
export const hapticSuccess = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticError = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
