import { useMemo } from 'react';
import OptionSelector from '@/components/OptionSelector';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { MathLine, Metric, NumberField, ScreenHeader, Section, ShowMath } from '@/components/ui';
import DateField from '@/components/DateField';
import { calculateTimingScenario, monthsUntil } from '@/engine/timing';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { TimingResult } from '@/types/domain';
import { formatCurrency } from '@/utils/format';

export default function TimingScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const scenario = useScenarioStore((state) => state.scenario);
  const updateProfile = useScenarioStore((state) => state.updateProfile);
  const updateTiming = useScenarioStore((state) => state.updateTiming);
  const customMonths = monthsUntil(scenario.timing.customPurchaseDate);
  const options = useMemo(() => [
    calculateTimingScenario(scenario, 0, 'Buy now'),
    calculateTimingScenario(scenario, 3, 'Wait 3 months'),
    calculateTimingScenario(scenario, 6, 'Wait 6 months'),
    calculateTimingScenario(scenario, customMonths, 'Custom date'),
  ], [scenario, customMonths]);
  const wide = width >= 760;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <ScreenHeader eyebrow="Decision timing" title="Buy now or wait?" subtitle="Waiting is only useful when the added savings outweigh financing and transportation costs." />
        <OptionSelector />
        <View style={wide ? styles.wideLayout : styles.stack}>
          <View style={[styles.stack, wide && styles.controls]}>
            <Section title="Waiting assumptions" caption="Savings accumulate only from the amount you explicitly set here.">
              <NumberField label="Monthly car savings" value={scenario.profile.monthlyCarSavingsContribution} onChange={(monthlyCarSavingsContribution) => updateProfile({ monthlyCarSavingsContribution: monthlyCarSavingsContribution ?? 0 })} />
              <NumberField label="Monthly cost of waiting" value={scenario.timing.waitingMonthlyCosts} onChange={(waitingMonthlyCosts) => updateTiming({ waitingMonthlyCosts: waitingMonthlyCosts ?? 0 })} hint="Rideshare, rentals, repairs, or lost income" />
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Custom purchase date</Text>
                <DateField value={scenario.timing.customPurchaseDate} onChange={(customPurchaseDate) => updateTiming({ customPurchaseDate })} accessibilityLabel="Custom purchase date" />
              </View>
            </Section>
            <Section title="How timing is modeled">
              <Text style={[styles.body, { color: colors.textMuted }]}>The vehicle price, APR, and ownership costs stay constant. Your planned car savings increase the down payment, while the cost of waiting reduces cash remaining.</Text>
              <ShowMath>
                <MathLine>Added savings = monthly car savings × months waited</MathLine>
                <MathLine>Future down payment = current down payment + added savings</MathLine>
                <MathLine>Net benefit = interest saved − cost of waiting</MathLine>
              </ShowMath>
            </Section>
          </View>
          <View style={[styles.results, wide && styles.resultsWide]}>
            {options.map((option) => <TimingCard key={`${option.label}-${option.monthsWaiting}`} option={option} />)}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function TimingCard({ option }: { option: TimingResult }) {
  const { colors } = useAppTheme();
  const isNow = option.monthsWaiting === 0;
  const benefit = option.netDifferenceFromNow;
  return (
    <Section title={option.label} caption={isNow ? 'Baseline scenario' : `${option.monthsWaiting} months from now`}>
      <View style={styles.metricGrid}>
        <Metric label="Monthly payment" value={formatCurrency(option.result.loan.monthlyPayment)} />
        <Metric label="True monthly cost" value={formatCurrency(option.result.trueMonthlyCost)} />
        <Metric label="Down payment" value={formatCurrency(option.downPayment)} />
        <Metric label="Cash remaining" value={formatCurrency(option.result.cashRemaining)} tone={option.result.reserveGap >= 0 ? 'good' : 'warning'} />
      </View>
      {!isNow ? (
        <View style={[styles.net, { backgroundColor: benefit >= 0 ? colors.primarySoft : colors.warningSoft }]}>
          <Text style={{ color: benefit >= 0 ? colors.primary : colors.warning, fontWeight: '800' }}>{benefit >= 0 ? `${formatCurrency(benefit)} net benefit` : `${formatCurrency(Math.abs(benefit))} net cost`}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatCurrency(option.additionalSavings)} saved · {formatCurrency(option.waitingCost)} waiting cost</Text>
        </View>
      ) : null}
    </Section>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  stack: { gap: 12 },
  wideLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  controls: { flex: 0.75 },
  results: { gap: 12 },
  resultsWide: { flex: 1.25 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 21 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  net: { borderRadius: 6, padding: 12, gap: 3 },
});
