import { Image, type ImageProps } from 'expo-image';
import { type StyleProp, type ImageStyle } from 'react-native';
import { colors } from '@/theme';
import { focalPosition } from '@/lib/media';

type Props = Omit<ImageProps, 'source' | 'style'> & {
  uri?: string;
  alt?: string;
  focalX?: number;
  focalY?: number;
  style?: StyleProp<ImageStyle>;
};

/** Image avec cache disque, point focal mobile et fond de repli (jamais d'écran blanc). */
export function MediaImage({ uri, alt, focalX, focalY, style, contentFit = 'cover', ...rest }: Props) {
  return (
    <Image
      source={uri ? { uri } : undefined}
      contentFit={contentFit}
      contentPosition={focalPosition(focalX, focalY)}
      transition={250}
      cachePolicy="memory-disk"
      accessible={!!alt}
      accessibilityLabel={alt || undefined}
      style={[{ backgroundColor: colors.grey[700] }, style]}
      {...rest}
    />
  );
}
