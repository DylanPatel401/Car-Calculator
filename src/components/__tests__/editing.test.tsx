import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NumberField } from '@/components/ui';
import WhatIf from '@/components/WhatIf';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultScenario } from '@/data/defaults';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
function DecimalField() { const [value, setValue] = useState<number | null>(6); return <NumberField label="APR" value={value} onChange={setValue} />; }
it('preserves a trailing decimal while publishing valid updates', async () => {
  const screen = await render(<DecimalField />);
  await fireEvent.changeText(screen.getByLabelText('APR'), '6.'); expect(screen.getByLabelText('APR').props.value).toBe('6.');
  await fireEvent.changeText(screen.getByLabelText('APR'), '6.5'); expect(screen.getByLabelText('APR').props.value).toBe('6.5');
});
it('does not silently turn invalid edits into valid numbers', async () => {
  const change = jest.fn(); const screen = await render(<NumberField label="Price" value={100} onChange={change} />);
  await fireEvent.changeText(screen.getByLabelText('Price'), '-20'); expect(change).not.toHaveBeenCalled(); expect(screen.getByText(/last valid value/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Price'), '1.2.3'); expect(change).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Price'), '$1,234.50'); expect(change).toHaveBeenLastCalledWith(1234.5);
});
it('discards experiments without modifying the source and saves only valid experiments', async () => {
  const s = createDefaultScenario(); s.vehicle.make = 'Honda'; s.vehicle.model = 'Civic'; useScenarioStore.getState().completeOnboarding(s);
  const original = useScenarioStore.getState().workspace; const close = jest.fn();
  const screen = await render(<WhatIf onClose={close} />);
  await fireEvent.changeText(screen.getByLabelText('Vehicle price'), '18000'); expect(useScenarioStore.getState().workspace).toEqual(original);
  await fireEvent.changeText(screen.getByLabelText('APR (%)'), '-1'); expect(screen.getByRole('button', { name: 'Save as new option' }).props.accessibilityState?.disabled ?? screen.getByRole('button', { name: 'Save as new option' }).props.disabled).toBe(true);
  await fireEvent.press(screen.getByText('Reset experiment')); expect(screen.getByLabelText('Vehicle price').props.value).toBe('30000');
  await fireEvent.press(screen.getByText('Discard')); expect(close).toHaveBeenCalled(); expect(useScenarioStore.getState().workspace).toEqual(original);
});
