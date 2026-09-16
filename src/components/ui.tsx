import { PropsWithChildren, ReactNode, useState } from 'react';
import {
  Pressable,
  Platform,
  ColorValue,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Car, Calendar, UserCircle, Grid2X2, Plus, ChevronDown, ChevronUp, Copy, Pencil, Trash2, RotateCcw, Circle } from 'lucide-react-native';

import { useAppTheme } from '@/theme/theme';

export function AppIcon({ name, size = 20, color }: { name: SymbolViewProps['name']; size?: number; color?: ColorValue }) {
  const { colors } = useAppTheme();
  if (Platform.OS !== 'ios') {
    const icons = { 'car.fill': Car, calendar: Calendar, 'person.crop.circle': UserCircle, 'square.grid.2x2': Grid2X2,
      plus: Plus, 'chevron.down': ChevronDown, 'chevron.up': ChevronUp, 'doc.on.doc': Copy, pencil: Pencil, trash: Trash2, 'arrow.counterclockwise': RotateCcw };
    const Icon = icons[name as keyof typeof icons] ?? Circle;
    return <Icon size={size} color={typeof color === 'string' ? color : colors.text} />;
  }
  return <SymbolView name={name} size={size} tintColor={color ?? colors.text} fallback={<View style={{ width: size, height: size }} />} />;
}

export function ScreenHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Section({ title, caption, children, style }: PropsWithChildren<{ title: string; caption?: string; style?: ViewStyle }>) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }, style]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {caption ? <Text style={[styles.caption, { color: colors.textMuted }]}>{caption}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function Field({ label, hint, error, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        allowFontScaling
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text, borderColor: error ? colors.danger : colors.border, backgroundColor: colors.background }, props.style]}
      />
      {error || hint ? <Text style={[styles.hint, { color: error ? colors.danger : colors.textMuted }]}>{error ?? hint}</Text> : null}
    </View>
  );
}

export function NumberField({ label, value, onChange, prefix, suffix, hint, allowDecimal = true }: {
  label: string; value: number | null; onChange: (value: number | null) => void; prefix?: string; suffix?: string; hint?: string; allowDecimal?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const display = focused && value === 0 ? '' : value === null ? '' : String(value);
  return (
    <Field
      label={label}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChangeText={(text) => {
        const clean = text.replace(/[^0-9.]/g, '');
        if (!clean) onChange(null);
        else {
          const parsed = allowDecimal ? Number.parseFloat(clean) : Number.parseInt(clean, 10);
          onChange(Number.isFinite(parsed) ? Math.max(0, parsed) : null);
        }
      }}
      keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
      placeholder={prefix ? `${prefix}0` : '0'}
      hint={suffix ? `${hint ? `${hint} | ` : ''}${suffix}` : hint}
      accessibilityLabel={label}
    />
  );
}

export function Segmented<T extends string>({ label, hint, value, options, onChange }: {
  label: string; hint?: string; value: T; options: { label: string; value: T }[]; onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.segmentText, { color: selected ? colors.text : colors.textMuted }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

export function ToggleRow({ label, caption, value, onChange }: { label: string; caption?: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {caption ? <Text style={[styles.hint, { color: colors.textMuted }]}>{caption}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

export function Button({ label, icon, onPress, variant = 'primary', disabled = false }: {
  label: string; icon?: SymbolViewProps['name']; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const palette: Record<typeof variant, { background: string; foreground: string; border: string }> = {
    primary: { background: colors.primary, foreground: colors.background, border: colors.primary },
    secondary: { background: colors.surface, foreground: colors.text, border: colors.border },
    danger: { background: colors.dangerSoft, foreground: colors.danger, border: colors.dangerSoft },
  };
  const selected = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: selected.background, borderColor: selected.border, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}
    >
      {icon ? <AppIcon name={icon} size={18} color={selected.foreground} /> : null}
      <Text style={[styles.buttonText, { color: selected.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function Metric({ label, value, tone = 'neutral', detail }: { label: string; value: string; tone?: 'neutral' | 'good' | 'warning' | 'danger'; detail?: string }) {
  const { colors } = useAppTheme();
  const toneColor = tone === 'good' ? colors.primary : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={[styles.metric, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.metricValue, { color: toneColor }]}>{value}</Text>
      {detail ? <Text style={[styles.hint, { color: colors.textMuted }]}>{detail}</Text> : null}
    </View>
  );
}

export function ShowMath({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const { colors } = useAppTheme();
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={() => setOpen((value) => !value)} style={styles.mathButton}>
        <Text style={[styles.mathLabel, { color: colors.primary }]}>{open ? 'Hide math' : 'Show math'}</Text>
        <AppIcon name={open ? 'chevron.up' : 'chevron.down'} size={14} color={colors.primary} />
      </Pressable>
      {open ? <View style={[styles.mathBody, { backgroundColor: colors.background }]}>{children}</View> : null}
    </View>
  );
}

export function MathLine({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.mathText, { color: colors.textMuted }]}>{children}</Text>;
}

export function responsiveColumns(width: number): ViewStyle {
  return width >= 760 ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : {};
}

const styles = StyleSheet.create({
  header: { gap: 5, marginBottom: 20 },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22, maxWidth: 620 },
  section: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 16, gap: 4 },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  sectionBody: { gap: 14, marginTop: 12 },
  caption: { fontSize: 13, lineHeight: 18 },
  fieldWrap: { gap: 6, flex: 1, minWidth: 130 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 7, minHeight: 46, paddingHorizontal: 12, fontSize: 16, fontVariant: ['tabular-nums'] },
  hint: { fontSize: 12, lineHeight: 17 },
  segmented: { flexDirection: 'row', borderRadius: 7, padding: 3, minHeight: 44 },
  segment: { flex: 1, minHeight: 38, borderRadius: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentText: { fontSize: 13, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12 },
  toggleCopy: { flex: 1, gap: 2 },
  button: { minHeight: 48, borderRadius: 7, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  metric: { minHeight: 106, flex: 1, minWidth: 145, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 14, gap: 5, justifyContent: 'center' },
  metricLabel: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  metricValue: { fontSize: 25, lineHeight: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  mathButton: { flexDirection: 'row', minHeight: 44, gap: 6, alignItems: 'center' },
  mathLabel: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  mathBody: { padding: 12, borderRadius: 6, gap: 4 },
  mathText: { fontSize: 13, lineHeight: 19, fontVariant: ['tabular-nums'] },
});
