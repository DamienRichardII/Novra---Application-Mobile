import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme';

type Props = { name: React.ComponentProps<typeof Feather>['name']; size?: number; color?: string };

export function Icon({ name, size = 22, color = colors.white }: Props) {
  return <Feather name={name} size={size} color={color} />;
}
