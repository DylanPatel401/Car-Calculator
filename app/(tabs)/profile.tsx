import { Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { Button, Field, NumberField, ScreenHeader, Section, Segmented, ToggleRow } from '@/components/ui';
import { payFrequencyHint } from '@/engine/cashflow';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { DebtType, ExpenseMode, PayFrequency } from '@/types/domain';

const expenseLabels: Record<string, string> = {
  housing: 'Housing', groceries: 'Groceries', utilities: 'Utilities', phone: 'Phone', transportation: 'Current transportation', insurance: 'Other insurance', subscriptions: 'Subscriptions', otherRequired: 'Other required',
};

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const scenario = useScenarioStore((state) => state.scenario);
  const updateProfile = useScenarioStore((state) => state.updateProfile);
  const addDebt = useScenarioStore((state) => state.addDebt);
  const updateDebt = useScenarioStore((state) => state.updateDebt);
  const removeDebt = useScenarioStore((state) => state.removeDebt);
  const reset = useScenarioStore((state) => state.reset);
  const wide = width >= 760;
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <ScreenHeader eyebrow="Local profile" title="Your financial picture" subtitle="These inputs shape affordability. They are stored only on this device and are not financial advice." />
        <View style={wide ? styles.wideGrid : styles.stack}>
          <View style={styles.column}>
            <Section title="Income">
              <NumberField label="Paycheck amount" value={scenario.profile.paycheckAmount} onChange={(paycheckAmount) => updateProfile({ paycheckAmount: paycheckAmount ?? 0 })} />
              <Segmented<PayFrequency> label="Pay frequency" hint={payFrequencyHint[scenario.profile.payFrequency]} value={scenario.profile.payFrequency} onChange={(payFrequency) => updateProfile({ payFrequency })} options={[{ label: 'Weekly', value: 'weekly' }, { label: 'Every 2 weeks', value: 'biweekly' }, { label: 'Twice monthly', value: 'twiceMonthly' }, { label: 'Monthly', value: 'monthly' }]} />
              <NumberField label="Side income monthly" value={scenario.profile.sideIncomeMonthly} onChange={(sideIncomeMonthly) => updateProfile({ sideIncomeMonthly: sideIncomeMonthly ?? 0 })} />
              <ToggleRow label="Include side income" caption="Turn this off to test the plan using base income only." value={scenario.profile.includeSideIncome} onChange={(includeSideIncome) => updateProfile({ includeSideIncome })} />
            </Section>
            <Section title="Savings & reserve">
              <NumberField label="Emergency savings" value={scenario.profile.emergencySavings} onChange={(emergencySavings) => updateProfile({ emergencySavings: emergencySavings ?? 0 })} />
              <NumberField label="Car savings" value={scenario.profile.carSavings} onChange={(carSavings) => updateProfile({ carSavings: carSavings ?? 0 })} />
              <NumberField label="Other savings" value={scenario.profile.otherSavings} onChange={(otherSavings) => updateProfile({ otherSavings: otherSavings ?? 0 })} />
              <NumberField label="Emergency reserve target" value={scenario.profile.reserveTarget} onChange={(reserveTarget) => updateProfile({ reserveTarget: reserveTarget ?? 0 })} />
              <ToggleRow label="Allow emergency savings for down payment" caption="Off by default. When enabled, the calculator can draw from emergency cash after car and other savings." value={scenario.profile.useEmergencyForDownPayment} onChange={(useEmergencyForDownPayment) => updateProfile({ useEmergencyForDownPayment })} />
            </Section>
          </View>
          <View style={styles.column}>
            <Section title="Monthly spending">
              <Segmented<ExpenseMode> label="Expense detail" value={scenario.profile.expenseMode} onChange={(expenseMode) => updateProfile({ expenseMode })} options={[{ label: 'Quick total', value: 'quick' }, { label: 'Detailed', value: 'detailed' }]} />
              {scenario.profile.expenseMode === 'quick' ? <NumberField label="Required expenses" value={scenario.profile.essentialExpensesQuick} onChange={(essentialExpensesQuick) => updateProfile({ essentialExpensesQuick: essentialExpensesQuick ?? 0 })} /> : Object.entries(scenario.profile.detailedExpenses).map(([key, value]) => <NumberField key={key} label={expenseLabels[key] ?? key} value={value} onChange={(next) => updateProfile({ detailedExpenses: { ...scenario.profile.detailedExpenses, [key]: next ?? 0 } })} />)}
              <NumberField label="Discretionary spending" value={scenario.profile.discretionarySpending} onChange={(discretionarySpending) => updateProfile({ discretionarySpending: discretionarySpending ?? 0 })} />
            </Section>
            <Section title="Debt payoff model" caption="Extra available cash is applied to the highest APR first. This is a transparent estimate, not advice.">
              <ToggleRow label="Model extra debt payments" value={scenario.profile.debtAvalancheEnabled} onChange={(debtAvalancheEnabled) => updateProfile({ debtAvalancheEnabled })} />
              {scenario.debts.map((debt) => (
                <View key={debt.id} style={[styles.debt, { borderColor: colors.border }]}>
                  <Field label="Debt name" value={debt.name} onChangeText={(name) => updateDebt(debt.id, { name })} />
                  <Segmented<DebtType> label="Type" value={debt.type} onChange={(type) => updateDebt(debt.id, { type })} options={[{ label: 'Card', value: 'creditCard' }, { label: 'Student', value: 'studentLoan' }, { label: 'Personal', value: 'personalLoan' }, { label: 'Other', value: 'other' }]} />
                  <View style={styles.row}>
                    <NumberField label="Balance" value={debt.balance} onChange={(balance) => updateDebt(debt.id, { balance: balance ?? 0 })} />
                    <NumberField label="APR (%)" value={debt.apr} onChange={(apr) => updateDebt(debt.id, { apr: apr ?? 0 })} hint="Enter 18.9 for 18.9%" />
                    <NumberField label="Minimum" value={debt.minimumPayment} onChange={(minimumPayment) => updateDebt(debt.id, { minimumPayment: minimumPayment ?? 0 })} />
                  </View>
                  <Button variant="danger" icon="trash" label="Remove debt" onPress={() => removeDebt(debt.id)} />
                </View>
              ))}
              <Button variant="secondary" icon="plus" label="Add debt" onPress={addDebt} />
            </Section>
          </View>
        </View>
        <Section title="Privacy & data">
          <Text style={[styles.body, { color: colors.textMuted }]}>Your financial profile and saved options are stored locally using unencrypted device storage.</Text>
          <Button variant="danger" icon="arrow.counterclockwise" label="Reset all local data" onPress={() => setResetOpen(true)} />
        </Section>
      </View>
      <Modal visible={resetOpen} transparent animationType="fade" onRequestClose={() => setResetOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000080' }}>
          <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 480, alignSelf: 'center', padding: 20, borderRadius: 8, backgroundColor: colors.surface, gap: 16 }}>
            <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Reset all data?</Text>
            <Text style={{ color: colors.textMuted }}>This removes your financial profile and every saved option, then returns to setup.</Text>
            <Button label="Reset everything" variant="danger" onPress={() => { void reset().then(() => { setResetOpen(false); router.replace('/onboarding'); }); }} />
            <Button label="Cancel" variant="secondary" onPress={() => setResetOpen(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: 12 },
  stack: { gap: 12 },
  wideGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  column: { flex: 1, gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  debt: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 12 },
  body: { fontSize: 14, lineHeight: 21 },
});
