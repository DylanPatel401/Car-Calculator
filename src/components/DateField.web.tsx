import { ChangeEvent, CSSProperties } from 'react';

import { useAppTheme } from '@/theme/theme';

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
}

function toLocalDateValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayValue(): string {
  return toLocalDateValue(new Date().toISOString());
}

export default function DateField({ value, onChange, accessibilityLabel }: DateFieldProps) {
  const { colors } = useAppTheme();
  const style: CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 46,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: '0 12px',
    color: colors.text,
    background: colors.background,
    font: 'inherit',
    fontSize: 16,
    colorScheme: 'light dark',
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value;
    if (!next) return;
    const localNoon = new Date(`${next}T12:00:00`);
    if (!Number.isNaN(localNoon.getTime())) onChange(localNoon.toISOString());
  };

  return (
    <input
      aria-label={accessibilityLabel}
      type="date"
      min={todayValue()}
      value={toLocalDateValue(value)}
      onChange={handleChange}
      style={style}
    />
  );
}
