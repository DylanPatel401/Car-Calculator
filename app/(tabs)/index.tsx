import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import OptionSelector from '@/components/OptionSelector';
import { Button, Field, Metric, NumberField, ScreenHeader, Section, Segmented } from '@/components/ui';
import { CostChart, ReserveProgress, ResultMetrics, ResultStatus } from '@/components/insights';
import WhatIf from '@/components/WhatIf';
import { calculateScenario } from '@/engine/scenario';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { VehicleCondition } from '@/types/domain';
import { formatCurrency, formatMonths } from '@/utils/format';

export default function CalculatorScreen() {
  const { width, fontScale } = useWindowDimensions();
  const { colors } = useAppTheme();
  const scenario = useScenarioStore(state => state.scenario);
  const activeId = useScenarioStore(state => state.workspace.activeOptionId);
  const updateVehicle = useScenarioStore(state => state.updateVehicle);
  const updateLoan = useScenarioStore(state => state.updateLoan);
  const [experiment, setExperiment] = useState(false);
  const result = useMemo(() => calculateScenario(scenario), [scenario]);
  const wide = width >= 760 && fontScale < 1.6;
  const availableDown = scenario.profile.carSavings + scenario.profile.otherSavings + (scenario.profile.useEmergencyForDownPayment ? scenario.profile.emergencySavings : 0);
  const maxDown = Math.max(1000, Math.min(scenario.vehicle.price, availableDown || scenario.vehicle.price));
  const details = <View style={styles.summary}>
    <ReserveProgress scenario={scenario} result={result} />
    <CostChart scenario={scenario} result={result} />
    <Section title="The longer view"><View style={styles.metrics}>
      <Metric label="Total loan interest" value={formatCurrency(result.loan.totalInterest)} detail="Over the full loan term" />
      <Metric label="Debt payoff impact" value={result.debtDelayMonths === null ? 'Incomplete' : result.debtDelayMonths === 0 ? 'No delay' : `+${formatMonths(result.debtDelayMonths)}`} detail="Compared with no purchase" />
    </View></Section>
  </View>;
  const summary = <View style={[styles.summary, wide && styles.summaryWide]}>
    <View style={[styles.hero, { backgroundColor: colors.primarySoft }]}>
      <Text style={[styles.heroLabel, { color: colors.primary }]}>THE WHOLE PICTURE</Text>
      <Text style={[styles.heroValue, { color: colors.text }]}>{formatCurrency(result.trueMonthlyCost)}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 15 }}>per month, including ownership costs</Text>
      <View style={{ marginTop: 12 }}><ResultStatus result={result} /></View>
    </View>
    <ResultMetrics result={result} />
    {result.warnings.length > 0 && <Section title={result.complete ? 'Worth a closer look' : 'Finish your picture'}>{result.warnings.map(w => <Text key={w} style={{ color: colors.warning, lineHeight: 21 }}>{w}</Text>)}</Section>}
    <Button label="What if I change the terms?" onPress={() => setExperiment(true)} />
    {wide && details}
  </View>;
  const editor = (
    <View key={activeId} style={[styles.editor, wide && styles.editorWide]}>
      <Section collapsible initiallyOpen title="Vehicle" caption="Starting values are editable estimates.">
        <View style={styles.row}>
          <Field label="Make" value={scenario.vehicle.make} onChangeText={(make) => updateVehicle({ make })} />
          <Field label="Model" value={scenario.vehicle.model} onChangeText={(model) => updateVehicle({ model })} />
        </View>
        <Segmented<VehicleCondition> label="Condition" value={scenario.vehicle.condition} onChange={(condition) => updateVehicle({ condition })} options={[{ label: 'Used', value: 'used' }, { label: 'New', value: 'new' }]} />
        <View style={styles.row}>
          <NumberField min={1980} max={new Date().getFullYear() + 2} label="Year" value={scenario.vehicle.year} onChange={(year) => updateVehicle({ year: year ?? new Date().getFullYear() })} allowDecimal={false} />
          <NumberField min={1} label="Price" value={scenario.vehicle.price} onChange={(price) => updateVehicle({ price: price ?? 0 })} />
        </View>
        <View style={styles.row}>
          <NumberField label="Current mileage" value={scenario.vehicle.mileage} onChange={(mileage) => updateVehicle({ mileage: mileage ?? 0 })} hint="Affects the maintenance estimate" suffix="miles" />
          <NumberField min={0.1} label="Fuel economy" value={scenario.vehicle.mpg} onChange={(mpg) => updateVehicle({ mpg: mpg ?? 0 })} suffix="MPG" />
        </View>
      </Section>

      <Section collapsible title="Financing" caption="Longer terms lower the payment but increase total interest.">
        <Text style={[styles.sliderValue, { color: colors.text }]}>{formatCurrency(scenario.loan.downPayment)} down</Text>
        <Slider minimumValue={0} maximumValue={maxDown} step={250} value={Math.min(scenario.loan.downPayment, maxDown)} onValueChange={(downPayment) => updateLoan({ downPayment })} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.border} accessibilityLabel="Down payment" />
        <View style={styles.row}>
          <NumberField label="Down payment" value={scenario.loan.downPayment} onChange={(downPayment) => updateLoan({ downPayment: downPayment ?? 0 })} />
          <NumberField max={100} label="APR (%)" value={scenario.loan.apr} onChange={(apr) => updateLoan({ apr: apr ?? 0 })} hint="Enter 6.5 for 6.5%" />
        </View>
        <Segmented label="Loan term" value={String(scenario.loan.termMonths)} onChange={(value) => updateLoan({ termMonths: Number(value) })} options={['36', '48', '60', '72', '84'].map((value) => ({ label: `${value} mo`, value }))} />
        <View style={styles.row}>
          <NumberField max={100} label="Sales tax (%)" value={scenario.loan.taxRate} onChange={(taxRate) => updateLoan({ taxRate: taxRate ?? 0 })} hint="Enter 7 for 7%" />
          <NumberField label="Fees" value={scenario.loan.fees} onChange={(fees) => updateLoan({ fees: fees ?? 0 })} />
        </View>
        <View style={styles.row}>
          <NumberField label="Trade-in credit" value={scenario.loan.tradeInCredit} onChange={(tradeInCredit) => updateLoan({ tradeInCredit: tradeInCredit ?? 0 })} />
          <NumberField label="Negative equity" value={scenario.loan.negativeEquity} onChange={(negativeEquity) => updateLoan({ negativeEquity: negativeEquity ?? 0 })} />
        </View>
        <View style={styles.metrics}>
          <Metric label="Amount financed" value={formatCurrency(result.loan.amountFinanced)} />
          <Metric label="Total interest" value={formatCurrency(result.loan.totalInterest)} />
        </View>
      </Section>

      <Section collapsible title="Ownership costs" caption="Annual driving and fuel price are shared across all saved options.">
        <View style={styles.row}>
          <NumberField label="Insurance monthly" value={scenario.vehicle.insuranceMonthly} onChange={(insuranceMonthly) => updateVehicle({ insuranceMonthly: insuranceMonthly ?? 0 })} />
          <NumberField label="Miles per year" value={scenario.vehicle.annualMiles} onChange={(annualMiles) => updateVehicle({ annualMiles: annualMiles ?? 0 })} />
        </View>
        <View style={styles.row}>
          <NumberField label="Fuel per gallon" value={scenario.vehicle.fuelPrice} onChange={(fuelPrice) => updateVehicle({ fuelPrice: fuelPrice ?? 0 })} />
          <NumberField nullable label="Maintenance monthly" value={scenario.vehicle.maintenanceMonthly} onChange={(maintenanceMonthly) => updateVehicle({ maintenanceMonthly })} hint="Leave blank for estimate" />
        </View>
        <View style={styles.row}>
          <NumberField label="Registration yearly" value={scenario.vehicle.registrationAnnual} onChange={(registrationAnnual) => updateVehicle({ registrationAnnual: registrationAnnual ?? 0 })} />
          <NumberField label="Parking monthly" value={scenario.vehicle.parkingMonthly} onChange={(parkingMonthly) => updateVehicle({ parkingMonthly: parkingMonthly ?? 0 })} />
        </View>
        <View style={styles.row}>
          <NumberField label="Tolls monthly" value={scenario.vehicle.tollsMonthly} onChange={(tollsMonthly) => updateVehicle({ tollsMonthly: tollsMonthly ?? 0 })} />
          <NumberField label="Other monthly" value={scenario.vehicle.otherMonthly} onChange={(otherMonthly) => updateVehicle({ otherMonthly: otherMonthly ?? 0 })} />
        </View>
      </Section>
    </View>
  );

  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <View accessibilityLiveRegion="polite" style={[styles.ribbon, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>Monthly {formatCurrency(result.trueMonthlyCost)}</Text>
      <Text style={{ color: result.monthlySurplus !== null && result.monthlySurplus < 0 ? colors.danger : colors.textMuted, flex: 1, textAlign: 'right' }}>Left over {formatCurrency(result.monthlySurplus)}</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.shell}><ScreenHeader eyebrow="A clearer road ahead" title="Your car plan" subtitle="A car you love. A financial picture you understand." /><OptionSelector />
        <View style={wide ? styles.wideLayout : styles.stack}>{summary}{editor}{!wide && details}</View>
      </View>
    </ScrollView>
    {experiment && <WhatIf onClose={() => setExperiment(false)} />}
  </View>;
}
const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 }, shell: { width: '100%', maxWidth: 1180, alignSelf: 'center' },
  ribbon: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', gap: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  stack: { gap: 20 }, wideLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  editor: { gap: 16 }, editorWide: { flex: 1.1 }, summary: { gap: 16 }, summaryWide: { flex: 1 },
  hero: { borderRadius: 24, padding: 24, gap: 8 }, heroLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  heroValue: { fontSize: 52, lineHeight: 62, fontWeight: '700', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sliderValue: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
