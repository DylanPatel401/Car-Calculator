import { act, fireEvent, render } from '@testing-library/react-native';
import CompareScreen from '../../../app/(tabs)/compare';
import ProfileScreen from '../../../app/(tabs)/profile';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultScenario } from '@/data/defaults';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const state = () => useScenarioStore.getState();
beforeEach(async () => {
  await state().reset();
  const scenario = createDefaultScenario();
  scenario.vehicle.make = 'Toyota'; scenario.vehicle.model = 'Camry';
  state().completeOnboarding(scenario);
});

it('requires confirmation to delete and supports renaming', async () => {
  const screen = await render(<CompareScreen />);
  await fireEvent.press(screen.getByLabelText('Delete Toyota Camry'));
  expect(state().workspace.options[0]!.name).toBe('Toyota Camry');
  await fireEvent.press(screen.getByText('Cancel'));
  await fireEvent.press(screen.getByLabelText('Rename Toyota Camry'));
  await fireEvent.changeText(screen.getByLabelText('Option name'), 'Camry 60 months');
  await fireEvent.press(screen.getByText('Save name'));
  expect(state().workspace.options[0]!.name).toBe('Camry 60 months');
  await fireEvent.press(screen.getByLabelText('Delete Camry 60 months'));
  await fireEvent.press(screen.getByText('Delete option'));
  expect(state().workspace.options[0]!.vehicle.make).toBe('');
}, 15000);

it('duplicates, selects for comparison, and switches baseline', async () => {
  const screen = await render(<CompareScreen />);
  await fireEvent.press(screen.getByLabelText('Duplicate Toyota Camry'));
  const copy = state().workspace.options[1]!;
  await fireEvent.press(screen.getByLabelText(`Compare ${copy.name}`));
  expect(screen.getByText('Current purchase comparison')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(`Baseline: ${copy.name}`));
  expect(state().workspace.baselineId).toBe(copy.id);
  await act(() => state().updateVehicle({ mpg: 0 }));
  expect(screen.getByText('Incomplete vehicle inputs')).toBeTruthy();
});

it('keeps all options until global reset is confirmed', async () => {
  state().duplicateOption(state().workspace.activeOptionId);
  const screen = await render(<ProfileScreen />);
  await fireEvent.press(screen.getByText('Reset all local data'));
  expect(state().workspace.options).toHaveLength(2);
  await fireEvent.press(screen.getByText('Cancel'));
  expect(state().workspace.options).toHaveLength(2);
  await fireEvent.press(screen.getByText('Reset all local data'));
  await fireEvent.press(screen.getByText('Reset everything'));
  expect(state().workspace.options).toHaveLength(1);
  expect(state().workspace.onboardingComplete).toBe(false);
});
