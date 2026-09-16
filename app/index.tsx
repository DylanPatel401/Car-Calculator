import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
export default function Index() {
  const hydrated = useScenarioStore(state => state.hasHydrated);
  const complete = useScenarioStore(state => state.workspace.onboardingComplete);
  const { colors } = useAppTheme();
  if (!hydrated) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  return <Redirect href={complete ? '/(tabs)' : '/welcome'} />;
}
