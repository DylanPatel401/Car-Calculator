import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import OptionSelector from '@/components/OptionSelector';
import { Difference, ResultStatus } from '@/components/insights';
import { MathLine, Metric, NumberField, ScreenHeader, Section, Segmented, ShowMath } from '@/components/ui';
import DateField from '@/components/DateField';
import { calculateTimingScenario, monthsUntil } from '@/engine/timing';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { formatCurrency } from '@/utils/format';

export default function TimingScreen() {
  const { width, fontScale } = useWindowDimensions();
  const { colors } = useAppTheme();
  const scenario = useScenarioStore(state => state.scenario);
  const activeId = useScenarioStore(state => state.workspace.activeOptionId);
  const updateProfile = useScenarioStore(state => state.updateProfile);
  const updateTiming = useScenarioStore(state => state.updateTiming);
  const [selected, setSelected] = useState('3');
  const customMonths = monthsUntil(scenario.timing.customPurchaseDate);
  const options = useMemo(() => [calculateTimingScenario(scenario, 0, 'Buy now'), calculateTimingScenario(scenario, 3, 'In 3 months'), calculateTimingScenario(scenario, 6, 'In 6 months'), calculateTimingScenario(scenario, customMonths, 'Custom date')], [scenario, customMonths]);
  const option = options[selected === 'now' ? 0 : selected === '3' ? 1 : selected === '6' ? 2 : 3]!;
  const baseline = options[0]!;
  const complete = option.result.complete && baseline.result.complete;
  const benefit = complete ? option.netDifferenceFromNow : null;
  const chartMaximum = Math.max(1, ...options.map(o => o.result.loan.monthlyPayment ?? 0));
  const wide = width >= 760 && fontScale < 1.6;
  return <ScrollView style={{ backgroundColor: colors.background }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    <View style={styles.shell}>
      <ScreenHeader eyebrow="Find your moment" title="Now, or a little later?" subtitle="See what more time changes, and what waiting costs." />
      <OptionSelector />
      <Segmented label="Purchase timing" value={selected} onChange={setSelected} options={[{ label: 'Now', value: 'now' }, { label: '3 months', value: '3' }, { label: '6 months', value: '6' }, { label: 'Custom', value: 'custom' }]} />
      <View style={wide ? styles.columns : styles.stack}>
        <View style={[styles.stack, wide && styles.column]}>
          <Section title={option.label} caption={`${option.monthsWaiting} months from now`}>
            <ResultStatus result={option.result} />
            {option.result.warnings.map(w => <Text key={w} style={{ color: colors.warning, lineHeight: 21 }}>{w}</Text>)}
            <Text style={{ color: colors.text, fontSize: 34, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{option.monthsWaiting === 0 ? 'Your starting point' : benefit === null ? 'Complete your inputs' : Math.abs(benefit) < 0.005 ? 'No net difference' : `${formatCurrency(Math.abs(benefit))} ${benefit > 0 ? 'net benefit' : 'net cost'}`}</Text>
            <Text style={{ color: colors.textMuted, lineHeight: 21 }}>Interest saved minus the cost of waiting. This is a financing comparison, not a forecast of vehicle value.</Text>
            <View style={styles.metrics}><Metric label="Monthly payment" value={formatCurrency(complete ? option.result.loan.monthlyPayment : null)} /><Metric label="Funded down payment" value={formatCurrency(complete ? option.downPayment : null)} /></View>
            <Difference label="Monthly cost vs now" current={complete ? option.result.trueMonthlyCost : null} baseline={baseline.result.trueMonthlyCost} />
            <Difference label="Total interest vs now" current={complete ? option.result.loan.totalInterest : null} baseline={baseline.result.loan.totalInterest} />
            <Difference label="Cash remaining vs now" current={complete ? option.result.cashRemaining : null} baseline={baseline.result.cashRemaining} />
            <Difference label="Emergency reserve vs now" current={complete ? option.result.emergencyCashRemaining : null} baseline={baseline.result.emergencyCashRemaining} />
            <Text style={{ color: colors.textMuted }}>{formatCurrency(option.additionalSavings)} added savings / {formatCurrency(option.waitingCost)} waiting costs</Text>
          </Section>
          <Section title="A little time, a different payment" caption="Estimated monthly loan payment at each purchase date.">
            {options.map(o => <View key={o.label} style={{ gap: 8 }}>
              <View style={styles.line}><Text style={{ color: colors.textMuted, flex: 1 }}>{o.label}</Text><Text style={{ color: colors.text, fontWeight: '600' }}>{formatCurrency(o.result.complete ? o.result.loan.monthlyPayment : null)}</Text></View>
              {o.result.complete && o.result.loan.monthlyPayment !== null && <View accessible={false} style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted }}><View style={{ height: 8, borderRadius: 4, backgroundColor: o === option ? colors.primary : colors.tabInactive, width: `${o.result.loan.monthlyPayment / chartMaximum * 100}%` }} /></View>}
            </View>)}
          </Section>
        </View>
        <View key={activeId} style={[styles.stack, wide && styles.column]}>
          <Section title="Your waiting plan" caption="Monthly savings are shared across options. Waiting costs and the custom date belong to this option.">
            <NumberField label="Monthly car savings" value={scenario.profile.monthlyCarSavingsContribution} onChange={monthlyCarSavingsContribution => updateProfile({ monthlyCarSavingsContribution: monthlyCarSavingsContribution! })} />
            <NumberField label="Monthly cost of waiting" value={scenario.timing.waitingMonthlyCosts} onChange={waitingMonthlyCosts => updateTiming({ waitingMonthlyCosts: waitingMonthlyCosts! })} hint="Transportation, repairs or other costs while waiting" />
            <Text style={{ color: colors.text, fontWeight: '600' }}>Custom purchase date</Text>
            <DateField value={scenario.timing.customPurchaseDate} onChange={customPurchaseDate => { updateTiming({ customPurchaseDate }); setSelected('custom'); }} accessibilityLabel="Custom purchase date" />
          </Section>
          <Section title="What stays the same">
            <Text style={{ color: colors.textMuted, lineHeight: 22 }}>Vehicle price, APR and ownership costs stay constant. Planned savings add to the down payment; waiting costs reduce the cash available. Debt projections use your current balances.</Text>
            <ShowMath><MathLine>Added savings = monthly car savings x months waited.</MathLine><MathLine>Future down payment = requested down payment + added savings, capped by available funds and purchase balance.</MathLine><MathLine>Net benefit = interest saved - waiting costs.</MathLine></ShowMath>
          </Section>
        </View>
      </View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({ page: { padding: 20, paddingTop: 28, paddingBottom: 40 }, shell: { width: '100%', maxWidth: 1180, alignSelf: 'center', gap: 20 }, stack: { gap: 16 }, columns: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' }, column: { flex: 1 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, line: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' } });
