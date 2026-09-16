import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo } from 'react';

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
}

function validDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function DateField({ value, onChange, accessibilityLabel }: DateFieldProps) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  return (
    <DateTimePicker
      value={validDate(value)}
      minimumDate={today}
      mode="date"
      display="compact"
      onChange={(_, date) => {
        if (date) onChange(date.toISOString());
      }}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
