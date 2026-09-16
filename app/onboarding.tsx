import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { z } from 'zod';

import { Button, Field, NumberField, ScreenHeader, Section, Segmented } from '@/components/ui';
import { payFrequencyHint } from '@/engine/cashflow';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { AppScenario, DebtType, ExpenseMode, PayFrequency, VehicleCondition } from '@/types/domain';

const schema = z.object({
  version: z.number(),
  onboardingComplete: z.boolean(),
  profile: z.object({
    paycheckAmount: z.number().positive('Enter your take-home pay.'),
    payFrequency: z.enum(['weekly', 'biweekly', 'twiceMonthly', 'monthly']),
    sideIncomeMonthly: z.number().min(0), includeSideIncome: z.boolean(),
    emergencySavings: z.number().min(0), carSavings: z.number().min(0), otherSavings: z.number().min(0), reserveTarget: z.number().min(0),
    expenseMode: z.enum(['quick', 'detailed']), essentialExpensesQuick: z.number().min(0),
    detailedExpenses: z.object({ housing: z.number().min(0), groceries: z.number().min(0), utilities: z.number().min(0), phone: z.number().min(0), transportation: z.number().min(0), insurance: z.number().min(0), subscriptions: z.number().min(0), otherRequired: z.number().min(0) }),
    discretionarySpending: z.number().min(0), monthlyCarSavingsContribution: z.number().min(0),
    useEmergencyForDownPayment: z.boolean(), debtAvalancheEnabled: z.boolean(),
  }),
  debts: z.array(z.object({ id: z.string(), name: z.string().min(1), type: z.enum(['studentLoan', 'creditCard', 'personalLoan', 'autoLoan', 'other']), balance: z.number().min(0), apr: z.number().min(0).max(100), minimumPayment: z.number().min(0) })),
  vehicle: z.object({
    make: z.string().min(1, 'Enter a make.'), model: z.string().min(1, 'Enter a model.'), trim: z.string(), year: z.number().int().min(1980), condition: z.enum(['new', 'used']), price: z.number().positive(), mileage: z.number().min(0), mpg: z.number().positive(), annualMiles: z.number().min(0), fuelPrice: z.number().min(0), insuranceMonthly: z.number().min(0), maintenanceMonthly: z.number().nullable(), registrationAnnual: z.number().min(0), parkingMonthly: z.number().min(0), tollsMonthly: z.number().min(0), otherMonthly: z.number().min(0),
  }),
  loan: z.object({ taxRate: z.number().min(0).max(30), fees: z.number().min(0), tradeInCredit: z.number().min(0), negativeEquity: z.number().min(0), downPayment: z.number().min(0), apr: z.number().min(0).max(100), termMonths: z.number().int().min(1).max(120) }),
  timing: z.object({ customPurchaseDate: z.string(), waitingMonthlyCosts: z.number().min(0) }),
});

const steps = ['Income', 'Savings', 'Debt', 'Vehicle', 'Costs'];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const initial = useScenarioStore((state) => state.scenario);
  const completeOnboarding = useScenarioStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const { control, handleSubmit, formState: { errors } } = useForm<AppScenario>({ defaultValues: initial, resolver: zodResolver(schema) });
  const debts = useFieldArray({ control, name: 'debts' });
  const expenseMode = useWatch({ control, name: 'profile.expenseMode' });
  const isWide = width >= 760;

  const finish = handleSubmit((values) => {
    completeOnboarding(values);
    router.replace('/(tabs)');
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: colors.background }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.shell}>
          <View accessibilityLabel={`Step ${step + 1} of ${steps.length}`} style={styles.progressRow}>
            {steps.map((name, index) => <View key={name} style={[styles.progress, { backgroundColor: index <= step ? colors.primary : colors.border }]} />)}
          </View>
          <ScreenHeader eyebrow={`Step ${step + 1} of ${steps.length}`} title={steps[step] ?? 'Setup'} subtitle="Your numbers stay on this device. You can change every assumption later." />

          {step === 0 ? <IncomeStep control={control} /> : null}
          {step === 1 ? <SavingsStep control={control} expenseMode={expenseMode} isWide={isWide} /> : null}
          {step === 2 ? (
            <Section title="Existing debt" caption="Optional. Add each balance so the car's impact on payoff timing is visible.">
              {debts.fields.map((debt, index) => (
                <View key={debt.id} style={[styles.debt, { borderColor: colors.border }]}>
                  <Controller control={control} name={`debts.${index}.name`} render={({ field }) => <Field label="Debt name" value={field.value} onChangeText={field.onChange} />} />
                  <Controller control={control} name={`debts.${index}.type`} render={({ field }) => <Segmented label="Type" value={field.value as DebtType} onChange={field.onChange} options={[{ label: 'Card', value: 'creditCard' }, { label: 'Student', value: 'studentLoan' }, { label: 'Other', value: 'other' }]} />} />
                  <View style={styles.row}>
                    <NumberController control={control} name={`debts.${index}.balance`} label="Balance" />
                    <NumberController control={control} name={`debts.${index}.apr`} label="APR" suffix="percent" />
                    <NumberController control={control} name={`debts.${index}.minimumPayment`} label="Minimum" />
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => debts.remove(index)}><Text style={{ color: colors.danger, fontWeight: '700' }}>Remove debt</Text></Pressable>
                </View>
              ))}
              <Button variant="secondary" icon="plus" label="Add debt" onPress={() => debts.append({ id: `debt-${Date.now()}`, name: '', type: 'creditCard', balance: 0, apr: 0, minimumPayment: 0 })} />
            </Section>
          ) : null}
          {step === 3 ? <VehicleStep control={control} errors={errors} /> : null}
          {step === 4 ? <CostsStep control={control} /> : null}

          {Object.keys(errors).length > 0 && step === steps.length - 1 ? <Text style={{ color: colors.danger }}>Review the highlighted required fields before continuing.</Text> : null}
          <View style={styles.actions}>
            {step > 0 ? <View style={{ flex: 1 }}><Button variant="secondary" label="Back" onPress={() => setStep((value) => value - 1)} /></View> : null}
            <View style={{ flex: 1 }}><Button label={step === steps.length - 1 ? 'See my plan' : 'Continue'} onPress={step === steps.length - 1 ? finish : () => setStep((value) => value + 1)} /></View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type Control = any;
function NumberController({ control, name, label, suffix }: { control: Control; name: string; label: string; suffix?: string }) {
  return <Controller control={control} name={name as never} render={({ field }) => <NumberField label={label} value={field.value as number | null} onChange={(value) => field.onChange(value ?? 0)} suffix={suffix} />} />;
}

function IncomeStep({ control }: { control: Control }) {
  return <Section title="Take-home income" caption="Use the amount that reaches your bank account after taxes and deductions.">
    <NumberController control={control} name="profile.paycheckAmount" label="Paycheck amount" />
    <Controller control={control} name="profile.payFrequency" render={({ field }) => <Segmented<PayFrequency> label="Pay frequency" hint={payFrequencyHint[field.value as PayFrequency]} value={field.value} onChange={field.onChange} options={[{ label: 'Weekly', value: 'weekly' }, { label: 'Every 2 weeks', value: 'biweekly' }, { label: 'Twice monthly', value: 'twiceMonthly' }, { label: 'Monthly', value: 'monthly' }]} />} />
    <NumberController control={control} name="profile.sideIncomeMonthly" label="Reliable side income per month" />
  </Section>;
}

function SavingsStep({ control, expenseMode, isWide }: { control: Control; expenseMode: ExpenseMode; isWide: boolean }) {
  return <View style={isWide ? styles.wideGrid : styles.stack}>
    <Section title="Savings" style={isWide ? styles.wideSection : undefined}>
      <NumberController control={control} name="profile.emergencySavings" label="Emergency savings" />
      <NumberController control={control} name="profile.carSavings" label="Car savings" />
      <NumberController control={control} name="profile.otherSavings" label="Other available savings" />
      <NumberController control={control} name="profile.reserveTarget" label="Emergency reserve target" />
      <NumberController control={control} name="profile.monthlyCarSavingsContribution" label="Monthly car savings" />
    </Section>
    <Section title="Monthly spending" style={isWide ? styles.wideSection : undefined}>
      <Controller control={control} name="profile.expenseMode" render={({ field }) => <Segmented<ExpenseMode> label="Expense detail" value={field.value} onChange={field.onChange} options={[{ label: 'Quick total', value: 'quick' }, { label: 'Detailed', value: 'detailed' }]} />} />
      {expenseMode === 'quick' ? <NumberController control={control} name="profile.essentialExpensesQuick" label="Required monthly expenses" /> : (
        ['housing', 'groceries', 'utilities', 'phone', 'transportation', 'insurance', 'subscriptions', 'otherRequired'].map((key) => <NumberController key={key} control={control} name={`profile.detailedExpenses.${key}`} label={key === 'otherRequired' ? 'Other required' : key[0]!.toUpperCase() + key.slice(1)} />)
      )}
      <NumberController control={control} name="profile.discretionarySpending" label="Discretionary spending" />
    </Section>
  </View>;
}

function VehicleStep({ control, errors }: { control: Control; errors: any }) {
  return <Section title="The car" caption="Enter a real vehicle when possible. Estimates remain editable.">
    <View style={styles.row}>
      <Controller control={control} name="vehicle.make" render={({ field }) => <Field label="Make" value={field.value} onChangeText={field.onChange} error={errors.vehicle?.make?.message} />} />
      <Controller control={control} name="vehicle.model" render={({ field }) => <Field label="Model" value={field.value} onChangeText={field.onChange} error={errors.vehicle?.model?.message} />} />
    </View>
    <Controller control={control} name="vehicle.condition" render={({ field }) => <Segmented<VehicleCondition> label="Condition" value={field.value} onChange={field.onChange} options={[{ label: 'Used', value: 'used' }, { label: 'New', value: 'new' }]} />} />
    <View style={styles.row}><NumberController control={control} name="vehicle.year" label="Year" /><NumberController control={control} name="vehicle.price" label="Price" /></View>
    <View style={styles.row}><NumberController control={control} name="vehicle.mileage" label="Current mileage" suffix="miles; affects maintenance estimate" /><NumberController control={control} name="vehicle.mpg" label="Fuel economy" suffix="MPG" /></View>
  </Section>;
}

function CostsStep({ control }: { control: Control }) {
  return <View style={styles.stack}>
    <Section title="Financing">
      <View style={styles.row}><NumberController control={control} name="loan.downPayment" label="Down payment" /><NumberController control={control} name="loan.apr" label="APR (%)" suffix="Enter 6.5 for 6.5%" /></View>
      <Controller control={control} name="loan.termMonths" render={({ field }) => <Segmented label="Loan term" value={String(field.value)} onChange={(value) => field.onChange(Number(value))} options={['36', '48', '60', '72', '84'].map((value) => ({ label: `${value} mo`, value }))} />} />
      <View style={styles.row}><NumberController control={control} name="loan.taxRate" label="Sales tax (%)" suffix="Enter 7 for 7%" /><NumberController control={control} name="loan.fees" label="Fees" /></View>
    </Section>
    <Section title="Ownership estimates">
      <View style={styles.row}><NumberController control={control} name="vehicle.insuranceMonthly" label="Insurance monthly" /><NumberController control={control} name="vehicle.fuelPrice" label="Fuel per gallon" /></View>
      <View style={styles.row}><NumberController control={control} name="vehicle.annualMiles" label="Miles per year" /><NumberController control={control} name="vehicle.registrationAnnual" label="Registration yearly" /></View>
    </Section>
  </View>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 64, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 920, alignSelf: 'center' },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  progress: { height: 4, flex: 1, borderRadius: 2 },
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  debt: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 12 },
  wideGrid: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  wideSection: { flex: 1 },
});
