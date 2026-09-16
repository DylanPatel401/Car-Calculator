import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, FieldPath } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, ScreenHeader, Section, Segmented } from '@/components/ui';
import { ResultMetrics, ResultStatus } from '@/components/insights';
import { clearSetup, emptySetup, loadSetup, saveSetup, setupSchema, setupScenario, setupSteps, SetupValues } from '@/data/setup';
import { calculateScenario } from '@/engine/scenario';
import { flushWorkspace } from '@/store/persistence';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { formatCurrency } from '@/utils/format';

const titles = ['Start with your income', 'Make room for real life', 'Meet your next car', 'Your first clear picture'];
export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const finishing = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const { control, reset, subscribe, trigger, handleSubmit, setFocus, formState: { errors } } = useForm<SetupValues>({ defaultValues: emptySetup(), resolver: zodResolver(setupSchema) });
  const values = useWatch({ control }) as SetupValues;
  const debts = useFieldArray({ control, name: 'debts' });
  useEffect(() => { let alive = true; void loadSetup().then(saved => { if (!alive) return; if (saved) { reset(saved.values); setStep(saved.step); } setReady(true); }); return () => { alive = false; }; }, [reset]);
  useEffect(() => {
    if (!ready) return;
    return subscribe({ formState: { values: true }, callback: ({ values: v }) => { if (!finishing.current) void saveSetup(v, step).then(() => setSaveError(false)).catch(() => setSaveError(true)); } });
  }, [ready, step, subscribe]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [step]);
  const move = (next: number) => { setStep(next); void saveSetup(values, next).catch(() => setSaveError(true)); };
  const finish = () => handleSubmit(async v => {
    finishing.current = true;
    useScenarioStore.getState().completeOnboarding(setupScenario(v));
    if (!(await flushWorkspace())) { finishing.current = false; setSaveError(true); return; }
    await clearSetup().catch(() => undefined);
    router.replace('/(tabs)');
  }, invalid => {
    const firstStep = setupSteps.findIndex(fields => fields.some(field => invalid[field]));
    if (firstStep >= 0) setStep(firstStep);
    requestAnimationFrame(() => { const field = Object.keys(invalid)[0]; if (field) setFocus(field as FieldPath<SetupValues>); });
  })();
  const input = (name: FieldPath<SetupValues>, label: string, numeric = true, hint?: string) => <Controller key={name} control={control} name={name} render={({ field, fieldState }) => <Field ref={field.ref} label={label} value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={text => field.onChange(numeric ? text.replace(/[$,\s]/g, '') : text)} keyboardType={numeric ? 'decimal-pad' : 'default'} error={fieldState.error?.message} hint={hint} />} />;
  const parsed = setupSchema.safeParse(values);
  const result = parsed.success ? calculateScenario(setupScenario(parsed.data)) : null;
  if (!ready) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, width: '100%', maxWidth: 720, alignSelf: 'center', gap: 20 }}>
      <View accessibilityLabel={`Step ${step + 1} of 4`} style={{ flexDirection: 'row', gap: 6 }}>{titles.map((title, i) => <View key={title} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.primary : colors.border }} />)}</View>
      <ScreenHeader eyebrow={`Your plan / ${step + 1} of 4`} title={titles[step]!} subtitle="Your numbers stay here. You can refine every assumption later." />
      {step === 0 && <Section title="What reaches your bank account?" caption="Use take-home pay after taxes and deductions.">
        {input('paycheck', 'Paycheck amount')}
        <Controller control={control} name="frequency" render={({ field }) => <Segmented label="Pay frequency" value={field.value} onChange={field.onChange} options={[{ label: 'Weekly', value: 'weekly' }, { label: 'Every 2 weeks', value: 'biweekly' }, { label: 'Twice monthly', value: 'twiceMonthly' }, { label: 'Monthly', value: 'monthly' }]} />} />
        {input('sideIncome', 'Reliable side income', true, 'Optional - monthly')}
      </Section>}
      {step === 1 && <>
        <Section title="Savings & your safety cushion" caption="Enter zero where appropriate. Emergency savings stay protected.">{input('emergency', 'Emergency savings')}{input('carSavings', 'Car savings')}{input('reserve', 'Emergency reserve target')}{input('otherSavings', 'Other available savings', true, 'Optional')}</Section>
        <Section title="Your monthly life">{input('expenses', 'Required monthly expenses', true, 'Housing, food, bills and other essentials; exclude debt payments and the new car.')}{input('discretionary', 'Discretionary spending', true, 'Optional - monthly')}{input('contribution', 'Planned car savings', true, 'Optional - monthly amount to save while waiting')}</Section>
        <Section title="Existing debts" caption="Optional. Add balances to model how a car changes payoff timing.">
          {debts.fields.map((debt, i) => <View key={debt.id} style={{ gap: 12, borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 }}>{input(`debts.${i}.name`, 'Debt name', false)}{input(`debts.${i}.balance`, 'Balance')}{input(`debts.${i}.apr`, 'Debt APR (%)')}{input(`debts.${i}.minimum`, 'Minimum monthly payment')}<Button label="Remove debt" variant="secondary" onPress={() => debts.remove(i)} /></View>)}
          <Button label="Add debt" variant="secondary" onPress={() => debts.append({ name: '', balance: '', apr: '', minimum: '' })} />
        </Section>
      </>}
      {step === 2 && <>
        <Section title="The vehicle">{input('make', 'Make', false)}{input('model', 'Model', false)}{input('price', 'Purchase price')}{input('year', 'Year', true, 'Editable starting estimate')}
          <Controller control={control} name="condition" render={({ field }) => <Segmented label="Condition" value={field.value} onChange={field.onChange} options={[{ label: 'Used', value: 'used' }, { label: 'New', value: 'new' }]} />} />
        </Section>
        <Section title="The financing">{input('down', 'Down payment')}{input('apr', 'APR (%)', true, 'Enter 6.5 for 6.5%. Use zero for a cash purchase.')}{input('tax', 'Sales tax (%)')}
          <Controller control={control} name="term" render={({ field }) => <Segmented label="Loan term" value={field.value} onChange={field.onChange} options={['36', '48', '60', '72', '84'].map(value => ({ label: `${value} mo`, value }))} />} />
        </Section>
      </>}
      {step === 3 && <>
        {result ? <><ResultStatus result={result} /><Text style={{ color: colors.text, fontSize: 44, fontWeight: '700' }}>{formatCurrency(result.trueMonthlyCost)}<Text style={{ fontSize: 16 }}> / month</Text></Text><ResultMetrics result={result} /></> : <Text style={{ color: colors.warning }}>Some required details still need attention. Select See my plan to return to them.</Text>}
        <Section title="Starting estimates to refine" caption="These are estimates, not quotes. Edit them in your calculator."><Text style={{ color: colors.textMuted, lineHeight: 24 }}>Insurance $180/month; fuel $3.50/gallon; 12,000 miles/year; 25 MPG; registration $240/year; fees $800; current mileage 25,000. Maintenance is estimated from age, condition and mileage.</Text></Section>
        <Text style={{ color: colors.textMuted, lineHeight: 22 }}>Your reserve target and cash flow define the status. This plan is an estimate based on your inputs, not a lending decision.</Text>
      </>}
      {saveError && <Text accessibilityRole="alert" style={{ color: colors.warning }}>This draft could not be saved. Keep this screen open and try again.</Text>}
      {Object.keys(errors).length > 0 && <Text accessibilityRole="alert" style={{ color: colors.danger }}>Review the highlighted fields before continuing.</Text>}
      <Button label={step === 3 ? 'See my plan' : 'Continue'} onPress={step === 3 ? finish : async () => { if (await trigger(setupSteps[step], { shouldFocus: true })) move(step + 1); }} />
      <Button variant="secondary" label={step > 0 ? 'Back' : 'Save & exit'} onPress={() => { if (step > 0) move(step - 1); else router.replace('/welcome'); }} />
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
