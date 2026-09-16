import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';

export default function Index() {
  const { colors } = useAppTheme();
  const hasHydrated = useScenarioStore((state) => state.hasHydrated);
  const complete = useScenarioStore((state) => state.scenario.onboardingComplete);

  if (!hasHydrated) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  return <Redirect href={complete ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
