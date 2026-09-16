import { Tabs } from 'expo-router';

import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Calculator', tabBarIcon: ({ color }) => <AppIcon name="car.fill" color={color} /> }} />
      <Tabs.Screen name="timing" options={{ title: 'Timing', tabBarIcon: ({ color }) => <AppIcon name="calendar" color={color} /> }} />
      <Tabs.Screen name="compare" options={{ title: 'Compare', tabBarIcon: ({ color }) => <AppIcon name="square.grid.2x2" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <AppIcon name="person.crop.circle" color={color} /> }} />
    </Tabs>
  );
}
