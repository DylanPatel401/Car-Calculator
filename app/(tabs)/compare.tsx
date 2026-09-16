import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ResultStatus } from '@/components/insights';
import { AppIcon, Button, Field, ScreenHeader, Section } from '@/components/ui';
import { scenarioForOption } from '@/data/workspace';
import { calculateScenario } from '@/engine/scenario';
import { compareOptions, comparisonRows } from '@/engine/comparison';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { formatCurrency } from '@/utils/format';

export default function CompareScreen() {
  const store = useScenarioStore();
  const { workspace } = store;
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const [dialog, setDialog] = useState<{ id: string; mode: 'rename' | 'delete' } | null>(null);
  const [name, setName] = useState('');
  const entries = useMemo(() => compareOptions(workspace), [workspace]);
  const summaries = useMemo(() => workspace.options.map((option) => ({ option, result: calculateScenario(scenarioForOption(workspace, option.id)) })), [workspace]);
  const rowHeight = Math.max(78, 72 * fontScale);
  const labelWidth = Math.min(180, Math.max(112, width * 0.29));
  const columnWidth = Math.max(190, (Math.min(width - 32, 1120) - labelWidth) / Math.max(1, entries.length));
  const edit = (id: string) => { store.selectOption(id); router.push('/(tabs)'); };
  const selectedOption = workspace.options.find((option) => option.id === dialog?.id);
  return <ScrollView style={{ backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
    <View style={styles.shell}>
      <ScreenHeader eyebrow="Your shortlist" title="Compare options" subtitle={`${workspace.options.length} saved | ${workspace.comparisonIds.length} of 3 selected`} />
      <Button label="New option" icon="plus" onPress={() => { store.addOption(); router.push('/(tabs)'); }} />
      <Section title="Choose up to three" caption="Select the options you want to see side by side.">
        {workspace.options.map(option => {
          const checked = workspace.comparisonIds.includes(option.id);
          const disabled = !checked && workspace.comparisonIds.length >= 3;
          return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityLabel={`Compare ${option.name}`} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => store.toggleComparison(option.id)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: disabled ? 0.45 : 1 }}>
            <Text style={{ color: checked ? colors.primary : colors.text, fontSize: 22 }}>{checked ? '\u2611' : '\u2610'}</Text>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '600' }}>{option.name}</Text>
          </Pressable>;
        })}
      </Section>
      {entries.length >= 2 && <Section title="The differences that matter" caption="Relative to your selected baseline. There is no single winner; each option has trade-offs.">
        {entries.map(entry => <View key={entry.option.id} style={{ paddingVertical: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
          <Text style={[styles.name, { color: colors.text }]}>{entry.option.name}{entry.option.id === workspace.baselineId ? ' / baseline' : ''}</Text>
          <ResultStatus result={entry.result} />
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{formatCurrency(entry.result.complete ? entry.result.trueMonthlyCost : null)} / month</Text>
          {entry.option.id !== workspace.baselineId && [6, 7, 11].map(index => <Text key={index} style={{ color: colors.textMuted }}>{comparisonRows[index]!.label}: {entry.differences[index] == null ? 'Incomplete' : `${entry.differences[index]! > 0 ? '+' : entry.differences[index]! < 0 ? '-' : ''}${formatCurrency(Math.abs(entry.differences[index]!))} vs baseline`}</Text>)}
        </View>)}
      </Section>}
      {entries.length < 2 ? <Text style={{ color: colors.textMuted }}>Select at least two options to compare.</Text> : <View>
        <Text accessibilityRole="header" style={[styles.name, { color: colors.text, marginBottom: 16 }]}>Current purchase comparison</Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: labelWidth }}>
            <View style={{ height: rowHeight * 2, justifyContent: 'center' }}><Text style={{ color: colors.textMuted }}>Compared with baseline</Text></View>
            {comparisonRows.map((row) => <View key={row.label} style={[styles.cell, { height: rowHeight, borderColor: colors.border }]}><Text style={{ color: colors.text }}>{row.label}</Text></View>)}
          </View>
          <ScrollView horizontal style={{ flex: 1 }} showsHorizontalScrollIndicator>
            {entries.map((entry) => <View key={entry.option.id} style={{ width: columnWidth }}>
              <View style={[styles.cell, { height: rowHeight * 2, borderColor: colors.border }]}>
                <Text numberOfLines={2} style={[styles.name, { color: colors.text }]}>{entry.option.name}</Text>
                <Pressable accessibilityRole="radio" accessibilityLabel={`Baseline: ${entry.option.name}`} accessibilityState={{ checked: workspace.baselineId === entry.option.id }}
                  onPress={() => store.setBaseline(entry.option.id)} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: colors.primary }}>{workspace.baselineId === entry.option.id ? '\u25c9 Baseline' : '\u25cb Set baseline'}</Text>
                </Pressable>
              </View>
              {comparisonRows.map((row, index) => {
                const value = entry.values[index];
                const difference = entry.differences[index];
                return <View key={row.label} style={[styles.cell, { height: rowHeight, borderColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{value == null ? 'Incomplete' : row.unit === 'money' ? formatCurrency(value) : `${Number(value.toFixed(1))}${row.unit === 'percent' ? '%' : ' mo'}`}</Text>
                  {row.unit === 'money' && difference != null && workspace.baselineId !== entry.option.id ? <Text style={{ color: colors.textMuted }}>{difference > 0 ? '+' : difference < 0 ? '-' : ''}{formatCurrency(Math.abs(difference))} vs baseline</Text> : null}
                </View>;
              })}
            </View>)}
          </ScrollView>
        </View>
      </View>}
      <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>Manage your shortlist</Text>
      <View style={styles.list}>
        {summaries.map(({ option, result }) => {
          return <View key={option.id} style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}><Text style={[styles.name, { color: colors.text }]}>{option.name}</Text>
                <Text style={{ color: colors.textMuted }}>{[option.vehicle.year, option.vehicle.make, option.vehicle.model].filter(Boolean).join(' ')}</Text></View>
            </View>
            <Text style={{ color: colors.text }}>{result.complete ? `${formatCurrency(result.trueMonthlyCost)} / month | ${formatCurrency(result.monthlySurplus)} surplus` : result.issues.some(issue => issue.field.startsWith('vehicle.')) ? 'Incomplete vehicle inputs' : 'Incomplete financial inputs'}</Text>
            {result.warnings.map((warning) => <Text key={warning} style={{ color: colors.warning }}>{warning}</Text>)}
            <View style={styles.actions}>
              <Button label="Edit" variant="secondary" onPress={() => edit(option.id)} />
              <IconAction label={`Duplicate ${option.name}`} name="doc.on.doc" onPress={() => { store.duplicateOption(option.id); router.push('/(tabs)'); }} />
              <IconAction label={`Rename ${option.name}`} name="pencil" onPress={() => { setName(option.name); setDialog({ id: option.id, mode: 'rename' }); }} />
              <IconAction label={`Delete ${option.name}`} name="trash" onPress={() => setDialog({ id: option.id, mode: 'delete' })} />
            </View>
          </View>;
        })}
      </View>

    </View>
    <Modal visible={dialog !== null} transparent animationType="none" onRequestClose={() => setDialog(null)}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surface }]}>
        <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>{dialog?.mode === 'rename' ? 'Rename option' : `Delete ${selectedOption?.name}?`}</Text>
        {dialog?.mode === 'rename' ? <Field label="Option name" accessibilityLabel="Option name" value={name} onChangeText={setName} maxLength={120} autoFocus />
          : <Text style={{ color: colors.textMuted }}>Your shared financial profile will be kept.</Text>}
        <Button label={dialog?.mode === 'rename' ? 'Save name' : 'Delete option'} variant={dialog?.mode === 'rename' ? 'primary' : 'danger'} disabled={dialog?.mode === 'rename' && !name.trim()}
          onPress={() => { if (dialog) { if (dialog.mode === 'rename') store.renameOption(dialog.id, name); else store.deleteOption(dialog.id); } setDialog(null); }} />
        <Button label="Cancel" variant="secondary" onPress={() => setDialog(null)} />
      </View></View>
    </Modal>
  </ScrollView>;
}

function IconAction({ label, name, onPress }: { label: string; name: 'pencil' | 'trash' | 'doc.on.doc'; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const { colors } = useAppTheme();
  return <View><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={styles.icon}><AppIcon name={name} /></Pressable>
    {hovered ? <Text style={{ position: 'absolute', top: 48, right: 0, width: 180, backgroundColor: colors.surfaceMuted, color: colors.text, padding: 6, zIndex: 10 }}>{label}</Text> : null}</View>;
}
const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 22, paddingBottom: 40 }, shell: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: 16 },
  list: { gap: 12 }, item: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 18, fontWeight: '700' }, actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, icon: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cell: { padding: 10, justifyContent: 'center', borderBottomWidth: 1, gap: 6 }, overlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000080' },
  dialog: { maxWidth: 480, width: '100%', alignSelf: 'center', borderRadius: 20, padding: 20, gap: 16 },
});
