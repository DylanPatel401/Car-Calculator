import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePersistenceStatus } from '@/store/persistence';
import { useScenarioStore } from '@/store/scenarioStore';
import { router, Tabs, Redirect } from 'expo-router';

import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const saveError = usePersistenceStatus(state => state.error);
  const demo = useScenarioStore(state => state.demoOriginal !== null);
  const hydrated = useScenarioStore(state => state.hasHydrated);
  const complete = useScenarioStore(state => state.workspace.onboardingComplete);
  if (hydrated && !complete) return <Redirect href="/welcome" />;
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      {saveError && <View accessibilityRole="alert" style={{ paddingHorizontal: 20, backgroundColor: colors.warningSoft, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text style={{ color: colors.warning, flex: 1 }}>Changes are on screen but could not be saved.</Text><Pressable accessibilityRole="button" onPress={() => useScenarioStore.getState().updateProfile({})} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.warning, fontWeight: '700' }}>Retry save</Text></Pressable></View>}
      {demo && <View style={{ paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.warningSoft, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text style={{ color: colors.warning, flex: 1, fontWeight: '600' }}>Sample plan / demo only</Text><Pressable accessibilityRole="button" onPress={() => { useScenarioStore.getState().exitDemo(); router.replace(useScenarioStore.getState().workspace.onboardingComplete ? '/(tabs)' : '/welcome'); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.warning, fontWeight: '700' }}>Exit demo</Text></Pressable></View>}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarStyle: { minHeight: 64, paddingTop: 6, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Calculator', tabBarIcon: ({ color }) => <AppIcon name="car.fill" color={color} /> }} />
      <Tabs.Screen name="timing" options={{ title: 'Timing', tabBarIcon: ({ color }) => <AppIcon name="calendar" color={color} /> }} />
      <Tabs.Screen name="compare" options={{ title: 'Compare', tabBarIcon: ({ color }) => <AppIcon name="square.grid.2x2" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <AppIcon name="person.crop.circle" color={color} /> }} />
    </Tabs>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
