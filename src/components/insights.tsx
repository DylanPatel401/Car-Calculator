import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '@/theme/theme';
import { AppScenario, ScenarioResult, ScenarioStatus } from '@/types/domain';
import { formatCurrency } from '@/utils/format';
import { Metric, Section, ShowMath, MathLine } from './ui';

export const statusLabels: Record<ScenarioStatus, string> = {
  incomplete: 'A few details to finish', shortfall: 'Monthly shortfall', reserveBelowTarget: 'Below your reserve target', withinTarget: 'Within your cash-flow & reserve targets',
};
export function ResultStatus({ result }: { result: ScenarioResult }) {
  const { colors } = useAppTheme();
  const good = result.status === 'withinTarget';
  return <View style={{ backgroundColor: good ? colors.primarySoft : colors.warningSoft, padding: 12, borderRadius: 12 }}>
    <Text style={{ color: good ? colors.primary : colors.warning, fontSize: 13, lineHeight: 19, fontWeight: '700' }}>{good ? 'OK: ' : 'Review: '}{statusLabels[result.status]}</Text>
  </View>;
}
export function CostChart({ scenario, result }: { scenario: AppScenario; result: ScenarioResult }) {
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const values: [string, number | null, string][] = [
    ['Loan payment', result.loan.monthlyPayment, colors.primary], ['Insurance', scenario.vehicle.insuranceMonthly, '#5C8E85'],
    ['Fuel', result.fuelMonthly, '#BA9454'], ['Maintenance', result.maintenanceMonthly, '#829E6D'],
    ['Registration & other', scenario.vehicle.registrationAnnual / 12 + scenario.vehicle.parkingMonthly + scenario.vehicle.tollsMonthly + scenario.vehicle.otherMonthly, '#8D8FA9'],
  ];
  const total = result.trueMonthlyCost;
  let offset = 0;
  return <Section title="Every dollar, accounted for" caption="Your monthly ownership cost, beyond the payment.">
    {total !== null && total > 0 ? <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Svg width={164} height={164} viewBox="0 0 164 164">
        {values.map(([label, value, color]) => { const fraction = (value ?? 0) / total; const start = offset; offset += fraction;
          return <Circle key={label} cx={82} cy={82} r={65} fill="none" stroke={color} strokeWidth={18} strokeDasharray={`${fraction * 408.407} ${408.407}`} strokeDashoffset={-start * 408.407} transform="rotate(-90 82 82)" />;
        })}
      </Svg>
      <View style={[{ pointerEvents: 'none', alignItems: 'center' }, fontScale <= 1.2 ? { position: 'absolute', top: 64 } : { marginTop: 12 }]}><Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatCurrency(total)}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>per month</Text></View>
    </View> : <Text style={{ color: colors.textMuted }}>Complete your vehicle and financing details to see the breakdown.</Text>}
    {values.map(([label, value, color]) => <View key={label} style={styles.row}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} /><Text style={{ color: colors.textMuted, flex: 1 }}>{label}{label === 'Maintenance' && result.maintenanceIsEstimate ? ' - estimate' : ''}</Text><Text style={{ color: colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{formatCurrency(value)}</Text></View>)}
    <ShowMath><MathLine>Monthly cost = payment + insurance + fuel + maintenance + registration + parking, tolls and other costs.</MathLine><MathLine>Fuel = {scenario.vehicle.annualMiles.toLocaleString()} miles / {scenario.vehicle.mpg} MPG x {formatCurrency(scenario.vehicle.fuelPrice, true)} / 12.</MathLine><MathLine>Financed = price + tax + fees + negative equity - funded down payment - trade-in credit.</MathLine></ShowMath>
  </Section>;
}
export function ReserveProgress({ scenario, result }: { scenario: AppScenario; result: ScenarioResult }) {
  const { colors } = useAppTheme();
  const target = scenario.profile.reserveTarget;
  if (result.emergencyCashRemaining === null || result.reserveGap === null) return <Section title="Your safety cushion"><Text style={{ color: colors.textMuted }}>Complete valid financial and purchase details to calculate your reserve.</Text></Section>;
  const progress = target > 0 ? Math.min(1, Math.max(0, result.emergencyCashRemaining / target)) : 1;
  return <Section title="Your safety cushion" caption="Measured against the reserve target you chose.">
    <View style={styles.row}><Text style={{ flex: 1, color: colors.text, fontSize: 26, fontWeight: '700' }}>{formatCurrency(result.emergencyCashRemaining)}</Text><Text style={{ color: colors.textMuted }}>of {formatCurrency(target)}</Text></View>
    <View accessible accessibilityLabel={`${formatCurrency(result.emergencyCashRemaining)} emergency savings remaining. Target ${formatCurrency(target)}.`} style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}><View style={{ width: `${progress * 100}%`, height: 8, backgroundColor: result.reserveGap < 0 ? colors.warning : colors.primary }} /></View>
    <Text style={{ color: colors.textMuted, lineHeight: 21 }}>{result.reserveGap < 0 ? `${formatCurrency(-result.reserveGap)} below your target.` : target === 0 ? 'No reserve target set.' : 'Your reserve target is covered.'} {result.emergencyRunwayMonths === null ? 'Add required expenses to calculate runway.' : `${result.emergencyRunwayMonths.toFixed(1)} months of required expenses.`}</Text>
    <ShowMath><MathLine>Emergency cash remaining / required monthly expenses = emergency runway.</MathLine><MathLine>{scenario.profile.useEmergencyForDownPayment ? 'Emergency savings may fund the down payment after other available savings.' : 'Emergency savings are protected from the down payment.'}</MathLine></ShowMath>
  </Section>;
}
export function ResultMetrics({ result }: { result: ScenarioResult }) {
  return <View style={styles.metrics}>
    <Metric label="Left each month" value={formatCurrency(result.monthlySurplus)} detail="After costs, spending & debt" tone={result.monthlySurplus === null ? 'neutral' : result.monthlySurplus < 0 ? 'danger' : 'good'} />
    <Metric label="Cash after purchase" value={formatCurrency(result.cashRemaining)} detail="Includes emergency savings" />
  </View>;
}
export function Difference({ label, current, baseline }: { label: string; current: number | null; baseline: number | null }) {
  const { colors } = useAppTheme();
  const delta = current === null || baseline === null ? null : current - baseline;
  return <View style={styles.row}><Text style={{ flex: 1, color: colors.textMuted }}>{label}</Text><Text style={{ color: colors.text, fontVariant: ['tabular-nums'], fontWeight: '600' }}>{delta === null ? 'Incomplete' : `${delta > 0 ? '+' : delta < 0 ? '-' : ''}${formatCurrency(Math.abs(delta))}`}</Text></View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } });
