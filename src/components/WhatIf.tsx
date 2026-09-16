import { useState } from 'react';
import { Modal, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScenarioStore } from '@/store/scenarioStore';
import { calculateScenario } from '@/engine/scenario';
import { useAppTheme } from '@/theme/theme';
import { Button, Field, NumberField, Section, Segmented, ScreenHeader } from './ui';
import { Difference, ResultMetrics, ResultStatus } from './insights';
import { formatCurrency } from '@/utils/format';
import { AppScenario } from '@/types/domain';

export default function WhatIf({ onClose }: { onClose: () => void }) {
  const { colors } = useAppTheme();
  const demo = useScenarioStore(state => state.demoOriginal !== null);
  const [baseline] = useState<AppScenario>(() => JSON.parse(JSON.stringify(useScenarioStore.getState().scenario)));
  const [draft, setDraft] = useState(baseline);
  const [name, setName] = useState('What-if option');
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [revision, setRevision] = useState(0);
  const original = calculateScenario(baseline);
  const result = calculateScenario(draft);
  const valid = (key: string) => (ok: boolean) => setInvalid(prev => ({ ...prev, [key]: !ok }));
  return <Modal visible animationType="none" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 20, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
          {demo && <Text style={{ color: colors.warning, fontWeight: '700' }}>Sample plan / experiments stay in this demo</Text>}
          <ScreenHeader eyebrow="Room to explore" title="What if?" subtitle="Try different terms. Your original option stays saved exactly as it is." />
          <ResultStatus result={result} /><Text style={{ fontSize: 40, fontWeight: '700', color: colors.text }}>{formatCurrency(result.trueMonthlyCost)}<Text style={{ fontSize: 16 }}> / month</Text></Text>
          <ResultMetrics result={result} />
          <Section title="Shape the purchase" key={revision}>
            <NumberField label="Vehicle price" min={1} value={draft.vehicle.price} onValidityChange={valid('price')} onChange={price => setDraft({ ...draft, vehicle: { ...draft.vehicle, price: price! } })} />
            <NumberField label="Down payment" value={draft.loan.downPayment} onValidityChange={valid('down')} onChange={downPayment => setDraft({ ...draft, loan: { ...draft.loan, downPayment: downPayment! } })} />
            <NumberField label="APR (%)" max={100} value={draft.loan.apr} onValidityChange={valid('apr')} onChange={apr => setDraft({ ...draft, loan: { ...draft.loan, apr: apr! } })} />
            <Segmented label="Loan term" value={String(draft.loan.termMonths)} options={['36', '48', '60', '72', '84'].map(value => ({ label: `${value} mo`, value }))} onChange={value => setDraft({ ...draft, loan: { ...draft.loan, termMonths: Number(value) } })} />
          </Section>
          <Section title="Change from your original">
            <Difference label="Monthly ownership" current={result.trueMonthlyCost} baseline={original.trueMonthlyCost} />
            <Difference label="Monthly surplus" current={result.monthlySurplus} baseline={original.monthlySurplus} />
            <Difference label="Total interest" current={result.loan.totalInterest} baseline={original.loan.totalInterest} />
            <Difference label="Cash remaining" current={result.cashRemaining} baseline={original.cashRemaining} />
          </Section>
          {result.warnings.map(w => <Text key={w} style={{ color: colors.warning }}>{w}</Text>)}
          <Field label="New option name" value={name} onChangeText={setName} maxLength={120} />
          <Button label="Save as new option" disabled={!name.trim() || !result.complete || Object.values(invalid).some(Boolean)} onPress={() => { useScenarioStore.getState().saveExperiment(draft, name); onClose(); }} />
          <Button label="Reset experiment" variant="secondary" onPress={() => { setDraft(baseline); setInvalid({}); setRevision(v => v + 1); }} />
          <Button label="Discard" variant="secondary" onPress={onClose} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
