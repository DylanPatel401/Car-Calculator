import Slider from '@react-native-community/slider';
import OptionSelector from '@/components/OptionSelector';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Field, MathLine, Metric, NumberField, ScreenHeader, Section, Segmented, ShowMath } from '@/components/ui';
import { calculateScenario } from '@/engine/scenario';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { VehicleCondition } from '@/types/domain';
import { formatCurrency, formatMonths, formatPercent } from '@/utils/format';

export default function CalculatorScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const scenario = useScenarioStore((state) => state.scenario);
  const updateVehicle = useScenarioStore((state) => state.updateVehicle);
  const updateLoan = useScenarioStore((state) => state.updateLoan);
  const result = useMemo(() => calculateScenario(scenario), [scenario]);
  const wide = width >= 760;
  const availableDown = scenario.profile.carSavings + scenario.profile.otherSavings + (scenario.profile.useEmergencyForDownPayment ? scenario.profile.emergencySavings : 0);
  const maxDown = Math.max(1000, Math.min(scenario.vehicle.price, availableDown || scenario.vehicle.price));
  const surplusTone = result.monthlySurplus === null ? 'warning' : result.monthlySurplus >= 0 ? 'good' : 'danger';

  const summary = (
    <View style={[styles.summary, wide && styles.summaryWide]}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: colors.textMuted }]}>TRUE MONTHLY COST</Text>
          <Text accessibilityLiveRegion="polite" adjustsFontSizeToFit numberOfLines={1} style={[styles.heroValue, { color: colors.text }]}>{formatCurrency(result.trueMonthlyCost)}</Text>
          <Text style={[styles.heroDetail, { color: colors.textMuted }]}>{result.vehicleName || 'Your vehicle'} · payment {formatCurrency(result.loan.monthlyPayment)}</Text>
        </View>
        <View style={[styles.status, { backgroundColor: result.monthlySurplus !== null && result.monthlySurplus >= 0 ? colors.primarySoft : colors.dangerSoft }]}>
          <Text style={{ color: result.monthlySurplus !== null && result.monthlySurplus >= 0 ? colors.primary : colors.danger, fontWeight: '800' }}>{result.monthlySurplus !== null && result.monthlySurplus >= 0 ? 'Positive cash flow' : 'Shortfall'}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric label="Monthly surplus" value={formatCurrency(result.monthlySurplus)} tone={surplusTone} detail="After spending and debt" />
        <Metric label="Emergency runway" value={result.emergencyRunwayMonths === null ? 'Incomplete' : `${result.emergencyRunwayMonths.toFixed(1)} mo`} tone={result.reserveGap >= 0 ? 'good' : 'warning'} detail={`${formatCurrency(result.emergencyCashRemaining)} remains`} />
        <Metric label="Transport / income" value={formatPercent(result.transportationIncomePercent)} detail="Take-home income" />
        <Metric label="Debt payoff impact" value={result.debtDelayMonths === null ? 'Incomplete' : result.debtDelayMonths === 0 ? 'No delay' : `+${formatMonths(result.debtDelayMonths)}`} tone={result.debtDelayMonths === 0 ? 'good' : 'warning'} detail={`With car: ${formatMonths(result.debtWithCar.months)}`} />
      </View>
      {result.warnings.length ? <View style={[styles.warningBox, { backgroundColor: colors.warningSoft }]}>{result.warnings.map((warning) => <Text key={warning} style={[styles.warningText, { color: colors.warning }]}>• {warning}</Text>)}</View> : null}
      <Section title="How this total works">
        <View style={styles.costRows}>
          <CostRow label="Loan payment" value={result.loan.monthlyPayment} />
          <CostRow label="Insurance" value={scenario.vehicle.insuranceMonthly} />
          <CostRow label="Fuel" value={result.fuelMonthly} />
          <CostRow label={result.maintenanceIsEstimate ? 'Maintenance estimate' : 'Maintenance'} value={result.maintenanceMonthly} />
          <CostRow label="Registration" value={scenario.vehicle.registrationAnnual / 12} />
          <CostRow label="Parking, tolls & other" value={scenario.vehicle.parkingMonthly + scenario.vehicle.tollsMonthly + scenario.vehicle.otherMonthly} />
        </View>
        <ShowMath>
          <MathLine>{formatCurrency(scenario.vehicle.price, true)} vehicle + {formatCurrency(result.loan.taxes, true)} tax + {formatCurrency(scenario.loan.fees, true)} fees</MathLine>
          <MathLine>− {formatCurrency(result.downPaymentApplied, true)} funded down − {formatCurrency(scenario.loan.tradeInCredit, true)} trade = {formatCurrency(result.loan.amountFinanced, true)} financed</MathLine>
          <MathLine>{scenario.vehicle.annualMiles.toLocaleString()} miles ÷ {scenario.vehicle.mpg} MPG × {formatCurrency(scenario.vehicle.fuelPrice, true)} ÷ 12 = {formatCurrency(result.fuelMonthly, true)}</MathLine>
        </ShowMath>
      </Section>
    </View>
  );

  const editor = (
    <View style={[styles.editor, wide && styles.editorWide]}>
      <Section title="Vehicle" caption="Starting values are editable estimates.">
        <View style={styles.row}>
          <Field label="Make" value={scenario.vehicle.make} onChangeText={(make) => updateVehicle({ make })} />
          <Field label="Model" value={scenario.vehicle.model} onChangeText={(model) => updateVehicle({ model })} />
        </View>
        <Segmented<VehicleCondition> label="Condition" value={scenario.vehicle.condition} onChange={(condition) => updateVehicle({ condition })} options={[{ label: 'Used', value: 'used' }, { label: 'New', value: 'new' }]} />
        <View style={styles.row}>
          <NumberField label="Year" value={scenario.vehicle.year} onChange={(year) => updateVehicle({ year: year ?? new Date().getFullYear() })} allowDecimal={false} />
          <NumberField label="Price" value={scenario.vehicle.price} onChange={(price) => updateVehicle({ price: price ?? 0 })} />
        </View>
        <View style={styles.row}>
          <NumberField label="Current mileage" value={scenario.vehicle.mileage} onChange={(mileage) => updateVehicle({ mileage: mileage ?? 0 })} hint="Affects the maintenance estimate" suffix="miles" />
          <NumberField label="Fuel economy" value={scenario.vehicle.mpg} onChange={(mpg) => updateVehicle({ mpg: mpg ?? 0 })} suffix="MPG" />
        </View>
      </Section>

      <Section title="Financing" caption="Longer terms lower the payment but increase total interest.">
        <Text style={[styles.sliderValue, { color: colors.text }]}>{formatCurrency(scenario.loan.downPayment)} down</Text>
        <Slider minimumValue={0} maximumValue={maxDown} step={250} value={Math.min(scenario.loan.downPayment, maxDown)} onValueChange={(downPayment) => updateLoan({ downPayment })} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.border} accessibilityLabel="Down payment" />
        <View style={styles.row}>
          <NumberField label="Down payment" value={scenario.loan.downPayment} onChange={(downPayment) => updateLoan({ downPayment: downPayment ?? 0 })} />
          <NumberField label="APR (%)" value={scenario.loan.apr} onChange={(apr) => updateLoan({ apr: apr ?? 0 })} hint="Enter 6.5 for 6.5%" />
        </View>
        <Segmented label="Loan term" value={String(scenario.loan.termMonths)} onChange={(value) => updateLoan({ termMonths: Number(value) })} options={['36', '48', '60', '72', '84'].map((value) => ({ label: `${value} mo`, value }))} />
        <View style={styles.row}>
          <NumberField label="Sales tax (%)" value={scenario.loan.taxRate} onChange={(taxRate) => updateLoan({ taxRate: taxRate ?? 0 })} hint="Enter 7 for 7%" />
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

      <Section title="Ownership costs" caption="Annual driving and fuel price are shared across all saved options.">
        <View style={styles.row}>
          <NumberField label="Insurance monthly" value={scenario.vehicle.insuranceMonthly} onChange={(insuranceMonthly) => updateVehicle({ insuranceMonthly: insuranceMonthly ?? 0 })} />
          <NumberField label="Miles per year" value={scenario.vehicle.annualMiles} onChange={(annualMiles) => updateVehicle({ annualMiles: annualMiles ?? 0 })} />
        </View>
        <View style={styles.row}>
          <NumberField label="Fuel per gallon" value={scenario.vehicle.fuelPrice} onChange={(fuelPrice) => updateVehicle({ fuelPrice: fuelPrice ?? 0 })} />
          <NumberField label="Maintenance monthly" value={scenario.vehicle.maintenanceMonthly} onChange={(maintenanceMonthly) => updateVehicle({ maintenanceMonthly })} hint="Leave blank for estimate" />
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

  return (
    <ScrollView style={{ backgroundColor: colors.background }} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <ScreenHeader eyebrow="Live scenario" title="Your car plan" subtitle="Change any assumption and the full financial picture updates immediately." />
        <OptionSelector />
        <View style={wide ? styles.wideLayout : styles.stack}>{wide ? <>{editor}{summary}</> : <>{summary}{editor}</>}</View>
      </View>
    </ScrollView>
  );
}

function CostRow({ label, value }: { label: string; value: number | null }) {
  const { colors } = useAppTheme();
  return <View style={styles.costRow}><Text style={{ color: colors.textMuted }}>{label}</Text><Text style={[styles.costValue, { color: colors.text }]}>{formatCurrency(value)}</Text></View>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 1180, alignSelf: 'center' },
  stack: { gap: 12 },
  wideLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  editor: { gap: 12 },
  editorWide: { flex: 1.15 },
  summary: { gap: 12 },
  summaryWide: { flex: 0.85, position: 'relative' },
  hero: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroLabel: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  heroValue: { fontSize: 38, lineHeight: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  heroDetail: { fontSize: 13, lineHeight: 18 },
  status: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 110 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  warningBox: { borderRadius: 7, padding: 13, gap: 4 },
  warningText: { fontSize: 13, lineHeight: 19 },
  costRows: { gap: 10 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  costValue: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sliderValue: { fontSize: 24, lineHeight: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
