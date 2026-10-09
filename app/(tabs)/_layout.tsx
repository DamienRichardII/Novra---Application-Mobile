import { View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '@/theme';
import { fr } from '@/i18n/fr';
import { useCart } from '@/stores/cart';
import { cartCount } from '@/lib/cart';
import { T } from '@/components/Text';

type IconName = React.ComponentProps<typeof Feather>['name'];

function TabIcon({ name, color, badge }: { name: IconName; color: ColorValue; badge?: number }) {
  return (
    <View>
      <Feather name={name} size={22} color={color} />
      {badge ? (
        <View style={{ position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <T variant="small" weight="bold" color={colors.black} style={{ fontSize: 10, lineHeight: 12 }}>
            {badge > 99 ? '99+' : badge}
          </T>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const count = useCart((s) => cartCount(s.lines));
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.white45,
        tabBarStyle: { backgroundColor: colors.black, borderTopColor: colors.lineDark, borderTopWidth: 1, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 9, letterSpacing: 0, textTransform: 'uppercase', marginBottom: 6 },
        sceneStyle: { backgroundColor: colors.black },
      }}
    >
      <Tabs.Screen name="index" options={{ title: fr.tabs.home, tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />, tabBarAccessibilityLabel: 'Accueil' }} />
      <Tabs.Screen name="shop" options={{ title: fr.tabs.shop, tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} />, tabBarAccessibilityLabel: 'Shop' }} />
      <Tabs.Screen name="favoris" options={{ title: fr.tabs.favorites, tabBarIcon: ({ color }) => <TabIcon name="heart" color={color} />, tabBarAccessibilityLabel: 'Favoris' }} />
      <Tabs.Screen name="panier" options={{ title: fr.tabs.cart, tabBarIcon: ({ color }) => <TabIcon name="shopping-bag" color={color} badge={count} />, tabBarAccessibilityLabel: count ? `Panier, ${count} articles` : 'Ouvrir le panier' }} />
      <Tabs.Screen name="commandes" options={{ title: fr.tabs.orders, tabBarIcon: ({ color }) => <TabIcon name="package" color={color} />, tabBarAccessibilityLabel: 'Commandes' }} />
    </Tabs>
  );
}
