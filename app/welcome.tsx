import { Redirect, router } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { AppIcon, Button, Section } from '@/components/ui';

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  const hydrated = useScenarioStore(state => state.hasHydrated);
  const complete = useScenarioStore(state => state.scenario.onboardingComplete);
  if (!hydrated) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  if (complete) return <Redirect href="/(tabs)" />;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
    <View style={{ width: '100%', maxWidth: 580, alignSelf: 'center', gap: 24 }}>
      <View style={{ backgroundColor: colors.primarySoft, width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="car.fill" size={30} color={colors.primary} /></View>
      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>CAR CALCULATOR</Text>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 46, lineHeight: 52, fontWeight: '700', letterSpacing: -1.5 }}>A clearer road to your next car.</Text>
      <Text style={{ color: colors.textMuted, fontSize: 18, lineHeight: 28 }}>Look beyond the payment. Understand the real cost, protect your savings, and explore your options.</Text>
      <Section title="Your decision. Your numbers."><Text style={{ color: colors.textMuted, lineHeight: 24 }}>01  See the full monthly cost
02  Check your cash flow and reserve
03  Compare cars, terms, and timing</Text></Section>
      <Button label="Create my plan" onPress={() => router.push('/onboarding')} />
      <Button label="Explore a demo" variant="secondary" onPress={() => { useScenarioStore.getState().startDemo(); router.replace('/(tabs)'); }} />
      <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>Private by default. No account. Saved on your device.</Text>
    </View>
  </ScrollView></SafeAreaView>;
}
