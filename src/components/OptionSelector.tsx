import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useScenarioStore } from '@/store/scenarioStore';
import { useAppTheme } from '@/theme/theme';
import { AppIcon, Button } from '@/components/ui';

export default function OptionSelector() {
  const [open, setOpen] = useState(false);
  const { colors } = useAppTheme();
  const workspace = useScenarioStore((s) => s.workspace);
  const select = useScenarioStore((s) => s.selectOption);
  const active = workspace.options.find((option) => option.id === workspace.activeOptionId)!;
  return <View style={{ marginBottom: 16 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Active option: ${active.name}`} onPress={() => setOpen(true)}
      style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>{active.name}</Text><AppIcon name="chevron.down" />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000080' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 520, maxHeight: '80%', alignSelf: 'center', backgroundColor: colors.surface, padding: 20, borderRadius: 8, gap: 16 }}>
          <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Saved options</Text>
          <ScrollView>{workspace.options.map((option) => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: option.id === active.id }}
            onPress={() => { select(option.id); setOpen(false); }} style={{ minHeight: 48, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: option.id === active.id ? colors.primary : colors.text }}>{option.name}</Text>
          </Pressable>)}</ScrollView>
          <Button label="Close" variant="secondary" onPress={() => setOpen(false)} />
        </View>
      </View>
    </Modal>
  </View>;
}
